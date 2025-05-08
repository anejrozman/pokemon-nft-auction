import {
  prepareEvent,
  prepareContractCall,
  readContract,
  type BaseTransactionOptions,
  type AbiParameterToPrimitiveType,
} from "thirdweb";

/**
 * Contract events
 */

/**
 * Represents the filters for the "AuctionClosed" event.
 */
export type AuctionClosedEventFilters = Partial<{
  auctionId: AbiParameterToPrimitiveType<{
    indexed: true;
    internalType: "uint256";
    name: "auctionId";
    type: "uint256";
  }>;
  assetContract: AbiParameterToPrimitiveType<{
    indexed: true;
    internalType: "address";
    name: "assetContract";
    type: "address";
  }>;
  closer: AbiParameterToPrimitiveType<{
    indexed: true;
    internalType: "address";
    name: "closer";
    type: "address";
  }>;
}>;

/**
 * Creates an event object for the AuctionClosed event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { auctionClosedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  auctionClosedEvent({
 *  auctionId: ...,
 *  assetContract: ...,
 *  closer: ...,
 * })
 * ],
 * });
 * ```
 */
export function auctionClosedEvent(filters: AuctionClosedEventFilters = {}) {
  return prepareEvent({
    signature:
      "event AuctionClosed(uint256 indexed auctionId, address indexed assetContract, address indexed closer, uint256 tokenId, address auctionCreator, address winningBidder)",
    filters,
  });
}

/**
 * Represents the filters for the "CancelledAuction" event.
 */
export type CancelledAuctionEventFilters = Partial<{
  auctionCreator: AbiParameterToPrimitiveType<{
    indexed: true;
    internalType: "address";
    name: "auctionCreator";
    type: "address";
  }>;
  auctionId: AbiParameterToPrimitiveType<{
    indexed: true;
    internalType: "uint256";
    name: "auctionId";
    type: "uint256";
  }>;
}>;

/**
 * Creates an event object for the CancelledAuction event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { cancelledAuctionEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  cancelledAuctionEvent({
 *  auctionCreator: ...,
 *  auctionId: ...,
 * })
 * ],
 * });
 * ```
 */
export function cancelledAuctionEvent(
  filters: CancelledAuctionEventFilters = {}
) {
  return prepareEvent({
    signature:
      "event CancelledAuction(address indexed auctionCreator, uint256 indexed auctionId)",
    filters,
  });
}

/**
 * Represents the filters for the "NewAuction" event.
 */
export type NewAuctionEventFilters = Partial<{
  auctionCreator: AbiParameterToPrimitiveType<{
    indexed: true;
    internalType: "address";
    name: "auctionCreator";
    type: "address";
  }>;
  auctionId: AbiParameterToPrimitiveType<{
    indexed: true;
    internalType: "uint256";
    name: "auctionId";
    type: "uint256";
  }>;
  assetContract: AbiParameterToPrimitiveType<{
    indexed: true;
    internalType: "address";
    name: "assetContract";
    type: "address";
  }>;
}>;

/**
 * Creates an event object for the NewAuction event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { newAuctionEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  newAuctionEvent({
 *  auctionCreator: ...,
 *  auctionId: ...,
 *  assetContract: ...,
 * })
 * ],
 * });
 * ```
 */
export function newAuctionEvent(filters: NewAuctionEventFilters = {}) {
  return prepareEvent({
    signature:
      "event NewAuction(address indexed auctionCreator, uint256 indexed auctionId, address indexed assetContract, (uint256 auctionId, uint256 tokenId, uint256 quantity, uint256 minimumBidAmount, uint256 buyoutBidAmount, uint64 timeBufferInSeconds, uint64 bidBufferBps, uint64 startTimestamp, uint64 endTimestamp, address auctionCreator, address assetContract, address currency, uint8 tokenType, uint8 status) auction)",
    filters,
  });
}

/**
 * Represents the filters for the "NewBid" event.
 */
export type NewBidEventFilters = Partial<{
  auctionId: AbiParameterToPrimitiveType<{
    indexed: true;
    internalType: "uint256";
    name: "auctionId";
    type: "uint256";
  }>;
  bidder: AbiParameterToPrimitiveType<{
    indexed: true;
    internalType: "address";
    name: "bidder";
    type: "address";
  }>;
  assetContract: AbiParameterToPrimitiveType<{
    indexed: true;
    internalType: "address";
    name: "assetContract";
    type: "address";
  }>;
}>;

