import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import { Box, Button, Code, Heading, Text, useDisclosure } from "@chakra-ui/react";
import { useState } from "react";

export function DebugAuctions() {
  const { isOpen, onToggle } = useDisclosure();
  const { allAuctions, auctionsInSelectedCollection, nftContract } = useMarketplaceContext();
  const [lastRefreshTime, setLastRefreshTime] = useState<string>(new Date().toLocaleTimeString());
  
  const handleRefresh = () => {
    window.location.reload();
    setLastRefreshTime(new Date().toLocaleTimeString());
  };
  
  return (
    <Box p={4} bg="black" color="white" mt={8} borderRadius="md">
      <Heading size="md" onClick={onToggle} cursor="pointer" mb={2}>
        Debug Auction Data (Click to {isOpen ? 'Hide' : 'Show'})
      </Heading>
      <Text fontSize="sm">Last refreshed: {lastRefreshTime}</Text>
      <Button size="sm" onClick={handleRefresh} mt={2} mb={4} colorScheme="blue">
        Refresh Page
      </Button>
      
      {isOpen && (
        <Box>
          <Text fontWeight="bold" mt={4}>Collection Contract Address:</Text>
          <Code p={2} borderRadius="md" display="block" whiteSpace="pre-wrap" fontSize="xs">
            {nftContract.address}
          </Code>
          
          <Text fontWeight="bold" mt={4}>All Auctions ({allAuctions?.length || 0}):</Text>
          <Code p={2} borderRadius="md" display="block" whiteSpace="pre-wrap" fontSize="xs" maxH="300px" overflow="auto">
            {JSON.stringify(allAuctions, null, 2)}
          </Code>
          
          <Text fontWeight="bold" mt={4}>Filtered Auctions for this Collection ({auctionsInSelectedCollection?.length || 0}):</Text>
          <Code p={2} borderRadius="md" display="block" whiteSpace="pre-wrap" fontSize="xs" maxH="300px" overflow="auto">
            {JSON.stringify(auctionsInSelectedCollection, null, 2)}
          </Code>
        </Box>
      )}
    </Box>
  );
} 