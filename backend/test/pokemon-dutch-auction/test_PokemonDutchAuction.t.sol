// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "forge-std/Test.sol";
import "../PokemonDutchAuction.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract MockERC721 is ERC721Enumerable {
    constructor() ERC721("MockNFT", "MNFT") {}

    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}

contract TestPokemonDutchAuction is Test {
    PokemonDutchAuction public auctionContract;
    MockERC721 public mockNFT;

    address public seller = address(0x1);
    address public buyer = address(0x2);

    function setUp() public {
        // Deploy contracts
        auctionContract = new PokemonDutchAuction(250); // 2.5% fee
        mockNFT = new MockERC721();

        // Mint NFT to seller
        mockNFT.mint(seller, 1);

        // Approve auction contract
        vm.startPrank(seller);
        mockNFT.approve(address(auctionContract), 1);
        vm.stopPrank();
    }

    function testConstructor() public {
        assertEq(auctionContract.marketplaceFeeBps(), 250);
        assertEq(auctionContract.platformFeeRecipient(), address(this));
    }

    function testCreateAuction() public {
        vm.startPrank(seller);
        auctionContract.createDutchAuction(
            address(mockNFT),
            1,
            1 ether,
            0.5 ether,
            3600,
            1,
            address(0)
        );

        (address auctionSeller, , uint256 tokenId, uint256 startPrice, , , , , , bool active) = auctionContract.auctions(0);
        assertEq(auctionSeller, seller);
        assertEq(tokenId, 1);
        assertEq(startPrice, 1 ether);
        assertTrue(active);
        vm.stopPrank();
    }

    function testCreateAuctionInvalidParams() public {
        vm.startPrank(seller);
        vm.expectRevert("Start price must be greater than end price");
        auctionContract.createDutchAuction(address(mockNFT), 1, 0.5 ether, 1 ether, 3600, 1, address(0));

        vm.expectRevert("Duration must be greater than 0");
        auctionContract.createDutchAuction(address(mockNFT), 1, 1 ether, 0.5 ether, 0, 1, address(0));

        vm.expectRevert("Decay exponent must be positive");
        auctionContract.createDutchAuction(address(mockNFT), 1, 1 ether, 0.5 ether, 3600, 0, address(0));
        vm.stopPrank();
    }

    function testGetCurrentPrice() public {
        vm.startPrank(seller);
        auctionContract.createDutchAuction(
            address(mockNFT),
            1,
            1 ether,
            0.5 ether,
            3600,
            1,
            address(0)
        );
        vm.stopPrank();

        // Simulate time passing
        vm.warp(block.timestamp + 1800); // Halfway through the auction
        uint256 currentPrice = auctionContract.getCurrentPrice(0);
        assertEq(currentPrice, 0.75 ether); // Linear decay
    }

    function testBuy() public {
        vm.startPrank(seller);
        auctionContract.createDutchAuction(
            address(mockNFT),
            1,
            1 ether,
            0.5 ether,
            3600,
            1,
            address(0)
        );
        vm.stopPrank();

        vm.startPrank(buyer);
        vm.deal(buyer, 1 ether); // Fund buyer
        auctionContract.buy{value: 1 ether}(0);

        assertEq(mockNFT.ownerOf(1), buyer);
        vm.stopPrank();
    }

    function testBuyInsufficientPayment() public {
        vm.startPrank(seller);
        auctionContract.createDutchAuction(
            address(mockNFT),
            1,
            1 ether,
            0.5 ether,
            3600,
            1,
            address(0)
        );
        vm.stopPrank();

        vm.startPrank(buyer);
        vm.deal(buyer, 0.5 ether); // Insufficient funds
        vm.expectRevert("Insufficient payment");
        auctionContract.buy{value: 0.5 ether}(0);
        vm.stopPrank();
    }

    function testPauseUnpause() public {
        auctionContract.pause();
        assertTrue(auctionContract.paused());

        auctionContract.unpause();
        assertFalse(auctionContract.paused());
    }
}