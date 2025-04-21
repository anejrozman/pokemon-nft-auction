// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "../utils/BaseTest.sol";
import "../../contracts/PokemonAuctionHouse.sol";
import "../../contracts/interfaces/IMarketplace.sol";

contract PokemonAuctionHouseBidInAuctionTest is BaseTest {
    // Target contract
    PokemonAuctionHouse public auctionHouse;

    // Participants
    address public owner;
    address public seller;
    address public buyer;
    address public otherBuyer;

    // Auction parameters and ID
    IEnglishAuctions.AuctionParameters internal auctionParams;
    uint256 public auctionId;

    function setUp() public override {
        super.setUp();

        owner = getActor(1);
        seller = getActor(2);
        buyer = getActor(3);
        otherBuyer = getActor(4);

        vm.prank(owner);
        auctionHouse = new PokemonAuctionHouse(250); // 2.5% marketplace fee
        
        // Sample auction parameters
        address assetContract = address(erc721);
        uint256 tokenId = 0;
        uint256 quantity = 1;
        address currency = address(erc20);
        uint256 minimumBidAmount = 1 ether;
        uint256 buyoutBidAmount = 10 ether;
        uint64 timeBufferInSeconds = 10 seconds;
        uint64 bidBufferBps = 1000;
        uint64 startTimestamp = uint64(block.timestamp + 100);
        uint64 endTimestamp = uint64(block.timestamp + 200);

        auctionParams = IEnglishAuctions.AuctionParameters(
            assetContract,
            tokenId,
            quantity,
            currency,
            minimumBidAmount,
            buyoutBidAmount,
            timeBufferInSeconds,
            bidBufferBps,
            startTimestamp,
            endTimestamp
        );

        // Mint NFT to seller
        erc721.mint(seller, 1);
        
        // Mint ERC20 to buyers for bidding
        erc20.mint(buyer, 100 ether);
        erc20.mint(otherBuyer, 100 ether);
        
        // Approvals
        vm.prank(seller);
        erc721.setApprovalForAll(address(auctionHouse), true);
        
        vm.prank(buyer);
        erc20.approve(address(auctionHouse), type(uint256).max);
        
        vm.prank(otherBuyer);
        erc20.approve(address(auctionHouse), type(uint256).max);
        
        // Create the auction
        vm.prank(seller);
        auctionId = auctionHouse.createAuction(auctionParams);
        
        // Warp to start time
        vm.warp(auctionParams.startTimestamp);
    }

    function test_bidInAuction() public {
        uint256 bidAmount = auctionParams.minimumBidAmount;
        
        vm.prank(buyer);
        auctionHouse.bidInAuction(auctionId, bidAmount);
        
        // Check that bid was recorded
        (address bidder, address currency, uint256 amount) = auctionHouse.getWinningBid(auctionId);
        
        assertEq(bidder, buyer);
        assertEq(currency, auctionParams.currency);
        assertEq(amount, bidAmount);
        
        // Check ERC20 was transferred from buyer
        assertEq(erc20.balanceOf(buyer), 100 ether - bidAmount);
        assertEq(erc20.balanceOf(address(auctionHouse)), bidAmount);
    }
    
    function test_bidInAuction_withHigherBid() public {
        // First bid (minimum)
        vm.prank(buyer);
        auctionHouse.bidInAuction(auctionId, auctionParams.minimumBidAmount);
        
        // Second higher bid
        uint256 higherBid = auctionParams.minimumBidAmount * 2;
        vm.prank(otherBuyer);
        auctionHouse.bidInAuction(auctionId, higherBid);
        
        // Check that bid was updated
        (address bidder, address currency, uint256 amount) = auctionHouse.getWinningBid(auctionId);
        
        assertEq(bidder, otherBuyer);
        assertEq(amount, higherBid);
        
        // First bidder should be refunded
        assertEq(erc20.balanceOf(buyer), 100 ether); // Full refund
        assertEq(erc20.balanceOf(otherBuyer), 100 ether - higherBid);
        assertEq(erc20.balanceOf(address(auctionHouse)), higherBid);
    }
    
    function test_bidInAuction_withBuyout() public {
        // Bid with buyout amount
        vm.prank(buyer);
        auctionHouse.bidInAuction(auctionId, auctionParams.buyoutBidAmount);
        
        // Check that bid was recorded
        (address bidder, address currency, uint256 amount) = auctionHouse.getWinningBid(auctionId);
        
        assertEq(bidder, buyer);
        assertEq(amount, auctionParams.buyoutBidAmount);
        
        // Check auction is completed (moved to buyout state)
        IEnglishAuctions.Auction memory auction = auctionHouse.getAuction(auctionId);
        assertEq(uint8(auction.status), uint8(IEnglishAuctions.Status.COMPLETED));
        
        // Check end timestamp was updated to current time
        assertEq(auction.endTimestamp, block.timestamp);
    }
    
    function test_bidInAuction_revert_belowMinimum() public {
        uint256 bidAmount = auctionParams.minimumBidAmount - 1;
        
        vm.prank(buyer);
        vm.expectRevert("AuctionHouse: Bid not high enough");
        auctionHouse.bidInAuction(auctionId, bidAmount);
    }
    
    function test_bidInAuction_revert_belowBidBuffer() public {
        // First bid (minimum)
        vm.prank(buyer);
        auctionHouse.bidInAuction(auctionId, auctionParams.minimumBidAmount);
        
        // Second bid with insufficient increase
        uint256 bidAmount = auctionParams.minimumBidAmount + (auctionParams.minimumBidAmount * auctionParams.bidBufferBps / 10000) - 1;
        
        vm.prank(otherBuyer);
        vm.expectRevert("AuctionHouse: Bid not high enough");
        auctionHouse.bidInAuction(auctionId, bidAmount);
    }
    
    function test_bidInAuction_revert_auctionExpired() public {
        // Warp past end time
        vm.warp(auctionParams.endTimestamp + 1);
        
        vm.prank(buyer);
        vm.expectRevert("AuctionHouse: Auction expired");
        auctionHouse.bidInAuction(auctionId, auctionParams.minimumBidAmount);
    }
} 