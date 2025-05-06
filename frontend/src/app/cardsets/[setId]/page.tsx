"use client";

import { ethers } from "ethers";

import React, { useEffect, useState } from "react";
import { Box, Heading, Text, SimpleGrid, Image, Button, Flex} from "@chakra-ui/react";
import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import { useReadContract } from "thirdweb/react";
import { getCardSet } from "@/helpers/0xc0d1f4bdebc058663b10258920d2c4c08eab9854";

export default function CardSetDetailsPage({
  params,
}: {
  params: { setId: string };
}) {

  const { nftContract } = useMarketplaceContext();
  const { setId } = params; // Extract setId from the URL
  const { data: cardSet, isLoading } = useReadContract(getCardSet, {
    contract: nftContract,
    setId: BigInt(setId), 
  });

  // Get signer from browser's Ethereum provider 
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      provider.getSigner().then(setSigner);
    }
  }, []);

  const pokemonContract = signer
    ? new ethers.Contract(
        nftContract.address,
        [
          "function mintFromCardSet(uint256 setId) public payable",
        ],
        signer // Signer from the connected wallet
      )
    : null;
    
  const [isMinting, setIsMinting] = useState(false);
  
  const handleMint = async () => {
    try {
      if (!cardSet) {
        alert("Card set data is not available.");
        return;
      }
  
      if (!pokemonContract) {
        alert("Contract is not initialized. Please connect your wallet.");
        return;
      }

      setIsMinting(true);
  
      const tx = await pokemonContract.mintFromCardSet(BigInt(setId), {
        value: cardSet.price,
      });
  
      await tx.wait();
      alert("Mint successful!");

      window.location.reload();
    } 
    
    catch (error: any) {
      console.error("Error minting from card set:", error);
      if (error.code === "INSUFFICIENT_FUNDS") {
        alert("You do not have enough ETH to mint this card.");
      } else {
        alert("Mint failed. Please try again.");
      }
    } finally {
      setIsMinting(false);
    }
  };

  const [cardImages, setCardImages] = useState<string[]>([]);

  useEffect(() => {
    if (cardSet) {
      const fetchImages = async () => {
        const gatewayBase = "https://ipfs.io/ipfs/";
        const images = await Promise.all(
          cardSet.cardURIs.map(async (uri: string) => {
            try {
              const metadataUrl = uri.replace("ipfs://", gatewayBase);
              const response = await fetch(metadataUrl);
              const metadata = await response.json();
              return metadata.image.replace("ipfs://", gatewayBase);
            } catch (error) {
              console.error("Error fetching metadata:", error);
              return ""; 
            }
          })
        );
        setCardImages(images);
      };

      fetchImages();
    }
  }, [cardSet]);

  if (isLoading) {
    return (
      <Text fontSize="2xl" textAlign="center" mt={8}>
        Loading card set details...
      </Text>
    );
  }
  
  if (!cardSet || !cardSet.name || Number(cardSet.supply) === 0) {
    return (
      <Box textAlign="center" mt={8}>
        <Text fontSize="2xl" mb={4}>
          Card set doesn't exist or is sold out.
        </Text>
        <Button
          onClick={() => window.location.href = "/cardsets"} 
          bgGradient="linear(to-l, rgba(121, 40, 202, 0.7), rgba(255, 0, 128, 0.7))"
          color="white"
          size="lg"
          _hover={{
            bgGradient: "linear(to-r, #FF0080, #7928CA)",
          }}
        >
          Back to Card Sets
        </Button>
      </Box>
    );
  }

  return (
    <Box p={8} maxW="1000px" mx="auto">
      {/* Title */}
      <Heading size="xl" mb={4} textAlign="center">
        {cardSet.name}
      </Heading>

      {/* Card Set Details */}
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Text fontSize="lg" mb={2}>
            <strong>Price:</strong> {(Number(cardSet.price) / 10 ** 18)} ETH
          </Text>
          <Text fontSize="lg" mb={2}>
            <strong>Available Mints:</strong> {cardSet.supply.toString()}
          </Text>
        </Box>
        <Button
          onClick={handleMint}
          isLoading={isMinting}
          disabled={isMinting}
          bgGradient="linear(to-l, rgba(121, 40, 202, 0.7), rgba(255, 0, 128, 0.7))"
          color="white"
          size="lg"
          _hover={{
            bgGradient: "linear(to-r, #FF0080, #7928CA)",
          }}
        >
          {isMinting ? "Minting..." : "Mint from Card Set"}
        </Button>
      </Flex>

      {/* Cards and Probabilities */}
      <Heading size="md" mt={8} mb={4} textAlign="center">
        Contents of the set
      </Heading>
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={6}>
        {cardImages.map((image: string, index: number) => {
          const pokemonName = image
            ? image.split("/").pop()?.split(".")[0]
            : "Unknown";
        
          return (
            <Box
              key={index}
              p={4}
              borderRadius="md"
              boxShadow="sm"
              bg="gray.700"
              textAlign="center"
            >
              {/* Display Pokémon name */}
              <Text fontSize="lg" fontWeight="bold" mb={2}>
                {pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1)}
              </Text>
          
              {/* Display card image */}
              {image ? (
                <Image
                  src={image}
                  alt={`Card ${index + 1}`}
                  borderRadius="md"
                  mb={4}
                />
              ) : (
                <Text>Image not available</Text>
              )}

              {/* Display probability */}
              <Text fontSize="lg" fontWeight="bold">
                Probability: {(Number(cardSet.probabilities[index]) / 100)}%
              </Text>
            </Box>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}