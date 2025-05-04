import { ethers } from "hardhat";


async function main() {
  // Get the PokemonNFT contract
  const PokemonNFT = await ethers.getContractFactory("PokemonNFT");
  
  const contractAddresses = require("../contractAddresses.json");
  const pokemonNFT = PokemonNFT.attach(contractAddresses.nftAddress);
  const [owner] = await ethers.getSigners();

  const CID = "bafybeibw5cjn63fm6zco7cnnaff4iwizcynsvee76iwc6rxuaruodfsxxe";

   // Pokemon data to mint
   const pokemons = [
    {
      name: "Pikachu",
      ipfsURI: `ipfs://${CID}/pikachu.json` 
    },
    {
      name: "Charmander",
      ipfsURI: `ipfs://${CID}/charmander.json`
    },
    {
      name: "Bulbasaur",
      ipfsURI: `ipfs://${CID}/bulbasaur.json`
    }, 
    {
      name: "Diglett",
      ipfsURI: `ipfs://${CID}/diglett.json`
    }, 
    {
      name: "Squirtle",
      ipfsURI: `ipfs://${CID}/squirtle.json`
    }, 
    {
      name: "Jigglypuff",
      ipfsURI: `ipfs://${CID}/jigglypuff.json`
    }
  ];

  console.log("Minting Pokemon NFTs...");

  // Mint each Pokemon
  for (const pokemon of pokemons) {
    console.log(`Minting ${pokemon.name}...`);
    
    // Use "as any" to bypass TypeScript type checking
    const tx = await (pokemonNFT as any).mintPokemon(
      owner.address,
      pokemon.ipfsURI 
    );
    
    await tx.wait();
    console.log(`${pokemon.name} minted successfully!`);
  }

  console.log("All Pokemon NFTs minted!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });