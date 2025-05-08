// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

// OpenZeppelin Imports
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/**
 * @title PokemonDutchAuction
 * @dev Contract for conducting Dutch auctions of Pokemon NFTs.
 */
contract PokemonDutchAuction is ReentrancyGuard, IERC721Receiver, Ownable, Pausable {
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

    /**
     * @dev Creates a new Dutch auction
     * @param nftAddress Address of the NFT contract
     * @param tokenId ID of the token to auction
     * @param startPrice Starting price of the auction
     * @param endPrice Ending price of the auction
     * @param duration Duration of the auction in seconds
     * @param decayExponent Exponent for price decay (1 = linear, >1 = non-linear)
     * @param currency Address of the currency token (use NATIVE_TOKEN for ETH)
     * @return auctionId The ID of the created auction
     */
    function createDutchAuction(
        address nftAddress,
        uint256 tokenId,
        uint256 startPrice,
        uint256 endPrice,
        uint256 duration,
        uint256 decayExponent,
        address currency
    ) external whenNotPaused nonReentrant returns (uint256) {
        // Checks if the auction is correctly defined
        require(startPrice > endPrice, "Start price must be greater than end price");
        require(duration > 0, "Duration must be greater than 0");
        require(decayExponent >= 1, "Decay exponent must be positive");

        IERC721 nft = IERC721(nftAddress);
        require(nft.ownerOf(tokenId) == msg.sender, "Not the token owner");
        require(nft.getApproved(tokenId) == address(this) || nft.isApprovedForAll(msg.sender, address(this)), "Contract not approved");

        uint256 newAuctionId = auctionCounter;
        auctions[newAuctionId] = DutchAuction({
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

        // Transfer the NFT to the contract
        nft.safeTransferFrom(msg.sender, address(this), tokenId);
        
        emit DutchAuctionCreated(
            newAuctionId,
            msg.sender,
            tokenId,
            startPrice,
            endPrice,
            duration,
            decayExponent,
            currency
        );
        
        auctionCounter++;
        return newAuctionId;
    }

    function onERC721Received(
    address,
    address,
    uint256,
    bytes calldata
) external pure override returns (bytes4) {
    return IERC721Receiver.onERC721Received.selector;
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
            result = result * base;
        }
        return result;
    }

    /**
     * @dev Buy an NFT at the current Dutch auction price
     * @param auctionId ID of the auction to buy from
     */
    function buy(uint256 auctionId) external payable whenNotPaused nonReentrant {
        DutchAuction storage auction = auctions[auctionId];
        require(auction.active, "Auction not active");
        
        uint256 currentPrice = getCurrentPrice(auctionId);
        
        // Handle payment
        if (auction.currency == NATIVE_TOKEN) {
            require(msg.value >= currentPrice, "Insufficient payment");
        } else {
            require(msg.value == 0, "Native token not accepted for this auction");
            IERC20 tokenContract = IERC20(auction.currency);
            require(
                tokenContract.transferFrom(msg.sender, address(this), currentPrice),
                "Token transfer failed"
            );
        }
        
        // Mark auction as complete
        auction.active = false;
        
        // Calculate fees
        uint256 platformFeeAmount = (currentPrice * marketplaceFeeBps) / MAX_BPS;
        uint256 sellerProceeds = currentPrice - platformFeeAmount;
        
        // Transfer the NFT to the buyer
        IERC721(auction.nftAddress).safeTransferFrom(address(this), msg.sender, auction.tokenId);
        
        // Transfer funds
        if (auction.currency == NATIVE_TOKEN) {
            // Send platform fee
            payable(platformFeeRecipient).transfer(platformFeeAmount);
            
            // Send seller proceeds
            payable(auction.seller).transfer(sellerProceeds);
            
            // Refund excess payment if any
            uint256 refund = msg.value - currentPrice;
            if (refund > 0) {
                payable(msg.sender).transfer(refund);
            }
        } else {
            // Handle ERC20 token payments
            IERC20 tokenContract = IERC20(auction.currency);
            
            // Send platform fee
            require(
                tokenContract.transfer(platformFeeRecipient, platformFeeAmount),
                "Fee transfer failed"
            );
            
            // Send seller proceeds
            require(
                tokenContract.transfer(auction.seller, sellerProceeds),
                "Seller payment failed"
            );
        }
        
        emit DutchAuctionCompleted(auctionId, msg.sender, currentPrice);
    }

    /**
     * @dev Cancels an auction - only the seller or admin can cancel
     * @param auctionId ID of the auction to cancel
     */
    function cancelAuction(uint256 auctionId) external nonReentrant {
        DutchAuction storage auction = auctions[auctionId];
        require(auction.active, "Auction not active");
        require(
            msg.sender == auction.seller || msg.sender == owner(),
            "Only seller or owner can cancel auction"
        );
        
        auction.active = false;
        
        // Return the NFT to the seller
        IERC721(auction.nftAddress).safeTransferFrom(address(this), auction.seller, auction.tokenId);
    }
    
    /**
     * @dev Get details of an auction
     * @param auctionId ID of the auction
     * @return seller The address of the seller
     * @return nftAddress The address of the NFT contract
     * @return tokenId The ID of the token
     * @return startPrice The starting price
     * @return endPrice The ending price
     * @return startTime The start time of the auction
     * @return duration The duration of the auction
     * @return decayExponent The decay exponent
     * @return currency The currency address
     * @return active Whether the auction is active
     * @return currentPrice The current price of the auction
     */
    function getAuction(uint256 auctionId) 
        external 
        view 
        returns (
            address seller,
            address nftAddress,
            uint256 tokenId,
            uint256 startPrice,
            uint256 endPrice,
            uint256 startTime,
            uint256 duration,
            uint256 decayExponent,
            address currency,
            bool active,
            uint256 currentPrice
        ) 
    {
        DutchAuction memory auction = auctions[auctionId];
        
        return (
            auction.seller,
            auction.nftAddress,
            auction.tokenId,
            auction.startPrice,
            auction.endPrice,
            auction.startTime,
            auction.duration,
            auction.decayExponent,
            auction.currency,
            auction.active,
            auction.active ? getCurrentPrice(auctionId) : 0
        );
    }
    
    /**
     * @dev Get multiple auctions in a specified range
     * @param _startId Starting auction ID (inclusive)
     * @param _endId Ending auction ID (inclusive)
     * @return dutchAuctions Array of Dutch auction structs
     */
    function getAllAuctions(uint256 _startId, uint256 _endId)
        external
        view
        returns (DutchAuction[] memory dutchAuctions)
    {
        // Check for valid range
        require(_startId <= _endId, "AuctionHouse: Invalid range");
        
        // Handle the case when there are no auctions yet
        if (auctionCounter == 0) {
            return new DutchAuction[](0);
        }
        
        // Adjust _endId if it exceeds the counter
        if (_endId >= auctionCounter) {
            _endId = auctionCounter - 1;
        }

        // Create array of exact size requested
        uint256 count = _endId - _startId + 1;
        dutchAuctions = new DutchAuction[](count);

        // Fill the array with the requested range of auctions
        for (uint256 i = 0; i < count; i++) {
            uint256 currentId = _startId + i;
            DutchAuction storage auction = auctions[currentId];
            dutchAuctions[i] = auction;
        }
        
        return dutchAuctions;
    }

    /**
     * @dev Get all active auctions in a specified range
     * @param _startId Starting auction ID (inclusive)
     * @param _endId Ending auction ID (inclusive)
     * @return activeAuctions Array of active Dutch auction structs
     */
    function getAllActiveAuctions(uint256 _startId, uint256 _endId)
        external
        view
        returns (DutchAuction[] memory activeAuctions)
    {
        // If user passes 0 for both parameters, return all auctions up to counter
        if (_startId == 0 && _endId == 0) {
            if (auctionCounter == 0) {
                return new DutchAuction[](0);
            }
            _endId = auctionCounter - 1;
        }
        
        // Check for valid range
        require(_startId <= _endId, "AuctionHouse: Invalid range");
        
        // Handle the case when there are no auctions yet
        if (auctionCounter == 0) {
            return new DutchAuction[](0);
        }
        
        // Adjust _endId if it exceeds the counter
        if (_endId >= auctionCounter) {
            _endId = auctionCounter - 1;
        }

        // First pass: count active auctions to size the array
        uint256 activeCount = 0;
        for (uint256 i = _startId; i <= _endId; i++) {
            DutchAuction storage auction = auctions[i];
            if (auction.active && (block.timestamp - auction.startTime) < auction.duration) {
                activeCount++;
            }
        }

        activeAuctions = new DutchAuction[](activeCount);
        uint256 currentIndex = 0;
        
        // Second pass: fill the array with active auctions
        for (uint256 i = _startId; i <= _endId; i++) {
            DutchAuction storage auction = auctions[i];
            if (auction.active && (block.timestamp - auction.startTime) < auction.duration) {
                activeAuctions[currentIndex] = auction;
                currentIndex++;
            }
        }
        
        return activeAuctions;
    }

    /**
     * @dev Get the total number of auctions created
     * @return Total number of auctions
     */
    function totalAuctions() external view returns (uint256) {
        return auctionCounter;
    }
    
    /**
     * @dev Emergency withdrawal of ETH
     * @param to Address to send ETH to
     * @param amount Amount of ETH to withdraw
     */
    function withdrawETH(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot withdraw to zero address");
        require(amount <= address(this).balance, "Insufficient balance");
        payable(to).transfer(amount);
    }
    
    /**
     * @dev Emergency withdrawal of ERC20 tokens
     * @param tokenAddress Address of the token contract
     * @param to Address to send tokens to
     * @param amount Amount of tokens to withdraw
     */
    function withdrawERC20(address tokenAddress, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot withdraw to zero address");
        IERC20 token = IERC20(tokenAddress);
        require(token.transfer(to, amount), "Token transfer failed");
    }
}