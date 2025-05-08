"use client";

import { ethers } from "ethers";

import React, { useEffect, useState } from "react";
import { 
  Box, 
  Heading, 
  Text, 
  Image, 
  Button, 
  Flex,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  HStack,
  VStack,
  Container,
  Spacer
} from "@chakra-ui/react";
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
    
  const [isMinting, setIsMinting] = useState(false);
  
  const handleMint = async () => {
    try {
      if (!cardSet) {
        alert("Card set data is not available.");
        return;
      }
  
      if (typeof window === "undefined" || !(window as any).ethereum) {
        alert("Ethereum provider is not available. Please install MetaMask.");
        return;
      }
  
      // Dynamically fetch the signer
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();
      console.log("Connected Wallet Address:", walletAddress);
  
      // Dynamically create the contract instance with the signer
      const pokemonContract = new ethers.Contract(
        nftContract.address,
        [
          "function mintFromCardSet(uint256 setId) public payable",
        ],
        signer
      );
  
      setIsMinting(true);
  
      // Call the mint function
      const tx = await pokemonContract.mintFromCardSet(BigInt(setId), {
        value: cardSet.price,
      });
  
      await tx.wait();
      alert("Mint successful!");
  
      // Reload the page to fetch updated card set data
      window.location.reload();
    } catch (error: any) {
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
    <Container maxW="1200px" px={4} py={8}>
      {/* Card Set Info Box */}
      <Card 
        mx="auto" 
        mb={10} 
        maxW="md" 
        borderRadius="lg" 
        boxShadow="xl"
        bg="gray.800"
        borderWidth="1px"
        borderColor="purple.500"
      >
        <CardHeader pb={0}>
          <Heading size="xl" textAlign="center" color="white">
            {cardSet.name}
          </Heading>
        </CardHeader>
        
        <CardBody>
          <VStack spacing={4} align="center">
            <Text fontSize="xl" fontWeight="bold" color="white">
              Price: {(Number(cardSet.price) / 10 ** 18)} ETH
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="white">
              Available Mints: {cardSet.supply.toString()}
            </Text>
          </VStack>
        </CardBody>
        
        <CardFooter justifyContent="center" pt={0}>
          <Button
            onClick={handleMint}
            isLoading={isMinting}
            disabled={isMinting}
            bgGradient="linear(to-l, rgba(121, 40, 202, 0.7), rgba(255, 0, 128, 0.7))"
            color="white"
            size="lg"
            width="full"
            _hover={{
              bgGradient: "linear(to-r, #FF0080, #7928CA)",
            }}
          >
            {isMinting ? "Minting..." : "Mint from Card Set"}
          </Button>
        </CardFooter>
      </Card>

      {/* Contents of the Set - Horizontal Scrollable List */}
      <Box mb={4}>
        <Heading size="md" mb={4} textAlign="center">
          Contents of the Set
        </Heading>
        
        {/* Scrollable container */}
        <Box 
          overflowX="auto" 
          css={{
            '&::-webkit-scrollbar': {
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#2D3748',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#805AD5',
              borderRadius: '4px',
            },
          }}
        >
          <HStack spacing={6} pb={4} pl={2} pr={2}>
            {cardImages.map((image: string, index: number) => {
              const pokemonName = image
                ? image.split("/").pop()?.split(".")[0]
                : "Unknown";
            
              return (
                <Box
                  key={index}
                  p={4}
                  borderRadius="md"
                  boxShadow="md"
                  bg="gray.700"
                  textAlign="center"
                  minW="220px"
                  flex="0 0 auto"
                >
                  {/* Display Pokémon name */}
                  <Text fontSize="lg" fontWeight="bold" mb={2} color="white">
                    {pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1)}
                  </Text>
              
                  {/* Display card image */}
                  {image ? (
                    <Image
                      src={image}
                      alt={`Card ${index + 1}`}
                      borderRadius="md"
                      mb={4}
                      maxH="250px"
                      mx="auto"
                    />
                  ) : (
                    <Text>Image not available</Text>
                  )}

                  {/* Display probability */}
                  <Text fontSize="lg" fontWeight="bold" color="white">
                    Probability: {(Number(cardSet.probabilities[index]) / 100)}%
                  </Text>
                </Box>
              );
            })}
          </HStack>
        </Box>
      </Box>
    </Container>
  );
}