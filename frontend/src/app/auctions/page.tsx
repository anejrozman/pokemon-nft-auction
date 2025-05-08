"use client";

import { client } from "@/consts/client";
import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import { Link } from "@chakra-ui/next-js";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Grid,
  Heading,
  HStack,
  Select,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useReadContract } from "thirdweb/react";
import { MediaRenderer } from "thirdweb/react";
import {
  type DirectListing,
  type EnglishAuction,
  getAllAuctions,
} from "thirdweb/extensions/marketplace";
import { NFT, prepareContractCall, getContract } from "thirdweb";
import { getWinningBid } from "@/helpers/0xf3ff3d85c43dc6b54f1a9223bb7eea02cadd8fba";
import { MARKETPLACE_CONTRACTS } from "@/consts/marketplace_contract";

// Define listing types
enum ListingType {
  SELL_OFFER = "Sell Offers",
  STANDARD_AUCTION = "Standard Auctions",
  DUTCH_AUCTION = "Dutch Auctions",
}

// Define trait filter structure
interface TraitFilter {
  traitType: string;
  isNumeric: boolean;
  values: {
    [key: string]: boolean;
  };
  range?: {
    min: number;
    max: number;
    currentMin: number;
    currentMax: number;
  };
}

export default function CollectionListings() {
  const {
    nftContract,
    marketplaceContract,
    allValidListings,
    refetchAllAuctions,
    isLoading,
  } = useMarketplaceContext();

  const auctionHouse = getContract({
    address: MARKETPLACE_CONTRACTS[1].address,
    chain: MARKETPLACE_CONTRACTS[1].chain,
    client,
  });

  const { data: allAuctions } = useReadContract(getAllAuctions, {
    contract: auctionHouse,
    start: 0,
  });
  // Log for debugging
  useEffect(() => {
    console.log("Available listings:", allValidListings?.length);
    console.log("Available auctions:", allAuctions?.length);
  }, [allValidListings, allAuctions]);
  const [activeTab, setActiveTab] = useState<ListingType>(
    ListingType.SELL_OFFER
  );
  const [traitFilters, setTraitFilters] = useState<TraitFilter[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<TraitFilter[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Extract all possible traits from listings for filtering
  useEffect(() => {
    if (!allValidListings && !allAuctions) return;

    // Safely collect all NFTs from both listings and auctions
    const allNfts: NFT[] = [
      ...(allValidListings?.map((listing) => listing.asset) || []),
      ...(allAuctions?.map((auction) => auction.asset) || []),
    ];

    console.log("Processing attributes for", allNfts.length, "NFTs");

    // Extract unique trait types and their values
    const traitTypes: {
      [key: string]: {
        values: Set<string>;
        isNumeric: boolean;
        min?: number;
        max?: number;
      };
    } = {};

    allNfts.forEach((nft) => {
      if (!nft.metadata || !nft.metadata.attributes) return;

      const attributes = Array.isArray(nft.metadata.attributes)
        ? nft.metadata.attributes
        : [];

      attributes.forEach((attr) => {
        if (attr && attr.trait_type && attr.value !== undefined) {
          const traitType = attr.trait_type;
          const value = attr.value;
          const stringValue = String(value);

          // Initialize if this is the first time seeing this trait
          if (!traitTypes[traitType]) {
            traitTypes[traitType] = {
              values: new Set(),
              isNumeric: !isNaN(Number(value)) && typeof value !== "boolean",
            };
          }

          // Add to values set
          traitTypes[traitType].values.add(stringValue);

          // Update min/max if numeric
          if (traitTypes[traitType].isNumeric) {
            const numValue = Number(value);

            if (!isNaN(numValue)) {
              if (
                traitTypes[traitType].min === undefined ||
                numValue < traitTypes[traitType].min
              ) {
                traitTypes[traitType].min = numValue;
              }

              if (
                traitTypes[traitType].max === undefined ||
                numValue > traitTypes[traitType].max
              ) {
                traitTypes[traitType].max = numValue;
              }
            }
          }
        }
      });
    });

    // Convert to TraitFilter format
    const filters: TraitFilter[] = Object.entries(traitTypes).map(
      ([traitType, info]) => {
        const values: { [key: string]: boolean } = {};
        info.values.forEach((value) => {
          values[value] = false;
        });

        const filter: TraitFilter = {
          traitType,
          values,
          isNumeric: info.isNumeric,
        };

        // Add range if numeric
        if (
          info.isNumeric &&
          info.min !== undefined &&
          info.max !== undefined
        ) {
          filter.range = {
            min: info.min,
            max: info.max,
            currentMin: info.min,
            currentMax: info.max,
          };
        }

        return filter;
      }
    );

    console.log("Generated filters:", filters);
    setTraitFilters(filters);
  }, [allValidListings, allAuctions]);

  // Filter listings based on selected traits
  const filteredListings = useMemo(() => {
    if (!allValidListings) return [];

    // Check if any filters are actually applied
    const hasActiveFilters = appliedFilters.some((filter) => {
      // Check if any checkbox filters are active
      const hasActiveCheckboxes = Object.values(filter.values).some(
        (isSelected) => isSelected
      );

      // Check if range filter is active
      const hasActiveRange =
        filter.isNumeric &&
        filter.range &&
        (filter.range.currentMin > filter.range.min ||
          filter.range.currentMax < filter.range.max);

      return hasActiveCheckboxes || hasActiveRange;
    });

    if (!hasActiveFilters) return allValidListings;

    return allValidListings.filter((listing) => {
      if (!listing.asset.metadata || !listing.asset.metadata.attributes)
        return false;

      const attributes = Array.isArray(listing.asset.metadata.attributes)
        ? listing.asset.metadata.attributes
        : [];

      // For each applied filter trait type
      for (const filter of appliedFilters) {
        // Get selected values for non-numeric filters
        const selectedValues = Object.entries(filter.values)
          .filter(([_, isSelected]) => isSelected)
          .map(([value]) => value);

        // Find if the NFT has this trait type
        const nftTrait = attributes.find(
          (attr) => attr.trait_type === filter.traitType
        );

        // If NFT doesn't have this trait, filter it out
        if (!nftTrait) return false;

        // For numeric traits, check range
        if (filter.isNumeric && filter.range) {
          const numValue = Number(nftTrait.value);

          if (
            isNaN(numValue) ||
            numValue < filter.range.currentMin ||
            numValue > filter.range.currentMax
          ) {
            return false;
          }
        }
        // For non-numeric traits, check against selected values if any are selected
        else if (
          selectedValues.length > 0 &&
          !selectedValues.includes(String(nftTrait.value))
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allValidListings, appliedFilters]);

  // Filter auctions based on selected traits
  const filteredAuctions = useMemo(() => {
    if (!allAuctions) return [];

    // Check if any filters are actually applied
    const hasActiveFilters = appliedFilters.some((filter) => {
      // Check if any checkbox filters are active
      const hasActiveCheckboxes = Object.values(filter.values).some(
        (isSelected) => isSelected
      );

      // Check if range filter is active
      const hasActiveRange =
        filter.isNumeric &&
        filter.range &&
        (filter.range.currentMin > filter.range.min ||
          filter.range.currentMax < filter.range.max);

      return hasActiveCheckboxes || hasActiveRange;
    });

    if (!hasActiveFilters) return allAuctions;

    return allAuctions.filter((auction) => {
      if (!auction.asset.metadata || !auction.asset.metadata.attributes)
        return false;

      const attributes = Array.isArray(auction.asset.metadata.attributes)
        ? auction.asset.metadata.attributes
        : [];

      // For each applied filter trait type
      for (const filter of appliedFilters) {
        // Get selected values for non-numeric filters
        const selectedValues = Object.entries(filter.values)
          .filter(([_, isSelected]) => isSelected)
          .map(([value]) => value);

        // Find if the NFT has this trait type
        const nftTrait = attributes.find(
          (attr) => attr.trait_type === filter.traitType
        );

        // If NFT doesn't have this trait, filter it out
        if (!nftTrait) return false;

        // For numeric traits, check range
        if (filter.isNumeric && filter.range) {
          const numValue = Number(nftTrait.value);

          if (
            isNaN(numValue) ||
            numValue < filter.range.currentMin ||
            numValue > filter.range.currentMax
          ) {
            return false;
          }
        }
        // For non-numeric traits, check against selected values if any are selected
        else if (
          selectedValues.length > 0 &&
          !selectedValues.includes(String(nftTrait.value))
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allAuctions, appliedFilters]);

  const standardAuctions = useMemo(() => {
    return (
      filteredAuctions?.filter((auction) => {
        // More reliable check for standard auctions - could be based on auction type
        return true; // Placeholder for actual condition
      }) || []
    );
  }, [filteredAuctions]);

  const dutchAuctionContract = getContract({
    address: MARKETPLACE_CONTRACTS[2].address, // Dutch auction (PokemonDutchAuction)
    chain: MARKETPLACE_CONTRACTS[2].chain,
    client,
  });

  const dutchAuctions = prepareContractCall({
    contract: dutchAuctionContract,
    method: "function getAllActiveAuctions(uint256 _startId, uint256 _endId)",
    params: [BigInt(0), BigInt(0)],
  });

  // Apply the current filter selections
  const applyFilters = () => {
    setAppliedFilters([...traitFilters]);
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = traitFilters.map((filter) => {
      if (filter.isNumeric && filter.range) {
        // Reset numeric filters to their full range
        return {
          ...filter,
          values: Object.fromEntries(
            Object.keys(filter.values).map((key) => [key, false])
          ),
          range: {
            ...filter.range,
            currentMin: filter.range.min,
            currentMax: filter.range.max,
          },
        };
      } else {
        // Reset checkbox filters
        return {
          ...filter,
          values: Object.fromEntries(
            Object.keys(filter.values).map((key) => [key, false])
          ),
        };
      }
    });

    setTraitFilters(clearedFilters);
    setAppliedFilters([]);
  };

  // Handle trait value changes for non-numeric traits
  const handleTraitValueChange = (
    traitType: string,
    value: string,
    isChecked: boolean
  ) => {
    setTraitFilters((prev) =>
      prev.map((filter) => {
        if (filter.traitType === traitType) {
          return {
            ...filter,
            values: {
              ...filter.values,
              [value]: isChecked,
            },
          };
        }
        return filter;
      })
    );
  };

  // Handle numeric range changes
  const handleRangeChange = (
    traitType: string,
    isMin: boolean,
    value: string
  ) => {
    const numValue = parseFloat(value);

    if (isNaN(numValue)) return;

    setTraitFilters((prev) =>
      prev.map((filter) => {
        if (filter.traitType === traitType && filter.range) {
          const newRange = { ...filter.range };

          if (isMin) {
            newRange.currentMin = numValue;
            // Ensure min doesn't exceed max
            if (numValue > newRange.currentMax) {
              newRange.currentMax = numValue;
            }
          } else {
            newRange.currentMax = numValue;
            // Ensure max doesn't go below min
            if (numValue < newRange.currentMin) {
              newRange.currentMin = numValue;
            }
          }

          return {
            ...filter,
            range: newRange,
          };
        }
        return filter;
      })
    );
  };

  // Render a single listing card
  const ListingCard = ({
    listing,
  }: {
    listing: DirectListing | EnglishAuction;
  }) => {
    const isAuction = listing.type === "english-auction";
    console.log("Listing:", listing);

    const listingId = isAuction ? listing.id.toString() : undefined;

    const { data: winningBid } = isAuction
      ? useReadContract(getWinningBid, {
          contract: auctionHouse,
          auctionId: listing.id,
        })
      : { data: undefined };

    return (
      <Card
        key={listingId}
        overflow="hidden"
        borderRadius="lg"
        borderWidth="1px"
        p={4}
      >
        <Link
          href={`/collection/${nftContract.chain.id}/${
            nftContract.address
          }/token/${listing.asset.id.toString()}`}
          _hover={{ textDecoration: "none" }}
        >
          <VStack spacing={3} align="stretch">
            <Box height="200px" position="relative">
              <MediaRenderer
                client={client}
                src={listing.asset.metadata.image}
                width="100%"
                height="100%"
                style={{ objectFit: "cover", borderRadius: "8px" }}
              />
            </Box>
            <Text fontWeight="bold" fontSize="lg">
              {listing.asset.metadata?.name || "Unnamed NFT"}
            </Text>

            {isAuction ? (
              <>
                {winningBid ? (
                  <Flex justify="space-between">
                    <Text fontSize="sm" color="gray.500">
                      Current Bid
                    </Text>
                    <Text fontWeight="semibold">
                      {(Number(winningBid[2]) / 10 ** 18).toFixed(4)}{" "}
                      {listing.buyoutCurrencyValue.symbol}
                    </Text>
                  </Flex>
                ) : (
                  <Flex justify="space-between">
                    <Text fontSize="sm" color="gray.500">
                      No bids yet
                    </Text>
                    <Text fontWeight="semibold">
                      {listing.minimumBidCurrencyValue.displayValue}{" "}
                      {listing.minimumBidCurrencyValue.symbol} min
                    </Text>
                  </Flex>
                )}

                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.500">
                    Buyout Price
                  </Text>
                  <Text fontWeight="semibold">
                    {listing.buyoutCurrencyValue.displayValue}{" "}
                    {listing.buyoutCurrencyValue.symbol}
                  </Text>
                </Flex>

                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.500">
                    Minimum Bid
                  </Text>
                  <Text fontWeight="semibold">
                    {listing.minimumBidCurrencyValue.displayValue}{" "}
                    {listing.minimumBidCurrencyValue.symbol}
                  </Text>
                </Flex>
              </>
            ) : (
              <Flex justify="space-between">
                <Text fontSize="sm" color="gray.500">
                  Price
                </Text>
                <Text fontWeight="semibold">
                  {listing.currencyValuePerToken.displayValue}{" "}
                  {listing.currencyValuePerToken.symbol}
                </Text>
              </Flex>
            )}

            {"endTimeInSeconds" in listing && (
              <Flex justify="space-between">
                <Text fontSize="sm" color="gray.500">
                  Ends
                </Text>
                <Text fontWeight="semibold">
                  {new Date(
                    Number(listing.endTimeInSeconds) * 1000
                  ).toLocaleString()}
                </Text>
              </Flex>
            )}
          </VStack>
        </Link>
      </Card>
    );
  };

  // Render filters section
  const renderFilters = () => {
    if (traitFilters.length === 0) return null;

    return (
      <Box mb={6} border="1px" borderColor="gray.200" borderRadius="md" p={4}>
        <Heading size="md" mb={4}>
          Filter by Traits
        </Heading>

        <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={6}>
          {traitFilters.map((filter) => (
            <Box key={filter.traitType}>
              <Heading size="sm" mb={3}>
                {filter.traitType}
              </Heading>

              {filter.isNumeric && filter.range ? (
                <VStack align="stretch" spacing={3}>
                  <Text fontSize="sm">
                    Range: {filter.range.min} - {filter.range.max}
                  </Text>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Min: {filter.range.currentMin}
                    </Text>
                    <input
                      type="range"
                      min={filter.range.min}
                      max={filter.range.max}
                      step={(filter.range.max - filter.range.min) / 100}
                      value={filter.range.currentMin}
                      onChange={(e) =>
                        handleRangeChange(
                          filter.traitType,
                          true,
                          e.target.value
                        )
                      }
                      style={{ width: "100%" }}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Max: {filter.range.currentMax}
                    </Text>
                    <input
                      type="range"
                      min={filter.range.min}
                      max={filter.range.max}
                      step={(filter.range.max - filter.range.min) / 100}
                      value={filter.range.currentMax}
                      onChange={(e) =>
                        handleRangeChange(
                          filter.traitType,
                          false,
                          e.target.value
                        )
                      }
                      style={{ width: "100%" }}
                    />
                  </Box>
                </VStack>
              ) : (
                <VStack align="start" spacing={2}>
                  {Object.entries(filter.values).map(([value, isSelected]) => (
                    <Checkbox
                      key={value}
                      isChecked={isSelected}
                      onChange={(e) =>
                        handleTraitValueChange(
                          filter.traitType,
                          value,
                          e.target.checked
                        )
                      }
                    >
                      {value}
                    </Checkbox>
                  ))}
                </VStack>
              )}
            </Box>
          ))}
        </Grid>

        <HStack mt={6} justify="flex-end">
          <Button variant="outline" onClick={clearFilters} mr={3}>
            Clear Filters
          </Button>
          <Button colorScheme="blue" onClick={applyFilters}>
            Apply Filters
          </Button>
        </HStack>
      </Box>
    );
  };

  // Display loading state
  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="300px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box p={6}>
      <Heading mb={6}>Marketplace Listings</Heading>

      {/* Filters */}
      {renderFilters()}

      {/* Tabs for different listing types */}
      <Tabs
        mt={6}
        onChange={(index) => setActiveTab(Object.values(ListingType)[index])}
      >
        <TabList>
          <Tab>{ListingType.SELL_OFFER}</Tab>
          <Tab>{ListingType.STANDARD_AUCTION}</Tab>
          <Tab>{ListingType.DUTCH_AUCTION}</Tab>
        </TabList>

        <TabPanels>
          {/* Sell Offers Tab */}
          <TabPanel>
            {filteredListings && filteredListings.length > 0 ? (
              <Grid
                templateColumns="repeat(auto-fill, minmax(250px, 1fr))"
                gap={6}
                mt={4}
              >
                {filteredListings.map((listing) => (
                  <ListingCard listing={listing} />
                ))}
              </Grid>
            ) : (
              <Box textAlign="center" p={10}>
                <Text>No sell offers available.</Text>
              </Box>
            )}
          </TabPanel>

          {/* Standard Auctions Tab */}
          <TabPanel>
            {standardAuctions && standardAuctions.length > 0 ? (
              <Grid
                templateColumns="repeat(auto-fill, minmax(250px, 1fr))"
                gap={6}
                mt={4}
              >
                {standardAuctions.map((auction) => (
                  <ListingCard listing={auction} />
                ))}
              </Grid>
            ) : (
              <Box textAlign="center" p={10}>
                <Text>No standard auctions available.</Text>
              </Box>
            )}
          </TabPanel>

          {/* Dutch Auctions Tab */}
          <TabPanel>
            {dutchAuctions && dutchAuctions.length > 0 ? (
              <Grid
                templateColumns="repeat(auto-fill, minmax(250px, 1fr))"
                gap={6}
                mt={4}
              >
                {dutchAuctions.map((auction) => (
                  <ListingCard listing={auction} />
                ))}
              </Grid>
            ) : (
              <Box textAlign="center" p={10}>
                <Text>No Dutch auctions available.</Text>
              </Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