/**
 * Creates an event object for the NewBid event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { newBidEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  newBidEvent({
 *  auctionId: ...,
 *  bidder: ...,
 *  assetContract: ...,
 * })
 * ],
 * });
 * ```
 */
export function newBidEvent(filters: NewBidEventFilters = {}) {
  return prepareEvent({
    signature:
      "event NewBid(uint256 indexed auctionId, address indexed bidder, address indexed assetContract, uint256 bidAmount, (uint256 auctionId, uint256 tokenId, uint256 quantity, uint256 minimumBidAmount, uint256 buyoutBidAmount, uint64 timeBufferInSeconds, uint64 bidBufferBps, uint64 startTimestamp, uint64 endTimestamp, address auctionCreator, address assetContract, address currency, uint8 tokenType, uint8 status) auction)",
    filters,
  });
}

/**
 * Represents the filters for the "OwnershipTransferred" event.
 */
export type OwnershipTransferredEventFilters = Partial<{
  previousOwner: AbiParameterToPrimitiveType<{
    indexed: true;
    internalType: "address";
    name: "previousOwner";
    type: "address";
  }>;
  newOwner: AbiParameterToPrimitiveType<{
    indexed: true;
    internalType: "address";
    name: "newOwner";
    type: "address";
  }>;
}>;

/**
 * Creates an event object for the OwnershipTransferred event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { ownershipTransferredEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  ownershipTransferredEvent({
 *  previousOwner: ...,
 *  newOwner: ...,
 * })
 * ],
 * });
 * ```
 */
export function ownershipTransferredEvent(
  filters: OwnershipTransferredEventFilters = {}
) {
  return prepareEvent({
    signature:
      "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
    filters,
  });
}

/**
 * Creates an event object for the Paused event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { pausedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  pausedEvent()
 * ],
 * });
 * ```
 */
export function pausedEvent() {
  return prepareEvent({
    signature: "event Paused(address account)",
  });
}

/**
 * Creates an event object for the Unpaused event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { unpausedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  unpausedEvent()
 * ],
 * });
 * ```
 */
export function unpausedEvent() {
  return prepareEvent({
    signature: "event Unpaused(address account)",
  });
}

/**
 * Contract read functions
 */

/**
 * Calls the "NATIVE_TOKEN" function on the contract.
 * @param options - The options for the NATIVE_TOKEN function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { NATIVE_TOKEN } from "TODO";
 *
 * const result = await NATIVE_TOKEN();
 *
 * ```
 */
export async function NATIVE_TOKEN(options: BaseTransactionOptions) {
  return readContract({
    contract: options.contract,
    method: [
      "0x31f7d964",
      [],
      [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
    ],
    params: [],
  });
}

/**
 * Represents the parameters for the "getAllAuctions" function.
 */
export type GetAllAuctionsParams = {
  startId: AbiParameterToPrimitiveType<{
    internalType: "uint256";
    name: "_startId";
    type: "uint256";
  }>;
  endId: AbiParameterToPrimitiveType<{
    internalType: "uint256";
    name: "_endId";
    type: "uint256";
  }>;
};

/**
 * Calls the "getAllAuctions" function on the contract.
 * @param options - The options for the getAllAuctions function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getAllAuctions } from "TODO";
 *
 * const result = await getAllAuctions({
 *  startId: ...,
 *  endId: ...,
 * });
 *
 * ```
 */
export async function getAllAuctions(
  options: BaseTransactionOptions<GetAllAuctionsParams>
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xc291537c",
      [
        {
          internalType: "uint256",
          name: "_startId",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "_endId",
          type: "uint256",
        },
      ],
      [
        {
          components: [
            {
              internalType: "uint256",
              name: "auctionId",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "tokenId",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "quantity",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "minimumBidAmount",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "buyoutBidAmount",
              type: "uint256",
            },
            {
              internalType: "uint64",
              name: "timeBufferInSeconds",
              type: "uint64",
            },
            {
              internalType: "uint64",
              name: "bidBufferBps",
              type: "uint64",
            },
            {
              internalType: "uint64",
              name: "startTimestamp",
              type: "uint64",
            },
            {
              internalType: "uint64",
              name: "endTimestamp",
              type: "uint64",
            },
            {
              internalType: "address",
              name: "auctionCreator",
              type: "address",
            },
            {
              internalType: "address",
              name: "assetContract",
              type: "address",
            },
            {
              internalType: "address",
              name: "currency",
              type: "address",
            },
            {
              internalType: "enum IEnglishAuctions.TokenType",
              name: "tokenType",
              type: "uint8",
            },
            {
              internalType: "enum IEnglishAuctions.Status",
              name: "status",
              type: "uint8",
            },
          ],
          internalType: "struct IEnglishAuctions.Auction[]",
          name: "auctions",
          type: "tuple[]",
        },
      ],
    ],
    params: [options.startId, options.endId],
  });
}

