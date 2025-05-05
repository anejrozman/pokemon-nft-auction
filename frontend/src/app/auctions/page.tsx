// app/auctions/page.tsx

"use client";

import {
  Box,
  Flex,
  Heading,
  SimpleGrid,
  Spinner,
  Text,
} from "@chakra-ui/react";
import {
  MediaRenderer,
  useReadContract,
} from "thirdweb/react";
import { getContract, toEther } from "thirdweb";
import { client } from "@/consts/client";
import { MARKETPLACE_CONTRACTS } from "@/consts/marketplace_contract";


export default function AuctionsPage() {
  const contract = getContract({
    address: MARKETPLACE_CONTRACTS[1].address,
    chain: MARKETPLACE_CONTRACTS[1].chain,
    client,
  });

  


  const {
    data: activeAuctions,
    isLoading,
    error,
  } = useReadContract({
    contract,
    method: "getAllValidAuctions",
    params: [20, 10],
    queryOptions: {
      refetchInterval: 10000,
    },
  });
  
  

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!activeAuctions || activeAuctions.length === 0) {
    return (
      <Box p={10}>
        <Heading size="lg" mb={4}>
          Active Auctions
        </Heading>
        <Text>No active auctions found.</Text>
      </Box>
    );
  }

  return (
    <Box p={10}>
      <Heading size="lg" mb={6}>
        Active Auctions
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {activeAuctions.map((auction: any, index: number) => (
          <Box key={index} borderWidth="1px" rounded="md" p={4}>
            <MediaRenderer src={auction.tokenURI} client={client} />
            <Text mt={2} fontWeight="bold">
              Token ID: {auction.tokenId}
            </Text>
            <Text>Current Bid: {toEther(auction.currentBid)} ETH</Text>
            <Text>Ends At: {new Date(Number(auction.endTime) * 1000).toLocaleString()}</Text>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
