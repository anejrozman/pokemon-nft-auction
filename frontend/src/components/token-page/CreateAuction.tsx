import { NATIVE_TOKEN_ICON_MAP, Token } from "@/consts/supported_tokens";
import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import { CheckIcon, ChevronDownIcon } from "@chakra-ui/icons";
import {
  Button,
  Flex,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Image,
  useToast,
  Box,
  FormControl,
  FormLabel,
  HStack,
  Tooltip,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { NATIVE_TOKEN_ADDRESS, sendAndConfirmTransaction } from "thirdweb";
import {
  isApprovedForAll as isApprovedForAll1155,
  setApprovalForAll as setApprovalForAll1155,
} from "thirdweb/extensions/erc1155";
import {
  isApprovedForAll as isApprovedForAll721,
  setApprovalForAll as setApprovalForAll721,
} from "thirdweb/extensions/erc721";
import { createAuction } from "thirdweb/extensions/marketplace";
import {
  useActiveWalletChain,
  useSwitchActiveWalletChain,
} from "thirdweb/react";
import type { Account } from "thirdweb/wallets";
import { FaInfoCircle } from "react-icons/fa";
import { MARKETPLACE_CONTRACTS } from "@/consts/marketplace_contract";
import { getContract } from "thirdweb";
import { client } from "@/consts/client";

type Props = {
  tokenId: bigint;
  account: Account;
};

export function CreateAuction(props: Props) {
  const minBidRef = useRef<HTMLInputElement>(null);
  const buyoutRef = useRef<HTMLInputElement>(null);
  const bidBufferRef = useRef<HTMLInputElement>(null);
  const timeBufferRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  
  const { tokenId, account } = props;
  const switchChain = useSwitchActiveWalletChain();
  const activeChain = useActiveWalletChain();
  const [currency, setCurrency] = useState<Token>();
  const toast = useToast();

  const {
    nftContract,
    marketplaceContract,
    refetchAllAuctions,
    type,
    supportedTokens,
  } = useMarketplaceContext();
  
  // Get the auction house contract - it's the second contract in the MARKETPLACE_CONTRACTS array
  const auctionContract = getContract({
    address: MARKETPLACE_CONTRACTS[1].address, // Use the second contract (PokemonAuctionHouse)
    chain: MARKETPLACE_CONTRACTS[1].chain,
    client,
  });
  const chain = auctionContract.chain;

  const nativeToken: Token = {
    tokenAddress: NATIVE_TOKEN_ADDRESS,
    symbol: chain.nativeCurrency?.symbol || "NATIVE TOKEN",
    icon: NATIVE_TOKEN_ICON_MAP[chain.id] || "",
  };

  const options: Token[] = [nativeToken].concat(supportedTokens);
  
  const startAuction = async () => {
    // Validate inputs
    const minBid = minBidRef.current?.value;
    const buyout = buyoutRef.current?.value;
    const bidBuffer = bidBufferRef.current?.value;
    const timeBuffer = timeBufferRef.current?.value;
    const duration = durationRef.current?.value;
    
    if (!minBid || Number(minBid) <= 0) {
      return toast({
        title: "Please enter a minimum bid amount",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
    
    if (!duration || Number(duration) <= 0) {
      return toast({
        title: "Please enter a valid duration",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
    
    if (!bidBuffer || Number(bidBuffer) <= 0) {
      return toast({
        title: "Please enter a valid bid buffer percentage",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
    
    if (!timeBuffer || Number(timeBuffer) <= 0) {
      return toast({
        title: "Please enter a valid time buffer in seconds",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
    
    if (!currency) {
      return toast({
        title: "Please select a currency",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }

    // Handle chain switching if needed
    if (activeChain?.id !== nftContract.chain.id) {
      await switchChain(nftContract.chain);
    }
    
    // Handle quantity
    const _qty = BigInt(qtyRef.current?.value ?? 1);
    if (type === "ERC1155") {
      if (!_qty || _qty <= 0n) {
        return toast({
          title: "Error",
          description: "Invalid quantity",
          status: "error",
          isClosable: true,
          duration: 5000,
        });
      }
    }

    // Check for approval
    const checkApprove = type === "ERC1155" ? isApprovedForAll1155 : isApprovedForAll721;
    
    const isApproved = await checkApprove({
      contract: nftContract,
      owner: account.address,
      operator: auctionContract.address, // Use auction contract address
    });

    if (!isApproved) {
      const setApproval = type === "ERC1155" ? setApprovalForAll1155 : setApprovalForAll721;

      const approveTx = setApproval({
        contract: nftContract,
        operator: auctionContract.address, // Use auction contract address
        approved: true,
      });

      try {
        await sendAndConfirmTransaction({
          transaction: approveTx,
          account,
        });
      } catch (error) {
        console.error("Approval error:", error);
        return toast({
          title: "Approval failed",
          description: "Failed to approve auction contract",
          status: "error",
          isClosable: true,
          duration: 5000,
        });
      }
    }

    // Calculate timestamps
    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 60; // Start in 1 minute
    const endTime = now + (Number(duration) * 3600); // Convert hours to seconds
    
    // Create Date objects from timestamps
    const startTimestamp = new Date(startTime * 1000);
    const endTimestamp = new Date(endTime * 1000);
    
    // Create auction
    try {
      const transaction = createAuction({
        contract: auctionContract, // Use auction contract
        assetContractAddress: nftContract.address,
        tokenId,
        quantity: type === "ERC721" ? 1n : _qty,
        currencyContractAddress: currency.tokenAddress,
        minimumBidAmount: minBid,
        buyoutBidAmount: buyout || "0", // Optional buyout price
        timeBufferInSeconds: Number(timeBuffer),
        bidBufferBps: Number(bidBuffer) * 100, // Convert percentage to basis points
        startTimestamp,
        endTimestamp,
      });

      await sendAndConfirmTransaction({
        transaction,
        account,
      });
      
      toast({
        title: "Auction created successfully!",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      if (refetchAllAuctions) {
        refetchAllAuctions();
      }
    } catch (error) {
      console.error("Create auction error:", error);
      toast({
        title: "Failed to create auction",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        isClosable: true,
        duration: 5000,
      });
    }
  };

  return (
    <>
      <br />
      <Flex direction="column" w={{ base: "90vw", lg: "430px" }} gap="10px">
        <Text fontSize="xl" fontWeight="bold" mb={2}>Create Auction</Text>
        
        <FormControl>
          <FormLabel>Minimum Bid</FormLabel>
          <Input
            type="number"
            ref={minBidRef}
            placeholder="Minimum bid amount"
          />
        </FormControl>
        
        <FormControl>
          <FormLabel>
            <HStack>
              <Text>Buyout Price</Text>
              <Tooltip label="Optional. Bidders can immediately win the auction by bidding this amount.">
                <Box><FaInfoCircle /></Box>
              </Tooltip>
            </HStack>
          </FormLabel>
          <Input
            type="number"
            ref={buyoutRef}
            placeholder="Optional buyout price"
          />
        </FormControl>
        
        <FormControl>
          <FormLabel>
            <HStack>
              <Text>Bid Buffer (%)</Text>
              <Tooltip label="Minimum percentage a new bid must be higher than the current bid">
                <Box><FaInfoCircle /></Box>
              </Tooltip>
            </HStack>
          </FormLabel>
          <Input
            type="number"
            ref={bidBufferRef}
            placeholder="Bid increase percentage"
            defaultValue="5"
          />
        </FormControl>
        
        <FormControl>
          <FormLabel>
            <HStack>
              <Text>Time Buffer (seconds)</Text>
              <Tooltip label="Time added to auction end when a bid is placed near the end">
                <Box><FaInfoCircle /></Box>
              </Tooltip>
            </HStack>
          </FormLabel>
          <Input
            type="number"
            ref={timeBufferRef}
            placeholder="Time buffer in seconds"
            defaultValue="300"
          />
        </FormControl>
        
        <FormControl>
          <FormLabel>Auction Duration (hours)</FormLabel>
          <Input
            type="number"
            ref={durationRef}
            placeholder="Auction duration in hours"
            defaultValue="24"
          />
        </FormControl>
        
        {type === "ERC1155" && (
          <FormControl>
            <FormLabel>Quantity</FormLabel>
            <Input
              type="number"
              ref={qtyRef}
              defaultValue="1"
              placeholder="Quantity to auction"
            />
          </FormControl>
        )}
        
        <FormControl>
          <FormLabel>Currency</FormLabel>
          <Menu>
            <MenuButton minH="48px" as={Button} rightIcon={<ChevronDownIcon />}>
              {currency ? (
                <Flex direction="row">
                  <Image
                    boxSize="2rem"
                    borderRadius="full"
                    src={currency.icon}
                    mr="12px"
                  />
                  <Text my="auto">{currency.symbol}</Text>
                </Flex>
              ) : (
                "Select currency"
              )}
            </MenuButton>
            <MenuList>
              {options.map((token) => (
                <MenuItem
                  minH="48px"
                  key={token.tokenAddress}
                  onClick={() => setCurrency(token)}
                  display={"flex"}
                  flexDir={"row"}
                >
                  <Image
                    boxSize="2rem"
                    borderRadius="full"
                    src={token.icon}
                    ml="2px"
                    mr="14px"
                  />
                  <Text my="auto">{token.symbol}</Text>
                  {token.tokenAddress.toLowerCase() ===
                    currency?.tokenAddress.toLowerCase() && (
                    <CheckIcon ml="auto" />
                  )}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </FormControl>
        
        <Button
          colorScheme="purple"
          isDisabled={!currency}
          onClick={startAuction}
          mt={4}
        >
          Create Auction
        </Button>
      </Flex>
    </>
  );
} 