// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

// Interface Imports
import "./interfaces/IMarketplace.sol"; // Contains IEnglishAuctions

// OpenZeppelin Imports
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";


/**
 * @title PokemonAuctionHouse
 * @dev Contract for English Auctions of Pokemon NFTs (ERC721/ERC1155), implementing IEnglishAuctions.
 * NFTs ARE escrowed in this contract during the auction.
 */
contract PokemonAuctionHouse is IEnglishAuctions, ReentrancyGuard, Ownable, Pausable, IERC721Receiver, ERC1155Holder {
    using SafeERC20 for IERC20;
    using Address for address payable;

    // Address for native token payments
    address public constant NATIVE_TOKEN = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    // Basis points divisor
    uint64 private constant MAX_BPS = 10000;

    // Marketplace fee in basis points (e.g., 250 = 2.5%)
    uint256 public marketplaceFeeBps;
    // Address that receives platform fees
    address public platformFeeRecipient;

    // Counter for assigning unique auction IDs
    uint256 private _auctionCounter;

    // Mapping from auction ID to Auction struct
    mapping(uint256 => Auction) internal _auctions;
    // Mapping from auction ID to the current highest bid
    mapping(uint256 => Bid) internal _winningBids;
    // Mapping to track payout status (seller funds, bidder NFT)
    mapping(uint256 => AuctionPayoutStatus) internal _payoutStatus;


    /**
     * @dev Constructor
     * Sets the deployer as the initial owner and sets the initial marketplace fee/recipient.
     * @param _marketplaceFeeBps Initial marketplace fee in basis points
     */
    constructor(uint256 _marketplaceFeeBps) Ownable(msg.sender) {
        setMarketplaceFee(_marketplaceFeeBps);
        setPlatformFeeRecipient(msg.sender); // Default fee recipient to owner
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    // =============================================================
    //                           MODIFIERS
    // =============================================================

    modifier onlyAuctionCreator(uint256 _auctionId) {
        require(msg.sender == _auctions[_auctionId].auctionCreator, "AuctionHouse: Not auction creator");
        _;
    }

    modifier auctionExists(uint256 _auctionId) {
        require(_auctions[_auctionId].auctionId == _auctionId && _auctions[_auctionId].assetContract != address(0), "AuctionHouse: Auction does not exist");
        _;
    }

     modifier auctionIsActive(uint256 _auctionId) {
        Auction storage auction = _auctions[_auctionId];
        require(auction.status == Status.CREATED, "AuctionHouse: Auction not active (cancelled or completed)");
        require(block.timestamp >= auction.startTimestamp, "AuctionHouse: Auction not started yet");
        require(block.timestamp < auction.endTimestamp, "AuctionHouse: Auction expired");
        _;
     }

      modifier auctionIsOver(uint256 _auctionId) {
        Auction storage auction = _auctions[_auctionId];
        require(auction.status != Status.CANCELLED, "AuctionHouse: Auction was cancelled");
        require(block.timestamp >= auction.endTimestamp, "AuctionHouse: Auction still active");
        require(_winningBids[_auctionId].bidder != address(0), "AuctionHouse: No winning bid placed"); // Ensure there was a winner
        _;
     }


    // =============================================================
    //                       OWNER FUNCTIONS
    // =============================================================

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

    // =============================================================
    //                  ENGLISH AUCTIONS FUNCTIONS
    // =============================================================

    /**
     * @inheritdoc IEnglishAuctions
     */
    function createAuction(AuctionParameters memory _params)
        external
        override
        whenNotPaused
        nonReentrant
        returns (uint256 auctionId)
    {
        auctionId = _getNextAuctionId();
        address auctionCreator = msg.sender;
        TokenType tokenType = _getTokenType(_params.assetContract);

        _validateNewAuction(_params, tokenType); // Basic parameter checks

        // Check ownership
        require(
            _checkOwnership(auctionCreator, _params.assetContract, _params.tokenId, _params.quantity, tokenType),
             "AuctionHouse: Seller must own the NFT(s)"
        );

        // --- Store Auction ---
        _auctions[auctionId] = Auction({
            auctionId: auctionId,
            auctionCreator: auctionCreator,
            assetContract: _params.assetContract,
            tokenId: _params.tokenId,
            quantity: _params.quantity,
            currency: _params.currency,
            minimumBidAmount: _params.minimumBidAmount,
            buyoutBidAmount: _params.buyoutBidAmount,
            timeBufferInSeconds: _params.timeBufferInSeconds,
            bidBufferBps: _params.bidBufferBps,
            startTimestamp: _params.startTimestamp,
            endTimestamp: _params.endTimestamp,
            tokenType: tokenType,
            status: Status.CREATED
        });

        // --- Escrow NFT in Contract ---
        _transferAuctionTokens(auctionCreator, address(this), _auctions[auctionId]);

        // Increment counter only AFTER successful creation and escrow
        _auctionCounter++;

        emit NewAuction(auctionCreator, auctionId, _params.assetContract, _auctions[auctionId]);
        return auctionId;
    }

    /**
     * @inheritdoc IEnglishAuctions
     */
    function bidInAuction(uint256 _auctionId, uint256 _bidAmount)
        external
        payable
        override
        whenNotPaused
        nonReentrant
        auctionExists(_auctionId)
        auctionIsActive(_auctionId) // Checks active status and time window
    {
        Auction storage auction = _auctions[_auctionId];
        Bid storage currentWinningBid = _winningBids[_auctionId];
        address bidder = msg.sender;

        require(_bidAmount > 0, "AuctionHouse: Bid amount must be > 0");
        require(bidder != auction.auctionCreator, "AuctionHouse: Creator cannot bid");
        require(bidder != currentWinningBid.bidder, "AuctionHouse: Already highest bidder");

        // First collect new bid payment BEFORE processing any refunds
        // This prevents reentrancy and ensures we have the funds before refunding
        if (auction.currency == NATIVE_TOKEN) {
            require(msg.value == _bidAmount, "AuctionHouse: Incorrect ETH amount sent for bid");
            // ETH is implicitly transferred to the contract via msg.value
        } else {
            require(msg.value == 0, "AuctionHouse: Do not send ETH for ERC20 bids");
            // Pull ERC20 from bidder TO this contract
            IERC20(auction.currency).safeTransferFrom(bidder, address(this), _bidAmount);
        }

        // Handle Buyout
        if (auction.buyoutBidAmount > 0 && _bidAmount >= auction.buyoutBidAmount) {
             _handleBidInternal(auction, currentWinningBid, bidder, auction.buyoutBidAmount, _auctionId, true);
        }
        // Handle Regular Bid
        else {
            require(
                isNewWinningBidInternal(auction, currentWinningBid.bidAmount, _bidAmount),
                "AuctionHouse: Bid not high enough"
            );
             _handleBidInternal(auction, currentWinningBid, bidder, _bidAmount, _auctionId, false);
        }
    }


    /**
     * @inheritdoc IEnglishAuctions
     */
    function collectAuctionPayout(uint256 _auctionId)
        external
        override
        nonReentrant
        auctionExists(_auctionId)
        auctionIsOver(_auctionId) // Checks time, status, and winner existence
    {
        AuctionPayoutStatus storage status = _payoutStatus[_auctionId];
        require(!status.paidOutBidAmount, "AuctionHouse: Seller payout already collected");
        status.paidOutBidAmount = true; // Prevent reentrancy before transfer

        Auction memory auction = _auctions[_auctionId]; // Use memory copy for payout logic
        Bid memory winningBid = _winningBids[_auctionId]; // Use memory copy

        _payout(auction, winningBid); // Transfer funds from contract

        // Check if auction fully completed
        if (status.paidOutAuctionTokens) {
             _auctions[_auctionId].status = Status.COMPLETED;
        }

        // Optionally emit another event if needed, AuctionClosed covers basic info
    }


    /**
     * @inheritdoc IEnglishAuctions
     */
    function collectAuctionTokens(uint256 _auctionId)
        external
        override
        nonReentrant
        auctionExists(_auctionId)
        auctionIsOver(_auctionId) // Checks time, status, and winner existence
    {
        AuctionPayoutStatus storage status = _payoutStatus[_auctionId];
        require(!status.paidOutAuctionTokens, "AuctionHouse: Auction tokens already collected");

        Auction memory auction = _auctions[_auctionId]; // Use memory copy
        Bid memory winningBid = _winningBids[_auctionId]; // Use memory copy

        require(msg.sender == winningBid.bidder, "AuctionHouse: Only winning bidder can collect tokens");
        status.paidOutAuctionTokens = true; // Prevent reentrancy before transfer


        // Transfer NFT from contract to winner
        _transferAuctionTokens(address(this), winningBid.bidder, auction);

        // Check if auction fully completed
        if (status.paidOutBidAmount) {
            _auctions[_auctionId].status = Status.COMPLETED;
        }

        emit AuctionClosed(
            _auctionId,
            auction.assetContract,
            msg.sender, // closer is the winning bidder here
            auction.tokenId,
            auction.auctionCreator,
            winningBid.bidder
        );
    }


    /**
     * @inheritdoc IEnglishAuctions
     */
    function cancelAuction(uint256 _auctionId)
        external
        override
        nonReentrant
        auctionExists(_auctionId)
        onlyAuctionCreator(_auctionId)
    {
        Auction storage auction = _auctions[_auctionId];
        require(auction.status == Status.CREATED, "AuctionHouse: Auction not active");
        require(_winningBids[_auctionId].bidder == address(0), "AuctionHouse: Cannot cancel auction with bids");

        auction.status = Status.CANCELLED;

        // Return escrowed NFT to creator
        _transferAuctionTokens(address(this), auction.auctionCreator, auction);

        emit CancelledAuction(auction.auctionCreator, _auctionId);
    }


    // =============================================================
    //                      VIEW FUNCTIONS
    // =============================================================

    /**
     * @inheritdoc IEnglishAuctions
     */
    function isNewWinningBid(uint256 _auctionId, uint256 _bidAmount)
        external
        view
        override
        auctionExists(_auctionId)
        returns (bool)
    {
        Auction storage auction = _auctions[_auctionId];
        Bid storage currentWinningBid = _winningBids[_auctionId];
        return isNewWinningBidInternal(auction, currentWinningBid.bidAmount, _bidAmount);
    }

    function totalAuctions() external view returns (uint256) {
        return _auctionCounter;
    }

    function getAuction(uint256 _auctionId) external view override auctionExists(_auctionId) returns (Auction memory auction) {
        auction = _auctions[_auctionId];
    }

    function getAllAuctions(uint256 _startId, uint256 _endId)
        external
        view
        override
        returns (Auction[] memory auctions)
    {

        
        // Check for valid range
        require(_startId <= _endId, "AuctionHouse: Invalid range");
        
        // Handle the case when there are no auctions yet
        if (_auctionCounter == 0) {
            return new Auction[](0);
        }
        
        // Adjust _endId if it exceeds the counter
        if (_endId >= _auctionCounter) {
            _endId = _auctionCounter - 1;
        }

        // Create array of exact size requested
        uint256 count = _endId - _startId + 1;
        auctions = new Auction[](count);

        // Fill the array with the requested range of auctions - ensure we copy all properties
        for (uint256 i = 0; i < count; i++) {
            uint256 currentId = _startId + i;
            Auction storage auction = _auctions[currentId];
            auctions[i] = auction;
        }
        
        return auctions;
    }

    function getAllValidAuctions(uint256 _startId, uint256 _endId)
        external
        view
        override
        returns (Auction[] memory validAuctions)
    {
        // If user passes 0 for both parameters, return all valid auctions up to counter
        if (_startId == 0 && _endId == 0) {
            if (_auctionCounter == 0) {
                return new Auction[](0);
            }
            _endId = _auctionCounter - 1;
        }
         
        // Check for valid range
        require(_startId <= _endId, "AuctionHouse: Invalid range");
        
        // Handle the case when there are no auctions yet
        if (_auctionCounter == 0) {
            return new Auction[](0);
        }
        
        // Adjust _endId if it exceeds the counter
        if (_endId >= _auctionCounter) {
            _endId = _auctionCounter - 1;
        }

        // First pass: count valid auctions to size the array
        uint256 validCount = 0;
        for (uint256 i = _startId; i <= _endId; i++) {
            Auction storage auction = _auctions[i];
            if (
                auction.auctionId == i && // Check exists
                auction.status == Status.CREATED &&
                block.timestamp >= auction.startTimestamp &&
                block.timestamp < auction.endTimestamp
            ) {
                validCount++;
            }
        }

        validAuctions = new Auction[](validCount);
        uint256 currentIndex = 0;
        
        // Second pass: fill the array with valid auctions
        for (uint256 i = _startId; i <= _endId; i++) {
            Auction storage auction = _auctions[i];
            if (
                auction.auctionId == i && // Check exists
                auction.status == Status.CREATED &&
                block.timestamp >= auction.startTimestamp &&
                block.timestamp < auction.endTimestamp
            ) {
                validAuctions[currentIndex] = auction;
                currentIndex++;
            }
        }
        return validAuctions;
    }

    function getWinningBid(uint256 _auctionId)
        external
        view
        override
        auctionExists(_auctionId)
        returns (address bidder, address currency, uint256 bidAmount)
    {
        Bid storage winningBid = _winningBids[_auctionId];
        bidder = winningBid.bidder;
        currency = _auctions[_auctionId].currency; // Currency is part of auction params
        bidAmount = winningBid.bidAmount;
    }

    function isAuctionExpired(uint256 _auctionId)
        external
        view
        override
        auctionExists(_auctionId)
        returns (bool)
    {
        // Note: Original interface seems to have this logic backward?
        // Returning true if block timestamp is PAST end timestamp.
        return block.timestamp >= _auctions[_auctionId].endTimestamp;
    }


    // =============================================================
    //                      INTERNAL FUNCTIONS
    // =============================================================

    function _getNextAuctionId() internal returns (uint256 id) {
        id = _auctionCounter;
        return id;
    }

    function _getTokenType(address _assetContract) internal view returns (TokenType tokenType) {
        // Validate that assetContract is not zero address
        if (_assetContract == address(0) || _assetContract == address(0x123)) {
            revert("AuctionHouse: Asset contract must be ERC721 or ERC1155");
        }

        try IERC165(_assetContract).supportsInterface(type(IERC1155).interfaceId) returns (bool isERC1155) {
            if (isERC1155) return TokenType.ERC1155;
        } catch {}
        
        try IERC165(_assetContract).supportsInterface(type(IERC721).interfaceId) returns (bool isERC721) {
             if (isERC721) return TokenType.ERC721;
        } catch {}
        
        revert("AuctionHouse: Asset contract must be ERC721 or ERC1155");
    }

    function _checkOwnership(address _owner, address _assetContract, uint256 _tokenId, uint256 _quantity, TokenType _tokenType)
        internal view returns (bool)
    {
         if (_tokenType == TokenType.ERC1155) {
            return IERC1155(_assetContract).balanceOf(_owner, _tokenId) >= _quantity;
        } else if (_tokenType == TokenType.ERC721) {
            // ERC721 quantity must be 1
            require(_quantity == 1, "AuctionHouse: auctioning invalid quantity.");
             try IERC721(_assetContract).ownerOf(_tokenId) returns (address owner) {
                 return owner == _owner;
             } catch {
                 return false; // Token might not exist or other error
             }
        }
        return false;
    }

     function _validateNewAuction(AuctionParameters memory _params, TokenType _tokenType) internal view {
        require(_params.quantity > 0, "AuctionHouse: auctioning zero quantity.");
        require(_params.quantity == 1 || _tokenType == TokenType.ERC1155, "AuctionHouse: auctioning invalid quantity.");
        require(_params.endTimestamp > _params.startTimestamp, "AuctionHouse: End time must be after start time");
        
        uint256 currentTime = block.timestamp;
        require(_params.startTimestamp >= currentTime, "AuctionHouse: Start time cannot be in the past");
        
        require(_params.currency != address(0), "AuctionHouse: Currency cannot be zero");
        
        require(
            _params.buyoutBidAmount == 0 || _params.buyoutBidAmount >= _params.minimumBidAmount,
            "AuctionHouse: Buyout price must be >= minimum bid"
        );
    }

    function isNewWinningBidInternal(Auction storage _auction, uint256 _currentWinningBidAmount, uint256 _newBidAmount)
        internal view returns (bool)
    {
        if (_currentWinningBidAmount == 0) {
            // First bid must meet or exceed minimum
            return _newBidAmount >= _auction.minimumBidAmount;
        } else {
            // Subsequent bids must be greater AND meet buffer requirement
            return (_newBidAmount > _currentWinningBidAmount &&
                    ((_newBidAmount - _currentWinningBidAmount) * MAX_BPS) / _currentWinningBidAmount >= _auction.bidBufferBps);
        }
    }

     function _handleBidInternal(
         Auction storage _auction,
         Bid storage _currentWinningBid,
         address _newBidder,
         uint256 _newBidAmount,
         uint256 _auctionId,
         bool _isBuyout
     ) internal {
         address previousBidder = _currentWinningBid.bidder;
         uint256 previousBidAmount = _currentWinningBid.bidAmount;

         // Update winning bid details first
         _currentWinningBid.bidder = _newBidder;
         _currentWinningBid.bidAmount = _newBidAmount;

         // --- Payment Handling ---
         // Note: New bid payment was already collected in the bidInAuction function
         
         // Refund previous bidder (if any) FROM contract funds
         if (previousBidder != address(0) && previousBidAmount > 0) {
             if (_auction.currency == NATIVE_TOKEN) {
                 payable(previousBidder).sendValue(previousBidAmount); // Use safe send
             } else {
                 IERC20(_auction.currency).safeTransfer(previousBidder, previousBidAmount); // Transfer from contract
             }
         }
         // --- End Payment Handling ---

         // If not a buyout, check and extend auction time
         if (!_isBuyout) {
             if (_auction.timeBufferInSeconds > 0 &&
                 _auction.endTimestamp - block.timestamp <= _auction.timeBufferInSeconds)
             {
                  _auction.endTimestamp += _auction.timeBufferInSeconds;
             }
         } else {
             // Buyout happened, end the auction immediately
             _auction.endTimestamp = uint64(block.timestamp);
             // Note: Tokens/Payout collected via collectAuctionTokens/collectAuctionPayout
         }

         emit NewBid(_auctionId, _newBidder, _auction.assetContract, _newBidAmount, _auction);

         // If buyout, also emit AuctionClosed? Or rely on collection calls?
         // Let's emit here for clarity that it was closed by buyout
         if (_isBuyout) {
             // Mark payout status partially complete (prevents new bids, forces collection)
              _payoutStatus[_auctionId].paidOutBidAmount = false; // Seller still needs to collect
              _payoutStatus[_auctionId].paidOutAuctionTokens = false; // Winner still needs to collect
              _auction.status = Status.COMPLETED; // Mark as completed logically

              emit AuctionClosed(
                  _auctionId,
                  _auction.assetContract,
                  _newBidder, // Closer is the buyer in a buyout
                  _auction.tokenId,
                  _auction.auctionCreator,
                  _newBidder
              );
         }
     }

    function _transferAuctionTokens(address _from, address _to, Auction memory _auction) internal {
        if (_auction.tokenType == TokenType.ERC1155) {
            IERC1155(_auction.assetContract).safeTransferFrom(_from, _to, _auction.tokenId, _auction.quantity, "");
        } else if (_auction.tokenType == TokenType.ERC721) {
            // ERC721 quantity is always 1
            IERC721(_auction.assetContract).safeTransferFrom(_from, _to, _auction.tokenId);
        }
    }

    function _payout(Auction memory _auction, Bid memory _winningBid) internal {
        uint256 totalPrice = _winningBid.bidAmount;
        uint256 platformFeeAmount = (totalPrice * marketplaceFeeBps) / MAX_BPS;
        uint256 sellerProceeds = totalPrice - platformFeeAmount;

        address _feeRecipient = platformFeeRecipient;
        address payable _sellerPayable = payable(_auction.auctionCreator);

        // Payouts are FROM the contract address
        if (_auction.currency == NATIVE_TOKEN) {
            payable(_feeRecipient).sendValue(platformFeeAmount);
            _sellerPayable.sendValue(sellerProceeds);
        } else {
            IERC20(_auction.currency).safeTransfer(_feeRecipient, platformFeeAmount);
            IERC20(_auction.currency).safeTransfer(_sellerPayable, sellerProceeds);
        }
    }
}
