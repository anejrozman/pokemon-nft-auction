import React from "react";
import { Box, Flex, Heading, Text, SimpleGrid } from "@chakra-ui/react";
import Link from "next/link";

export default function CardSetsPage() {
  return (
    <Box p={8} maxW="1200px" mx="auto">
      {/* Title */}
      <Heading
        size="xl"
        mb={4}
        textAlign="center"
        bgGradient="linear(to-l, #7928CA, #FF0080)"
        bgClip="text"
      >
        Card Sets
      </Heading>

      {/* Subtitle */}
      <Text fontSize="lg" color="gray.200" textAlign="center" mb={8}>
        Mint new Pokémon cards from the following collections before they sell out!
      </Text>

      {/* Grey Rectangle Box */}
      <Box bg="gray.700" p={6} borderRadius="md" boxShadow="sm">
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {/* Placeholder for Set 1 */}
          <Link href="/cardsets/1">
            <Box
              p={4}
              borderRadius="md"
              boxShadow="sm"
              bgGradient="linear(to-l, rgba(121, 40, 202, 0.7), rgba(255, 0, 128, 0.7))"
              textAlign="center"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexDirection="column"
              _hover={{
                cursor: "pointer",
                bgGradient: "linear(to-l, #7928CA, #FF0080)",
                color: "white",
              }}
              h="200px"
            >
              <Text fontSize="xl" fontWeight="bold">
                Set1 Name
              </Text>
              <Text fontSize="lg" fontWeight="bold">
                Price: Set1 Price
              </Text>
              <Text fontSize="lg" fontWeight="bold">
                Available Mints: Set1 Quantity
              </Text>
            </Box>
          </Link>
        </SimpleGrid>
      </Box>
    </Box>
  );
}