import { ExtendedEnglishAuction, WinningBid } from "@/types/auction";
import { EnglishAuction } from "thirdweb/extensions/marketplace";

// Map from ThirdWeb EnglishAuction type to our ExtendedEnglishAuction type
export function mapToExtendedAuction(auction: EnglishAuction): ExtendedEnglishAuction {
  if (!auction) {
    console.error("Received null/undefined auction in mapper");
    // Return a default object to prevent crashes
    return {
      id: 0n,
      assetContractAddress: "",
      tokenId: 0n,
      quantity: 0n,
      currency: {
        name: "ETH",
        symbol: "ETH",
        decimals: 18,
        address: ""
      },
      minimumBidAmount: "0",
      buyoutBidAmount: "0",
      timeBufferInSeconds: 0n,
      bidBufferBps: 0n,
      startTimeInSeconds: 0n,
      endTimeInSeconds: 0n,
      status: "CREATED",
      auctionCreator: "",
      winningBid: undefined
    } as ExtendedEnglishAuction;
  }

  // Log data for debugging
  console.log("Mapping auction:", {
    id: auction.id,
    assetContract: auction.assetContractAddress,
    tokenId: auction.tokenId,
    tokenType: typeof auction.tokenId
  });
  
  // Safely extract winner and bid amount
  const winner = auction.winningBidder || "";
  const bidAmount = auction.winningBidAmount?.toString() || "0";
  
  // Create winning bid object if there is a winner
  const winningBid: WinningBid | undefined = winner ? {
    bidder: winner,
    bidAmount: bidAmount,
    currencyValue: {
      symbol: "ETH", // Default, should be updated based on actual currency
      name: "Ethereum",
      decimals: 18
    }
  } : undefined;
  
  return {
    ...auction,
    id: auction.id || 0n,
    assetContractAddress: auction.assetContractAddress || "",
    tokenId: auction.tokenId || 0n,
    quantity: auction.quantity || 1n,
    currency: {
      name: "ETH", // Default, should be updated based on actual currency
      symbol: "ETH",
      decimals: 18,
      address: auction.currency || ""
    },
    minimumBidAmount: auction.minimumBidAmount?.toString() || "0",
    buyoutBidAmount: auction.buyoutBidAmount?.toString() || "0",
    timeBufferInSeconds: auction.timeBufferInSeconds || 0n,
    bidBufferBps: auction.bidBufferBps || 0n,
    startTimeInSeconds: auction.startTimeInSeconds || 0n,
    endTimeInSeconds: auction.endTimeInSeconds || 0n,
    status: auction.status as "CREATED" | "COMPLETED" | "CANCELLED" || "CREATED",
    auctionCreator: auction.auctionCreator || "",
    winningBid
  };
}

// Map an array of ThirdWeb EnglishAuction to ExtendedEnglishAuction
export function mapToExtendedAuctions(auctions: EnglishAuction[]): ExtendedEnglishAuction[] {
  if (!auctions || !Array.isArray(auctions)) {
    console.error("Invalid auctions array:", auctions);
    return [];
  }
  console.log("Mapping", auctions.length, "auctions");
  return auctions.map(mapToExtendedAuction);
} 