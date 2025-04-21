import type { Chain } from "thirdweb";
import { hardhatLocal } from "./chains";

export type NftContract = {
  address: string;
  chain: Chain;
  type: "ERC1155" | "ERC721";

  title?: string;
  description?: string;
  thumbnailUrl?: string;
  slug?: string;
};

/**
 * Below is a list of all NFT contracts supported by your marketplace(s)
 * This is of course hard-coded for demo purpose
 *
 * In reality, the list should be dynamically fetched from your own data source
 */
export const NFT_CONTRACTS: NftContract[] = [
  {
    address: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Replace with your PokemonNFT contract address
    chain: hardhatLocal,
    title: "Pokemon NFT Collection",
    description: "Collect, trade, and battle with Pokemon NFTs!",
    thumbnailUrl: "/images/pokemon-collection.jpg", // Add an image to your public folder
    type: "ERC721",
  },
];
