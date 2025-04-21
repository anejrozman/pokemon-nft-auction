// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "../utils/BaseTest.sol";
import "../../contracts/PokemonAuctionHouse.sol";
import "../../contracts/interfaces/IMarketplace.sol";

contract PokemonAuctionHouseCreateAuctionTest is BaseTest {
    // Target contract
    PokemonAuctionHouse public auctionHouse;

    // Participants
    address public deployer;
    address public seller;
    address public buyer;
    address public randomUser;

    // Auction parameters
    IEnglishAuctions.AuctionParameters internal auctionParams;

    // Events
    event NewAuction(
        address indexed auctionCreator,
        uint256 indexed auctionId,
        address indexed assetContract,
        IEnglishAuctions.Auction auction
    );

    function setUp() public override {
        super.setUp();

        deployer = getActor(1);
        seller = getActor(2);
        buyer = getActor(3);
        randomUser = getActor(4);

        vm.startPrank(deployer);
        auctionHouse = new PokemonAuctionHouse(250); // 2.5% marketplace fee
        vm.stopPrank();
        
        vm.label(address(auctionHouse), "PokemonAuctionHouse");
        vm.label(deployer, "Deployer");
        vm.label(seller, "Seller");
        vm.label(buyer, "Buyer");
        vm.label(randomUser, "RandomUser");
        vm.label(address(erc721), "ERC721_Token");
        vm.label(address(erc1155), "ERC1155_Token");

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

        // Auction parameters
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
        erc721.mint(seller, 1); // to, amount
        erc1155.mint(seller, 0, 100); // to, id, amount
        
        // Mint ERC20 to buyer for bidding
        erc20.mint(buyer, 100 ether);
        
        // Approve tokens
        vm.prank(seller);
        erc721.setApprovalForAll(address(auctionHouse), true);
        
        vm.prank(seller);
        erc1155.setApprovalForAll(address(auctionHouse), true);
        
        vm.prank(buyer);
        erc20.approve(address(auctionHouse), type(uint256).max);
    }

    /*//////////////////////////////////////////////////////////////
                        CREATE AUCTION - SUCCESS CASES
    //////////////////////////////////////////////////////////////*/

    function test_createAuction_erc721_success() public {
        uint256 expectedAuctionId = 0; // First auction should have ID 0
        
        // Pre-conditions
        assertEq(erc721.ownerOf(0), seller);
        
        // Expect the NewAuction event
        vm.expectEmit(true, true, true, false);
        emit NewAuction(seller, expectedAuctionId, auctionParams.assetContract, IEnglishAuctions.Auction(0, 0, 0, 0, 0, 0, 0, 0, 0, address(0), address(0), address(0), IEnglishAuctions.TokenType.ERC721, IEnglishAuctions.Status.CREATED));
        
        // Create the auction
        vm.prank(seller);
        uint256 auctionId = auctionHouse.createAuction(auctionParams);
        
        // Check auction ID
        assertEq(auctionId, expectedAuctionId);
        
        // Get auction details and verify all parameters
        IEnglishAuctions.Auction memory auction = auctionHouse.getAuction(auctionId);
        
        assertEq(auction.auctionId, expectedAuctionId);
        assertEq(auction.assetContract, auctionParams.assetContract);
        assertEq(auction.tokenId, auctionParams.tokenId);
        assertEq(auction.quantity, auctionParams.quantity);
        assertEq(auction.currency, auctionParams.currency);
        assertEq(auction.minimumBidAmount, auctionParams.minimumBidAmount);
        assertEq(auction.buyoutBidAmount, auctionParams.buyoutBidAmount);
        assertEq(auction.timeBufferInSeconds, auctionParams.timeBufferInSeconds);
        assertEq(auction.bidBufferBps, auctionParams.bidBufferBps);
        assertEq(auction.startTimestamp, auctionParams.startTimestamp);
        assertEq(auction.endTimestamp, auctionParams.endTimestamp);
        assertEq(auction.auctionCreator, seller);
        assertEq(uint256(auction.tokenType), uint256(IEnglishAuctions.TokenType.ERC721));
        assertEq(uint256(auction.status), uint256(IEnglishAuctions.Status.CREATED));
        
        // Verify NFT was transferred to contract
        assertEq(erc721.ownerOf(0), address(auctionHouse));
    }
    
    function test_createAuction_erc1155_success() public {
        // Update auction params to use ERC1155
        auctionParams.assetContract = address(erc1155);
        auctionParams.quantity = 5;
        
        // Pre-conditions
        uint256 sellerBalanceBefore = erc1155.balanceOf(seller, 0);
        assertEq(sellerBalanceBefore, 100);
        
        vm.prank(seller);
        uint256 auctionId = auctionHouse.createAuction(auctionParams);
        
        // Verify auction was created
        IEnglishAuctions.Auction memory auction = auctionHouse.getAuction(auctionId);
        
        assertEq(auction.auctionCreator, seller);
        assertEq(auction.assetContract, address(erc1155));
        assertEq(auction.tokenId, auctionParams.tokenId);
        assertEq(auction.quantity, 5);
        assertEq(uint256(auction.tokenType), uint256(IEnglishAuctions.TokenType.ERC1155));
        assertEq(uint256(auction.status), uint256(IEnglishAuctions.Status.CREATED));
        
        // Verify ERC1155 tokens were transferred to contract
        assertEq(erc1155.balanceOf(address(auctionHouse), 0), 5);
        assertEq(erc1155.balanceOf(seller, 0), 95);
    }
    
    function test_createMultipleAuctions_success() public {
        // Create first auction (ERC721)
        vm.prank(seller);
        uint256 auctionId1 = auctionHouse.createAuction(auctionParams);
        assertEq(auctionId1, 0);
        
        // Mint another ERC721 to seller
        erc721.mint(seller, 1);
        
        // Create a second auction with different token ID
        IEnglishAuctions.AuctionParameters memory secondParams = auctionParams;
        secondParams.tokenId = 1;
        
        vm.prank(seller);
        uint256 auctionId2 = auctionHouse.createAuction(secondParams);
        assertEq(auctionId2, 1);
        
        // Check both auctions exist
        IEnglishAuctions.Auction[] memory allAuctions = auctionHouse.getAllAuctions(0, 10);
        assertEq(allAuctions.length, 2);
        assertEq(allAuctions[0].auctionId, 0);
        assertEq(allAuctions[1].auctionId, 1);
    }
    
    function test_getAllAuctions_pagination() public {
        // Create multiple auctions
        for(uint i = 0; i < 5; i++) {
            // Mint a new token for each auction
            erc721.mint(seller, i+1);
            
            // Create auction parameters with the new token
            IEnglishAuctions.AuctionParameters memory params = auctionParams;
            params.tokenId = i;
            
            vm.prank(seller);
            auctionHouse.createAuction(params);
        }
        
        // Test pagination - get first 2 auctions
        IEnglishAuctions.Auction[] memory firstPage = auctionHouse.getAllAuctions(0, 2);
        assertEq(firstPage.length, 2);
        assertEq(firstPage[0].auctionId, 0);
        assertEq(firstPage[1].auctionId, 1);
        
        // Test pagination - get next 2 auctions
        IEnglishAuctions.Auction[] memory secondPage = auctionHouse.getAllAuctions(2, 2);
        assertEq(secondPage.length, 2);
        assertEq(secondPage[0].auctionId, 2);
        assertEq(secondPage[1].auctionId, 3);
        
        // Get all auctions with large limit
        IEnglishAuctions.Auction[] memory allAuctions = auctionHouse.getAllAuctions(0, 10);
        assertEq(allAuctions.length, 5);
    }
    
    function test_getAllValidAuctions_filtering() public {
        // Create an auction
        vm.prank(seller);
        uint256 auctionId = auctionHouse.createAuction(auctionParams);
        
        // Before start time, there should be no valid auctions
        IEnglishAuctions.Auction[] memory validAuctionsBefore = auctionHouse.getAllValidAuctions(0, 10);
        assertEq(validAuctionsBefore.length, 0);
        
        // At start time, it should be valid
        vm.warp(auctionParams.startTimestamp);
        IEnglishAuctions.Auction[] memory validAuctionsAtStart = auctionHouse.getAllValidAuctions(0, 10);
        assertEq(validAuctionsAtStart.length, 1);
        assertEq(validAuctionsAtStart[0].auctionId, auctionId);
        
        // After end time, it should not be valid
        vm.warp(auctionParams.endTimestamp + 1);
        IEnglishAuctions.Auction[] memory validAuctionsAfterEnd = auctionHouse.getAllValidAuctions(0, 10);
        assertEq(validAuctionsAfterEnd.length, 0);
    }

    /*//////////////////////////////////////////////////////////////
                        CREATE AUCTION - FAILURE CASES
    //////////////////////////////////////////////////////////////*/
    
    function test_createAuction_revert_zeroQuantity() public {
        // Set quantity to 0 which should revert
        auctionParams.quantity = 0;
        
        vm.prank(seller);
        vm.expectRevert("AuctionHouse: auctioning zero quantity.");
        auctionHouse.createAuction(auctionParams);
    }
    
    function test_createAuction_revert_invalidQuantityForERC721() public {
        // Set quantity to >1 for ERC721 which should revert
        auctionParams.quantity = 2;
        
        vm.prank(seller);
        vm.expectRevert("AuctionHouse: auctioning invalid quantity.");
        auctionHouse.createAuction(auctionParams);
    }
    
    function test_createAuction_revert_endBeforeStart() public {
        // Set end time before start time
        auctionParams.endTimestamp = auctionParams.startTimestamp - 1;
        
        vm.prank(seller);
        vm.expectRevert("AuctionHouse: End time must be after start time");
        auctionHouse.createAuction(auctionParams);
    }
    
    function test_createAuction_revert_startInPast() public {
        // Set start time in the past
        auctionParams.startTimestamp = uint64(block.timestamp - 100);
        auctionParams.endTimestamp = uint64(block.timestamp + 100);
        
        vm.prank(seller);
        vm.expectRevert("AuctionHouse: Start time cannot be in the past");
        auctionHouse.createAuction(auctionParams);
    }
    
    function test_createAuction_revert_zeroCurrency() public {
        // Set currency to zero address
        auctionParams.currency = address(0);
        
        vm.prank(seller);
        vm.expectRevert("AuctionHouse: Currency cannot be zero");
        auctionHouse.createAuction(auctionParams);
    }
    
    function test_createAuction_revert_buyoutLessThanMinimum() public {
        // Set buyout less than minimum bid
        auctionParams.minimumBidAmount = 5 ether;
        auctionParams.buyoutBidAmount = 2 ether;
        
        vm.prank(seller);
        vm.expectRevert("AuctionHouse: Buyout price must be >= minimum bid");
        auctionHouse.createAuction(auctionParams);
    }
    
    function test_createAuction_revert_invalidToken() public {
        // Create a mock invalid token (using an EOA as an example)
        address invalidToken = address(0x123);
        auctionParams.assetContract = invalidToken;
        
        vm.prank(seller);
        vm.expectRevert("AuctionHouse: Asset contract must be ERC721 or ERC1155");
        auctionHouse.createAuction(auctionParams);
    }
    
    function test_createAuction_revert_notOwner() public {
        // Try to create auction for token not owned by seller
        vm.prank(buyer); // buyer doesn't own the token
        vm.expectRevert("AuctionHouse: Seller must own the NFT(s)");
        auctionHouse.createAuction(auctionParams);
    }
    
    function test_createAuction_revert_insufficientBalance() public {
        // For ERC1155, try to auction more than owned
        auctionParams.assetContract = address(erc1155);
        auctionParams.quantity = 101; // Seller only has 100
        
        vm.prank(seller);
        vm.expectRevert();
        auctionHouse.createAuction(auctionParams);
    }
    
    function test_createAuction_revert_noApproval() public {
        // Revoke approval
        vm.prank(seller);
        erc721.setApprovalForAll(address(auctionHouse), false);
        
        // Try to create auction without approval
        vm.prank(seller);
        vm.expectRevert(); // Will revert with ERC721 transfer error
        auctionHouse.createAuction(auctionParams);
    }
    
    function test_createAuction_revert_whenPaused() public {
        // Pause the contract
        vm.prank(deployer);
        auctionHouse.pause();
        
        // Try to create auction while paused
        vm.prank(seller);
        vm.expectRevert("Pausable: paused");
        auctionHouse.createAuction(auctionParams);
    }

    /*//////////////////////////////////////////////////////////////
                        CONTRACT STATE CHECKS
    //////////////////////////////////////////////////////////////*/
    
    function test_auctionCounter_increments() public {
        // Create multiple auctions and check IDs
        vm.startPrank(seller);
        
        uint256 auctionId1 = auctionHouse.createAuction(auctionParams);
        assertEq(auctionId1, 0);
        
        // Mint another NFT
        erc721.mint(seller, 1);
        
        // Create second auction with new token
        IEnglishAuctions.AuctionParameters memory params2 = auctionParams;
        params2.tokenId = 1;
        uint256 auctionId2 = auctionHouse.createAuction(params2);
        assertEq(auctionId2, 1);
        
        vm.stopPrank();
    }
} 