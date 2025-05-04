// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

// OpenZeppelin Imports
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PokemonDutchAuction
 * @dev Contract for conducting Dutch auctions of Pokemon NFTs.
 */
contract PokemonDutchAuction is ReentrancyGuard, Ownable, Pausable {
    struct DutchAuction {
        address seller;
        address nftAddress;
        uint256 tokenId;
        uint256 startPrice;
        uint256 endPrice;
        uint256 startTime;
        uint256 duration;
        uint256 decayExponent; // 1 = linear, >1 = non-linear
        address currency;
        bool active;
    }

    // Address for native token payments
    address public constant NATIVE_TOKEN = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    // Basis points divisor
    uint64 private constant MAX_BPS = 10000;

    // Marketplace fee in basis points (e.g., 250 = 2.5%)
    uint256 public marketplaceFeeBps;
    // Address that receives platform fees
    address public platformFeeRecipient;

    // Counter for assigning unique auction IDs
    uint256 public auctionCounter;
    // Mapping from auction ID to Auction struct
    mapping(uint256 => DutchAuction) public auctions;

    event DutchAuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        uint256 tokenId,
        uint256 startPrice,
        uint256 endPrice,
        uint256 duration,
        uint256 decayExponent,
        address currency
    );

    event DutchAuctionCompleted(uint256 indexed auctionId, address buyer, uint256 price);

    /**
     * @dev Constructor
     * Sets the deployer as the initial owner and sets the initial marketplace fee/recipient.
     * @param _marketplaceFeeBps Initial marketplace fee in basis points
     */
    constructor(uint256 _marketplaceFeeBps) Ownable(msg.sender) {
        setMarketplaceFee(_marketplaceFeeBps);
        setPlatformFeeRecipient(msg.sender); // Default fee recipient to owner
    }

    function setMarketplaceFee(uint256 _newFeeBps) public onlyOwner {
        require(_newFeeBps <= MAX_BPS, "AuctionHouse: Fee cannot exceed 100%");
        marketplaceFeeBps = _newFeeBps;
    }

    function setPlatformFeeRecipient(address _newRecipient) public onlyOwner {
        require(_newRecipient != address(0), "AuctionHouse: Fee recipient cannot be zero address");
        platformFeeRecipient = _newRecipient;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }


    function createDutchAuction(
        address nftAddress,
        uint256 tokenId,
        uint256 startPrice,
        uint256 endPrice,
        uint256 duration,
        uint256 decayExponent,
        address currency
    ) external nonReentrant{
        
        // Checks if the auction is correctly defined
        require(startPrice > endPrice, "Start price must be greater than end price");
        require(duration > 0, "Duration must be greater than 0");
        require(decayExponent >= 1, "Decay exponent must be positive");

        IERC721 nft = IERC721(nftAddress);
        require(nft.ownerOf(tokenId) == msg.sender, "Not the token owner");
        require(nft.getApproved(tokenId) == address(this) || nft.isApprovedForAll(msg.sender, address(this)), "Contract not approved");

        auctions[auctionCounter] = DutchAuction({
            seller: msg.sender,
            nftAddress: nftAddress,
            tokenId: tokenId,
            startPrice: startPrice,
            endPrice: endPrice,
            startTime: block.timestamp,
            duration: duration,
            decayExponent: decayExponent,
            currency: currency,
            active: true
        });

        IERC721(nftAddress).safeTransferFrom(msg.sender, address(this), auctions[auctionCounter].tokenId);
        emit DutchAuctionCreated(auctionCounter, msg.sender, tokenId, startPrice, endPrice, duration, decayExponent, currency);
        auctionCounter++;
    }

    function getCurrentPrice(uint256 auctionId) public view returns (uint256) {
        DutchAuction memory auction = auctions[auctionId];
        require(auction.active, "Auction is not active");

        uint256 elapsed = block.timestamp > auction.startTime
            ? block.timestamp - auction.startTime
            : 0;

        if (elapsed >= auction.duration) {
            return auction.endPrice;
        }

        uint256 priceRange = auction.startPrice - auction.endPrice;

        // Calculate decay based on exponent: decay = priceRange * (elapsed/duration)^exponent
        uint256 decay;
        if (auction.decayExponent == 1) {
            decay = (priceRange * elapsed) / auction.duration; // Linear
        } else {
            // Approximate: (elapsed^exp) / (duration^exp)
            uint256 elapsedExp = _pow(elapsed, auction.decayExponent);
            uint256 durationExp = _pow(auction.duration, auction.decayExponent);
            decay = (priceRange * elapsedExp) / durationExp;
        }

        return auction.startPrice > decay ? auction.startPrice - decay : auction.endPrice;
    }

    function _pow(uint256 base, uint256 exp) internal pure returns (uint256 result) {
        result = 1;
        for (uint256 i = 0; i < exp; i++) {
            result *= base;
        }
    }

    function buy(uint256 auctionId) external payable nonReentrant {
        DutchAuction storage auction = auctions[auctionId];
        uint256 currentPrice = getCurrentPrice(auctionId);
        require(auction.active, "Auction not active");
        require(msg.value >= currentPrice, "Insufficient payment");
        
        uint256 platformFeeAmount = (currentPrice * marketplaceFeeBps) / MAX_BPS;
        uint256 sellerProceeds = currentPrice - platformFeeAmount;
        address feeRecipient = platformFeeRecipient;
        address payable sellerPayable = payable(auction.seller);

        auction.active = false;
        uint256 refund = msg.value - currentPrice;

        IERC721(auction.nftAddress).safeTransferFrom(address(this), msg.sender, auction.tokenId);
        payable(feeRecipient).transfer(platformFeeAmount);
        sellerPayable.transfer(sellerProceeds);
        if (refund > 0) {
            payable(msg.sender).transfer(refund);
        } 
        emit DutchAuctionCompleted(auctionId, msg.sender, currentPrice);
    }
}
