"use client";

import { NFT_CONTRACTS } from "@/consts/nft_contracts";
import { Link } from "@chakra-ui/next-js";
import {
  Box,
  Flex,
  Heading,
  Image,
  Stack,
  StackDivider,
  Text,
} from "@chakra-ui/react";

export default function Home() {
  return (
    <Flex direction="column" mt="24px" mx="auto" maxW="90vw" gap="6">
      {/* Website Description */}
      <Heading
        size="md"
        bgGradient="linear(to-l, #7928CA, #FF0080)"
        bgClip="text"
        textAlign="center"
      >
        Welcome to PokéMarket!
      </Heading>

      <Stack divider={<StackDivider />} spacing="6">
        <Box>
          <Heading
            size="xs"
            textTransform="uppercase"
            bgGradient="linear(to-l, #7928CA, #FF0080)"
            bgClip="text"
          >
            What are Pokémon?
          </Heading>
          <Text pt="2" fontSize="sm">
            Pokémon are creatures with unique abilities and traits that have
            captured the hearts of millions worldwide. Now, you can own your
            favorite Pokémon as NFTs, bringing them to life in the digital
            world!
          </Text>
        </Box>

        <Box>
          <Heading
            size="xs"
            textTransform="uppercase"
            bgGradient="linear(to-l, #7928CA, #FF0080)"
            bgClip="text"
          >
            Buy NFTs from Card Sets
          </Heading>
          <Text pt="2" fontSize="sm">
            Explore our exclusive{" "}
            <Link
              href="/cardsets"
              bgGradient="linear(to-l, #7928CA, #FF0080)"
              bgClip="text"
              _hover={{
                textDecoration: "underline",
                bgGradient: "linear(to-l, #FF0080, #7928CA)", 
              }}
            >
              Card Sets
            </Link>{" "}
            to mint limited-edition Pokémon NFTs. Each set contains rare and
            unique Pokémon waiting to be discovered!
          </Text>
        </Box>

        <Box>
          <Heading
            size="xs"
            textTransform="uppercase"
            bgGradient="linear(to-l, #7928CA, #FF0080)"
            bgClip="text"
          >
            Participate in Auctions
          </Heading>
          <Text pt="2" fontSize="sm">
            Bid on exclusive Pokémon NFTs in our{" "}
            <Link
              href="/auctions"
              bgGradient="linear(to-l, #7928CA, #FF0080)"
              bgClip="text"
              _hover={{
                textDecoration: "underline",
                bgGradient: "linear(to-l, #FF0080, #7928CA)",
              }}
            >
              Auctions
            </Link>
            . Compete with other collectors to own the rarest Pokémon NFTs
            available!
          </Text>
        </Box>
      </Stack>

      {/* Trending Collections */}
      <Heading
        ml="20px"
        mt="40px"
        bgGradient="linear(to-l, #7928CA, #FF0080)"
        bgClip="text"
      >
        Trending Collections
      </Heading>
      <Flex
        direction="row"
        wrap="wrap"
        mt="20px"
        gap="5"
        justifyContent="space-evenly"
      >
        {NFT_CONTRACTS.map((item) => (
          <Link
            _hover={{
              textDecoration: "none",
              bgGradient: "linear(to-l, #FF0080, #7928CA)", // Hover gradient
              bgClip: "text",
            }}
            w={300}
            h={400}
            key={item.address}
            href={`/collection/${item.chain.id.toString()}/${item.address}`}
          >
            <Image src={item.thumbnailUrl} />
            <Text fontSize="large" mt="10px">
              {item.title}
            </Text>
          </Link>
        ))}
      </Flex>
    </Flex>
  );
}