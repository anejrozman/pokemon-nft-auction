"use client";

import { client } from "@/consts/client";
import { useGetENSAvatar } from "@/hooks/useGetENSAvatar";
import { useGetENSName } from "@/hooks/useGetENSName";
import { Link } from "@chakra-ui/next-js";
import {
  Box,
  Button,
  Flex,
  Heading,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Image,
  Text,
  useColorMode,
  VStack,
} from "@chakra-ui/react";
import { blo } from "blo";
import { FaRegMoon } from "react-icons/fa";
import { FiUser } from "react-icons/fi";
import { IoSunny } from "react-icons/io5";
import {
  ConnectButton,
  useActiveAccount,
  useActiveWallet,
  useDisconnect,
} from "thirdweb/react";
import type { Wallet } from "thirdweb/wallets";
import { SideMenu } from "./SideMenu";

export function Navbar() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { colorMode } = useColorMode();
  return (
    <Box py="30px" px={{ base: "20px", lg: "50px" }}>
      <Flex direction="row" justifyContent="space-between">
        <VStack align="flex-start" spacing={0}>
          <Heading
            as={Link}
            href="/"
            bgGradient="linear(to-l, #7928CA, #FF0080)"
            bgClip="text"
            fontWeight="extrabold"
            _hover={{
              textDecoration: "underline",
              bgGradient: "linear(to-l, #FF0080, #7928CA)", // Hover gradient
            }}
          >
            POKÉMARKET
          </Heading>
          <Text 
            fontSize="sm" 
            color="gray.500"
            fontStyle="italic"
          >
            Collect, Trade, and make each other jealous with Pokémon NFTs
          </Text>
        </VStack>
        <Flex direction="row" alignItems="center" gap={4} display={{ lg: "flex", base: "none" }}>
            {/* Mint button */}
            <Button
              as={Link}
              href="/cardsets"
              fontWeight="bold"
              bgGradient="linear(to-l, #7928CA, #FF0080)"
              color="white"
              _hover={{
                bgGradient: "linear(to-l, #FF0080, #7928CA)",
                transform: "translateY(-2px)",
              }}
              _active={{
                transform: "translateY(0)",
              }}
              transition="all 0.2s"
              size="md"
              borderRadius="md"
            >
              Mint
            </Button>
            
            {/* Auctions button */}
            <Button
              as={Link}
              href="/auctions"
              fontWeight="bold"
              bgGradient="linear(to-l, #7928CA, #FF0080)"
              color="white"
              _hover={{
                bgGradient: "linear(to-l, #FF0080, #7928CA)",
                transform: "translateY(-2px)",
              }}
              _active={{
                transform: "translateY(0)",
              }}
              transition="all 0.2s"
              size="md"
              borderRadius="md"
            >
              Auctions
            </Button>

            
          {account && wallet ? (
            <ProfileButton address={account.address} wallet={wallet} />
          ) : (
            <ConnectButton
              client={client}
              theme={colorMode}
              connectButton={{ style: { height: "56px" } }}
            />
          )}
        </Flex>
        <SideMenu />
      </Flex>
    </Box>
  );
}

function ProfileButton({
  address,
  wallet,
}: {
  address: string;
  wallet: Wallet;
}) {
  const { disconnect } = useDisconnect();
  const { data: ensName } = useGetENSName({ address });
  const { data: ensAvatar } = useGetENSAvatar({ ensName });
  const { colorMode } = useColorMode();
  return (
    <Menu>
      <MenuButton as={Button} height="56px">
        <Flex direction="row" gap="5">
          <Box my="auto">
            <FiUser size={30} />
          </Box>
          <Image
            src={ensAvatar ?? blo(address as `0x${string}`)}
            height="40px"
            rounded="8px"
          />
        </Flex>
      </MenuButton>
      <MenuList>
        <MenuItem display="flex">
          <Box mx="auto">
            <ConnectButton client={client} theme={colorMode} />
          </Box>
        </MenuItem>
        <MenuItem as={Link} href="/profile" _hover={{ textDecoration: "none" }}>
          Profile {ensName ? `(${ensName})` : ""}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (wallet) disconnect(wallet);
          }}
        >
          Logout
        </MenuItem>
      </MenuList>
    </Menu>
  );
}