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
  RadioGroup,
  Radio,
  Stack,
  Divider,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { NATIVE_TOKEN_ADDRESS, sendAndConfirmTransaction, prepareTransaction, prepareContractCall } from "thirdweb";
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
  // Standard auction refs
  const minBidRef = useRef<HTMLInputElement>(null);
  const buyoutRef = useRef<HTMLInputElement>(null);
  const bidBufferRef = useRef<HTMLInputElement>(null);
  const timeBufferRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  
  // Dutch auction refs
  const startPriceRef = useRef<HTMLInputElement>(null);
  const endPriceRef = useRef<HTMLInputElement>(null);
  const dutchDurationRef = useRef<HTMLInputElement>(null);
  const decayExponentRef = useRef<HTMLInputElement>(null);
  
  const { tokenId, account } = props;
  const switchChain = useSwitchActiveWalletChain();
  const activeChain = useActiveWalletChain();
  const [currency, setCurrency] = useState<Token>();
  const [auctionType, setAuctionType] = useState<"standard" | "dutch">("standard");
  const toast = useToast();

  const {
    nftContract,
    marketplaceContract,
    refetchAllAuctions,
    type,
    supportedTokens,
  } = useMarketplaceContext();
  
  // Get the contracts - standard auction is the second contract, dutch auction is the third contract
  const auctionContract = getContract({
    address: MARKETPLACE_CONTRACTS[1].address, // Standard auction (PokemonAuctionHouse)
    chain: MARKETPLACE_CONTRACTS[1].chain,
    client,
  });
  
  const dutchAuctionContract = getContract({
    address: MARKETPLACE_CONTRACTS[2].address, // Dutch auction (PokemonDutchAuction)
    chain: MARKETPLACE_CONTRACTS[2].chain,
    client,
  });
  
  const chain = auctionContract.chain;

  const nativeToken: Token = {
    tokenAddress: NATIVE_TOKEN_ADDRESS,
    symbol: chain.nativeCurrency?.symbol || "NATIVE TOKEN",
    icon: NATIVE_TOKEN_ICON_MAP[chain.id] || "",
  };

  const options: Token[] = [nativeToken].concat(supportedTokens);
  
  const startStandardAuction = async () => {
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
      operator: auctionContract.address,
    });

    if (!isApproved) {
      const setApproval = type === "ERC1155" ? setApprovalForAll1155 : setApprovalForAll721;

      const approveTx = setApproval({
        contract: nftContract,
        operator: auctionContract.address,
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
        contract: auctionContract,
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
        title: "Standard auction created successfully!",
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
  
  const startDutchAuction = async () => {
    // Validate inputs
    const startPrice = startPriceRef.current?.value;
    const endPrice = endPriceRef.current?.value;
    const duration = dutchDurationRef.current?.value;
    const decayExponent = decayExponentRef.current?.value;
    
    if (!startPrice || Number(startPrice) <= 0) {
      return toast({
        title: "Please enter a start price",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
    
    if (!endPrice || Number(endPrice) <= 0) {
      return toast({
        title: "Please enter an end price",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
    
    if (Number(startPrice) <= Number(endPrice)) {
      return toast({
        title: "Start price must be greater than end price",
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
    
    if (!decayExponent || Number(decayExponent) < 1) {
      return toast({
        title: "Decay exponent must be 1 or greater",
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

    // Check for approval
    const checkApprove = type === "ERC1155" ? isApprovedForAll1155 : isApprovedForAll721;
    
    const isApproved = await checkApprove({
      contract: nftContract,
      owner: account.address,
      operator: dutchAuctionContract.address,
    });

    if (!isApproved) {
      const setApproval = type === "ERC1155" ? setApprovalForAll1155 : setApprovalForAll721;

      const approveTx = setApproval({
        contract: nftContract,
        operator: dutchAuctionContract.address,
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
          description: "Failed to approve Dutch auction contract",
          status: "error",
          isClosable: true,
          duration: 5000,
        });
      }
    }
    
    // Convert duration to seconds for contract call
    const durationInSeconds = Number(duration) * 3600; // Convert hours to seconds
    
    // Create Dutch auction using the proper transaction preparation method
    try {
      // Prepare the transaction using the contract's write interface
      // const transaction = await dutchAuctionContract.prepare(
      //   "createDutchAuction", [
      //     nftContract.address,             // NFT contract address
      //     tokenId,                         // Token ID
      //     String(BigInt(Math.floor(Number(startPrice) * 10**18))), // Start price in wei
      //     String(BigInt(Math.floor(Number(endPrice) * 10**18))),   // End price in wei
      //     durationInSeconds,               // Duration in seconds
      //     Number(decayExponent),           // Decay exponent
      //     currency.tokenAddress,           // Currency address
      //   ]
      // );
      
      const transaction = prepareContractCall({
        contract: dutchAuctionContract,
        method: "function createDutchAuction(address nftAddress, uint256 tokenId, uint256 startPrice, uint256 endPrice, uint256 duration, uint256 decayExponent, address currency)",
        params: [
          nftContract.address,             // NFT contract address
          tokenId,                         // Token ID
          BigInt(Math.floor(Number(startPrice) * 10**18)), // Start price in wei
          BigInt(Math.floor(Number(endPrice) * 10**18)),   // End price in wei
          BigInt(durationInSeconds),               // Duration in seconds
          BigInt(decayExponent),           // Decay exponent
          currency.tokenAddress,           // Currency address
        ],
      });


      console.log("Transaction prepared:", transaction);

      await sendAndConfirmTransaction({
        transaction,
        account,
      });
      
      toast({
        title: "Dutch auction created successfully!",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      if (refetchAllAuctions) {
        refetchAllAuctions();
      }
    } catch (error) {
      console.error("Create Dutch auction error:", error);
      toast({
        title: "Failed to create Dutch auction",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        isClosable: true,
        duration: 5000,
      });
    }
  };
  
  const handleCreateAuction = () => {
    if (auctionType === "standard") {
      startStandardAuction();
    } else {
      startDutchAuction();
    }
  };

  return (
    <>
      <br />
      <Flex direction="column" w={{ base: "90vw", lg: "430px" }} gap="10px">
        <Text fontSize="xl" fontWeight="bold" mb={2}>Create Auction</Text>
        
        <FormControl mb={4}>
          <FormLabel>Auction Type</FormLabel>
          <RadioGroup onChange={(value) => setAuctionType(value as "standard" | "dutch")} value={auctionType}>
            <Stack direction="row">
              <Radio value="standard">Standard Auction</Radio>
              <Radio value="dutch">Dutch Auction</Radio>
            </Stack>
          </RadioGroup>
        </FormControl>
        
        <Divider mb={4} />
        
        {auctionType === "standard" ? (
          <>
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
          </>
        ) : (
          <>
            <FormControl>
              <FormLabel>
                <HStack>
                  <Text>Start Price</Text>
                  <Tooltip label="Initial price of the Dutch auction. This price will decrease over time.">
                    <Box><FaInfoCircle /></Box>
                  </Tooltip>
                </HStack>
              </FormLabel>
              <Input
                type="number"
                ref={startPriceRef}
                placeholder="Starting price"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>
                <HStack>
                  <Text>End Price</Text>
                  <Tooltip label="Final price of the Dutch auction. Must be lower than start price.">
                    <Box><FaInfoCircle /></Box>
                  </Tooltip>
                </HStack>
              </FormLabel>
              <Input
                type="number"
                ref={endPriceRef}
                placeholder="Ending price"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>
                <HStack>
                  <Text>Decay Exponent</Text>
                  <Tooltip label="Controls price drop rate. 1 = linear decay, >1 = faster initial drop">
                    <Box><FaInfoCircle /></Box>
                  </Tooltip>
                </HStack>
              </FormLabel>
              <Input
                type="number"
                ref={decayExponentRef}
                placeholder="Decay exponent (min: 1)"
                defaultValue="1"
                min="1"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Auction Duration (hours)</FormLabel>
              <Input
                type="number"
                ref={dutchDurationRef}
                placeholder="Auction duration in hours"
                defaultValue="24"
              />
            </FormControl>
          </>
        )}
        
        <FormControl mt={4}>
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
          onClick={handleCreateAuction}
          mt={4}
        >
          Create {auctionType === "standard" ? "Standard" : "Dutch"} Auction
        </Button>
      </Flex>
    </>
  );
}