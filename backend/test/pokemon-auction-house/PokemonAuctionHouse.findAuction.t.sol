// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "../utils/BaseTest.sol";
import "../../contracts/PokemonAuctionHouse.sol";
import "../../contracts/interfaces/IMarketplace.sol";

contract PokemonAuctionHouseFindAuctionTest is BaseTest {
    // Target contract
    PokemonAuctionHouse public auctionHouse;

    // Participants
    address public deployer;
    address public seller;
    address public buyer;

    // Auction parameters
    IEnglishAuctions.AuctionParameters internal auctionParams;

    function setUp() public override {
        super.setUp();

        deployer = getActor(1);
        seller = getActor(2);
        buyer = getActor(3);

        vm.startPrank(deployer);
        auctionHouse = new PokemonAuctionHouse(250); // 2.5% marketplace fee
        vm.stopPrank();
        
        // Label addresses for better debugging
        vm.label(address(auctionHouse), "PokemonAuctionHouse");
        vm.label(deployer, "Deployer");
        vm.label(seller, "Seller");
        vm.label(buyer, "Buyer");
        vm.label(address(erc721), "ERC721_Token");
        vm.label(address(erc1155), "ERC1155_Token");

        // Setup auction parameters
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

        // Create auction parameters
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
        
        // Mint ERC20 tokens to buyer for bidding
        erc20.mint(buyer, 100 ether); // Mint 100 mock ERC20 tokens

        // Approve tokens - Seller approves AuctionHouse
        vm.prank(seller);
        erc721.setApprovalForAll(address(auctionHouse), true);
        
        vm.prank(seller);
        erc1155.setApprovalForAll(address(auctionHouse), true);
    }
    
    /*//////////////////////////////////////////////////////////////
                            AUCTION LOOKUP TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_createAndFind_auction() public {
        // Create auction
        vm.prank(seller);
        uint256 auctionId = auctionHouse.createAuction(auctionParams);
        
        // Get auction by ID
        IEnglishAuctions.Auction memory auction = auctionHouse.getAuction(auctionId);
        
        // Verify retrieved auction matches what we created
        assertEq(auction.auctionId, auctionId);
        assertEq(auction.assetContract, auctionParams.assetContract);
        assertEq(auction.tokenId, auctionParams.tokenId);
        assertEq(auction.quantity, auctionParams.quantity);
        assertEq(auction.auctionCreator, seller);
    }
    
    function test_getAllAuctions() public {
        // Create first auction
        vm.prank(seller);
        uint256 auctionId1 = auctionHouse.createAuction(auctionParams);
        
        // Mint the next two NFTs (IDs 2 and 3)
        erc721.mint(seller, 2);
        
        // Create second auction with different token
        IEnglishAuctions.AuctionParameters memory params2 = auctionParams;
        params2.tokenId = 2;

        vm.prank(seller);
        uint256 auctionId2 = auctionHouse.createAuction(params2);
        
        // Get all auctions
        IEnglishAuctions.Auction[] memory allAuctions = auctionHouse.getAllAuctions(0, 10);
        
        // Verify correct number of auctions
        assertEq(allAuctions.length, 2, "Should have found 2 auctions");
        
        // Verify correct auction IDs
        assertEq(allAuctions[0].auctionId, auctionId1, "First auction ID should match");
        assertEq(allAuctions[1].auctionId, auctionId2, "Second auction ID should match");
        
        // Test pagination
        IEnglishAuctions.Auction[] memory firstAuction = auctionHouse.getAllAuctions(0, 0);
        assertEq(firstAuction.length, 1, "First auction length should be 1");
        assertEq(firstAuction[0].auctionId, auctionId1, "First auction ID should match");
        
        IEnglishAuctions.Auction[] memory secondAuction = auctionHouse.getAllAuctions(1, 1);
        assertEq(secondAuction.length, 1, "Second auction length should be 1");
        assertEq(secondAuction[0].auctionId, auctionId2, "Second auction ID should match");
    }
    
    function test_getAllValidAuctions() public {
        // Create auction
        vm.prank(seller);
        uint256 auctionId = auctionHouse.createAuction(auctionParams);
        
        // Before start time, no valid auctions
        IEnglishAuctions.Auction[] memory beforeStart = auctionHouse.getAllValidAuctions(0, 10); // Use range
        assertEq(beforeStart.length, 0, "Should be 0 valid auctions before start time");
        
        // At start time, should be valid
        vm.warp(auctionParams.startTimestamp);
        IEnglishAuctions.Auction[] memory atStart = auctionHouse.getAllValidAuctions(0, 10); // Use range
        assertEq(atStart.length, 1, "Should be 1 valid auction at start time");
        assertEq(atStart[0].auctionId, auctionId);
        
        // After end time, no longer valid
        vm.warp(auctionParams.endTimestamp + 1);
        IEnglishAuctions.Auction[] memory afterEnd = auctionHouse.getAllValidAuctions(0, 10); // Use range
        assertEq(afterEnd.length, 0, "Should be 0 valid auctions after end time");
    }
    
    function test_auctionInterfaceId() public {
        // Print interface ID for debugging
        bytes4 interfaceId = type(IEnglishAuctions).interfaceId;
        emit log_bytes32(bytes32(interfaceId));
        
        // Test if contract supports the interface
        bool supportsInterface = false;
        try IERC165(address(auctionHouse)).supportsInterface(interfaceId) returns (bool result) {
            supportsInterface = result;
        } catch {
            // If it reverts, it means supportsInterface isn't implemented
            emit log_string("Contract doesn't implement IERC165.supportsInterface");
        }
        
        // Log the result
        if (supportsInterface) {
            emit log_string("Contract supports IEnglishAuctions interface");
        } else {
            emit log_string("Contract does NOT support IEnglishAuctions interface");
        }
    }
    
    function test_getWinningBid() public {
        // Create auction
        vm.prank(seller);
        uint256 auctionId = auctionHouse.createAuction(auctionParams);
        
        // Advance to start time
        vm.warp(auctionParams.startTimestamp);
        
        // Make a bid
        vm.startPrank(buyer);
        erc20.approve(address(auctionHouse), 2 ether);
        auctionHouse.bidInAuction(auctionId, 2 ether);
        vm.stopPrank();
        
        // Get winning bid
        (address bidder, address currency, uint256 amount) = auctionHouse.getWinningBid(auctionId);
        
        // Verify winning bid
        assertEq(bidder, buyer);
        assertEq(currency, address(erc20));
        assertEq(amount, 2 ether);
    }
    
    function test_directFunctionCalls() public {
        // Test direct function calls with explicit selector and parameters
        // This helps diagnose unrecognized selector issues
        
        // Create auction
        vm.prank(seller);
        uint256 auctionId = auctionHouse.createAuction(auctionParams);
        
        // Test getAuction with assembly
        bytes memory data = abi.encodeWithSelector(
            auctionHouse.getAuction.selector,
            auctionId
        );
        
        (bool success, bytes memory returnData) = address(auctionHouse).call(data);
        require(success, "Direct call to getAuction failed");
        
        IEnglishAuctions.Auction memory auction = abi.decode(returnData, (IEnglishAuctions.Auction));
        assertEq(auction.auctionId, auctionId);
        assertEq(auction.auctionCreator, seller);
        
        // Test getAllAuctions with assembly
        data = abi.encodeWithSelector(
            auctionHouse.getAllAuctions.selector,
            0, // startId 
            0  // endId
        );
        
        (success, returnData) = address(auctionHouse).call(data);
        require(success, "Direct call to getAllAuctions failed");
        
        IEnglishAuctions.Auction[] memory auctions = abi.decode(returnData, (IEnglishAuctions.Auction[]));
        assertEq(auctions.length, 1);
        assertEq(auctions[0].auctionId, auctionId);
    }
}