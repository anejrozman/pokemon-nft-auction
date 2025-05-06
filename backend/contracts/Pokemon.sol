// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@thirdweb-dev/contracts/extension/Permissions.sol";
import "@thirdweb-dev/contracts/extension/ContractMetadata.sol";
import "./helpers/PausableERC721Base.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// TO DO:
// REMOVE FUNCTIONS WITH (DELETE FUNCTION) IN DESCRIPTION

/**
 * @title PokemonNFT
 * @dev Implementation of ERC721 token representing Pokemon cards
 */
contract PokemonNFT is ReentrancyGuard, Permissions, PausableERC721Base {
    using ECDSA for bytes32; 
    using Strings for uint256;
    
    
    // Counters
    uint256 private _cardSetId;
    // Pokemon card struct
    struct Pokemon {
        string ipfsURI;
    }
    // CardSet struct for minting new Pokemon card NFT's
    struct CardSet {
        uint256 id; 
        string name; 
        string[] cardURIs; 
        uint256[] probabilities; 
        uint256 supply; 
        uint256 price;
    }
    
    // Mappings 
    mapping(uint256 => Pokemon) public pokemonAttributes;
    mapping(uint256 => CardSet) public cardSets;
    

    // Secret salt used for randomness
    bytes32 private _secretSalt;

    // Events
    event PokemonMinted(uint256 tokenId, string ipfsURI, address indexed owner);
    event CardSetCreated(uint id, string name, string[] cardURIs, uint256[] probabilities, uint256 supply, uint256 price);
    event CardSetBurned(uint256 indexed setId);
    event SecretSaltUpdated();
    event Withdrawal(address indexed to, uint256 amount);
    event ContractPaused();
    event ContractUnpaused();  

    /**
     * @dev Constructor to initialize the contract
     * @param _defaultAdmin Address of the default admin
     * @param _name Name of the ERC721 token
     * @param _symbol Symbol of the ERC721 token
     * @param _royaltyRecipient Address to receive royalties
     * @param _royaltyBps Royalty percentage in basis points
     */
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
    {
        // Roles
        _setupRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);

        // Initialize salt
        _secretSalt = keccak256(abi.encodePacked(block.timestamp, block.prevrandao, address(this)));

        // Initialize counters
        _cardSetId = 0;

    }

    // Card Set Management

    /**
     * @dev Create a card set to mint new Pokemon from
     * @param name Name of the card set
     * @param cardURIs Array of IPFS URIs for the cards
     * @param probabilities Array of probabilities for each card
     * @param supply Total supply of the card set
     * @param price Price per card in the set (in wei)
     */
    function createCardSet(
        string memory name,
        string[] memory cardURIs,
        uint256[] memory probabilities,
        uint256 supply,
        uint256 price
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(cardURIs.length == probabilities.length, "URIs and probabilities length mismatch");
        require(cardURIs.length > 0, "No cards in set");
        require(supply > 0, "Supply must be positive");
        uint256 totalProbability = 0;
        for (uint256 i = 0; i < probabilities.length; i++) {
            totalProbability += probabilities[i];
        }
        require(totalProbability == 10000, "Probabilities must sum to 10,000");
    
        uint256 id = _cardSetId;
        _cardSetId++;

        cardSets[id] = CardSet({
            id: id,
            name: name,
            cardURIs: cardURIs,
            probabilities: probabilities,
            supply: supply,
            price: price
        });
    
        emit CardSetCreated(id, name, cardURIs, probabilities, supply, price);
    }

    /**
     * @dev Burn a card set
     * @param setId The ID of the card set to burn
     */
    function burnCardSet(uint256 setId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(cardSets[setId].supply > 0, "Card set does not exist or is already burned");
    
        delete cardSets[setId];
    
        emit CardSetBurned(setId);
    }

    function getCardSet(uint256 setId) external view returns (CardSet memory) {
        return cardSets[setId];
    }

    function getCardSetCount() external view returns (uint256) {
        return _cardSetId;
    }

    /**
     * @dev Get all card sets with supply > 0
     * @return An array of CardSet structs
     */
    function getAvailableCardSets() external view returns (CardSet[] memory) {

        uint256 count = 0;
        for (uint256 i = 0; i < _cardSetId; i++) {
            if (cardSets[i].supply > 0) {
                count++;
            }
        }

        CardSet[] memory availableCardSets = new CardSet[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < _cardSetId; i++) {
            if (cardSets[i].supply > 0) {
                availableCardSets[index] = cardSets[i];
                index++;
            }
        }
        return availableCardSets;
    }

    // Minting

    /**
     * @dev Mint a new Pokemon NFT from a card set
     * @param setId The ID of the card set to mint from
     * @return The ID of the newly minted token
     */
    function mintFromCardSet(uint256 setId) public payable nonReentrant whenNotPaused returns (uint256) {
        CardSet storage cardSet = cardSets[setId];
        require(cardSet.supply > 0, "Set is sold out");
        require(msg.value == cardSet.price, "Incorrect payment amount");
    
        uint256 randomNumber = getRandomNumber(block.timestamp) % 10000;

        uint256 cumulative = 0;
        uint256 randomIndex = 0;
        for (uint256 i = 0; i < cardSet.probabilities.length; i++) {
            cumulative += cardSet.probabilities[i];
            if (randomNumber < cumulative) {
                randomIndex = i;
                break;
            }
        }
    
        string memory selectedURI = cardSet.cardURIs[randomIndex];

        mintTo(msg.sender, selectedURI);
        uint256 tokenId = getLastMintedTokenId();
        pokemonAttributes[tokenId] = Pokemon(selectedURI);
    
        cardSet.supply--;
    
        emit PokemonMinted(tokenId, selectedURI, msg.sender);
    
        return tokenId;
    }

    /**
     * @dev Mint a new Pokemon NFT (DELETE FUNCTION)
     */
    function mintPokemon(
        address _to,
        string memory _ipfsURI
    ) public nonReentrant returns (uint256) {
        mintTo(_to, _ipfsURI);
        uint256 tokenId = getLastMintedTokenId();
        pokemonAttributes[tokenId] = Pokemon(_ipfsURI);
        emit PokemonMinted(tokenId, _ipfsURI, _to);
        return tokenId;
    }

    /**
     * @dev Override _canMint to allow any wallet to mint cards from cardSets.
     */
    function _canMint() internal view virtual override returns (bool) {
        return true; // Allow all wallets to mint
    }

    // Randomness

    /**
     * @dev In production Chainlink's VRF Coordinator would be used. 
     * Miners/validators can see pending transactions and potentially 
     * mine their own transactions first to get preferred results.
     */
    function getRandomNumber(uint256 seed) internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
                seed,
                block.timestamp,
                block.prevrandao,
                msg.sender, 
                _secretSalt
        )));
    }

    /**
     * @dev Update the secret salt used for randomness
     */
    function updateSecretSalt() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _secretSalt = keccak256(abi.encodePacked(block.timestamp, block.prevrandao, address(this)));

        emit SecretSaltUpdated();
    }

    // Token data

    /**
     * @dev Returns the metadata URI for a given tokenId
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return pokemonAttributes[tokenId].ipfsURI;
    }

    /**
     * @dev Returns ID of the last minted token
     */
    function getLastMintedTokenId() public view returns (uint256) {
        return nextTokenIdToMint() - 1;
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

    // Token burning

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

    // Administrative functions

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause(); 
        emit ContractPaused();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
        emit ContractUnpaused();
    }
    
    /**
     * @dev Withdraw funds from the contract
     */
    function withdraw() external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Withdrawal failed");

        emit Withdrawal(msg.sender, balance);
    }
}