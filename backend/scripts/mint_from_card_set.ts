import { ethers } from "hardhat";

async function main() {
  // Define the account details
  const accountPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // account 0
  // const accountPrivateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"; // account 1
  const provider = ethers.provider; // Use the default Hardhat provider
  const wallet = new ethers.Wallet(accountPrivateKey, provider); // Create a wallet instance

  console.log(`Using wallet address: ${wallet.address}`);

  // Get the PokemonNFT contract
  const PokemonNFT = await ethers.getContractFactory("PokemonNFT");
  const contractAddresses = require("../contractAddresses.json");
  const pokemonNFT = PokemonNFT.attach(contractAddresses.nftAddress);

  console.log("Minting Pokémon from card sets...");

  // Mint one Pokémon from each card set
  const cardSetIds = [0, 1]; // IDs of the card sets created in create_card_set.ts

  for (const setId of cardSetIds) {
    console.log(`Minting from Card Set ID: ${setId}...`);

    // Get the price of the card set
    const cardSet = await pokemonNFT.getCardSet(setId);
    const price = cardSet.price;

    // Mint a Pokémon from the card set
    const tx = await pokemonNFT.connect(wallet).mintFromCardSet(setId, { value: price });
    const receipt = await tx.wait();

    // Find the PokemonMinted event to get the token ID and URI
    const event = receipt.events?.find((e: any) => e.event === "PokemonMinted");
    const tokenId = event?.args?.tokenId;
    const tokenURI = event?.args?.tokenURI;

    console.log(`Minted Pokémon with Token ID: ${tokenId}, Token URI: ${tokenURI}`);
  }

  console.log("All Pokémon minted successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });