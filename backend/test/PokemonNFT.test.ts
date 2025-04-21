import { expect } from "chai";
import { ethers } from "hardhat";
import { PokemonNFT } from "../typechain-types";

describe("PokemonNFT", function () {
  let pokemonNFT: PokemonNFT;

  beforeEach(async function () {
    const PokemonNFTFactory = await ethers.getContractFactory("PokemonNFT");
    pokemonNFT = await PokemonNFTFactory.deploy();
    await pokemonNFT.waitForDeployment();
  });

  it("Should have the correct name and symbol", async function () {
    expect(await pokemonNFT.name()).to.equal("PokemonNFT");
    expect(await pokemonNFT.symbol()).to.equal("PKMN");
  });

  it("Should mint a Pokemon NFT with correct attributes", async function () {
    const [owner, recipient] = await ethers.getSigners();
    
    // Mint a Pikachu NFT
    const tx = await pokemonNFT.mintPokemon(
      recipient.address,
      "ipfs://QmPikachu",
      "Pikachu",
      "Electric",
      25,
      100,
      55,
      40,
      false
    );
    
    await tx.wait();
    
    // Check token ownership
    expect(await pokemonNFT.ownerOf(1)).to.equal(recipient.address);
    
    // Check token URI
    expect(await pokemonNFT.tokenURI(1)).to.equal("ipfs://QmPikachu");
    
    // Check Pokemon attributes
    const attributes = await pokemonNFT.getPokemonAttributes(1);
    expect(attributes.name).to.equal("Pikachu");
    expect(attributes.pokemonType).to.equal("Electric");
    expect(attributes.level).to.equal(25);
    expect(attributes.hp).to.equal(100);
    expect(attributes.attack).to.equal(55);
    expect(attributes.defense).to.equal(40);
    expect(attributes.isShiny).to.equal(false);
  });
});