/**
 * Represents the parameters for the "getAllValidAuctions" function.
 */
export type GetAllValidAuctionsParams = {
  startId: AbiParameterToPrimitiveType<{
    internalType: "uint256";
    name: "_startId";
    type: "uint256";
  }>;
  endId: AbiParameterToPrimitiveType<{
    internalType: "uint256";
    name: "_endId";
    type: "uint256";
  }>;
};

/**
 * Calls the "getAllValidAuctions" function on the contract.
 * @param options - The options for the getAllValidAuctions function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getAllValidAuctions } from "TODO";
 *
 * const result = await getAllValidAuctions({
 *  startId: ...,
 *  endId: ...,
 * });
 *
 * ```
 */
export async function getAllValidAuctions(
  options: BaseTransactionOptions<GetAllValidAuctionsParams>
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x7b063801",
      [
        {
          internalType: "uint256",
          name: "_startId",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "_endId",
          type: "uint256",
        },
      ],
      [
        {
          components: [
            {
              internalType: "uint256",
              name: "auctionId",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "tokenId",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "quantity",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "minimumBidAmount",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "buyoutBidAmount",
              type: "uint256",
            },
            {
              internalType: "uint64",
              name: "timeBufferInSeconds",
              type: "uint64",
            },
            {
              internalType: "uint64",
              name: "bidBufferBps",
              type: "uint64",
            },
            {
              internalType: "uint64",
              name: "startTimestamp",
              type: "uint64",
            },
            {
              internalType: "uint64",
              name: "endTimestamp",
              type: "uint64",
            },
            {
              internalType: "address",
              name: "auctionCreator",
              type: "address",
            },
            {
              internalType: "address",
              name: "assetContract",
              type: "address",
            },
            {
              internalType: "address",
              name: "currency",
              type: "address",
            },
            {
              internalType: "enum IEnglishAuctions.TokenType",
              name: "tokenType",
              type: "uint8",
            },
            {
              internalType: "enum IEnglishAuctions.Status",
              name: "status",
              type: "uint8",
            },
          ],
          internalType: "struct IEnglishAuctions.Auction[]",
          name: "validAuctions",
          type: "tuple[]",
        },
      ],
    ],
    params: [options.startId, options.endId],
  });
}

/**
 * Represents the parameters for the "getAuction" function.
 */
export type GetAuctionParams = {
  auctionId: AbiParameterToPrimitiveType<{
    internalType: "uint256";
    name: "_auctionId";
    type: "uint256";
  }>;
};

/**
 * Calls the "getAuction" function on the contract.
 * @param options - The options for the getAuction function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getAuction } from "TODO";
 *
 * const result = await getAuction({
 *  auctionId: ...,
 * });
 *
 * ```
 */
