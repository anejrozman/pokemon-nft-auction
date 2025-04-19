// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title PokemonCardNFT
 * @dev Implementation of a Pokémon Card NFT with set-based minting and randomness
 */
contract PokemonCardNFT is ERC721URIStorage, Ownable, ReentrancyGuard, Pausable {
    using Math for uint256;

    struct Card {
        string ipfsHash;
        uint16 probability; // In basis points (100 = 1%)
    }

    struct CardSet {
        string name;
        uint256 mintPrice;
        bool isActive;
        Card[] possibleCards;
        uint256 totalProbability;
    }

    // Card set storage
    CardSet[] public cardSets;
    
    // Mapping for token details
    mapping(uint256 => uint256) public tokenToSetId;
    
    // User nonce for better randomness
    mapping(address => uint256) private userNonce;
    
    // Counter for token IDs
    uint256 private _nextTokenId;

    // Events
    event CardSetCreated(uint256 indexed setId, string name);
    event CardMinted(uint256 indexed tokenId, address indexed owner, uint256 indexed setId, string ipfsHash);
    event EmergencyStop(address indexed triggeredBy);
    event EmergencyResume(address indexed triggeredBy);

    /**
     * @dev Constructor
     */
    constructor() ERC721("Pokemon Card", "PKMN") Ownable(msg.sender) {
        _nextTokenId = 1;
    }

    /**
     * @dev Create a new card set
     * @param _name Name of the card set
     * @param _mintPrice Price to mint from this set
     * @param _cardIpfsHashes Array of IPFS hashes for card metadata
     * @param _probabilities Array of probabilities for each card (in basis points)
     */
    function createCardSet(
        string memory _name,
        uint256 _mintPrice,
        string[] memory _cardIpfsHashes,
        uint16[] memory _probabilities
    ) external onlyOwner {
        require(_cardIpfsHashes.length == _probabilities.length, "Arrays must have same length");
        require(_cardIpfsHashes.length > 0, "Must include at least one card");
        
        uint256 totalProbability = 0;
        
        CardSet storage newSet = cardSets.push();
        newSet.name = _name;
        newSet.mintPrice = _mintPrice;
        newSet.isActive = true;
        
        for (uint i = 0; i < _cardIpfsHashes.length; i++) {
            newSet.possibleCards.push(Card({
                ipfsHash: _cardIpfsHashes[i],
                probability: _probabilities[i]
            }));
            
            totalProbability += _probabilities[i];
        }
        
        require(totalProbability == 10000, "Total probability must equal 10000 basis points (100%)");
        newSet.totalProbability = totalProbability;
        
        emit CardSetCreated(cardSets.length - 1, _name);
    }

    /**
     * @dev Toggle a card set's active status
     * @param _setId ID of the card set to toggle
     * @param _isActive New active status
     */
    function setCardSetActive(uint256 _setId, bool _isActive) external onlyOwner {
        require(_setId < cardSets.length, "Set does not exist");
        cardSets[_setId].isActive = _isActive;
    }

    /**
     * @dev Get the number of card sets
     * @return Number of card sets
     */
    function getCardSetCount() external view returns (uint256) {
        return cardSets.length;
    }

    /**
     * @dev Get details about a card set
     * @param _setId ID of the card set
     * @return name Set name
     * @return mintPrice Price to mint from this set
     * @return isActive Whether the set is active
     * @return cardCount Number of cards in the set
     */
    function getCardSetDetails(uint256 _setId) external view returns (
        string memory name,
        uint256 mintPrice,
        bool isActive,
        uint256 cardCount
    ) {
        require(_setId < cardSets.length, "Set does not exist");
        CardSet storage set = cardSets[_setId];
        
        return (set.name, set.mintPrice, set.isActive, set.possibleCards.length);
    }

    /**
     * @dev Mint a card from a specific set
     * @param _setId ID of the set to mint from
     */
    function mintCard(uint256 _setId) external payable nonReentrant whenNotPaused {
        require(_setId < cardSets.length, "Set does not exist");
        CardSet storage set = cardSets[_setId];
        
        require(set.isActive, "Card set is not active");
        require(msg.value >= set.mintPrice, "Insufficient payment");
        
        // Get a random card from the set
        uint256 tokenId = _nextTokenId++;
        string memory ipfsHash = _getRandomCard(_setId);
        
        // Mint the card
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, ipfsHash);
        
        // Store token metadata
        tokenToSetId[tokenId] = _setId;
        
        // Increment user nonce for better randomness next time
        userNonce[msg.sender]++;
        
        emit CardMinted(tokenId, msg.sender, _setId, ipfsHash);
        
        // Refund excess payment
        uint256 excess = msg.value - set.mintPrice;
        if (excess > 0) {
            (bool success, ) = payable(msg.sender).call{value: excess}("");
            require(success, "Refund failed");
        }
    }

    /**
     * @dev Get a random card from a set
     * @param _setId ID of the set
     * @return IPFS hash of the selected card
     */
    function _getRandomCard(uint256 _setId) private view returns (string memory) {
        CardSet storage set = cardSets[_setId];
        
        // Generate pseudo-random number using multiple entropy sources
        uint256 randomNumber = uint256(
            keccak256(
                abi.encodePacked(
                    blockhash(block.number - 1),
                    block.timestamp,
                    msg.sender,
                    userNonce[msg.sender],
                    block.prevrandao
                )
            )
        ) % set.totalProbability;
        
        uint256 cumulativeProbability = 0;
        
        for (uint i = 0; i < set.possibleCards.length; i++) {
            cumulativeProbability += set.possibleCards[i].probability;
            if (randomNumber < cumulativeProbability) {
                return set.possibleCards[i].ipfsHash;
            }
        }
        
        // Fallback to the last card (should never reach here if probabilities sum to 10000)
        return set.possibleCards[set.possibleCards.length - 1].ipfsHash;
    }

    /**
     * @dev Emergency pause of all minting functionality
     */
    function pause() external onlyOwner {
        _pause();
        emit EmergencyStop(msg.sender);
    }

    /**
     * @dev Resume functionality after emergency pause
     */
    function unpause() external onlyOwner {
        _unpause();
        emit EmergencyResume(msg.sender);
    }

    /**
     * @dev Withdraw contract funds
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Override to prevent transfers when contract is paused
     */
    function _update(address to, uint256 tokenId, address auth) internal override whenNotPaused returns (address) {
        return super._update(to, tokenId, auth);
    }
}