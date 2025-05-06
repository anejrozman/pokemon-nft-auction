import MarketplaceProvider from "@/hooks/useMarketplaceContext";
import type { ReactNode } from "react";
import { NFT_CONTRACTS } from "@/consts/nft_contracts";

export default function MarketplaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { contractAddress: string; chainId: string };
}) {
  const defaultContract = NFT_CONTRACTS[0];
  return (
    <MarketplaceProvider
      chainId={defaultContract.chain.id.toString()}
      contractAddress={defaultContract.address}
    >
      {children}
    </MarketplaceProvider>
  );
}
