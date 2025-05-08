import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import { ExtendedEnglishAuction } from "@/types/auction";
import {
  Button,
  Flex,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  useToast,
  Text,
} from "@chakra-ui/react";
import { useRef } from "react";
import { sendAndConfirmTransaction } from "thirdweb";
import { bidInAuction } from "thirdweb/extensions/marketplace";
import {
  useActiveWalletChain,
  useSwitchActiveWalletChain,
} from "thirdweb/react";
import type { Account } from "thirdweb/wallets";
import { MARKETPLACE_CONTRACTS } from "@/consts/marketplace_contract";
import { getContract } from "thirdweb";
import { client } from "@/consts/client";
import { formatEther } from "viem";
type Props = {
  account: Account;
  auction: ExtendedEnglishAuction;
};

export default function BidInAuctionButton(props: Props) {
  const { account, auction } = props;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bidAmountRef = useRef<HTMLInputElement>(null);
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

  const placeBid = async () => {
    const bidAmount = bidAmountRef.current?.value;

    if (!bidAmount || Number(bidAmount) <= 0) {
      return toast({
        title: "Please enter a valid bid amount",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }

    // Check if bid meets minimum requirements
    if (
      Number(bidAmount) < Number(auction.minimumBidCurrencyValue.displayValue)
    ) {
      return toast({
        title: "Bid too low",
        description: `Minimum bid is ${auction.minimumBidCurrencyValue.displayValue} ${auction.currency.symbol}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }

    // Switch chain if needed
    if (activeChain?.id !== auctionContract.chain.id) {
      await switchChain(auctionContract.chain);
    }

    try {
      // Place bid transaction
      const transaction = bidInAuction({
        contract: auctionContract,
        auctionId: auction.id,
        bidAmount: bidAmount,
      });

      await sendAndConfirmTransaction({
        transaction,
        account,
      });

      toast({
        title: "Bid placed successfully!",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      onClose();

      if (refetchAllAuctions) {
        refetchAllAuctions();
      }
    } catch (error) {
      console.error("Bid error:", error);
      toast({
        title: "Failed to place bid",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const buyoutAuction = async () => {
    if (
      !auction.buyoutCurrencyValue.displayValue ||
      auction.buyoutCurrencyValue.displayValue === "0"
    ) {
      return;
    }

    // Switch chain if needed
    if (activeChain?.id !== auctionContract.chain.id) {
      await switchChain(auctionContract.chain);
    }

    try {
      // Place buyout bid
      const transaction = bidInAuction({
        contract: auctionContract,
        auctionId: auction.id,
        bidAmount: auction.buyoutCurrencyValue.displayValue,
      });

      await sendAndConfirmTransaction({
        transaction,
        account,
      });

      toast({
        title: "Buyout successful!",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      onClose();

      if (refetchAllAuctions) {
        refetchAllAuctions();
      }
    } catch (error) {
      console.error("Buyout error:", error);
      toast({
        title: "Failed to buyout auction",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <>
      <Button colorScheme="purple" onClick={onOpen}>
        Place Bid
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Place a Bid</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex direction="column" gap={4}>
              <Text>
                Current highest bid:{" "}
                {auction.winningBid?.bidAmount
                  ? `${auction.winningBid.bidAmount} ${auction.currency.symbol}`
                  : `None (Min: ${auction.minimumBidCurrencyValue.displayValue} ${auction.currency.symbol})`}
              </Text>

              <Input
                ref={bidAmountRef}
                type="number"
                placeholder="Enter bid amount"
                defaultValue={
                  auction.winningBid?.bidAmount
                    ? Math.ceil(
                        Number(auction.winningBid.bidAmount) * 1.05
                      ).toString()
                    : auction.minimumBidCurrencyValue.displayValue
                }
              />

              {auction.buyoutBidAmount &&
                auction.buyoutBidAmount !== BigInt(0) && (
                  <Text>
                    Buyout price: {auction.buyoutCurrencyValue.displayValue}{" "}
                    {auction.currency.symbol}
                  </Text>
                )}
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Flex gap={4}>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={placeBid}>
                Place Bid
              </Button>
              {auction.buyoutBidAmount &&
                auction.buyoutBidAmount !== BigInt(0) && (
                  <Button colorScheme="green" onClick={buyoutAuction}>
                    Buyout Now
                  </Button>
                )}
            </Flex>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
