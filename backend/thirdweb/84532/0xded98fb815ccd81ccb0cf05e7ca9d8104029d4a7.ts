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
 * Represents the filters for the "DutchAuctionCompleted" event.
 */
export type DutchAuctionCompletedEventFilters = Partial<{
  auctionId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"uint256","name":"auctionId","type":"uint256"}>
}>;

/**
 * Creates an event object for the DutchAuctionCompleted event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { dutchAuctionCompletedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  dutchAuctionCompletedEvent({
 *  auctionId: ...,
 * })
 * ],
 * });
 * ```
 */
export function dutchAuctionCompletedEvent(filters: DutchAuctionCompletedEventFilters = {}) {
  return prepareEvent({
    signature: "event DutchAuctionCompleted(uint256 indexed auctionId, address buyer, uint256 price)",
    filters,
  });
};
  

/**
 * Represents the filters for the "DutchAuctionCreated" event.
 */
export type DutchAuctionCreatedEventFilters = Partial<{
  auctionId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"uint256","name":"auctionId","type":"uint256"}>
seller: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"seller","type":"address"}>
}>;

/**
 * Creates an event object for the DutchAuctionCreated event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { dutchAuctionCreatedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  dutchAuctionCreatedEvent({
 *  auctionId: ...,
 *  seller: ...,
 * })
 * ],
 * });
 * ```
 */
export function dutchAuctionCreatedEvent(filters: DutchAuctionCreatedEventFilters = {}) {
  return prepareEvent({
    signature: "event DutchAuctionCreated(uint256 indexed auctionId, address indexed seller, uint256 tokenId, uint256 startPrice, uint256 endPrice, uint256 duration, uint256 decayExponent, address currency)",
    filters,
  });
};
  

/**
 * Represents the filters for the "OwnershipTransferred" event.
 */
export type OwnershipTransferredEventFilters = Partial<{
  previousOwner: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"}>
newOwner: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}>
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
export function ownershipTransferredEvent(filters: OwnershipTransferredEventFilters = {}) {
  return prepareEvent({
    signature: "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
    filters,
  });
};
  



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
};
  



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
};
  

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
export async function NATIVE_TOKEN(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x31f7d964",
  [],
  [
    {
      "internalType": "address",
      "name": "",
      "type": "address"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "auctionCounter" function on the contract.
 * @param options - The options for the auctionCounter function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { auctionCounter } from "TODO";
 *
 * const result = await auctionCounter();
 *
 * ```
 */
export async function auctionCounter(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xa7e76644",
  [],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: []
  });
};


/**
 * Represents the parameters for the "auctions" function.
 */
export type AuctionsParams = {
  arg_0: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"","type":"uint256"}>
};

/**
 * Calls the "auctions" function on the contract.
 * @param options - The options for the auctions function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { auctions } from "TODO";
 *
 * const result = await auctions({
 *  arg_0: ...,
 * });
 *
 * ```
 */
export async function auctions(
  options: BaseTransactionOptions<AuctionsParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x571a26a0",
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  [
    {
      "internalType": "address",
      "name": "seller",
      "type": "address"
    },
    {
      "internalType": "address",
      "name": "nftAddress",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "tokenId",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "startPrice",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "endPrice",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "startTime",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "duration",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "decayExponent",
      "type": "uint256"
    },
    {
      "internalType": "address",
      "name": "currency",
      "type": "address"
    },
    {
      "internalType": "bool",
      "name": "active",
      "type": "bool"
    }
  ]
],
    params: [options.arg_0]
  });
};


/**
 * Represents the parameters for the "getCurrentPrice" function.
 */
export type GetCurrentPriceParams = {
  auctionId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"auctionId","type":"uint256"}>
};

/**
 * Calls the "getCurrentPrice" function on the contract.
 * @param options - The options for the getCurrentPrice function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getCurrentPrice } from "TODO";
 *
 * const result = await getCurrentPrice({
 *  auctionId: ...,
 * });
 *
 * ```
 */
