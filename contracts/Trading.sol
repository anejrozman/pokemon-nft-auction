// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract PokemonTrading is ReentrancyGuard, Ownable {
    enum SaleType { FixedPrice, Auction, AuctionWithBuyout }

    struct Listing {
        address seller;
        address nftAddress;
        uint256 tokenId;
        SaleType saleType;
        uint256 startPrice;
        uint256 buyoutPrice;
        uint256 auctionEnd;
        address highestBidder;
        uint256 highestBid;
        bool active;
    }

    uint256 private _listingCounter;
    mapping(uint256 => Listing) public listings;
    mapping(address => uint256) public pendingWithdrawals;

    event CardListed(uint256 listingId, address indexed seller, uint256 tokenId, SaleType saleType, uint256 startPrice, uint256 buyoutPrice);
    event CardPurchased(uint256 listingId, address indexed buyer, uint256 price);
    event NewBid(uint256 listingId, address indexed bidder, uint256 bid);
    event AuctionEnded(uint256 listingId, address winner, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}


    function listCard(
        address nftAddress,
        uint256 tokenId,
        SaleType saleType,
        uint256 startPrice,
        uint256 buyoutPrice,
        uint256 duration // Only for auctions
    ) external {
        IERC721 nft = IERC721(nftAddress);
        require(nft.ownerOf(tokenId) == msg.sender, "Not the card owner");
        require(nft.isApprovedForAll(msg.sender, address(this)) || nft.getApproved(tokenId) == address(this), "Marketplace not approved");

        uint256 auctionEnd = (saleType == SaleType.Auction) ? block.timestamp + duration : 0;

        listings[_listingCounter] = Listing({
            seller: msg.sender,
            nftAddress: nftAddress,
            tokenId: tokenId,
            saleType: saleType,
            startPrice: startPrice,
            buyoutPrice: buyoutPrice,
            auctionEnd: auctionEnd,
            highestBidder: address(0),
            highestBid: 0,
            active: true
        });

        emit CardListed(_listingCounter, msg.sender, tokenId, saleType, startPrice, buyoutPrice);
        _listingCounter++;
    }

    function buyCard(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing is not active");
        require(listing.saleType == SaleType.FixedPrice, "Not a fixed-price sale");
        require(msg.value >= listing.buyoutPrice, "Incorrect price sent");

        listing.active = false;
        pendingWithdrawals[listing.seller] += msg.value;

        IERC721(listing.nftAddress).safeTransferFrom(listing.seller, msg.sender, listing.tokenId);

        emit CardPurchased(listingId, msg.sender, msg.value);
    }

    function placeBid(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing is not active");
        require(listing.saleType == SaleType.Auction || listing.saleType == SaleType.AuctionWithBuyout, "Not an auction");
        require(block.timestamp < listing.auctionEnd, "Auction ended (time expiration)");
        require(listing.saleType != SaleType.AuctionWithBuyout || 
            listing.highestBid < listing.buyoutPrice, "Auction ended (buyout executed)");
        require(msg.value > listing.highestBid, "Bid too low");

        if (listing.highestBidder != address(0)) {
            pendingWithdrawals[listing.highestBidder] += listing.highestBid;
        }

        listing.highestBidder = msg.sender;
        listing.highestBid = msg.value;

        emit NewBid(listingId, msg.sender, msg.value);
    }

    function endAuction(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing is not active");
        require(listing.saleType == SaleType.Auction, "Not an auction");
        require(block.timestamp >= listing.auctionEnd || 
            (listing.saleType == SaleType.AuctionWithBuyout && listing.highestBid >= listing.buyoutPrice), "Auction not ended");

        listing.active = false;

        if (listing.highestBidder != address(0)) {
            pendingWithdrawals[listing.seller] += listing.highestBid;
            IERC721(listing.nftAddress).safeTransferFrom(listing.seller, listing.highestBidder, listing.tokenId);
            emit AuctionEnded(listingId, listing.highestBidder, listing.highestBid);
        }
    }

    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
}
