"use client";

import React from "react";
import { Box, Flex, Heading, Text, SimpleGrid } from "@chakra-ui/react";
import Link from "next/link";
import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import { useReadContract } from "thirdweb/react";
import { getAvailableCardSets } from "@/helpers/0xc0d1f4bdebc058663b10258920d2c4c08eab9854";

const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export default function CardSetsPage() {
  const { nftContract } = useMarketplaceContext();

  // const { data: cardSets, isLoading } = useReadContract({
  //   contract: nftContract,
  //   method: "function getAvailableCardSets() external view returns (CardSet[] memory)",
  //   params: [], // No params needed for this function
  // });
    const { data: cardSets, isLoading } = useReadContract(getAvailableCardSets, {
    contract: nftContract,
  });

  console.log('Card sets:', cardSets);
  console.log(nftContract);

  return (
    <Box p={8} maxW="1200px" mx="auto">
      <Heading
        size="xl"
        mb={4}
        textAlign="center"
        bgGradient="linear(to-l, #7928CA, #FF0080)"
        bgClip="text"
      >
        Card Sets
      </Heading>

      <Text fontSize="lg" color="gray.200" textAlign="center" mb={8}>
        Mint new Pokémon cards from the following collections before they sell out!
      </Text>

      <Box bg="gray.700" p={6} borderRadius="md" boxShadow="sm">
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {isLoading ? (
            <Text>Loading card sets...</Text>
          ) : cardSets ? (
            cardSets.map((set: any, index: number) => {
              const color1 = getRandomColor();
              const color2 = getRandomColor();

              return (
              <Link key={set.id.toString()} href={`/cardsets/${set.id}`}>
                <Box
                  p={4}
                  borderRadius="md"
                  boxShadow="sm"
                  bgGradient={`linear(to-l, ${color1}, ${color2})`}
                  textAlign="center"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexDirection="column"
                  _hover={{
                    cursor: "pointer",
                    opacity: 0.7,
                    color: "white",
                  }}
                  h="200px"
                >
                  <Text fontSize="xl" fontWeight="bold">
                    {set.name}
                  </Text>
                  <Text fontSize="lg" fontWeight="bold">
                    Price: {(Number(set.price) / 10**18).toString()} ETH
                  </Text>
                  <Text fontSize="lg" fontWeight="bold">
                    Available Mints: {set.supply.toString()}
                  </Text>
                </Box>
              </Link>
              );
            })
          ) : (
            <Text>No card sets found</Text>
          )}
        </SimpleGrid>
      </Box>
    </Box>
  );
}