export async function getCurrentPrice(
  options: BaseTransactionOptions<GetCurrentPriceParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xc55d0f56",
  [
    {
      "internalType": "uint256",
      "name": "auctionId",
      "type": "uint256"
    }
  ],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: [options.auctionId]
  });
};




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
export async function marketplaceFeeBps(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xd3929c8a",
  [],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: []
  });
};




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
export async function owner(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x8da5cb5b",
  [],
  [
    {
      "internalType": "address",
      "name": "",
      "type": "address"
    }
  ]
],
    params: []
  });
};




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
export async function paused(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x5c975abb",
  [],
  [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ]
],
    params: []
  });
};




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
export async function platformFeeRecipient(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xeb13554f",
  [],
  [
    {
      "internalType": "address",
      "name": "",
      "type": "address"
    }
  ]
],
    params: []
  });
};


/**
* Contract write functions
*/

/**
 * Represents the parameters for the "buy" function.
 */
export type BuyParams = {
  auctionId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"auctionId","type":"uint256"}>
};

/**
 * Calls the "buy" function on the contract.
 * @param options - The options for the "buy" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { buy } from "TODO";
 *
 * const transaction = buy({
 *  auctionId: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function buy(
  options: BaseTransactionOptions<BuyParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xd96a094a",
  [
    {
      "internalType": "uint256",
      "name": "auctionId",
      "type": "uint256"
    }
  ],
  []
],
    params: [options.auctionId]
  });
};


/**
 * Represents the parameters for the "createDutchAuction" function.
 */
export type CreateDutchAuctionParams = {
  nftAddress: AbiParameterToPrimitiveType<{"internalType":"address","name":"nftAddress","type":"address"}>
tokenId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"tokenId","type":"uint256"}>
startPrice: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"startPrice","type":"uint256"}>
endPrice: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"endPrice","type":"uint256"}>
duration: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"duration","type":"uint256"}>
decayExponent: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"decayExponent","type":"uint256"}>
currency: AbiParameterToPrimitiveType<{"internalType":"address","name":"currency","type":"address"}>
};

/**
 * Calls the "createDutchAuction" function on the contract.
 * @param options - The options for the "createDutchAuction" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { createDutchAuction } from "TODO";
 *
 * const transaction = createDutchAuction({
 *  nftAddress: ...,
 *  tokenId: ...,
 *  startPrice: ...,
 *  endPrice: ...,
 *  duration: ...,
 *  decayExponent: ...,
 *  currency: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function createDutchAuction(
  options: BaseTransactionOptions<CreateDutchAuctionParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x571c6573",
  [
    {
      "internalType": "address",
      "name": "nftAddress",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "tokenId",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "startPrice",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "endPrice",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "duration",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "decayExponent",
      "type": "uint256"
    },
    {
      "internalType": "address",
      "name": "currency",
      "type": "address"
    }
  ],
  []
],
    params: [options.nftAddress, options.tokenId, options.startPrice, options.endPrice, options.duration, options.decayExponent, options.currency]
  });
};




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
export function pause(
  options: BaseTransactionOptions
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x8456cb59",
  [],
  []
],
    params: []
  });
};




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
export function renounceOwnership(
  options: BaseTransactionOptions
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x715018a6",
  [],
  []
],
    params: []
  });
};


/**
 * Represents the parameters for the "setMarketplaceFee" function.
 */
export type SetMarketplaceFeeParams = {
  newFeeBps: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"_newFeeBps","type":"uint256"}>
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
      "internalType": "uint256",
      "name": "_newFeeBps",
      "type": "uint256"
    }
  ],
  []
],
    params: [options.newFeeBps]
  });
};


/**
 * Represents the parameters for the "setPlatformFeeRecipient" function.
 */
export type SetPlatformFeeRecipientParams = {
  newRecipient: AbiParameterToPrimitiveType<{"internalType":"address","name":"_newRecipient","type":"address"}>
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
      "internalType": "address",
      "name": "_newRecipient",
      "type": "address"
    }
  ],
  []
],
    params: [options.newRecipient]
  });
};


/**
 * Represents the parameters for the "transferOwnership" function.
 */
export type TransferOwnershipParams = {
  newOwner: AbiParameterToPrimitiveType<{"internalType":"address","name":"newOwner","type":"address"}>
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
      "internalType": "address",
      "name": "newOwner",
      "type": "address"
    }
  ],
  []
],
    params: [options.newOwner]
  });
};




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
export function unpause(
  options: BaseTransactionOptions
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x3f4ba83a",
  [],
  []
],
    params: []
  });
};


