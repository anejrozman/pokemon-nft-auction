import { ethers } from "hardhat";

async function main() {
  // Get the PokemonNFT contract
  const PokemonNFT = await ethers.getContractFactory("PokemonNFT");

  // Load the deployed contract address
  const contractAddresses = require("../contractAddresses.json");
  const pokemonNFT = PokemonNFT.attach(contractAddresses.nftAddress);

  console.log("Fetching available card sets...");

  // Call the getAvailableCardSets function
  const availableCardSets = await pokemonNFT.getAvailableCardSets();

  // Log the output
  console.log("Available Card Sets:");
  availableCardSets.forEach((cardSet: any, index: number) => {
    console.log(`Card Set ${index + 1}:`);
    console.log(`  Name: ${cardSet.name}`);
    console.log(`  Supply: ${cardSet.supply}`);
    console.log(`  Raw Price: ${cardSet.price}`);
    console.log(`  Card URIs: ${cardSet.cardURIs.join(", ")}`);
    console.log(`  Probabilities: ${cardSet.probabilities.join(", ")}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });