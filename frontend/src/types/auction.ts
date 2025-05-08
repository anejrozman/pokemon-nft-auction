import { NATIVE_TOKEN_ADDRESS } from "thirdweb";
import { EnglishAuction as ThirdwebEnglishAuction } from "thirdweb/extensions/marketplace";

export type WinningBid = {
  bidder: string;
  bidAmount: string;
  currencyValue?: {
    symbol: string;
    name: string;
    decimals: number;
  };
};

export type AuctionCurrency = {
  name: string;
  symbol: string;
  decimals: number;
  address: string;
};

// Extended EnglishAuction type that includes all fields needed by our UI components
export interface ExtendedEnglishAuction extends ThirdwebEnglishAuction {
  id: bigint;
  assetContractAddress: string;
  tokenId: bigint;
  quantity: bigint;
  currency: AuctionCurrency;
  minimumBidAmount: bigint;
  buyoutBidAmount: bigint;
  timeBufferInSeconds: bigint;
  bidBufferBps: bigint;
  startTimeInSeconds: bigint;
  endTimeInSeconds: bigint;
  status: "CREATED" | "COMPLETED" | "CANCELLED";
  auctionCreator: string;
  winningBid?: WinningBid;
}
