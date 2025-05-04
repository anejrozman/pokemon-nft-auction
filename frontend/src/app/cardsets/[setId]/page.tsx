// filepath: [page.tsx](http://_vscodecontentref_/1)
import React from "react";
import { Box, Heading, Text } from "@chakra-ui/react";

export default function CardSetDetailsPage({
  params,
}: {
  params: { setId: string };
}) {
  const { setId } = params; // Extract the dynamic setId from the URL

  return (
    <Box p={8} maxW="1000px" mx="auto">
      {/* Title */}
      <Heading size="xl" mb={4} textAlign="center">
        Card Set Details
      </Heading>

      {/* Card Set Information */}
      <Text fontSize="lg" color="gray.600" textAlign="center" mb={8}>
        Details for Card Set ID: {setId}
      </Text>

      {/* Card Set Details Box */}
      <Box
        p={6}
        borderRadius="md"
        boxShadow="sm"
        bgGradient="linear(to-l, rgba(121, 40, 202, 0.7), rgba(255, 0, 128, 0.7))" // Gradient background
        textAlign="center"
        _hover={{
          cursor: "pointer",
          bgGradient: "linear(to-l, #7928CA, #FF0080)", // More vibrant gradient on hover
          color: "white", // Change text color on hover
        }}
        h="500px"
      >
        <Text fontSize="lg" fontWeight="bold">
          Card Set Name: Placeholder Name
        </Text>
        <Text fontSize="sm" color="gray.200">
          Price: Placeholder Price
        </Text>
        <Text fontSize="sm" color="gray.200">
          Available Mints: Placeholder Quantity
        </Text>
        <Text fontSize="sm" color="gray.200">
          Description: Placeholder Description
        </Text>
      </Box>
    </Box>
  );
}