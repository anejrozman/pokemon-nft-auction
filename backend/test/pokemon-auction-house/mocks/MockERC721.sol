// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockERC721 is ERC721 {
    uint256 private _nextTokenId;

    constructor() ERC721("MockERC721", "MOCK721") {}

    function mint(address to, uint256 amount) external {
        for (uint256 i = 0; i < amount; i++) {
            _mint(to, _nextTokenId);
            _nextTokenId++;
        }
    }

    function mintSpecific(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
} 