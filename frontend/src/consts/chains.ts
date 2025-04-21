import { Chain, defineChain } from "thirdweb";

/**
 * All chains should be exported from this file
 */
export { sepolia } from "thirdweb/chains";

// Define local Hardhat network (chainId 31337)
export const hardhatLocal: Chain = defineChain({
    id: 1337,
    name: "Hardhat Local",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18
    },
    rpc: "http://localhost:8545",
  });