export async function getAuction(
  options: BaseTransactionOptions<GetAuctionParams>
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x78bd7935",
      [
        {
          internalType: "uint256",
          name: "_auctionId",
          type: "uint256",
        },
      ],
      [
        {
          components: [
            {
              internalType: "uint256",
              name: "auctionId",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "tokenId",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "quantity",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "minimumBidAmount",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "buyoutBidAmount",
              type: "uint256",
            },
            {
              internalType: "uint64",
              name: "timeBufferInSeconds",
              type: "uint64",
            },
            {
              internalType: "uint64",
              name: "bidBufferBps",
              type: "uint64",
            },
            {
              internalType: "uint64",
              name: "startTimestamp",
              type: "uint64",
            },
            {
              internalType: "uint64",
              name: "endTimestamp",
              type: "uint64",
            },
            {
              internalType: "address",
              name: "auctionCreator",
              type: "address",
            },
            {
              internalType: "address",
              name: "assetContract",
              type: "address",
            },
            {
              internalType: "address",
              name: "currency",
              type: "address",
            },
            {
              internalType: "enum IEnglishAuctions.TokenType",
              name: "tokenType",
              type: "uint8",
            },
            {
              internalType: "enum IEnglishAuctions.Status",
              name: "status",
              type: "uint8",
            },
          ],
          internalType: "struct IEnglishAuctions.Auction",
          name: "auction",
          type: "tuple",
        },
      ],
    ],
    params: [options.auctionId],
  });
}

/**
 * Represents the parameters for the "getWinningBid" function.
 */
export type GetWinningBidParams = {
  auctionId: AbiParameterToPrimitiveType<{
    internalType: "uint256";
    name: "_auctionId";
    type: "uint256";
  }>;
};

/**
 * Calls the "getWinningBid" function on the contract.
 * @param options - The options for the getWinningBid function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getWinningBid } from "TODO";
 *
 * const result = await getWinningBid({
 *  auctionId: ...,
 * });
 *
 * ```
 */
export async function getWinningBid(
  options: BaseTransactionOptions<GetWinningBidParams>
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x6891939d",
      [
        {
          internalType: "uint256",
          name: "_auctionId",
          type: "uint256",
        },
      ],
      [
        {
          internalType: "address",
          name: "bidder",
          type: "address",
        },
        {
          internalType: "address",
          name: "currency",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "bidAmount",
          type: "uint256",
        },
      ],
    ],
    params: [options.auctionId],
  });
}

/**
 * Represents the parameters for the "isAuctionExpired" function.
 */
export type IsAuctionExpiredParams = {
  auctionId: AbiParameterToPrimitiveType<{
    internalType: "uint256";
    name: "_auctionId";
    type: "uint256";
  }>;
};

/**
 * Calls the "isAuctionExpired" function on the contract.
 * @param options - The options for the isAuctionExpired function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { isAuctionExpired } from "TODO";
 *
 * const result = await isAuctionExpired({
 *  auctionId: ...,
 * });
 *
 * ```
 */
export async function isAuctionExpired(
  options: BaseTransactionOptions<IsAuctionExpiredParams>
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x1389b117",
      [
        {
          internalType: "uint256",
          name: "_auctionId",
          type: "uint256",
        },
      ],
      [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
    ],
    params: [options.auctionId],
  });
}

/**
 * Represents the parameters for the "isNewWinningBid" function.
 */
export type IsNewWinningBidParams = {
  auctionId: AbiParameterToPrimitiveType<{
    internalType: "uint256";
    name: "_auctionId";
    type: "uint256";
  }>;
  bidAmount: AbiParameterToPrimitiveType<{
    internalType: "uint256";
    name: "_bidAmount";
    type: "uint256";
  }>;
};

/**
 * Calls the "isNewWinningBid" function on the contract.
 * @param options - The options for the isNewWinningBid function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { isNewWinningBid } from "TODO";
 *
 * const result = await isNewWinningBid({
 *  auctionId: ...,
 *  bidAmount: ...,
 * });
 *
 * ```
 */
export async function isNewWinningBid(
  options: BaseTransactionOptions<IsNewWinningBidParams>
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x2eb566bd",
      [
        {
          internalType: "uint256",
          name: "_auctionId",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "_bidAmount",
          type: "uint256",
        },
      ],
      [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
    ],
    params: [options.auctionId, options.bidAmount],
  });
}

/**
 * Calls the "marketplaceFeeBps" function on the contract.
 * @param options - The options for the marketplaceFeeBps function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { marketplaceFeeBps } from "TODO";
 *
 * const result = await marketplaceFeeBps();
 *
 * ```
 */
