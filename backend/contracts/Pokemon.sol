// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@thirdweb-dev/contracts/base/ERC721Base.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PokemonNFT
 * @dev Implementation of ERC721 token representing Pokemon cards
 */
contract PokemonNFT is ERC721Base, ReentrancyGuard {
    constructor(
        address _defaultAdmin,
        string memory _name,
        string memory _symbol,
        address _royaltyRecipient,
        uint128 _royaltyBps
    )
        ERC721Base(
            _defaultAdmin,
            _name,
            _symbol,
            _royaltyRecipient,
            _royaltyBps
        )
    {}
    
    uint256 private _tokenIds;

    // Mapping for Pokemon card attributes
    struct Pokemon {
        string name;
        string pokemonType;
        uint256 level;
        uint256 hp;
        uint256 attack;
        uint256 defense;
        bool isShiny;
    }
    
    mapping(uint256 => Pokemon) public pokemonAttributes;
    
    event PokemonMinted(uint256 tokenId, string name, address owner);

    
    /**
     * @dev Get the tokenId that was just minted
     */
    function getLastMintedTokenId() public view returns (uint256) {
        return nextTokenIdToMint() - 1;
    }
    
    /**
     * @dev Mint a new Pokemon NFT with attributes
     */
    function mintPokemon(
        address _to,
        string memory _tokenURI,
        string memory _name,
        string memory _pokemonType,
        uint256 _level,
        uint256 _hp,
        uint256 _attack,
        uint256 _defense,
        bool _isShiny
    ) public nonReentrant returns (uint256) {
        // Use the base mintTo function to mint the NFT
        mintTo(_to, _tokenURI);
        
        // Get the tokenId that was just minted
        uint256 tokenId = getLastMintedTokenId();
        
        // Set Pokemon attributes
        pokemonAttributes[tokenId] = Pokemon(
            _name,
            _pokemonType,
            _level,
            _hp,
            _attack,
            _defense,
            _isShiny
        );
        
        emit PokemonMinted(tokenId, _name, _to);
        
        return tokenId;
    }

    /**
     * @dev Override burn to clean up Pokemon attributes when an NFT is burned
     */
    function burn(uint256 _tokenId) public virtual override {
        // Only token owner or approved operator can burn
        require(
            isApprovedOrOwner(msg.sender, _tokenId),
            "Not approved to burn"
        );
        
        delete pokemonAttributes[_tokenId]; // have to delete this as we added attributes
        
        // Then burn the token
        _burn(_tokenId, true);
    }
    
    /**
     * @dev Get attributes of a Pokemon
     * @param tokenId The token ID to query
     * @return Pokemon attributes
     */
    function getPokemonAttributes(uint256 tokenId) external view returns (Pokemon memory) {
        require(_exists(tokenId), "Token does not exist");
        return pokemonAttributes[tokenId];
    }
}