import { expect } from "chai";
import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
// import { PokemonNFT, PokemonAuctionHouse, MockERC20 } from "../typechain-types"; // Use if TypeChain is working
// For IEnglishAuctions types if not using full TypeChain for it:
// import { IEnglishAuctions } from "../artifacts/contracts/interfaces/IMarketplace.sol/IEnglishAuctions";


const NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ONE_ETHER = ethers.parseEther("1");
const POINT_FIVE_ETHER = ethers.parseEther("0.5");
const INITIAL_FEE_BPS_AUCTION = 250n; // 2.5%

// Assuming Status and TokenType enums are defined in IMarketplace.sol or IEnglishAuctions
// These are common values. Adjust if your IMarketplace.sol defines them differently.
const AUCTION_STATUS = {
  CREATED: 0, // Or 0n if comparing with BigInt
  COMPLETED: 1, // Or 1n
  CANCELLED: 2, // Or 2n
};

const TOKEN_TYPE = {
  ERC721: 0, // Or 0n
  ERC1155: 1, // Or 1n
};


describe("PokemonAuctionHouse", function () {
  let owner: SignerWithAddress,
    seller: SignerWithAddress,
    bidder1: SignerWithAddress,
    feeRecipient: SignerWithAddress;

  let nft: any; // PokemonNFT
  let auctionHouse: any; // PokemonAuctionHouse
  let erc20Token: any; // MockERC20

  let tokenId0: bigint = 0n;

  async function getCurrentTimestamp(): Promise<number> {
    const block = await ethers.provider.getBlock("latest");
    return block!.timestamp;
  }

  async function increaseTime(seconds: number): Promise<void> {
    await network.provider.send("evm_increaseTime", [seconds]);
    await network.provider.send("evm_mine");
  }

  beforeEach(async function () {
    [owner, seller, bidder1, feeRecipient] = await ethers.getSigners();

    // Deploy NFT
    const PokemonNFTFactory = await ethers.getContractFactory("PokemonNFT");
    nft = await PokemonNFTFactory.deploy(
      owner.address, "PokemonNFT", "PKMN", owner.address, 500
    );
    await nft.waitForDeployment();

    // Create a card set
    await nft.connect(owner).createCardSet(
      "Auction Set", ["ipfs://card_auction_0"], [10000], 5, ethers.parseEther("0.01")
    );

    // Mint NFT for seller (tokenId 0)
    await nft.connect(seller).mintFromCardSet(0, { value: ethers.parseEther("0.01") });
    tokenId0 = await nft.getLastMintedTokenId();

    // Deploy MockERC20 (optional for these basic tests if only using ETH)
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    erc20Token = await MockERC20Factory.deploy("MockToken", "MTK");
    await erc20Token.waitForDeployment();
    await erc20Token.connect(owner).mint(bidder1.address, ethers.parseUnits("1000", 18));


    // Deploy AuctionHouse
    const AuctionHouseFactory = await ethers.getContractFactory("PokemonAuctionHouse");
    auctionHouse = await AuctionHouseFactory.connect(owner).deploy(INITIAL_FEE_BPS_AUCTION);
    await auctionHouse.waitForDeployment();

    // Seller approves AuctionHouse for the NFT
    await nft.connect(seller).setApprovalForAll(auctionHouse.target, true);

    // Set platform fee recipient
    await auctionHouse.connect(owner).setPlatformFeeRecipient(feeRecipient.address);
  });

  describe("Deployment", function () {
    it("should set the correct owner and initial fees", async function () {
      expect(await auctionHouse.owner()).to.equal(owner.address);
      expect(await auctionHouse.marketplaceFeeBps()).to.equal(INITIAL_FEE_BPS_AUCTION);
      expect(await auctionHouse.platformFeeRecipient()).to.equal(feeRecipient.address); // was set in beforeEach
    });
  });

  describe("Auction Creation (ERC721 - ETH)", function () {

    it("should fail to create an auction if seller does not own the NFT", async function () {
      const startTime = await getCurrentTimestamp() + 100;
      const endTime = startTime + 3600;
      const auctionParams = {
        assetContract: await nft.getAddress(), tokenId: tokenId0, quantity: 1n, currency: NATIVE_TOKEN_ADDRESS,
        minimumBidAmount: ethers.parseEther("0.1"), buyoutBidAmount: ethers.parseEther("1.0"),
        timeBufferInSeconds: 300n, bidBufferBps: 500n, startTimestamp: BigInt(startTime), endTimestamp: BigInt(endTime),
      };
      // bidder1 does not own tokenId0
      await expect(auctionHouse.connect(bidder1).createAuction(auctionParams))
        .to.be.revertedWith("AuctionHouse: Seller must own the NFT(s)");
    });

     it("should fail to create an auction if contract is not approved for NFT", async function () {
      await nft.connect(seller).setApprovalForAll(auctionHouse.target, false); // Revoke approval

      const startTime = await getCurrentTimestamp() + 100;
      const endTime = startTime + 3600;
      const auctionParams = {
        assetContract: await nft.getAddress(), tokenId: tokenId0, quantity: 1n, currency: NATIVE_TOKEN_ADDRESS,
        minimumBidAmount: ethers.parseEther("0.1"), buyoutBidAmount: ethers.parseEther("1.0"),
        timeBufferInSeconds: 300n, bidBufferBps: 500n, startTimestamp: BigInt(startTime), endTimestamp: BigInt(endTime),
      };
      // This check for approval happens inside _transferAuctionTokens, which is called after ownership check
      // The error might be generic from ERC721 if not approved.
      // Or your contract might not explicitly check approval before transfer, relying on the transfer to fail.
      // Let's assume safeTransferFrom will fail.
      await expect(auctionHouse.connect(seller).createAuction(auctionParams))
        .to.be.reverted; // Could be "ERC721: transfer caller is not owner nor approved" or similar

      await nft.connect(seller).setApprovalForAll(auctionHouse.target, true); // Re-approve
    });
  });

  describe("Bidding in Auction (ETH)", function () {
    let auctionId: bigint;
    const minBid = ethers.parseEther("0.1");
    const buyoutPrice = ethers.parseEther("1.0");

    beforeEach(async function () {
      const startTime = await getCurrentTimestamp(); // Start immediately
      const endTime = startTime + 3600;
      const auctionParams = {
        assetContract: await nft.getAddress(), tokenId: tokenId0, quantity: 1n, currency: NATIVE_TOKEN_ADDRESS,
        minimumBidAmount: minBid, buyoutBidAmount: buyoutPrice,
        timeBufferInSeconds: 300n, bidBufferBps: 500n, startTimestamp: BigInt(startTime), endTimestamp: BigInt(endTime),
      };
      // auctionId = await auctionHouse.connect(seller).createAuction(auctionParams);
      // If createAuction returns the ID:
      // auctionId = await auctionHouse.connect(seller).createAuction.staticCall(auctionParams); // Get return value without state change
      // await auctionHouse.connect(seller).createAuction(auctionParams); // Actual call
      // Or parse from event for robustness:
      const tx = await auctionHouse.connect(seller).createAuction(auctionParams);
      const receipt = await tx.wait();
      const event = auctionHouse.interface.parseLog(receipt.logs.find(log => (log as any).address === auctionHouse.target && auctionHouse.interface.parseLog(log as any)?.name === "NewAuction") as any);
      auctionId = event.args.auctionId;
    });


  });

  describe("Auction Cancellation & Collection (Basic)", function () {
    let auctionId: bigint;
    const minBid = ethers.parseEther("0.1");

    beforeEach(async function () {
      const startTime = await getCurrentTimestamp();
      const endTime = startTime + 3600;
      const auctionParams = {
        assetContract: await nft.getAddress(), tokenId: tokenId0, quantity: 1n, currency: NATIVE_TOKEN_ADDRESS,
        minimumBidAmount: minBid, buyoutBidAmount: 0n, // No buyout for this test
        timeBufferInSeconds: 300n, bidBufferBps: 500n, startTimestamp: BigInt(startTime), endTimestamp: BigInt(endTime),
      };
      const tx = await auctionHouse.connect(seller).createAuction(auctionParams);
      const receipt = await tx.wait();
      const event = auctionHouse.interface.parseLog(receipt.logs.find(log => (log as any).address === auctionHouse.target && auctionHouse.interface.parseLog(log as any)?.name === "NewAuction") as any);
      auctionId = event.args.auctionId;
    });


  });
});