export async function marketplaceFeeBps(options: BaseTransactionOptions) {
  return readContract({
    contract: options.contract,
    method: [
      "0xd3929c8a",
      [],
      [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
    ],
    params: [],
  });
}

/**
 * Represents the parameters for the "onERC721Received" function.
 */
export type OnERC721ReceivedParams = {
  arg_0: AbiParameterToPrimitiveType<{
    internalType: "address";
    name: "";
    type: "address";
  }>;
  arg_1: AbiParameterToPrimitiveType<{
    internalType: "address";
    name: "";
    type: "address";
  }>;
  arg_2: AbiParameterToPrimitiveType<{
    internalType: "uint256";
    name: "";
    type: "uint256";
  }>;
  arg_3: AbiParameterToPrimitiveType<{
    internalType: "bytes";
    name: "";
    type: "bytes";
  }>;
};

/**
 * Calls the "onERC721Received" function on the contract.
 * @param options - The options for the onERC721Received function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { onERC721Received } from "TODO";
 *
 * const result = await onERC721Received({
 *  arg_0: ...,
 *  arg_1: ...,
 *  arg_2: ...,
 *  arg_3: ...,
 * });
 *
 * ```
 */
export async function onERC721Received(
  options: BaseTransactionOptions<OnERC721ReceivedParams>
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x150b7a02",
      [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
        {
          internalType: "address",
          name: "",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
        {
          internalType: "bytes",
          name: "",
          type: "bytes",
        },
      ],
      [
        {
          internalType: "bytes4",
          name: "",
          type: "bytes4",
        },
      ],
    ],
    params: [options.arg_0, options.arg_1, options.arg_2, options.arg_3],
  });
}

/**
 * Calls the "owner" function on the contract.
 * @param options - The options for the owner function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { owner } from "TODO";
 *
 * const result = await owner();
 *
 * ```
 */
