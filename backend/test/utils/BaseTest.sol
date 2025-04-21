// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Import mock contracts for testing
import "../pokemon-auction-house/mocks/MockERC721.sol";
import "../pokemon-auction-house/mocks/MockERC1155.sol";
import "../pokemon-auction-house/mocks/MockERC20.sol";

contract BaseTest is Test {
    // Mock tokens
    MockERC721 public erc721;
    MockERC1155 public erc1155;
    MockERC20 public erc20;
    address public weth;

    // Test helpers
    mapping(uint256 => address) private actors;

    function setUp() public virtual {
        // Deploy mock tokens
        erc721 = new MockERC721();
        erc1155 = new MockERC1155();
        erc20 = new MockERC20();
        weth = address(erc20);
        
        // Initialize test addresses
        actors[1] = makeAddr("deployer");
        actors[2] = makeAddr("seller");
        actors[3] = makeAddr("buyer");
        actors[4] = makeAddr("randomUser");
        
        // Fund the test addresses
        vm.deal(actors[1], 100 ether);
        vm.deal(actors[2], 100 ether);
        vm.deal(actors[3], 100 ether);
        vm.deal(actors[4], 100 ether);
    }

    function getActor(uint256 actorIndexInRegistry) public view returns (address) {
        return actors[actorIndexInRegistry];
    }
} 