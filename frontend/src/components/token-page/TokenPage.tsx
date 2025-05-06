import { client } from "@/consts/client";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  Heading,
  Link,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { FaExternalLinkAlt } from "react-icons/fa";
import { balanceOf, getNFT as getERC1155, tokensClaimedEvent } from "thirdweb/extensions/erc1155";
import { getNFT as getERC721 } from "thirdweb/extensions/erc721";
import {
  MediaRenderer,
  useActiveAccount,
  useReadContract,
  useContractEvents,
} from "thirdweb/react";
import { shortenAddress } from "thirdweb/utils";
import { formatEther } from "viem";
import { NftAttributes } from "./NftAttributes";
import { CreateListing } from "./CreateListing";
import { CreateAuction } from "./CreateAuction";
import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import dynamic from "next/dynamic";
import { NftDetails } from "./NftDetails";
import { DebugAuctions } from "./DebugAuctions";
import { prepareEvent } from "thirdweb";
import { MARKETPLACE_CONTRACTS } from "@/consts/marketplace_contract";
import { getContract } from "thirdweb";
import auctionHouseAbi from "@/abi/PokemonAuctionHouse.json";
import { Abi } from "thirdweb/utils";
import React, { useEffect, useState } from "react";
import { newBidEvent } from "@/helpers/0xf3ff3d85c43dc6b54f1a9223bb7eea02cadd8fba";
import { getWinningBid } from "@/helpers/0xf3ff3d85c43dc6b54f1a9223bb7eea02cadd8fba";
const CancelListingButton = dynamic(() => import("./CancelListingButton"), {
  ssr: false,
});
const BuyFromListingButton = dynamic(() => import("./BuyFromListingButton"), {
  ssr: false,
});
const BidInAuctionButton = dynamic(() => import("./BidInAuctionButton"), {
  ssr: false,
});
const CollectAuctionButton = dynamic(() => import("./CollectAuctionButton"), {
  ssr: false,
});
const CollectAuctionPayoutButton = dynamic(() => import("./CollectAuctionPayoutButton"), {
  ssr: false,
});

type Props = {
  tokenId: bigint;
};

// Custom hook to batch winning bid requests
type WinningBid = [string, string, bigint]; // [bidder, currency, bidAmount]

function useWinningBids(auctions: any[], auctionHouse: any) {
  const [winningBids, setWinningBids] = useState<Record<string, WinningBid>>({});

  useEffect(() => {
    const fetchBids = async () => {
      const bids = await Promise.all(
        auctions.map(async (auction) => {
          const result = await auctionHouse.read.getWinningBid([auction.id]);
          return { id: auction.id.toString(), bid: result as WinningBid };
        })
      );
      
      const bidsMap = bids.reduce((acc, { id, bid }) => {
        acc[id] = bid;
        return acc;
      }, {} as Record<string, WinningBid>);
      
      setWinningBids(bidsMap);
    };

    if (auctions.length > 0) {
      fetchBids();
    }
  }, [auctions, auctionHouse]);

  return winningBids;
}

// Separate component for auction row
function AuctionRow({ 
  item, 
  account, 
  auctionHouse, 
  type,
  nft 
}: { 
  item: any; 
  account: any; 
  auctionHouse: any;
  type: string;
  nft: any;
}) {
  const createdByYou =
    item?.creatorAddress.toLowerCase() ===
    account?.address.toLowerCase();
  
  // Get winning bid for this auction
  const { data: auctionBid } = useReadContract(getWinningBid, {
    contract: auctionHouse,
    auctionId: item.id,
  });

  const isWinner = 
    auctionBid?.[0]?.toLowerCase() === 
    account?.address.toLowerCase();
  console.log("winningBid address:", auctionBid?.[0]?.toLowerCase());
  console.log("account address:", account?.address.toLowerCase());
  
  const isEnded = 
    Date.now() / 1000 > Number(item.endTimeInSeconds);
  
  console.log("Debug values:", {
    isEnded,
    isWinner,
    currentTime: Date.now() / 1000,
    endTime: Number(item.endTimeInSeconds),
    auctionBid
  });

  return (
    <Tr key={item.id.toString()}>
      <Td>
        <Text>
          {item.minimumBidCurrencyValue.displayValue} {item.currency.name}
        </Text> 
      </Td>
      <Td>
        <Text>
          {auctionBid
            ? `${formatEther(auctionBid[2])} ${item.currency.symbol || item.currency.name}`
            : "No bids"}
        </Text>
      </Td>
      {type === "ERC1155" && (
        <Td px={1}>
          <Text>{item.quantity.toString()}</Text>
        </Td>
      )}
      <Td>
        <Text>
          {isEnded 
            ? "Ended" 
            : getExpiration(item.endTimeInSeconds)}
        </Text>
      </Td>
      <Td px={1}>
        <Text>
          {createdByYou
            ? "You"
            : nft?.owner ? shortenAddress(nft.owner) : "N/A"}
        </Text>
      </Td>
      {account && (
        <Td>
          <Flex gap={2}>
            {!isEnded && !createdByYou && (
              <BidInAuctionButton
                account={account}
                auction={item}
              />
            )}
            {isEnded && isWinner && (
              <CollectAuctionButton
                account={account}
                auction={item}
              />
            )}
            {isEnded && createdByYou && (
              <CollectAuctionPayoutButton
                account={account}
                auction={item}
              />
            )}
          </Flex>
        </Td>
      )}
    </Tr>
  );
}