export async function owner(options: BaseTransactionOptions) {
  return readContract({
    contract: options.contract,
    method: [
      "0x8da5cb5b",
      [],
      [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
    ],
    params: [],
  });
}

/**
 * Calls the "paused" function on the contract.
 * @param options - The options for the paused function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { paused } from "TODO";
 *
 * const result = await paused();
 *
 * ```
 */
export async function paused(options: BaseTransactionOptions) {
  return readContract({
    contract: options.contract,
    method: [
      "0x5c975abb",
      [],
      [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
    ],
    params: [],
  });
}

/**
 * Calls the "platformFeeRecipient" function on the contract.
 * @param options - The options for the platformFeeRecipient function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { platformFeeRecipient } from "TODO";
 *
 * const result = await platformFeeRecipient();
 *
 * ```
 */
export async function platformFeeRecipient(options: BaseTransactionOptions) {
  return readContract({
    contract: options.contract,
    method: [
      "0xeb13554f",
      [],
      [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
    ],
    params: [],
  });
}

/**
 * Represents the parameters for the "supportsInterface" function.
 */
export type SupportsInterfaceParams = {
  interfaceId: AbiParameterToPrimitiveType<{
    internalType: "bytes4";
    name: "interfaceId";
    type: "bytes4";
  }>;
};

/**
 * Calls the "supportsInterface" function on the contract.
 * @param options - The options for the supportsInterface function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { supportsInterface } from "TODO";
 *
 * const result = await supportsInterface({
 *  interfaceId: ...,
 * });
 *
 * ```
 */
export async function supportsInterface(
  options: BaseTransactionOptions<SupportsInterfaceParams>
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x01ffc9a7",
      [
        {
          internalType: "bytes4",
          name: "interfaceId",
          type: "bytes4",
        },
      ],
      [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
    ],
    params: [options.interfaceId],
  });
}

/**
 * Calls the "totalAuctions" function on the contract.
 * @param options - The options for the totalAuctions function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { totalAuctions } from "TODO";
 *
 * const result = await totalAuctions();
 *
 * ```
 */
export async function totalAuctions(options: BaseTransactionOptions) {
  return readContract({
    contract: options.contract,
    method: [
      "0x16002f4a",
      [],
      [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
    ],
    params: [],
  });
}

/**
 * Contract write functions
 */

/**
 * Represents the parameters for the "bidInAuction" function.
 */
export type BidInAuctionParams = {
  auctionId: AbiParameterToPrimitiveType<{
    internalType: "uint256";
    name: "_auctionId";
    type: "uint256";
  }>;
  bidAmount: AbiParameterToPrimitiveType<{
    internalType: "uint256";
    name: "_bidAmount";
    type: "uint256";
  }>;
};

/**
 * Calls the "bidInAuction" function on the contract.
 * @param options - The options for the "bidInAuction" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { bidInAuction } from "TODO";
 *
 * const transaction = bidInAuction({
 *  auctionId: ...,
 *  bidAmount: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function bidInAuction(
  options: BaseTransactionOptions<BidInAuctionParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x0858e5ad",
      [
        {
          internalType: "uint256",
          name: "_auctionId",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "_bidAmount",
          type: "uint256",
        },
      ],
      [],
    ],
    params: [options.auctionId, options.bidAmount],
  });
}

/**
 * Represents the parameters for the "cancelAuction" function.
 */
export type CancelAuctionParams = {
  auctionId: AbiParameterToPrimitiveType<{
    internalType: "uint256";
    name: "_auctionId";
    type: "uint256";
  }>;
};

/**
 * Calls the "cancelAuction" function on the contract.
 * @param options - The options for the "cancelAuction" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { cancelAuction } from "TODO";
 *
 * const transaction = cancelAuction({
 *  auctionId: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function cancelAuction(
  options: BaseTransactionOptions<CancelAuctionParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x96b5a755",
      [
        {
          internalType: "uint256",
          name: "_auctionId",
          type: "uint256",
        },
      ],
      [],
    ],
    params: [options.auctionId],
  });
}

/**
 * Represents the parameters for the "collectAuctionPayout" function.
 */
export type CollectAuctionPayoutParams = {
  auctionId: AbiParameterToPrimitiveType<{
    internalType: "uint256";
    name: "_auctionId";
    type: "uint256";
  }>;
};

/**
 * Calls the "collectAuctionPayout" function on the contract.
 * @param options - The options for the "collectAuctionPayout" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { collectAuctionPayout } from "TODO";
 *
 * const transaction = collectAuctionPayout({
 *  auctionId: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function collectAuctionPayout(
  options: BaseTransactionOptions<CollectAuctionPayoutParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0xebf05a62",
      [
        {
          internalType: "uint256",
          name: "_auctionId",
          type: "uint256",
        },
      ],
      [],
    ],
    params: [options.auctionId],
  });
}

/**
 * Represents the parameters for the "collectAuctionTokens" function.
 */
export type CollectAuctionTokensParams = {
  auctionId: AbiParameterToPrimitiveType<{
    internalType: "uint256";
    name: "_auctionId";
    type: "uint256";
  }>;
};

/**
 * Calls the "collectAuctionTokens" function on the contract.
 * @param options - The options for the "collectAuctionTokens" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { collectAuctionTokens } from "TODO";
 *
 * const transaction = collectAuctionTokens({
 *  auctionId: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function collectAuctionTokens(
  options: BaseTransactionOptions<CollectAuctionTokensParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x03a54fe0",
      [
        {
          internalType: "uint256",
          name: "_auctionId",
          type: "uint256",
        },
      ],
      [],
    ],
    params: [options.auctionId],
  });
}

/**
 * Represents the parameters for the "createAuction" function.
 */
export type CreateAuctionParams = {
  params: AbiParameterToPrimitiveType<{
    components: [
      { internalType: "address"; name: "assetContract"; type: "address" },
      { internalType: "uint256"; name: "tokenId"; type: "uint256" },
      { internalType: "uint256"; name: "quantity"; type: "uint256" },
      { internalType: "address"; name: "currency"; type: "address" },
      { internalType: "uint256"; name: "minimumBidAmount"; type: "uint256" },
      { internalType: "uint256"; name: "buyoutBidAmount"; type: "uint256" },
      { internalType: "uint64"; name: "timeBufferInSeconds"; type: "uint64" },
      { internalType: "uint64"; name: "bidBufferBps"; type: "uint64" },
      { internalType: "uint64"; name: "startTimestamp"; type: "uint64" },
      { internalType: "uint64"; name: "endTimestamp"; type: "uint64" }
    ];
    internalType: "struct IEnglishAuctions.AuctionParameters";
    name: "_params";
    type: "tuple";
  }>;
};

/**
 * Calls the "createAuction" function on the contract.
 * @param options - The options for the "createAuction" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { createAuction } from "TODO";
 *
 * const transaction = createAuction({
 *  params: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function createAuction(
  options: BaseTransactionOptions<CreateAuctionParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x16654d40",
      [
        {
          components: [
            {
              internalType: "address",
              name: "assetContract",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "tokenId",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "quantity",
              type: "uint256",
            },
            {
              internalType: "address",
              name: "currency",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "minimumBidAmount",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "buyoutBidAmount",
              type: "uint256",
            },
            {
              internalType: "uint64",
              name: "timeBufferInSeconds",
              type: "uint64",
            },
            {
              internalType: "uint64",
              name: "bidBufferBps",
              type: "uint64",
            },
            {
              internalType: "uint64",
              name: "startTimestamp",
              type: "uint64",
            },
            {
              internalType: "uint64",
              name: "endTimestamp",
              type: "uint64",
            },
          ],
          internalType: "struct IEnglishAuctions.AuctionParameters",
          name: "_params",
          type: "tuple",
        },
      ],
      [
        {
          internalType: "uint256",
          name: "auctionId",
          type: "uint256",
        },
      ],
    ],
    params: [options.params],
  });
}

/**
 * Represents the parameters for the "onERC1155BatchReceived" function.
 */
export type OnERC1155BatchReceivedParams = {
  arg_0: AbiParameterToPrimitiveType<{
    internalType: "address";
    name: "";
    type: "address";
  }>;
  arg_1: AbiParameterToPrimitiveType<{
    internalType: "address";
    name: "";
    type: "address";
  }>;
  arg_2: AbiParameterToPrimitiveType<{
    internalType: "uint256[]";
    name: "";
    type: "uint256[]";
  }>;
  arg_3: AbiParameterToPrimitiveType<{
    internalType: "uint256[]";
    name: "";
    type: "uint256[]";
  }>;
  arg_4: AbiParameterToPrimitiveType<{
    internalType: "bytes";
    name: "";
    type: "bytes";
  }>;
};

/**
 * Calls the "onERC1155BatchReceived" function on the contract.
 * @param options - The options for the "onERC1155BatchReceived" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { onERC1155BatchReceived } from "TODO";
 *
 * const transaction = onERC1155BatchReceived({
 *  arg_0: ...,
 *  arg_1: ...,
 *  arg_2: ...,
 *  arg_3: ...,
 *  arg_4: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function onERC1155BatchReceived(
  options: BaseTransactionOptions<OnERC1155BatchReceivedParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0xbc197c81",
      [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
        {
          internalType: "address",
          name: "",
          type: "address",
        },
        {
          internalType: "uint256[]",
          name: "",
          type: "uint256[]",
        },
        {
          internalType: "uint256[]",
          name: "",
          type: "uint256[]",
        },
        {
          internalType: "bytes",
          name: "",
          type: "bytes",
        },
      ],
      [
        {
          internalType: "bytes4",
          name: "",
          type: "bytes4",
        },
      ],
    ],
    params: [
      options.arg_0,
      options.arg_1,
      options.arg_2,
      options.arg_3,
      options.arg_4,
    ],
  });
}

/**
 * Represents the parameters for the "onERC1155Received" function.
 */
export type OnERC1155ReceivedParams = {
  arg_0: AbiParameterToPrimitiveType<{
    internalType: "address";
    name: "";
    type: "address";
  }>;
  arg_1: AbiParameterToPrimitiveType<{
    internalType: "address";
    name: "";
    type: "address";
  }>;
  arg_2: AbiParameterToPrimitiveType<{
    internalType: "uint256";
    name: "";
    type: "uint256";
  }>;
  arg_3: AbiParameterToPrimitiveType<{
    internalType: "uint256";
    name: "";
    type: "uint256";
  }>;
  arg_4: AbiParameterToPrimitiveType<{
    internalType: "bytes";
    name: "";
    type: "bytes";
  }>;
};

/**
 * Calls the "onERC1155Received" function on the contract.
 * @param options - The options for the "onERC1155Received" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { onERC1155Received } from "TODO";
 *
 * const transaction = onERC1155Received({
 *  arg_0: ...,
 *  arg_1: ...,
 *  arg_2: ...,
 *  arg_3: ...,
 *  arg_4: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function onERC1155Received(
  options: BaseTransactionOptions<OnERC1155ReceivedParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0xf23a6e61",
      [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
        {
          internalType: "address",
          name: "",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
        {
          internalType: "bytes",
          name: "",
          type: "bytes",
        },
      ],
      [
        {
          internalType: "bytes4",
          name: "",
          type: "bytes4",
        },
      ],
    ],
    params: [
      options.arg_0,
      options.arg_1,
      options.arg_2,
      options.arg_3,
      options.arg_4,
    ],
  });
}

/**
 * Calls the "pause" function on the contract.
 * @param options - The options for the "pause" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { pause } from "TODO";
 *
 * const transaction = pause();
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function pause(options: BaseTransactionOptions) {
  return prepareContractCall({
    contract: options.contract,
    method: ["0x8456cb59", [], []],
    params: [],
  });
}

/**
 * Calls the "renounceOwnership" function on the contract.
 * @param options - The options for the "renounceOwnership" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { renounceOwnership } from "TODO";
 *
 * const transaction = renounceOwnership();
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function renounceOwnership(options: BaseTransactionOptions) {
  return prepareContractCall({
    contract: options.contract,
    method: ["0x715018a6", [], []],
    params: [],
  });
}

/**
 * Represents the parameters for the "setMarketplaceFee" function.
 */
export type SetMarketplaceFeeParams = {
  newFeeBps: AbiParameterToPrimitiveType<{
    internalType: "uint256";
    name: "_newFeeBps";
    type: "uint256";
  }>;
};

/**
 * Calls the "setMarketplaceFee" function on the contract.
 * @param options - The options for the "setMarketplaceFee" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { setMarketplaceFee } from "TODO";
 *
 * const transaction = setMarketplaceFee({
 *  newFeeBps: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function setMarketplaceFee(
  options: BaseTransactionOptions<SetMarketplaceFeeParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x9407ea98",
      [
        {
          internalType: "uint256",
          name: "_newFeeBps",
          type: "uint256",
        },
      ],
      [],
    ],
    params: [options.newFeeBps],
  });
}

/**
 * Represents the parameters for the "setPlatformFeeRecipient" function.
 */
export type SetPlatformFeeRecipientParams = {
  newRecipient: AbiParameterToPrimitiveType<{
    internalType: "address";
    name: "_newRecipient";
    type: "address";
  }>;
};

/**
 * Calls the "setPlatformFeeRecipient" function on the contract.
 * @param options - The options for the "setPlatformFeeRecipient" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { setPlatformFeeRecipient } from "TODO";
 *
 * const transaction = setPlatformFeeRecipient({
 *  newRecipient: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function setPlatformFeeRecipient(
  options: BaseTransactionOptions<SetPlatformFeeRecipientParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x1871e243",
      [
        {
          internalType: "address",
          name: "_newRecipient",
          type: "address",
        },
      ],
      [],
    ],
    params: [options.newRecipient],
  });
}

/**
 * Represents the parameters for the "transferOwnership" function.
 */
export type TransferOwnershipParams = {
  newOwner: AbiParameterToPrimitiveType<{
    internalType: "address";
    name: "newOwner";
    type: "address";
  }>;
};

/**
 * Calls the "transferOwnership" function on the contract.
 * @param options - The options for the "transferOwnership" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { transferOwnership } from "TODO";
 *
 * const transaction = transferOwnership({
 *  newOwner: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function transferOwnership(
  options: BaseTransactionOptions<TransferOwnershipParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0xf2fde38b",
      [
        {
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      [],
    ],
    params: [options.newOwner],
  });
}

/**
 * Calls the "unpause" function on the contract.
 * @param options - The options for the "unpause" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { unpause } from "TODO";
 *
 * const transaction = unpause();
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function unpause(options: BaseTransactionOptions) {
  return prepareContractCall({
    contract: options.contract,
    method: ["0x3f4ba83a", [], []],
    params: [],
  });
}
