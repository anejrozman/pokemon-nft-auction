"use client";

import { NFT_CONTRACTS } from "@/consts/nft_contracts";
import { Link } from "@chakra-ui/next-js";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Image,
  SimpleGrid,
  Text,
  useColorModeValue,
  VStack,
  HStack,
  IconButton,
  Card,
  CardBody,
} from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
// Import images directly
import setIconImage from "@/public/set_icon.jpg";
import auctionIconImage from "@/public/auction_icon.jpg";

export default function Home() {
  const bgGradient = "linear(to-br, #7928CA, #FF0080)";
  const cardBg = useColorModeValue("white", "gray.800");
  const cardHoverBg = useColorModeValue("gray.50", "gray.700");

  return (
    <Container maxW="container.xl" p={0}>
      {/* Main Navigation Cards - Card Sets & Auctions */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mt={8} mb={16}>
        {/* Card Sets Button */}
        <Link href="/cardsets" _hover={{ textDecoration: "none" }}>
          <Box
            h={{ base: "350px", lg: "500px" }}
            position="relative"
            borderRadius="lg"
            overflow="hidden"
            transition="transform 0.3s"
            _hover={{ transform: "translateY(-5px)" }}
          >
            {/* Card Sets image */}
            <Box w="full" h="full" position="absolute" overflow="hidden">
              <Image
                src={setIconImage.src}
                alt="Card Sets"
                objectFit="cover"
                w="full"
                h="full"
                fallback={
                  <Box
                    w="full"
                    h="full"
                    bgGradient="linear(to-br, #7928CA, #417ade)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text
                      color="white"
                      fontSize="6xl"
                      fontWeight="bold"
                      opacity={0.3}
                    >
                      CARD SETS
                    </Text>
                  </Box>
                }
              />
              {/* Darkening overlay for better text visibility */}
              <Box
                position="absolute"
                top="0"
                left="0"
                w="full"
                h="full"
                bg="blackAlpha.300"
              />
            </Box>

            {/* Content overlay */}
            <VStack
              position="absolute"
              bottom="0"
              w="full"
              p={8}
              align="start"
              bg="blackAlpha.700"
              color="white"
            >
              <Heading size="lg">Card Sets</Heading>
              <Text fontSize="md">
                Explore and mint exclusive Pokémon cards from various sets
              </Text>
              <HStack pt={2}>
                <Text fontWeight="bold">Browse Sets</Text>
                <ArrowForwardIcon />
              </HStack>
            </VStack>
          </Box>
        </Link>

        {/* Auctions Button */}
        <Link href="/auctions" _hover={{ textDecoration: "none" }}>
          <Box
            h={{ base: "350px", lg: "500px" }}
            position="relative"
            borderRadius="lg"
            overflow="hidden"
            transition="transform 0.3s"
            _hover={{ transform: "translateY(-5px)" }}
          >
            {/* Auctions image */}
            <Box w="full" h="full" position="absolute" overflow="hidden">
              <Image
                src={auctionIconImage.src}
                alt="Auctions"
                objectFit="cover"
                w="full"
                h="full"
                fallback={
                  <Box
                    w="full"
                    h="full"
                    bgGradient="linear(to-br, #FF0080, #ffaa00)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text
                      color="white"
                      fontSize="6xl"
                      fontWeight="bold"
                      opacity={0.3}
                    >
                      AUCTIONS
                    </Text>
                  </Box>
                }
              />
              {/* Darkening overlay for better text visibility */}
              <Box
                position="absolute"
                top="0"
                left="0"
                w="full"
                h="full"
                bg="blackAlpha.300"
              />
            </Box>

            {/* Content overlay */}
            <VStack
              position="absolute"
              bottom="0"
              w="full"
              p={8}
              align="start"
              bg="blackAlpha.700"
              color="white"
            >
              <Heading size="lg">Auctions</Heading>
              <Text fontSize="md">
                Bid on rare and limited Pokémon NFTs in our live auctions
              </Text>
              <HStack pt={2}>
                <Text fontWeight="bold">View Auctions</Text>
                <ArrowForwardIcon />
              </HStack>
            </VStack>
          </Box>
        </Link>
      </SimpleGrid>

      {/* Trending Collections Section */}
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="lg" bgGradient={bgGradient} bgClip="text">
            Pokemon Collections
          </Heading>
          <Button
            variant="outline"
            size="sm"
            bgGradient={bgGradient}
            bgClip="text"
            borderColor="purple.500"
          >
            View All
          </Button>
        </Flex>

        {/* Horizontal Scrollable List */}
        <Box
          overflowX="auto"
          css={{
            "&::-webkit-scrollbar": {
              height: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "#f1f1f1",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#888",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "#555",
            },
          }}
        >
          <Flex gap={5} pb={4}>
            {NFT_CONTRACTS.map((item) => (
              <Card
                key={item.address}
                minW="250px"
                maxW="250px"
                bg={cardBg}
                borderRadius="lg"
                overflow="hidden"
                transition="all 0.3s"
                _hover={{
                  transform: "translateY(-5px)",
                  boxShadow: "xl",
                }}
              >
                <Link
                  href={`/collection/${item.chain.id.toString()}/${
                    item.address
                  }`}
                  _hover={{ textDecoration: "none" }}
                >
                  <Box h="200px" overflow="hidden">
                    <Image
                      src={item.thumbnailUrl}
                      alt={item.title}
                      w="full"
                      h="full"
                      objectFit="cover"
                      transition="transform 0.5s"
                      _hover={{ transform: "scale(1.05)" }}
                    />
                  </Box>
                  <CardBody>
                    <Text fontSize="md" fontWeight="bold" noOfLines={1}>
                      {item.title}
                    </Text>
                  </CardBody>
                </Link>
              </Card>
            ))}
          </Flex>
        </Box>
      </Box>
    </Container>
  );
}
