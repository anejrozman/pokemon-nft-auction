import { expect } from "chai";
import { ethers } from "hardhat";
import { ZeroAddress } from "ethers";

describe("PokemonNFT Contract - Card Set Management", function () {
  let pokemonNFT: any;
  let owner: any;
  let admin: any;
  let user: any;

  beforeEach(async function () {
    // Deploy the contract
    const PokemonNFT = await ethers.getContractFactory("PokemonNFT");
    [owner, admin, user] = await ethers.getSigners();

    pokemonNFT = await PokemonNFT.deploy(
      owner.address,    // Default admin
      "PokemonNFT",     // Token name
      "PKMN",           // Token symbol
      owner.address,    // Royalty recipient
      500               // Royalty in basis points (5%)
    );
  });

  // -----------------------------------
  // Card Set Management Tests
  // -----------------------------------
  describe("Card Set Management", function () {
    it("Should create a card set", async function () {
      const cardURIs = ["ipfs://card1", "ipfs://card2"];
      const probabilities = [5000, 5000];
      const supply = 10;
      const price = ethers.parseEther("0.1");

      await expect(
        pokemonNFT
          .connect(owner)
          .createCardSet("Starter Set", cardURIs, probabilities, supply, price)
      )
        .to.emit(pokemonNFT, "CardSetCreated")
        .withArgs(0, "Starter Set", cardURIs, probabilities, supply, price);

      const cardSet = await pokemonNFT.getCardSet(0);
      expect(cardSet.name).to.equal("Starter Set");
      expect(cardSet.supply).to.equal(supply);
      expect(cardSet.price).to.equal(price);
    });

    it("Should fail to create a card set with invalid probabilities", async function () {
      const cardURIs = ["ipfs://card1", "ipfs://card2"];
      const probabilities = [6000, 3000]; 
      const supply = 10;
      const price = ethers.parseEther("0.1");

      await expect(
        pokemonNFT
          .connect(owner)
          .createCardSet("Invalid Set", cardURIs, probabilities, supply, price)
      ).to.be.revertedWith("Probabilities must sum to 10,000");
    });

    it("Should fail to create a card set with mismatched URIs and probabilities", async function () {
      const cardURIs = ["ipfs://card1"];
      const probabilities = [5000, 5000];
      const supply = 10;
      const price = ethers.parseEther("0.1");

      await expect(
        pokemonNFT
          .connect(owner)
          .createCardSet("Mismatched Set", cardURIs, probabilities, supply, price)
      ).to.be.revertedWith("URIs and probabilities length mismatch");
    });

    it("Should burn a card set", async function () {
      const cardURIs = ["ipfs://card1", "ipfs://card2"];
      const probabilities = [5000, 5000];
      const supply = 10;
      const price = ethers.parseEther("0.1");

      await pokemonNFT
        .connect(owner)
        .createCardSet("Starter Set", cardURIs, probabilities, supply, price);

      await expect(pokemonNFT.connect(owner).burnCardSet(0))
        .to.emit(pokemonNFT, "CardSetBurned")
        .withArgs(0);
    });

    it("Should fail to burn a non-existent card set", async function () {
      await expect(pokemonNFT.connect(owner).burnCardSet(0)).to.be.revertedWith(
        "Card set does not exist or is already burned"
      );
    });

    it("Should return the correct number of card sets", async function () {
      const cardURIs = ["ipfs://card1"];
      const probabilities = [10000];
      const supply = 5;
      const price = ethers.parseEther("0.05");

      await pokemonNFT
        .connect(owner)
        .createCardSet("Set 1", cardURIs, probabilities, supply, price);
      await pokemonNFT
        .connect(owner)
        .createCardSet("Set 2", cardURIs, probabilities, supply, price);

      const count = await pokemonNFT.getCardSetCount();
      expect(count).to.equal(2);
    });

    it("Should return only available card sets", async function () {
      const cardURIs = ["ipfs://card1"];
      const probabilities = [10000];
      const supply = 5;
      const price = ethers.parseEther("0.05");

      await pokemonNFT
        .connect(owner)
        .createCardSet("Set 1", cardURIs, probabilities, supply, price);
      await pokemonNFT
        .connect(owner)
        .createCardSet("Set 2", cardURIs, probabilities, supply, price); 

      const availableCardSets = await pokemonNFT.getAvailableCardSets();
      expect(availableCardSets.length).to.equal(2);
      expect(availableCardSets[0].name).to.equal("Set 1");
      expect(availableCardSets[1].name).to.equal("Set 2");
    });
  });

  // -----------------------------------
  // Minting Logic Tests
  // -----------------------------------
  describe("Minting Logic", function () {
    it("Should mint a Pokemon NFT from a card set", async function () {
      const cardURIs = ["ipfs://card1"];
      const probabilities = [10000];
      const supply = 10;
      const price = ethers.parseEther("0.1");

      await pokemonNFT
        .connect(owner)
        .createCardSet("Starter Set", cardURIs, probabilities, supply, price);
    
      await expect(
          pokemonNFT.connect(user).mintFromCardSet(0, { value: price })
        )
          .to.emit(pokemonNFT, "PokemonMinted")
          .withArgs(0, cardURIs[0], user.address); 
    
        const cardSet = await pokemonNFT.getCardSet(0);
        expect(cardSet.supply).to.equal(9); 
      });
  
    it("Should fail to mint with incorrect payment", async function () {
      const cardURIs = ["ipfs://card1"];
      const probabilities = [10000];
      const supply = 5;
      const price = ethers.parseEther("0.1");
      
      await pokemonNFT
        .connect(owner)
        .createCardSet("Starter Set", cardURIs, probabilities, supply, price);

      await expect(
        pokemonNFT.connect(user).mintFromCardSet(0, { value: ethers.parseEther("0.05") })
      ).to.be.revertedWith("Incorrect payment amount");
    });

    it("Should fail to mint from a sold-out card set", async function () {
      const cardURIs = ["ipfs://card1"];
      const probabilities = [10000];
      const supply = 1;
      const price = ethers.parseEther("0.1");

      await pokemonNFT
        .connect(owner)
        .createCardSet("Starter Set", cardURIs, probabilities, supply, price);

      // Mint the only NFT in the card set
      await pokemonNFT.connect(user).mintFromCardSet(0, { value: price });

      // Attempt to mint again
      await expect(
        pokemonNFT.connect(user).mintFromCardSet(0, { value: price })
      ).to.be.revertedWith("Set is sold out");
    });

    it("Should fail to mint from a non-existent card set", async function () {
      const price = ethers.parseEther("0.1");

      await expect(
        pokemonNFT.connect(user).mintFromCardSet(999, { value: price })
      ).to.be.revertedWith("Card set does not exist");
    });

    it("Should fail to mint when the contract is paused", async function () {
      const cardURIs = ["ipfs://card1"];
      const probabilities = [10000];
      const supply = 5;
      const price = ethers.parseEther("0.1");

      await pokemonNFT
        .connect(owner)
        .createCardSet("Starter Set", cardURIs, probabilities, supply, price);

      await pokemonNFT.connect(owner).pause();

      // Attempt to mint while paused
      await expect(
        pokemonNFT.connect(user).mintFromCardSet(0, { value: price })
      ).to.be.reverted;
    });
  });

  // ----------------------------------------------------------------------
  // Randomness tests (Unnecessary since this implementation is not secure 
  //                   and would not be used in production, also getRandomNumber
  //                   is an internal function and hence non-testable)
  // ----------------------------------------------------------------------
  describe("Randomness", function () {  
    it("Should update the secret salt", async function () {
      await expect(pokemonNFT.connect(owner).updateSecretSalt())
        .to.emit(pokemonNFT, "SecretSaltUpdated");
    });
  
    it("Should fail to update the secret salt if not admin", async function () {
      await expect(pokemonNFT.connect(user).updateSecretSalt()).to.be.reverted
    });
  });

  // -----------------------
  // Token metadata tests
  // ---------------------- 
  describe("Token Metadata", function () {
    it("Should return the correct token URI", async function () {
      const cardURIs = ["ipfs://card1"];
      const probabilities = [10000];
      const supply = 5;
      const price = ethers.parseEther("0.1");
  
      await pokemonNFT
        .connect(owner)
        .createCardSet("Starter Set", cardURIs, probabilities, supply, price);
      await pokemonNFT.connect(user).mintFromCardSet(0, { value: price });
  
      const tokenId = await pokemonNFT.getLastMintedTokenId();
      const tokenURI = await pokemonNFT.tokenURI(tokenId);
      expect(tokenURI).to.equal(cardURIs[0]);
    });
  
    it("Should fail to get token URI for a non-existent token", async function () {
      await expect(pokemonNFT.tokenURI(999)).to.be.revertedWith(
        "ERC721Metadata: URI query for nonexistent token"
      );
    });
  
    it("Should return the last minted token ID", async function () {
      const cardURIs = ["ipfs://card1"];
      const probabilities = [10000];
      const supply = 5;
      const price = ethers.parseEther("0.1");
  
      await pokemonNFT
        .connect(owner)
        .createCardSet("Starter Set", cardURIs, probabilities, supply, price);
      await pokemonNFT.connect(user).mintFromCardSet(0, { value: price });
  
      const tokenId = await pokemonNFT.getLastMintedTokenId();
      expect(tokenId).to.equal(0); 
    });
  
    it("Should return the correct Pokemon attributes", async function () {
      const cardURIs = ["ipfs://card1"];
      const probabilities = [10000];
      const supply = 5;
      const price = ethers.parseEther("0.1");
  
      await pokemonNFT
        .connect(owner)
        .createCardSet("Starter Set", cardURIs, probabilities, supply, price);
      await pokemonNFT.connect(user).mintFromCardSet(0, { value: price });
  
      const tokenId = await pokemonNFT.getLastMintedTokenId();
      const attributes = await pokemonNFT.getPokemonAttributes(tokenId);
      expect(attributes.ipfsURI).to.equal(cardURIs[0]);
    });
  
    it("Should fail to get attributes for a non-existent token", async function () {
      await expect(pokemonNFT.getPokemonAttributes(999)).to.be.revertedWith(
        "Token does not exist"
      );
    });
  });

  // ------------------------
  // Token burning tests
  // ------------------------
  describe("Token Burning", function () {
    it("Should burn a token and clean up attributes", async function () {
      const cardURIs = ["ipfs://card1"];
      const probabilities = [10000];
      const supply = 5;
      const price = ethers.parseEther("0.1");
  
      await pokemonNFT
        .connect(owner)
        .createCardSet("Starter Set", cardURIs, probabilities, supply, price);
      await pokemonNFT.connect(user).mintFromCardSet(0, { value: price });
  
      const tokenId = await pokemonNFT.getLastMintedTokenId();
  
      // Burn the token
      await expect(pokemonNFT.connect(user).burn(tokenId))
        .to.emit(pokemonNFT, "Transfer") // ERC721 emits Transfer event on burn
        .withArgs(user.address, ZeroAddress, tokenId);
  
      // Ensure the token no longer exists
      await expect(pokemonNFT.tokenURI(tokenId)).to.be.revertedWith(
        "ERC721Metadata: URI query for nonexistent token"
      );
  
      await expect(pokemonNFT.getPokemonAttributes(tokenId)).to.be.revertedWith(
        "Token does not exist"
      );
    });
  
    it("Should fail to burn a token without approval", async function () {
      const cardURIs = ["ipfs://card1"];
      const probabilities = [10000];
      const supply = 5;
      const price = ethers.parseEther("0.1");
  
      await pokemonNFT
        .connect(owner)
        .createCardSet("Starter Set", cardURIs, probabilities, supply, price);
      await pokemonNFT.connect(user).mintFromCardSet(0, { value: price });
  
      const tokenId = await pokemonNFT.getLastMintedTokenId();
  
      // Attempt to burn the token without approval
      await expect(pokemonNFT.connect(admin).burn(tokenId)).to.be.revertedWith(
        "Not approved to burn"
      );
    });
  
    it("Should fail to burn a non-existent token", async function () {
      await expect(pokemonNFT.connect(user).burn(999)).to.be.revertedWith(
        "Token does not exist"
      );
    });
  });

  // -------------------------------
  // Administrative functions tests
  // -------------------------------
  describe("Administrative Functions", function () {
    it("Should pause and unpause the contract", async function () {
      await expect(pokemonNFT.connect(owner).pause())
        .to.emit(pokemonNFT, "ContractPaused");
  
      const cardURIs = ["ipfs://card1"];
      const probabilities = [10000];
      const supply = 5;
      const price = ethers.parseEther("0.1");
  
      await pokemonNFT
        .connect(owner)
        .createCardSet("Starter Set", cardURIs, probabilities, supply, price);
  
      await expect(
        pokemonNFT.connect(user).mintFromCardSet(0, { value: price })
      ).to.be.reverted;
  
      await expect(pokemonNFT.connect(owner).unpause())
        .to.emit(pokemonNFT, "ContractUnpaused");
  
      await expect(
        pokemonNFT.connect(user).mintFromCardSet(0, { value: price })
      ).to.emit(pokemonNFT, "PokemonMinted");
    });
  
    it("Should withdraw funds to the admin", async function () {
      const cardURIs = ["ipfs://card1"];
      const probabilities = [10000];
      const supply = 5;
      const price = ethers.parseEther("0.1");
  
      await pokemonNFT
        .connect(owner)
        .createCardSet("Starter Set", cardURIs, probabilities, supply, price);
      await pokemonNFT.connect(user).mintFromCardSet(0, { value: price });
  
      const initialBalance = await ethers.provider.getBalance(owner.address);
  
      await expect(pokemonNFT.connect(owner).withdraw())
        .to.emit(pokemonNFT, "Withdrawal")
        .withArgs(owner.address, price);
  
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });
  
    it("Should fail to withdraw with zero balance", async function () {
      await expect(pokemonNFT.connect(owner).withdraw()).to.be.revertedWith(
        "No funds to withdraw"
      );
    });
  });
});