import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import { ExtendedEnglishAuction } from "@/types/auction";
import {
  Button,
  useToast,
} from "@chakra-ui/react";
import { sendAndConfirmTransaction } from "thirdweb";
import { collectAuctionTokens } from "thirdweb/extensions/marketplace";
import { useActiveWalletChain, useSwitchActiveWalletChain } from "thirdweb/react";
import type { Account } from "thirdweb/wallets";
import { MARKETPLACE_CONTRACTS } from "@/consts/marketplace_contract";
import { getContract } from "thirdweb";
import { client } from "@/consts/client";

type Props = {
  account: Account;
  auction: ExtendedEnglishAuction;
};

export default function CollectAuctionButton(props: Props) {
  const { account, auction } = props;
  const toast = useToast();
  const switchChain = useSwitchActiveWalletChain();
  const activeChain = useActiveWalletChain();
  const { refetchAllAuctions } = useMarketplaceContext();

  // Get the auction house contract directly
  const auctionContract = getContract({
    address: MARKETPLACE_CONTRACTS[1].address, // Use the second contract (PokemonAuctionHouse)
    chain: MARKETPLACE_CONTRACTS[1].chain,
    client,
  });

  const isWinner = auction.winningBid?.bidder.toLowerCase() === account.address.toLowerCase();
  const isAuctionEnded = Date.now() / 1000 > Number(auction.endTimeInSeconds);

  const handleCollect = async () => {
    if (!isWinner || !isAuctionEnded) {
      return;
    }
    
    // Switch chain if needed
    if (activeChain?.id !== auctionContract.chain.id) {
      await switchChain(auctionContract.chain);
    }
    
    try {
      // Collect NFT
      const transaction = collectAuctionTokens({
        contract: auctionContract,
        auctionId: auction.id,
      });
      
      await sendAndConfirmTransaction({
        transaction,
        account,
      });
      
      toast({
        title: "NFT collected successfully!",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      if (refetchAllAuctions) {
        refetchAllAuctions();
      }
    } catch (error) {
      console.error("Collection error:", error);
      toast({
        title: "Failed to collect NFT",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (!isWinner || !isAuctionEnded) {
    return null;
  }

  return (
    <Button 
      colorScheme="green" 
      onClick={handleCollect}
    >
      Collect NFT
    </Button>
  );
} 