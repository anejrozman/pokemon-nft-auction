"use client";

import React from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  HStack,
  Image,
  VStack,
} from "@chakra-ui/react";
import Link from "next/link";
import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import { useReadContract } from "thirdweb/react";
import { getAvailableCardSets } from "@/helpers/0xc0d1f4bdebc058663b10258920d2c4c08eab9854";

// Import card set icons
import starterSetIcon from "@/public/starter_set_icon.jpg";
import rareSetIcon from "@/public/rare_set_icon.jpg";

export default function CardSetsPage() {
  const { nftContract } = useMarketplaceContext();

  const { data: cardSets, isLoading } = useReadContract(getAvailableCardSets, {
    contract: nftContract,
  });

  console.log("Card sets:", cardSets);
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
        Mint new Pokémon cards from the following collections before they sell
        out!
      </Text>

      {/* Horizontal Scrollable Card Sets */}
      <Box
        bg="gray.700"
        p={6}
        borderRadius="md"
        boxShadow="sm"
        overflowX="auto"
        css={{
          "&::-webkit-scrollbar": {
            height: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#2D3748",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#805AD5",
            borderRadius: "4px",
          },
        }}
      >
        {isLoading ? (
          <Text textAlign="center" fontSize="lg">
            Loading card sets...
          </Text>
        ) : cardSets && cardSets.length > 0 ? (
          <HStack spacing={6} pb={2}>
            {cardSets.map((set: any) => (
              <Link
                key={set.id.toString()}
                href={`/cardsets/${set.id}`}
                style={{ textDecoration: "none" }}
              >
                <Box
                  borderRadius="lg"
                  boxShadow="md"
                  textAlign="center"
                  minW="280px"
                  h="320px"
                  position="relative"
                  overflow="hidden"
                  transition="all 0.3s ease"
                  _hover={{
                    transform: "translateY(-5px)",
                    boxShadow: "xl",
                  }}
                >
                  {/* Card Image */}
                  <Box
                    position="relative"
                    w="full"
                    h="full"
                    filter="grayscale(70%)"
                    transition="all 0.3s ease"
                    _hover={{ filter: "grayscale(0%)" }}
                  >
                    <Image
                      src={
                        Number(set.price) > 0.03 * 10 ** 18
                          ? starterSetIcon.src
                          : rareSetIcon.src
                      }
                      alt={set.name}
                      objectFit="cover"
                      w="full"
                      h="full"
                      fallbackSrc="https://via.placeholder.com/280x320?text=Card+Set"
                    />

                    {/* Overlay with set details */}
                    <Box
                      position="absolute"
                      bottom="0"
                      left="0"
                      right="0"
                      bg="rgba(0, 0, 0, 0.7)"
                      p={4}
                      color="white"
                    >
                      <VStack spacing={1}>
                        <Text fontSize="xl" fontWeight="bold">
                          {set.name}
                        </Text>
                        <Text fontSize="md">
                          Price: {(Number(set.price) / 10 ** 18).toString()} ETH
                        </Text>
                        <Text fontSize="md">
                          Available Mints: {set.supply.toString()}
                        </Text>
                      </VStack>
                    </Box>
                  </Box>
                </Box>
              </Link>
            ))}
          </HStack>
        ) : (
          <Text textAlign="center" fontSize="lg">
            No card sets found
          </Text>
        )}
      </Box>
    </Box>
  );
}
