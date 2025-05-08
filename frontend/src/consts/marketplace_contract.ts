import type { Chain } from "thirdweb";
import { hardhatLocal } from "./chains";

type MarketplaceContract = {
  address: string;
  chain: Chain;
};

/**
 * You need a marketplace contract on each of the chain you want to support
 * Only list one marketplace contract address for each chain
 */
export const MARKETPLACE_CONTRACTS: MarketplaceContract[] = [
  {
    address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // Your saved address
    chain: hardhatLocal,
  },
  {
    address: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", // Your saved address
    chain: hardhatLocal,
  },
  {
    address: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", // Your saved address
    chain: hardhatLocal,
  }
];
