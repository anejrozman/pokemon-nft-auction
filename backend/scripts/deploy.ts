import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  console.log("Deploying Pokemon contracts...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // --- Deploy PokemonNFT contract ---
  const PokemonNFT = await ethers.getContractFactory("PokemonNFT");
  const pokemonNFT = await PokemonNFT.deploy(
    deployer.address, // _defaultAdmin
    "PokemonNFT", // _name
    "PKMN", // _symbol
    deployer.address, // _royaltyRecipient
    500 // _royaltyBps - 5%
  );
  await pokemonNFT.waitForDeployment();
  const pokemonNFTAddress = await pokemonNFT.getAddress();
  console.log(`PokemonNFT deployed to: ${pokemonNFTAddress}`);

  // --- Deploy PokemonMarketplace contract ---
  const PokemonMarketplace = await ethers.getContractFactory("PokemonMarketplace");
  const marketplaceFeeBps = 250; // 2.5% fee
  const pokemonMarketplace = await PokemonMarketplace.deploy(marketplaceFeeBps);
  await pokemonMarketplace.waitForDeployment();
  const marketplaceAddress = await pokemonMarketplace.getAddress();
  console.log(`PokemonMarketplace deployed to: ${marketplaceAddress}`);

  // --- Deploy PokemonAuctionHouse contract ---
  const PokemonAuctionHouse = await ethers.getContractFactory("PokemonAuctionHouse");
  // Using the same fee for simplicity, can be different
  const auctionHouseFeeBps = 250; // 2.5% fee
  const pokemonAuctionHouse = await PokemonAuctionHouse.deploy(auctionHouseFeeBps);
  await pokemonAuctionHouse.waitForDeployment();
  const auctionHouseAddress = await pokemonAuctionHouse.getAddress();
  console.log(`PokemonAuctionHouse deployed to: ${auctionHouseAddress}`);
  // --- End Deploy PokemonAuctionHouse ---

  console.log("\nDeployment complete!");

  // --- Export addresses for frontend use ---
  const addresses = {
    nftAddress: pokemonNFTAddress,
    marketplaceAddress: marketplaceAddress, // For direct listings
    auctionHouseAddress: auctionHouseAddress // For auctions
  };

  console.log("\nContract addresses for frontend:");
  console.log(`export const NFT_CONTRACT_ADDRESS = "${addresses.nftAddress}"`);
  console.log(`export const MARKETPLACE_ADDRESS = "${addresses.marketplaceAddress}"`);
  console.log(`export const AUCTION_HOUSE_ADDRESS = "${addresses.auctionHouseAddress}"`);


  fs.writeFileSync(
    "./contractAddresses.json",
    JSON.stringify(addresses, null, 2) // Add formatting
  );
  console.log("\nAddresses saved to contractAddresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });