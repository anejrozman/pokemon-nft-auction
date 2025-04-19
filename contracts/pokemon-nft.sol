// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title PokemonNFT
 * @dev A Pokemon card NFT contract with card sets and weighted probabilities
 */
contract PokemonNFT is ERC721URIStorage, ReentrancyGuard, Pausable, AccessControl {
    using ECDSA for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Counters
    uint256 private _currentTokenId;
    uint256 private _currentCardId;
    uint256 private _currentCardSetId;
    
    // Card struct to store metadata reference
    struct Card {
        string ipfsURI;      // IPFS URI for metadata 
        uint256 cardSetId;   // ID of the set the card belongs to
    }
    
    // CardSet struct for creating different card sets
    struct CardSet {
        string name;
        uint256 price;
        uint256 maxSupply;
        uint256 totalMinted;
        bool active;
        uint256[] cardIds;           // IDs of cards in this set
        uint256[] cardProbabilities;  // Corresponding probabilities (0-1000 where 1000 = 100%)
    }
    
    // Commit-reveal pattern to prevent frontrunning
    struct Commitment {
        bytes32 commit;
        uint256 blockNumber;
        bool revealed;
        address committer;
    }
    
    // Mapping for commitments
    mapping(bytes32 => Commitment) public commitments;
    
    // Mappings for card data
    mapping(uint256 => Card) public cards;
    mapping(uint256 => CardSet) public cardSets;
    
    // Secret salt used for randomness (can be updated by admin)
    bytes32 private _secretSalt;
    
    // Timelock for revealing commitments (in blocks)
    uint256 public commitRevealTimelock = 3;
    
    // Events
    event CardSetCreated(uint256 indexed cardSetId, string name, uint256 price);
    event CardAdded(uint256 indexed cardId, uint256 indexed cardSetId, string ipfsURI);
    event CardMinted(address indexed to, uint256 indexed tokenId, uint256 indexed cardId, uint256 cardSetId);
    event CommitmentMade(address indexed committer, bytes32 commitHash);
    event CommitmentRevealed(address indexed committer, bytes32 commitHash, uint256 tokenId);
    event SecretSaltUpdated();
    event CardSetActivated(uint256 indexed cardSetId);
    event CardSetDeactivated(uint256 indexed cardSetId);
    
    /**
     * @dev Constructor to initialize the contract with base parameters
     * @param name  Name of the NFT collection
     * @param symbol    Symbol of the NFT collection
     * @param adminWallet   Address of the multisig admin wallet
     */
    constructor(
        string memory name, 
        string memory symbol,
        address adminWallet
    ) ERC721(name, symbol) {
        require(adminWallet != address(0), "Admin wallet cannot be zero address");
        
        // Set up roles
        AccessControl._setupRole(DEFAULT_ADMIN_ROLE, adminWallet);
        _setupRole(ADMIN_ROLE, adminWallet);
        
        // Initialize salt
        _secretSalt = keccak256(abi.encodePacked(block.timestamp, block.prevrandao, address(this)));
        
        // Initialize counters
        _currentTokenId = 0;
        _currentCardId = 0;
        _currentCardSetId = 0;
    }
    
    /**
     * @dev Create a new card set
     * @param name The name of the card set
     * @param price The price to mint from this set
     * @param maxSupply Maximum number of cards that can be minted from this set
     */
    function createCardSet(
        string memory name,
        uint256 price,
        uint256 maxSupply
    ) external onlyRole(ADMIN_ROLE) {
        uint256 cardSetId = _currentCardSetId;
        _currentCardSetId++;
        
        cardSets[cardSetId] = CardSet({
            name: name,
            price: price,
            maxSupply: maxSupply,
            totalMinted: 0,
            active: true,
            cardIds: new uint256[](0),
            cardProbabilities: new uint256[](0)
        });
        
        emit CardSetCreated(cardSetId, name, price);
    }
    
    /**
     * @dev Add a card to a card set
     * @param cardSetId The ID of the card set
     * @param ipfsURI The IPFS URI for the card metadata
     * @param probability The probability weight of this card (0-1000)
     */
    function addCardToSet(
        uint256 cardSetId,
        string memory ipfsURI,
        uint256 probability
    ) external onlyRole(ADMIN_ROLE) {
        require(cardSetId < _currentCardSetId, "Invalid card set ID");
        require(probability <= 1000, "Probability must be between 0 and 1000");
        
        uint256 cardId = _currentCardId;
        _currentCardId++;
        
        cards[cardId] = Card({
            ipfsURI: ipfsURI,
            cardSetId: cardSetId
        });
        
        CardSet storage cardSet = cardSets[cardSetId];
        cardSet.cardIds.push(cardId);
        cardSet.cardProbabilities.push(probability);
        
        emit CardAdded(cardId, cardSetId, ipfsURI);
    }
    
    /**
     * @dev Update the active status of a card set
     * @param cardSetId The ID of the card set
     * @param active Whether the card set is active
     */
    function setCardSetActive(uint256 cardSetId, bool active) external onlyRole(ADMIN_ROLE) {
        require(cardSetId < _currentCardSetId, "Invalid card set ID");
        
        cardSets[cardSetId].active = active;
        
        if (active) {
            emit CardSetActivated(cardSetId);
        } else {
            emit CardSetDeactivated(cardSetId);
        }
    }
    
    /**
     * @dev Creates a commitment for minting a card from a set
     * @param cardSetId The ID of the card set to mint from
     * @param commitmentHash The hash of the commitment (keccak256(abi.encodePacked(userAddress, userProvidedSalt)))
     */
    function commitToMint(uint256 cardSetId, bytes32 commitmentHash) external payable whenNotPaused nonReentrant {
        require(cardSetId < _currentCardSetId, "Invalid card set ID");
        require(cardSets[cardSetId].active, "Card set is not active");
        require(cardSets[cardSetId].totalMinted < cardSets[cardSetId].maxSupply, "Card set is sold out");
        require(msg.value == cardSets[cardSetId].price, "Incorrect payment amount");
        require(commitments[commitmentHash].committer == address(0), "Commitment already exists");
        
        // Store the commitment
        commitments[commitmentHash] = Commitment({
            commit: commitmentHash,
            blockNumber: block.number,
            revealed: false,
            committer: msg.sender
        });
        
        emit CommitmentMade(msg.sender, commitmentHash);
    }
    
    /**
     * @dev Reveals a commitment and mints a card if valid
     * @param cardSetId The ID of the card set
     * @param salt The salt used in the commitment
     */
    function revealAndMint(uint256 cardSetId, bytes32 salt) external whenNotPaused nonReentrant {
        bytes32 commitmentHash = keccak256(abi.encodePacked(msg.sender, salt));
        
        Commitment storage commitment = commitments[commitmentHash];
        require(commitment.committer == msg.sender, "No matching commitment found");
        require(!commitment.revealed, "Commitment already revealed");
        require(block.number >= commitment.blockNumber + commitRevealTimelock, "Commitment timelock not expired");
        
        commitment.revealed = true;
        
        // Generate random card based on probabilities
        uint256 cardId = _selectRandomCard(cardSetId, commitmentHash, salt);
        
        // Mint the NFT
        uint256 tokenId = _currentTokenId;
        _currentTokenId++;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, cards[cardId].ipfsURI);
        
        // Update card set data
        cardSets[cardSetId].totalMinted++;
        
        emit CardMinted(msg.sender, tokenId, cardId, cardSetId);
        emit CommitmentRevealed(msg.sender, commitmentHash, tokenId);
    }
    
    /**
     * @dev Internal function to select a random card from a set based on probabilities
     * @param cardSetId The ID of the card set
     * @param commitmentHash The hash of the commitment
     * @param salt The salt provided by the user
     * @return The selected card ID
     */
    function _selectRandomCard(uint256 cardSetId, bytes32 commitmentHash, bytes32 salt) private view returns (uint256) {
        CardSet storage cardSet = cardSets[cardSetId];
        require(cardSet.cardIds.length > 0, "Card set has no cards");
        
        // Calculate pseudo-random number based on various inputs
        uint256 randomValue = uint256(
            keccak256(
                abi.encodePacked(
                    commitmentHash,
                    salt,
                    _secretSalt,
                    block.timestamp,
                    block.number,
                    block.prevrandao
                )
            )
        );
        
        // Calculate total probability
        uint256 totalProbability = 0;
        for (uint256 i = 0; i < cardSet.cardProbabilities.length; i++) {
            totalProbability += cardSet.cardProbabilities[i];
        }
        require(totalProbability > 0, "Total probability must be greater than zero");
        
        // Select a card based on weighted probability
        uint256 randomNumber = randomValue % totalProbability;
        uint256 cumulativeProbability = 0;
        
        for (uint256 i = 0; i < cardSet.cardProbabilities.length; i++) {
            cumulativeProbability += cardSet.cardProbabilities[i];
            if (randomNumber < cumulativeProbability) {
                return cardSet.cardIds[i];
            }
        }
        
        // Fallback (should never reach here if probabilities are set correctly)
        return cardSet.cardIds[0];
    }
    
    /**
     * @dev Update the secret salt used for randomness
     * Can only be called by admin
     */
    function updateSecretSalt() external onlyRole(ADMIN_ROLE) {
        _secretSalt = keccak256(abi.encodePacked(block.timestamp, block.prevrandao, address(this)));
        emit SecretSaltUpdated();
    }
    
    /**
     * @dev Update the commit-reveal timelock
     * @param newTimelock The new timelock value in blocks
     */
    function updateCommitRevealTimelock(uint256 newTimelock) external onlyRole(ADMIN_ROLE) {
        require(newTimelock > 0, "Timelock must be greater than zero");
        commitRevealTimelock = newTimelock;
    }
    
    /**
     * @dev Pause the contract
     * Can only be called by admin
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     * Can only be called by admin
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Withdraw funds from the contract
     * Can only be called by admin
     */
    function withdraw() external onlyRole(ADMIN_ROLE) nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Get card IDs and probabilities for a card set
     * @param cardSetId The ID of the card set
     */
    function getCardSetDetails(uint256 cardSetId) external view returns (
        uint256[] memory cardIds,
        uint256[] memory probabilities
    ) {
        require(cardSetId < _currentCardSetId, "Invalid card set ID");
        
        return (cardSets[cardSetId].cardIds, cardSets[cardSetId].cardProbabilities);
    }
}