// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "./interfaces/IMarketplace.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Address.sol"; // Import Address library for safe ETH transfer
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@thirdweb-dev/contracts/eip/interface/IERC721Receiver.sol";


/**
 * @title PokemonMarketplace
 * @dev Marketplace for fixed-price listings of Pokemon NFTs (ERC721), implementing thirdweb's IDirectListings.
 * NFTs are NOT escrowed; sellers must approve the marketplace contract beforehand.
 * Payouts are sent directly to the seller and platform fee recipient during the purchase.
 */
contract PokemonMarketplace is IDirectListings, ReentrancyGuard, Ownable, Pausable, ERC165 {
    using SafeERC20 for IERC20;
    using Address for address payable; // Use Address library for safe ETH transfer

    // Address for native token payments
    address public constant NATIVE_TOKEN = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    // Marketplace fee in basis points (e.g., 250 = 2.5%)
    uint256 public marketplaceFeeBps;
    // Address that receives platform fees
    address public platformFeeRecipient;

    // Counter for assigning unique listing IDs
    uint256 private _listingCounter;

    // Mapping from listing ID to Listing struct
    mapping(uint256 => Listing) internal _listings;

    // Mapping for reserved listings: listingId -> buyer -> isApproved
    mapping(uint256 => mapping(address => bool)) private _approvedBuyers;

    // Mapping for additional approved currencies: listingId -> currency -> pricePerToken
    mapping(uint256 => mapping(address => uint256)) private _currencyPrices;

    /**
     * @dev Constructor
     * Sets the deployer as the initial owner, sets the initial marketplace fee,
     * and sets the initial platform fee recipient to the owner.
     * @param _marketplaceFeeBps Initial marketplace fee in basis points
     */
    constructor(uint256 _marketplaceFeeBps) Ownable(msg.sender) {
        setMarketplaceFee(_marketplaceFeeBps);
        setPlatformFeeRecipient(msg.sender); // Default fee recipient to owner
    }

    // =============================================================
    //                           MODIFIERS
    // =============================================================

    /**
     * @dev Throws if called by any account other than the listing creator.
     */
    modifier onlyListingCreator(uint256 _listingId) {
        require(msg.sender == _listings[_listingId].listingCreator, "Marketplace: Not listing creator");
        _;
    }

    /**
     * @dev Throws if the listing does not exist or has been cancelled/completed.
     */
    modifier listingExistsAndActive(uint256 _listingId) {
        Listing storage listing = _listings[_listingId];
        require(listing.listingId == _listingId, "Marketplace: Listing does not exist");
        require(listing.status == Status.CREATED, "Marketplace: Listing not active");
        _;
    }

    // =============================================================
    //                       OWNER FUNCTIONS
    // =============================================================

    /**
     * @dev Updates the marketplace fee.
     * @param _newFeeBps New fee in basis points (e.g., 100 for 1%)
     */
    function setMarketplaceFee(uint256 _newFeeBps) public onlyOwner {
        require(_newFeeBps <= 10000, "Marketplace: Fee cannot exceed 100%"); // Max 100% fee
        marketplaceFeeBps = _newFeeBps;
    }

    /**
     * @dev Updates the platform fee recipient address.
     * @param _newRecipient New address to receive fees
     */
    function setPlatformFeeRecipient(address _newRecipient) public onlyOwner {
        require(_newRecipient != address(0), "Marketplace: Fee recipient cannot be zero address");
        platformFeeRecipient = _newRecipient;
    }

    /**
     * @dev Pauses the contract. Only callable by the owner.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses the contract. Only callable by the owner.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // =============================================================
    //                  DIRECT LISTINGS FUNCTIONS
    // =============================================================

    /**
     * @inheritdoc IDirectListings
     */
    function createListing(ListingParameters memory _params)
        external
        override
        whenNotPaused
        nonReentrant
        returns (uint256 listingId)
    {
        // Check if there's an existing active listing for this token
        for (uint256 i = 0; i < _listingCounter; i++) {
            Listing storage existingListing = _listings[i];
            if (existingListing.assetContract == _params.assetContract && 
                existingListing.tokenId == _params.tokenId &&
                existingListing.status == Status.CREATED &&
                existingListing.listingCreator == msg.sender) {
                // Found an active listing for this token by this seller - update it
                _updateListing(i, _params);
                return i;
            }
        }

        // No existing listing found - create new one
        require(_params.quantity > 0, "Marketplace: Quantity must be > 0");
        require(_params.quantity == 1, "Marketplace: ERC721 quantity must be 1");
        require(_params.pricePerToken > 0, "Marketplace: Price must be > 0");
        require(_params.currency != address(0), "Marketplace: Currency cannot be zero address");
        require(_params.assetContract != address(0), "Marketplace: Asset contract cannot be zero address");

        if (_params.startTimestamp == 0) {
            _params.startTimestamp = uint128(block.timestamp);
        }
        require(_params.endTimestamp > _params.startTimestamp, "Marketplace: End time must be after start time");

        IERC721 nft = IERC721(_params.assetContract);
        require(nft.ownerOf(_params.tokenId) == msg.sender, "Marketplace: Seller must own the NFT");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) || nft.getApproved(_params.tokenId) == address(this),
            "Marketplace: Contract not approved to transfer NFT"
        );

        listingId = _listingCounter;

        _listings[listingId] = Listing({
            listingId: listingId,
            tokenId: _params.tokenId,
            quantity: _params.quantity,
            pricePerToken: _params.pricePerToken,
            startTimestamp: _params.startTimestamp,
            endTimestamp: _params.endTimestamp,
            listingCreator: msg.sender,
            assetContract: _params.assetContract,
            currency: _params.currency,
            tokenType: TokenType.ERC721,
            status: Status.CREATED,
            reserved: _params.reserved
        });

        _currencyPrices[listingId][_params.currency] = _params.pricePerToken;
        emit NewListing(msg.sender, listingId, _params.assetContract, _listings[listingId]);
        _listingCounter++; // so we increase at the end and the next one gets the

        return listingId;
    }

    // Internal function for updating listings
    function _updateListing(uint256 _listingId, ListingParameters memory _params) internal {
        Listing storage listing = _listings[_listingId];
        require(_params.quantity == 1, "Marketplace: ERC721 quantity must be 1");
        require(_params.pricePerToken > 0, "Marketplace: Price must be > 0");
        require(_params.currency != address(0), "Marketplace: Currency cannot be zero address");
        require(_params.assetContract == listing.assetContract, "Marketplace: Cannot change asset contract");
        require(_params.tokenId == listing.tokenId, "Marketplace: Cannot change token ID");
        require(_params.startTimestamp >= listing.startTimestamp, "Marketplace: New start time cannot be earlier");
        require(_params.endTimestamp > _params.startTimestamp, "Marketplace: End time must be after start time");

        IERC721 nft = IERC721(listing.assetContract);
        require(nft.ownerOf(listing.tokenId) == msg.sender, "Marketplace: Seller must own the NFT");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) || nft.getApproved(listing.tokenId) == address(this),
            "Marketplace: Contract not approved to transfer NFT"
        );

        listing.pricePerToken = _params.pricePerToken;
        listing.currency = _params.currency;
        listing.startTimestamp = _params.startTimestamp;
        listing.endTimestamp = _params.endTimestamp;
        listing.reserved = _params.reserved;
        _currencyPrices[_listingId][_params.currency] = _params.pricePerToken;
        emit UpdatedListing(msg.sender, _listingId, listing.assetContract, listing);
    }

    // External function that calls internal implementation
    function updateListing(uint256 _listingId, ListingParameters memory _params)
        external
        override
        whenNotPaused
        nonReentrant
        onlyListingCreator(_listingId)
        listingExistsAndActive(_listingId)
    {
        _updateListing(_listingId, _params);
    }

     /**
      * @inheritdoc IDirectListings
      */
    function cancelListing(uint256 _listingId)
        external
        override
        nonReentrant
        onlyListingCreator(_listingId)
        listingExistsAndActive(_listingId)
    {
        Listing storage listing = _listings[_listingId];
        listing.status = Status.CANCELLED;
        emit CancelledListing(msg.sender, _listingId);
    }

    /**
     * @inheritdoc IDirectListings
     */
    function approveBuyerForListing(uint256 _listingId, address _buyer, bool _toApprove)
        external
        override
        whenNotPaused
        onlyListingCreator(_listingId)
        listingExistsAndActive(_listingId)
    {
        Listing storage listing = _listings[_listingId];
        require(listing.reserved, "Marketplace: Listing is not reserved");
        require(_buyer != address(0), "Marketplace: Buyer cannot be zero address");
        _approvedBuyers[_listingId][_buyer] = _toApprove;
        emit BuyerApprovedForListing(_listingId, _buyer, _toApprove);
    }

    /**
     * @inheritdoc IDirectListings
     */
    function approveCurrencyForListing(
        uint256 _listingId,
        address _currency,
        uint256 _pricePerTokenInCurrency
    )
        external
        override
        whenNotPaused
        onlyListingCreator(_listingId)
        listingExistsAndActive(_listingId)
    {
        Listing storage listing = _listings[_listingId];
        require(_currency != address(0), "Marketplace: Currency cannot be zero address");
        require(_currency != listing.currency, "Marketplace: Cannot approve the main currency");
        _currencyPrices[_listingId][_currency] = _pricePerTokenInCurrency;
        emit CurrencyApprovedForListing(_listingId, _currency, _pricePerTokenInCurrency);
    }

    /**
     * @inheritdoc IDirectListings
     * @dev Handles immediate payout to seller and platform fee recipient.
     * Requires buyer to approve contract for ERC20 token transfers beforehand.
     */
    function buyFromListing(
        uint256 _listingId,
        address _buyFor,
        uint256 _quantity,
        address _currency,
        uint256 _expectedTotalPrice
    )
        external
        payable
        override
        whenNotPaused
        nonReentrant
        listingExistsAndActive(_listingId)
    {
        Listing storage listing = _listings[_listingId];

        require(_buyFor != address(0), "Marketplace: Buy for cannot be zero address");
        require(_quantity == 1, "Marketplace: ERC721 quantity must be 1");
        require(_quantity <= listing.quantity, "Marketplace: Insufficient quantity available");
        require(block.timestamp >= listing.startTimestamp, "Marketplace: Listing not active yet");
        require(block.timestamp < listing.endTimestamp, "Marketplace: Listing expired");

        if (listing.reserved) {
            require(_approvedBuyers[_listingId][msg.sender], "Marketplace: Buyer not approved for reserved listing");
        }

        uint256 pricePerTokenInCurrency = _currencyPrices[_listingId][_currency];
        if (pricePerTokenInCurrency == 0 && _currency == listing.currency) {
             pricePerTokenInCurrency = listing.pricePerToken; // Use main price if currency is main and not explicitly approved
        }
        require(pricePerTokenInCurrency > 0, "Marketplace: Currency not accepted or approved for this listing");
        uint256 totalPrice = pricePerTokenInCurrency * _quantity;
        require(totalPrice == _expectedTotalPrice, "Marketplace: Incorrect total price expected");

        uint256 platformFeeAmount = (totalPrice * marketplaceFeeBps) / 10000;
        uint256 sellerProceeds = totalPrice - platformFeeAmount;

        address _feeRecipient = platformFeeRecipient;
        address payable _sellerPayable = payable(listing.listingCreator);

        if (_currency == NATIVE_TOKEN) {
            require(msg.value == totalPrice, "Marketplace: Incorrect native token amount sent");

            payable(_feeRecipient).sendValue(platformFeeAmount);
            _sellerPayable.sendValue(sellerProceeds);

        } else {
            require(msg.value == 0, "Marketplace: msg.value must be 0 for ERC20 payments");

            require(
                IERC20(_currency).allowance(msg.sender, address(this)) >= totalPrice,
                "Marketplace: Check ERC20 allowance"
            );

            IERC20(_currency).safeTransferFrom(msg.sender, _feeRecipient, platformFeeAmount);
            IERC20(_currency).safeTransferFrom(msg.sender, _sellerPayable, sellerProceeds);
        }

        IERC721(listing.assetContract).safeTransferFrom(listing.listingCreator, _buyFor, listing.tokenId);

        listing.quantity -= _quantity;
        if (listing.quantity == 0) {
             listing.status = Status.COMPLETED;
        }

        emit NewSale(
            listing.listingCreator,
            _listingId,
            listing.assetContract,
            listing.tokenId,
            msg.sender,
            _quantity,
            totalPrice
        );
    }

    /**
     * @inheritdoc IDirectListings
     */
    function totalListings() external view override returns (uint256) {
        return _listingCounter;
    }

    /**
     * @inheritdoc IDirectListings
     */
    function getListing(uint256 _listingId) external view override returns (Listing memory listing) {
        listing = _listings[_listingId];
        require(listing.listingId == _listingId, "Marketplace: Listing does not exist");
    }

    /**
     * @inheritdoc IDirectListings
     */
    function getAllListings(uint256 _startId, uint256 _endId)
        external
        view
        override
        returns (Listing[] memory listings)
    {
        require(_startId <= _endId, "Marketplace: Invalid range");
        require(_endId < _listingCounter, "Marketplace: End ID exceeds total listings");
        uint256 count = _endId - _startId + 1;
        listings = new Listing[](count);
        for (uint256 i = 0; i < count; i++) {
            uint256 currentId = _startId + i;
             if (currentId < _listingCounter && _listings[currentId].listingId == currentId) {
                listings[i] = _listings[currentId];
            }
        }
        return listings;
    }

    /**
     * @inheritdoc IDirectListings
     */
     function getAllValidListings(uint256 _startId, uint256 _endId)
        external
        view
        override
        returns (Listing[] memory validListings)
    {
        require(_startId <= _endId, "Marketplace: Invalid range");
        require(_endId < _listingCounter, "Marketplace: End ID exceeds total listings");

        uint256 validCount = 0;
        for (uint256 i = _startId; i <= _endId; i++) {
             if (i < _listingCounter) {
                Listing storage listing = _listings[i];
                 if (
                    listing.listingId == i &&
                    listing.status == Status.CREATED &&
                    block.timestamp >= listing.startTimestamp &&
                    block.timestamp < listing.endTimestamp
                ) {
                    validCount++;
                }
            }
        }

        validListings = new Listing[](validCount);
        uint256 currentIndex = 0;
        for (uint256 i = _startId; i <= _endId; i++) {
            if (i < _listingCounter) {
                Listing storage listing = _listings[i];
                if (
                    listing.listingId == i &&
                    listing.status == Status.CREATED &&
                    block.timestamp >= listing.startTimestamp &&
                    block.timestamp < listing.endTimestamp
                ) {
                    validListings[currentIndex] = listing;
                    currentIndex++;
                }
            }
        }
        return validListings;
    }

        /*///////////////////////////////////////////////////////////////
                        ERC 165 / 721 / 1155 logic
    //////////////////////////////////////////////////////////////*/

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC165) returns (bool) {
        return
            interfaceId == type(IERC721Receiver).interfaceId ||
            super.supportsInterface(interfaceId);
    }
} 

