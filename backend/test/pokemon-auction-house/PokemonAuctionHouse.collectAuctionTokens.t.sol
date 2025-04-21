// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "../utils/BaseTest.sol";
import "../../contracts/PokemonAuctionHouse.sol";
import "../../contracts/interfaces/IMarketplace.sol";

contract PokemonAuctionHouseCollectAuctionTokensTest is BaseTest {
    // Target contract
    PokemonAuctionHouse public auctionHouse;

    // Participants
    address public owner;
    address public seller;
    address public buyer;

    // Auction parameters and ID
    IEnglishAuctions.AuctionParameters internal auctionParams;
    uint256 public auctionId;

    function setUp() public override {
        super.setUp();

        owner = getActor(1);
        seller = getActor(2);
        buyer = getActor(3);

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

        // Mint tokens
        erc721.mint(seller, 1); // Mint NFT to seller
        erc20.mint(buyer, 100 ether); // Mint ERC20 to buyer
        
        // Approvals
        vm.prank(seller);
        erc721.setApprovalForAll(address(auctionHouse), true);
        
        vm.prank(buyer);
        erc20.approve(address(auctionHouse), type(uint256).max);
        
        // Create auction
        vm.prank(seller);
        auctionId = auctionHouse.createAuction(auctionParams);
        
        // Warp to start time
        vm.warp(auctionParams.startTimestamp);
        
        // Place bid
        vm.prank(buyer);
        auctionHouse.bidInAuction(auctionId, auctionParams.minimumBidAmount);
        
        // Warp to end time
        vm.warp(auctionParams.endTimestamp + 1);
    }

    function test_collectAuctionTokens() public {
        vm.prank(buyer);
        auctionHouse.collectAuctionTokens(auctionId);
        
        // Verify NFT was transferred to buyer
        assertEq(erc721.ownerOf(0), buyer);
    }
    
    function test_collectAuctionTokens_withERC1155() public {
        // Setup a new auction with ERC1155
        auctionParams.assetContract = address(erc1155);
        auctionParams.quantity = 5;
        auctionParams.startTimestamp = uint64(block.timestamp + 100);
        auctionParams.endTimestamp = uint64(block.timestamp + 200);
        
        // Mint ERC1155 to seller
        erc1155.mint(seller, 0, 10);
        
        vm.prank(seller);
        erc1155.setApprovalForAll(address(auctionHouse), true);
        
        // Create new auction
        vm.prank(seller);
        uint256 erc1155AuctionId = auctionHouse.createAuction(auctionParams);
        
        // Warp to start time
        vm.warp(auctionParams.startTimestamp);
        
        // Place bid
        vm.prank(buyer);
        auctionHouse.bidInAuction(erc1155AuctionId, auctionParams.minimumBidAmount);
        
        // Warp to end time
        vm.warp(auctionParams.endTimestamp + 1);
        
        // Collect tokens
        vm.prank(buyer);
        auctionHouse.collectAuctionTokens(erc1155AuctionId);
        
        // Verify ERC1155 tokens were transferred to buyer
        assertEq(erc1155.balanceOf(buyer, 0), 5);
        assertEq(erc1155.balanceOf(address(auctionHouse), 0), 0);
    }
    
    function test_collectAuctionTokens_revert_notWinningBidder() public {
        // Try to collect as someone other than winning bidder
        vm.prank(seller);
        vm.expectRevert("AuctionHouse: Only winning bidder can collect tokens");
        auctionHouse.collectAuctionTokens(auctionId);
    }
    
    function test_collectAuctionTokens_revert_alreadyCollected() public {
        // Collect once
        vm.prank(buyer);
        auctionHouse.collectAuctionTokens(auctionId);
        
        // Try to collect again
        vm.prank(buyer);
        vm.expectRevert("AuctionHouse: Auction tokens already collected");
        auctionHouse.collectAuctionTokens(auctionId);
    }
} 