export function Token(props: Props) {
  const {
    type,
    nftContract,
    allAuctions,
    isLoading,
    contractMetadata,
    isRefetchingAllListings,
    listingsInSelectedCollection,
    auctionsInSelectedCollection,
    refetchAllAuctions,
  } = useMarketplaceContext();
  const { tokenId } = props;
  const account = useActiveAccount();

  const { data: nft, isLoading: isLoadingNFT } = useReadContract(
    type === "ERC1155" ? getERC1155 : getERC721,
    {
      tokenId: BigInt(tokenId),
      contract: nftContract,
      includeOwner: true,
    }
  );

  const { data: ownedQuantity1155 } = useReadContract(balanceOf, {
    contract: nftContract,
    owner: account?.address!,
    tokenId: tokenId,
    queryOptions: {
      enabled: !!account?.address && type === "ERC1155",
    },
  });

  const listings = (listingsInSelectedCollection || []).filter(
    (item) =>
      item.assetContractAddress.toLowerCase() ===
        nftContract.address.toLowerCase() && item.asset.id === BigInt(tokenId)
  );

  // Convert tokenId to string for comparison to handle different data types
  const tokenIdString = tokenId.toString();
  
  // Add console logs to help debug auction data
  console.log("All auctions in collection:", auctionsInSelectedCollection);
  
  const auctions = (auctionsInSelectedCollection || []).filter(
    (item) => {
      // Log each item's tokenId for debugging
      console.log("Auction tokenId:", item.tokenId?.toString(), "Looking for:", tokenIdString);
      
      return item.assetContractAddress?.toLowerCase() ===
        nftContract.address.toLowerCase() && 
        (item.tokenId?.toString() === tokenIdString || 
         item.tokenId === BigInt(tokenId));
    }
  );
  
  console.log("Filtered auctions:", auctions);

  const allLoaded = !isLoadingNFT && !isLoading && !isRefetchingAllListings;

  const ownedByYou =
    nft?.owner?.toLowerCase() === account?.address.toLowerCase();

  // Get auction house contract
  const auctionHouse = getContract({
    address: MARKETPLACE_CONTRACTS[1].address,
    chain: MARKETPLACE_CONTRACTS[1].chain,
    client,
    abi: auctionHouseAbi.abi as Abi,
  });

  const { data: events } = useContractEvents({
    contract: auctionHouse,
    events: [newBidEvent({ bidder: account?.address })],
  });
  
  
  // Watch for changes in events
  useEffect(() => {
    if (events?.length) {
      console.log("New bid events:", events);
      if (refetchAllAuctions) {
        refetchAllAuctions();
      }
    }
  }, [events, refetchAllAuctions]);

  // Use batch read for winning bids
  const { data: winningBid } = useReadContract(getWinningBid, {
    contract: auctionHouse,
    auctionId: auctions[0]?.id,
    queryOptions: {
      enabled: auctions.length > 0,
    }
  });

  console.log("Winning bid:", winningBid);

  return (
    <Flex direction="column">
      <Box mt="24px" mx="auto">
        <Flex
          direction={{ lg: "row", base: "column" }}
          justifyContent={{ lg: "center", base: "space-between" }}
          gap={{ lg: 20, base: 5 }}
        >
          <Flex direction="column" w={{ lg: "45vw", base: "90vw" }} gap="5">
            <MediaRenderer
              client={client}
              src={nft?.metadata.image}
              style={{ width: "max-content", height: "auto", aspectRatio: "1" }}
            />
            <Accordion allowMultiple defaultIndex={[0, 1, 2]}>
              {nft?.metadata.description && (
                <AccordionItem>
                  <Text>
                    <AccordionButton>
                      <Box as="span" flex="1" textAlign="left">
                        Description
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </Text>
                  <AccordionPanel pb={4}>
                    <Text>{nft.metadata.description}</Text>
                  </AccordionPanel>
                </AccordionItem>
              )}

              {nft?.metadata?.attributes &&
                // @ts-ignore TODO FIx later
                nft?.metadata?.attributes.length > 0 && (
                  <NftAttributes attributes={nft.metadata.attributes} />
                )}

              {nft && <NftDetails nft={nft} />}
            </Accordion>
          </Flex>
          <Box w={{ lg: "45vw", base: "90vw" }}>
            <Text>Collection</Text>
            <Flex direction="row" gap="3">
              <Heading>{contractMetadata?.name}</Heading>
              <Link
                color="gray"
                href={`/collection/${nftContract.chain.id}/${nftContract.address}`}
              >
                <FaExternalLinkAlt size={20} />
              </Link>
            </Flex>
            <br />
            <Text># {nft?.id.toString()}</Text>
            <Heading>{nft?.metadata.name}</Heading>
            <br />
            {type === "ERC1155" ? (
              <>
                {account && ownedQuantity1155 && (
                  <>
                    <Text>You own</Text>
                    <Heading>{ownedQuantity1155.toString()}</Heading>
                  </>
                )}
              </>
            ) : (
              <>
                <Text>Current owner</Text>
                <Flex direction="row">
                  <Heading>
                    {nft?.owner ? shortenAddress(nft.owner) : "N/A"}{" "}
                  </Heading>
                  {ownedByYou && <Text color="gray">(You)</Text>}
                </Flex>
              </>
            )}
            {account &&
              nft &&
              (ownedByYou || (ownedQuantity1155 && ownedQuantity1155 > 0n)) && (
                <>
                  <CreateListing tokenId={nft?.id} account={account} />
                  <CreateAuction tokenId={nft?.id} account={account} />
                </>
              )}
            <Accordion
              mt="30px"
              sx={{ container: {} }}
              defaultIndex={[0, 1]}
              allowMultiple
            >
              <AccordionItem>
                <Text>
                  <AccordionButton>
                    <Box as="span" flex="1" textAlign="left">
                      Listings ({listings.length})
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </Text>
                <AccordionPanel pb={4}>
                  {listings.length > 0 ? (
                    <TableContainer>
                      <Table
                        variant="simple"
                        sx={{ "th, td": { borderBottom: "none" } }}
                      >
                        <Thead>
                          <Tr>
                            <Th>Price</Th>
                            {type === "ERC1155" && <Th px={1}>Qty</Th>}
                            <Th>Expiration</Th>
                            <Th px={1}>From</Th>
                            <Th>{""}</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {listings.map((item) => {
                            const listedByYou =
                              item.creatorAddress.toLowerCase() ===
                              account?.address.toLowerCase();
                            return (
                              <Tr key={item.id.toString()}>
                                <Td>
                                  <Text>
                                    {item.currencyValuePerToken.displayValue}{" "}
                                    {item.currencyValuePerToken.symbol}
                                  </Text>
                                </Td>
                                {type === "ERC1155" && (
                                  <Td px={1}>
                                    <Text>{item.quantity.toString()}</Text>
                                  </Td>
                                )}
                                <Td>
                                  <Text>
                                    {getExpiration(item.endTimeInSeconds)}
                                  </Text>
                                </Td>
                                <Td px={1}>
                                  <Text>
                                    {item.creatorAddress.toLowerCase() ===
                                    account?.address.toLowerCase()
                                      ? "You" :
                                      nft?.owner ? shortenAddress(nft.owner) : "N/A"}
                                      </Text>
                                </Td>
                                {account && (
                                  <Td>
                                    {!listedByYou ? (
                                      <BuyFromListingButton
                                        account={account}
                                        listing={item}
                                      />
                                    ) : (
                                      <CancelListingButton
                                        account={account}
                                        listingId={item.id}
                                      />
                                    )}
                                  </Td>
                                )}
                              </Tr>
                            );
                          })}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Text>This item is not listed for sale</Text>
                  )}
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem>
                <Text>
                  <AccordionButton>
                    <Box as="span" flex="1" textAlign="left">
                      Auctions ({auctions.length})
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </Text>
                <AccordionPanel pb={4}>
                  {auctions.length > 0 ? (
                    <TableContainer>
                      <Table
                        variant="simple"
                        sx={{ "th, td": { borderBottom: "none" } }}
                      >
                        <Thead>
                          <Tr>
                            <Th>Min Bid</Th>
                            <Th>Current Bid</Th>
                            {type === "ERC1155" && <Th px={1}>Qty</Th>}
                            <Th>Ends In</Th>
                            <Th px={1}>From</Th>
                            <Th>{""}</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {auctions.map((item) => (
                            <AuctionRow
                              key={item.id.toString()}
                              item={item}
                              account={account}
                              auctionHouse={auctionHouse}
                              type={type}
                              nft={nft}
                            />
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Text>No auctions found for this NFT</Text>
                  )}
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Box>
        </Flex>
      </Box>
      
      {/* Add debug panel for development */}
      <DebugAuctions />
    </Flex>
  );
}

function getExpiration(endTimeInSeconds: bigint) {
  // Fix: endTimeInSeconds is an absolute Unix timestamp in seconds. Convert to milliseconds.
  const milliseconds: bigint = endTimeInSeconds * 1000n;

  // Fix: Create the Date object directly from the timestamp milliseconds.
  const futureDate = new Date(Number(milliseconds)); 

  // Check if the date is valid before formatting
  if (isNaN(futureDate.getTime())) {
    return "Invalid Date"; 
  }

  // Format the future date
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit", // Add minutes for better precision
    timeZoneName: "short",
  };
  const formattedDate = futureDate.toLocaleDateString("en-US", options);
  return formattedDate;
}
