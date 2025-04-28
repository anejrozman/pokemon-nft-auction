// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PokemonDutchAuction is ReentrancyGuard, Ownable {
    struct DutchAuction {
        address seller;
        address nftAddress;
        uint256 tokenId;
        uint256 startPrice;
        uint256 endPrice;
        uint256 startTime;
        uint256 duration;
        uint256 decayExponent; // 1 = linear, >1 = non-linear
        bool active;
    }

    uint256 public auctionCounter;
    mapping(uint256 => DutchAuction) public auctions;
    mapping(address => uint256) public pendingWithdrawals;

    event DutchAuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        uint256 tokenId,
        uint256 startPrice,
        uint256 endPrice,
        uint256 duration,
        uint256 decayExponent
    );

    event DutchAuctionCompleted(uint256 indexed auctionId, address buyer, uint256 price);

    constructor(address initialOwner) Ownable(initialOwner) {}
    function createDutchAuction(
        address nftAddress,
        uint256 tokenId,
        uint256 startPrice,
        uint256 endPrice,
        uint256 duration,
        uint256 decayExponent
    ) external {
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
            active: true
        });

        emit DutchAuctionCreated(auctionCounter, msg.sender, tokenId, startPrice, endPrice, duration, decayExponent);
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
        require(auction.active, "Auction not active");

        uint256 currentPrice = getCurrentPrice(auctionId);
        require(msg.value >= currentPrice, "Insufficient payment");

        auction.active = false;
        pendingWithdrawals[auction.seller] += msg.value;

        IERC721(auction.nftAddress).safeTransferFrom(auction.seller, msg.sender, auction.tokenId);

        emit DutchAuctionCompleted(auctionId, msg.sender, currentPrice);
    }

    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
}
