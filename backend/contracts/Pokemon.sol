// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@thirdweb-dev/contracts/extension/Permissions.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./helpers/PausableERC721Base.sol";
import "@thirdweb-dev/contracts/extension/ContractMetadata.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title PokemonNFT
 * @dev Implementation of ERC721 token representing Pokemon cards
 */
contract PokemonNFT is ReentrancyGuard, Permissions, PausableERC721Base {
    using ECDSA for bytes32; 
    using Strings for uint256;
    
    
    // Counters
    uint256 private _tokenIds;
    uint256 private _CardId;
    uint256 private _CardSetId;
    // Pokemon card struct with IPFS metadata reference
    struct Pokemon {
        string ipfsURI;
    }
    // CardSet struct for minting new cards 
    struct CardSet {
        uint256 id; 
        string name; 
        string[] cardURIs; 
        uint256[] probabilities;
        uint256 supply; 
        uint256 price;
    }
    // Commit-reveal pattern to prevent frontrunning
    struct Commitment {
        bytes32 commit;
        uint256 blockNumber;
        bool revealed;
        address committer;
    }
    
    // Mappings 
    mapping(uint256 => Pokemon) public pokemonAttributes;
    mapping(uint256 => CardSet) public cardSets;
    mapping(bytes32 => Commitment) public commitments;

    // Secret salt used for randomness (can be updated by DEFAULT_ADMIN_ROLE)
    bytes32 private _secretSalt;

    // Timelock for revealing commitments in blocks (can be updated by DEFAULT_ADMIN_ROLE)
    uint256 public commitRevealTimelock = 3;
    
    // Events
    event PokemonMinted(uint256 tokenId, string ipfsURI, address owner);
    event CardSetCreated(uint id, string name, string[] cardURIs, uint256[] probabilities, uint256 supply, uint256 price);
    // event CommitmentMade(address indexed committer, bytes32 commitHash);
    // event CommitmentRevealed(address indexed committer, bytes32 commitHash, uint256 tokenId);
    event Withdrawal(address indexed to, uint256 amount);

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
            // Counters
        _tokenIds = 0;
        _CardId = 0;
        _CardSetId = 0;

    }


    /**
     * @dev Create a card set to mint new Pokemon from
     * Only callable by DEFAULT_ADMIN_ROLE
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
    
        uint256 id = _CardSetId;
        _CardSetId++;

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
     * @dev Mint a new Pokemon NFT from a card set
     * @param setId The ID of the card set to mint from
     * @return The ID of the newly minted token
     */
    function mintFromCardSet(uint256 setId) public payable nonReentrant returns (uint256) {
        // Check that the card set exists and has supply
        CardSet storage cardSet = cardSets[setId];
        require(cardSet.supply > 0, "Set is sold out");
        require(msg.value == cardSet.price, "Incorrect payment amount");

        // Generate pseudo-random number for card selection
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < cardSet.probabilities.length; i++) {
            totalWeight += cardSet.probabilities[i];
        }
        uint256 randomNum = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    msg.sender,
                    _secretSalt,
                    cardSet.supply
                )
            )
        ) % totalWeight;

        // Select card based on probability weights
        uint256 cumulativeWeight = 0;
        uint256 selectedIndex = 0;

        for (uint256 i = 0; i < cardSet.probabilities.length; i++) {
            cumulativeWeight += cardSet.probabilities[i];
            if (randomNum < cumulativeWeight) {
                selectedIndex = i;
                break;
            }
        }

        // Get the selected card URI
        string memory selectedURI = cardSet.cardURIs[selectedIndex];

        // Mint Pokemon NFT
        mintTo(msg.sender, selectedURI);
        uint256 tokenId = getLastMintedTokenId();
        pokemonAttributes[tokenId] = Pokemon(selectedURI);

        // Decrease supply
        cardSet.supply--;

        emit PokemonMinted(tokenId, selectedURI, msg.sender);

        return tokenId;
    }



    function getCardSet(uint256 setId) external view returns (CardSet memory) {
        return cardSets[setId];
    }

    function getCardSetCount() external view returns (uint256) {
        return _CardSetId;
    }

    /**
     * @dev Update the secret salt used for randomness
     * Can only be called by admin
     */
    function updateSecretSalt() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _secretSalt = keccak256(abi.encodePacked(block.timestamp, block.prevrandao, address(this)));
    }

    function updateCommitRevealTimelock(uint256 newTimelock) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newTimelock > 0, "Timelock must be greater than zero");
        commitRevealTimelock = newTimelock;
    }

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
        string memory _ipfsURI
    ) public nonReentrant returns (uint256) {
        mintTo(_to, _ipfsURI);
        uint256 tokenId = getLastMintedTokenId();
        pokemonAttributes[tokenId] = Pokemon(_ipfsURI);
        emit PokemonMinted(tokenId, _ipfsURI, _to);
        return tokenId;
    }

    /**
     * @dev Returns the metadata URI for a given tokenId
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return pokemonAttributes[tokenId].ipfsURI;
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

    // /**
    //  * @dev Pause the contract
    //  */
    // function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
    //     _pause();
    // }
    
    // /**
    //  * @dev Unpause the contract
    //  */
    // function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
    //     _unpause();
    // }
    
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