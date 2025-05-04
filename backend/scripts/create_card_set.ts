import { ethers } from "hardhat";

async function main() {
  // Get the PokemonNFT contract
  const PokemonNFT = await ethers.getContractFactory("PokemonNFT");
  
  const contractAddresses = require("../contractAddresses.json");
  const pokemonNFT = PokemonNFT.attach(contractAddresses.nftAddress);
  const [owner] = await ethers.getSigners();

  const CID = "bafybeibw5cjn63fm6zco7cnnaff4iwizcynsvee76iwc6rxuaruodfsxxe";

  // Card sets to create
  const cardSets = [
    {
      name: "Starter Pack",
      cardURIs: [
        `ipfs://${CID}/pidgey.json`,
        `ipfs://${CID}/ekans.json`,
      ],
      probabilities: [9999, 1],
      supply: 2,
      price: ethers.parseEther("0.5")
    },
    {
      name: "Rare Pack",
      cardURIs: [
        `ipfs://${CID}/rattata.json`,
        `ipfs://${CID}/vulpix.json`,
      ],
      probabilities: [5000, 5000],
      supply: 1,
      price: ethers.parseEther("0.02")
    }
  ];

  console.log("Creating Pokemon Card Sets...");

  // Create each card set
  for (const cardSet of cardSets) {
    console.log(`Creating ${cardSet.name}...`);
    
    const tx = await (pokemonNFT as any).createCardSet(
      cardSet.name,
      cardSet.cardURIs,
      cardSet.probabilities,
      cardSet.supply,
      cardSet.price
    );
    
    const receipt = await tx.wait();
    
    // Find the CardSetCreated event to get the ID
    const event = receipt.events?.find((e: any) => e.event === "CardSetCreated");
    const setId = event?.args?.id;
    
    console.log(`${cardSet.name} created successfully with ID: ${setId}`);
  }

  console.log("All card sets created!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });