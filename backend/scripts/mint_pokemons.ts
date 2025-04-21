import { ethers } from "hardhat";


async function main() {
  // Get the PokemonNFT contract
  const PokemonNFT = await ethers.getContractFactory("PokemonNFT");
  
  const contractAddresses = require("../contractAddresses.json");
  const pokemonNFT = PokemonNFT.attach(contractAddresses.nftAddress);
  const [owner] = await ethers.getSigners();
  
  // Pokemon data to mint
  const pokemons = [
    {
      name: "Pikachu",
      type: "Electric",
      level: 25,
      hp: 35,
      attack: 55,
      defense: 40,
      isShiny: false,
      tokenURI: "http://localhost:3000/metadata/pikachu.json"
    },
    {
      name: "Charizard",
      type: "Fire",
      level: 36,
      hp: 78,
      attack: 84,
      defense: 78,
      isShiny: true,
      tokenURI: "http://localhost:3000/metadata/charizard.json"
    },
    {
      name: "Bulbasaur",
      type: "Grass",
      level: 15,
      hp: 45,
      attack: 49,
      defense: 49,
      isShiny: false,
      tokenURI: "http://localhost:3000/metadata/bulbasaur.json"
    }
  ];

  console.log("Minting Pokemon NFTs...");

  // Mint each Pokemon
  for (const pokemon of pokemons) {
    console.log(`Minting ${pokemon.name}...`);
    
    // Use "as any" to bypass TypeScript type checking
    const tx = await (pokemonNFT as any).mintPokemon(
      owner.address,
      pokemon.tokenURI,
      pokemon.name,
      pokemon.type,
      pokemon.level,
      pokemon.hp,
      pokemon.attack,
      pokemon.defense,
      pokemon.isShiny
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