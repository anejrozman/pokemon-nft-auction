import { expect } from "chai";
import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
// import { PokemonNFT, PokemonMarketplace, MockERC20 } from "../typechain-types"; // Adjust path if necessary

const NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ONE_ETHER = ethers.parseEther("1");
const POINT_FIVE_ETHER = ethers.parseEther("0.5");
const INITIAL_FEE_BPS = 250n; // 2.5% as BigInt

const STATUS = {
  CREATED: 0n,
  COMPLETED: 1n,
  CANCELLED: 2n,
};

describe("PokemonMarketplace", function () {
  let owner: SignerWithAddress,
    seller: SignerWithAddress,
    buyer1: SignerWithAddress,
    buyer2: SignerWithAddress,
    feeRecipient: SignerWithAddress,
    anotherAddress: SignerWithAddress;

  let nft: any;
  let marketplace: any;
  let erc20Token: any;

  let tokenId0: bigint = 0n;
  let tokenId1: bigint = 1n;

  async function getCurrentTimestamp(): Promise<number> {
    return (await ethers.provider.getBlock("latest"))!.timestamp;
  }

  async function increaseTime(seconds: number): Promise<void> {
    await network.provider.send("evm_increaseTime", [seconds]);
    await network.provider.send("evm_mine");
  }

  beforeEach(async function () {
    [owner, seller, buyer1, buyer2, feeRecipient, anotherAddress] = await ethers.getSigners();

    // Deploy NFT
    const PokemonNFTFactory = await ethers.getContractFactory("PokemonNFT");
    nft = await PokemonNFTFactory.deploy(
      owner.address, "PokemonNFT", "PKMN", owner.address, 500 // 5% royalty, not directly used by this marketplace
    );
    await nft.waitForDeployment();

    // Create a card set
    await nft.connect(owner).createCardSet(
      "Market Set", ["ipfs://card_market_0", "ipfs://card_market_1"], [5000, 5000], 10, ethers.parseEther("0.01")
    );

    // Mint NFT for seller (tokenId 0)
    await nft.connect(seller).mintFromCardSet(0, { value: ethers.parseEther("0.01") });
    tokenId0 = await nft.getLastMintedTokenId();

    // Mint another NFT for seller (tokenId 1)
    await nft.connect(seller).mintFromCardSet(0, { value: ethers.parseEther("0.01") });
    tokenId1 = await nft.getLastMintedTokenId();

    // Deploy MockERC20
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    erc20Token = await MockERC20Factory.deploy("MockToken", "MTK");
    await erc20Token.waitForDeployment();

    // Mint ERC20 to buyer1
    await erc20Token.connect(owner).mint(buyer1.address, ethers.parseUnits("1000", 18));

    // Deploy Marketplace
    const MarketplaceFactory = await ethers.getContractFactory("PokemonMarketplace");
    marketplace = await MarketplaceFactory.connect(owner).deploy(INITIAL_FEE_BPS);
    await marketplace.waitForDeployment();

    // Seller approves marketplace for the NFTs
    await nft.connect(seller).setApprovalForAll(marketplace.target, true);

    // Set platform fee recipient
    await marketplace.connect(owner).setPlatformFeeRecipient(feeRecipient.address);
  });

  describe("Deployment & Setup", function () {
    it("should set the correct owner", async function () {
      expect(await marketplace.owner()).to.equal(owner.address);
    });

    it("should set the initial marketplace fee", async function () {
      expect(await marketplace.marketplaceFeeBps()).to.equal(INITIAL_FEE_BPS);
    });

    it("should set the initial platform fee recipient to owner and allow update", async function () {
        const TempMarketplace = await ethers.getContractFactory("PokemonMarketplace");
        const tempMarketplace = await TempMarketplace.connect(owner).deploy(INITIAL_FEE_BPS);
        await tempMarketplace.waitForDeployment();
        expect(await tempMarketplace.platformFeeRecipient()).to.equal(owner.address);

        await tempMarketplace.connect(owner).setPlatformFeeRecipient(feeRecipient.address);
        expect(await tempMarketplace.platformFeeRecipient()).to.equal(feeRecipient.address);
    });
  });

  describe("Listing Management: Create, Update, Cancel", function () {
  
    it("should update an existing active listing if createListing is called again for the same token by the same seller", async function () {
        const startTime1 = await getCurrentTimestamp() + 100;
        const endTime1 = startTime1 + 3600;
        const price1 = ONE_ETHER;
  
        const listingParams1 = {
          assetContract: await nft.getAddress(), tokenId: tokenId0, quantity: 1n, currency: NATIVE_TOKEN_ADDRESS,
          pricePerToken: price1, startTimestamp: BigInt(startTime1), endTimestamp: BigInt(endTime1), reserved: false,
        };
        await marketplace.connect(seller).createListing(listingParams1);
        const firstListingId = 0n;
  
        const startTime2 = startTime1 + 50; // Must be >= previous start
        const endTime2 = endTime1 + 50;
        const price2 = ethers.parseEther("1.5");
        const listingParams2 = {
          assetContract: await nft.getAddress(), tokenId: tokenId0, quantity: 1n, currency: NATIVE_TOKEN_ADDRESS,
          pricePerToken: price2, startTimestamp: BigInt(startTime2), endTimestamp: BigInt(endTime2), reserved: true,
        };
  
        await expect(marketplace.connect(seller).createListing(listingParams2))
          .to.emit(marketplace, "UpdatedListing")
          .withArgs(seller.address, firstListingId, await nft.getAddress(), (listing: any) =>
            listing.pricePerToken === price2 && listing.reserved === true
          );
  
        const updatedListing = await marketplace.getListing(firstListingId);
        expect(updatedListing.pricePerToken).to.equal(price2);
        expect(updatedListing.reserved).to.be.true;
        expect(updatedListing.startTimestamp).to.equal(startTime2);
        expect(await marketplace.totalListings()).to.equal(1n); // No new listing created
      });

    it("should update a listing using updateListing", async function () {
      const startTime = await getCurrentTimestamp() + 100;
      const endTime = startTime + 3600;
      let listingParams = {
        assetContract: await nft.getAddress(), tokenId: tokenId0, quantity: 1n, currency: NATIVE_TOKEN_ADDRESS,
        pricePerToken: ONE_ETHER, startTimestamp: BigInt(startTime), endTimestamp: BigInt(endTime), reserved: false,
      };
      await marketplace.connect(seller).createListing(listingParams);
      const listingId = 0n;

      const newPrice = ethers.parseEther("1.2");
      const newEndTime = endTime + 1800;
      listingParams = { ...listingParams, pricePerToken: newPrice, endTimestamp: BigInt(newEndTime), reserved: true };

      await expect(marketplace.connect(seller).updateListing(listingId, listingParams))
        .to.emit(marketplace, "UpdatedListing")
        .withArgs(seller.address, listingId, await nft.getAddress(), (listing: any) =>
            listing.pricePerToken === newPrice && listing.reserved === true
        );

      const updatedListing = await marketplace.getListing(listingId);
      expect(updatedListing.pricePerToken).to.equal(newPrice);
      expect(updatedListing.endTimestamp).to.equal(newEndTime);
      expect(updatedListing.reserved).to.be.true;
    });

    it("should default startTimestamp to block.timestamp if 0", async function () {
        const now = await getCurrentTimestamp();
        const listingParams = {
          assetContract: await nft.getAddress(), tokenId: tokenId0, quantity: 1n, currency: NATIVE_TOKEN_ADDRESS,
          pricePerToken: ONE_ETHER, startTimestamp: 0n, endTimestamp: BigInt(now + 3600), reserved: false,
        };
        await marketplace.connect(seller).createListing(listingParams);
        const listing = await marketplace.getListing(0n);
        expect(listing.startTimestamp).to.be.gte(now); // Should be close to now
        expect(listing.startTimestamp).to.be.lte(now + 5); // Allow for small delay
    });


    it("should fail to create listing if not owner of NFT", async function () {
        const startTime = await getCurrentTimestamp() + 100;
        const endTime = startTime + 3600;
        const listingParams = {
          assetContract: await nft.getAddress(), tokenId: tokenId0, quantity: 1n, currency: NATIVE_TOKEN_ADDRESS,
          pricePerToken: ONE_ETHER, startTimestamp: BigInt(startTime), endTimestamp: BigInt(endTime), reserved: false,
        };
        // anotherAddress does not own tokenId0
        await expect(marketplace.connect(anotherAddress).createListing(listingParams))
            .to.be.revertedWith("Marketplace: Seller must own the NFT");
      });

    it("should fail to create listing if marketplace not approved", async function () {
        await nft.connect(seller).setApprovalForAll(marketplace.target, false); // Revoke approval
        const startTime = await getCurrentTimestamp() + 100;
        const endTime = startTime + 3600;
        const listingParams = {
          assetContract: await nft.getAddress(), tokenId: tokenId0, quantity: 1n, currency: NATIVE_TOKEN_ADDRESS,
          pricePerToken: ONE_ETHER, startTimestamp: BigInt(startTime), endTimestamp: BigInt(endTime), reserved: false,
        };
        await expect(marketplace.connect(seller).createListing(listingParams))
            .to.be.revertedWith("Marketplace: Contract not approved to transfer NFT");
        await nft.connect(seller).setApprovalForAll(marketplace.target, true); // Re-approve for other tests
    });

    it("should fail to create listing with invalid params (price, time)", async function () {
        const now = await getCurrentTimestamp();
        let invalidParams = {
          assetContract: await nft.getAddress(), tokenId: tokenId0, quantity: 1n, currency: NATIVE_TOKEN_ADDRESS,
          pricePerToken: 0n, startTimestamp: BigInt(now + 100), endTimestamp: BigInt(now + 3700), reserved: false,
        };
        await expect(marketplace.connect(seller).createListing(invalidParams))
            .to.be.revertedWith("Marketplace: Price must be > 0");

        invalidParams = { ...invalidParams, pricePerToken: ONE_ETHER, endTimestamp: BigInt(now + 50) }; // end < start
         await expect(marketplace.connect(seller).createListing(invalidParams))
            .to.be.revertedWith("Marketplace: End time must be after start time");
    });

    it("should fail to update listing if not creator or listing not active", async function () {
        const listingParams = {
            assetContract: await nft.getAddress(), tokenId: tokenId0, quantity: 1n, currency: NATIVE_TOKEN_ADDRESS,
            pricePerToken: ONE_ETHER, startTimestamp: BigInt(await getCurrentTimestamp()), endTimestamp: BigInt(await getCurrentTimestamp() + 3600), reserved: false,
        };
        await marketplace.connect(seller).createListing(listingParams);
        const listingId = 0n;

        await expect(marketplace.connect(buyer1).updateListing(listingId, listingParams))
            .to.be.revertedWith("Marketplace: Not listing creator");

        await marketplace.connect(seller).cancelListing(listingId);
        await expect(marketplace.connect(seller).updateListing(listingId, listingParams))
            .to.be.revertedWith("Marketplace: Listing not active");
    });
  });

  describe("Approval Management", function () {
    let listingId: bigint;
    beforeEach(async function() {
        const listingParams = {
            assetContract: await nft.getAddress(), tokenId: tokenId0, quantity: 1n, currency: NATIVE_TOKEN_ADDRESS,
            pricePerToken: ONE_ETHER, startTimestamp: BigInt(await getCurrentTimestamp()), endTimestamp: BigInt(await getCurrentTimestamp() + 3600), reserved: true, // Reserved listing
          };
          await marketplace.connect(seller).createListing(listingParams);
          listingId = 0n;
    });

    it("should approve a buyer for a reserved listing", async function () {
      await expect(marketplace.connect(seller).approveBuyerForListing(listingId, buyer1.address, true))
        .to.emit(marketplace, "BuyerApprovedForListing")
        .withArgs(listingId, buyer1.address, true);
      // Internal mapping _approvedBuyers is not directly checkable, but buy logic will test it.
    });

    it("should fail to approve buyer if not listing creator or listing not reserved", async function () {
        await expect(marketplace.connect(buyer1).approveBuyerForListing(listingId, buyer1.address, true))
            .to.be.revertedWith("Marketplace: Not listing creator");

        // Create non-reserved listing
        const nonReservedParams = {
            assetContract: await nft.getAddress(), tokenId: tokenId1, quantity: 1n, currency: NATIVE_TOKEN_ADDRESS,
            pricePerToken: ONE_ETHER, startTimestamp: BigInt(await getCurrentTimestamp()), endTimestamp: BigInt(await getCurrentTimestamp() + 3600), reserved: false,
        };
        await marketplace.connect(seller).createListing(nonReservedParams);
        const nonReservedListingId = 1n;

        await expect(marketplace.connect(seller).approveBuyerForListing(nonReservedListingId, buyer1.address, true))
            .to.be.revertedWith("Marketplace: Listing is not reserved");
    });

    it("should approve an alternative currency for a listing", async function () {
        const erc20Price = ethers.parseUnits("100", 18); // 100 MTK
        await expect(marketplace.connect(seller).approveCurrencyForListing(listingId, await erc20Token.getAddress(), erc20Price))
          .to.emit(marketplace, "CurrencyApprovedForListing")
          .withArgs(listingId, await erc20Token.getAddress(), erc20Price);
    });

    it("should fail to approve currency if zero address or main currency", async function () {
        await expect(marketplace.connect(seller).approveCurrencyForListing(listingId, ethers.ZeroAddress, ONE_ETHER))
            .to.be.revertedWith("Marketplace: Currency cannot be zero address");
        await expect(marketplace.connect(seller).approveCurrencyForListing(listingId, NATIVE_TOKEN_ADDRESS, ONE_ETHER))
            .to.be.revertedWith("Marketplace: Cannot approve the main currency");
    });
  });

  describe("Buying from Listing (Native Token - ETH)", function () {
    let listingId: bigint;
    const listingPrice = ONE_ETHER;

    beforeEach(async function() {
        const listingParams = {
            assetContract: await nft.getAddress(), tokenId: tokenId0, quantity: 1n, currency: NATIVE_TOKEN_ADDRESS,
            pricePerToken: listingPrice, startTimestamp: BigInt(await getCurrentTimestamp()), endTimestamp: BigInt(await getCurrentTimestamp() + 3600), reserved: false,
          };
        await marketplace.connect(seller).createListing(listingParams);
        listingId = 0n;
    });


    it("should fail to buy if listing expired or not started", async function () {
        await increaseTime(5000); // Pass end time
        await expect(marketplace.connect(buyer1).buyFromListing(listingId, buyer1.address, 1n, NATIVE_TOKEN_ADDRESS, listingPrice, { value: listingPrice }))
            .to.be.revertedWith("Marketplace: Listing expired");

        // New listing that starts in future
        const futureStartTime = await getCurrentTimestamp() + 7200;
        const futureParams = {
            assetContract: await nft.getAddress(), tokenId: tokenId1, quantity: 1n, currency: NATIVE_TOKEN_ADDRESS,
            pricePerToken: listingPrice, startTimestamp: BigInt(futureStartTime), endTimestamp: BigInt(futureStartTime + 3600), reserved: false,
          };
        await marketplace.connect(seller).createListing(futureParams);
        const futureListingId = 1n;
        await expect(marketplace.connect(buyer1).buyFromListing(futureListingId, buyer1.address, 1n, NATIVE_TOKEN_ADDRESS, listingPrice, { value: listingPrice }))
            .to.be.revertedWith("Marketplace: Listing not active yet");
    });

    it("should fail to buy if incorrect ETH value sent or wrong expected price", async function () {
        await expect(marketplace.connect(buyer1).buyFromListing(listingId, buyer1.address, 1n, NATIVE_TOKEN_ADDRESS, listingPrice, { value: POINT_FIVE_ETHER }))
            .to.be.revertedWith("Marketplace: Incorrect native token amount sent");
        await expect(marketplace.connect(buyer1).buyFromListing(listingId, buyer1.address, 1n, NATIVE_TOKEN_ADDRESS, POINT_FIVE_ETHER, { value: listingPrice }))
            .to.be.revertedWith("Marketplace: Incorrect total price expected");
    });

    it("should fail to buy reserved listing if buyer not approved", async function () {
        const reservedParams = {
            assetContract: await nft.getAddress(), tokenId: tokenId1, quantity: 1n, currency: NATIVE_TOKEN_ADDRESS,
            pricePerToken: listingPrice, startTimestamp: BigInt(await getCurrentTimestamp()), endTimestamp: BigInt(await getCurrentTimestamp() + 3600), reserved: true,
          };
        await marketplace.connect(seller).createListing(reservedParams);
        const reservedListingId = 1n;

        await expect(marketplace.connect(buyer1).buyFromListing(reservedListingId, buyer1.address, 1n, NATIVE_TOKEN_ADDRESS, listingPrice, { value: listingPrice }))
            .to.be.revertedWith("Marketplace: Buyer not approved for reserved listing");

        // Approve and try again
        await marketplace.connect(seller).approveBuyerForListing(reservedListingId, buyer1.address, true);
        await expect(marketplace.connect(buyer1).buyFromListing(reservedListingId, buyer1.address, 1n, NATIVE_TOKEN_ADDRESS, listingPrice, { value: listingPrice }))
            .to.emit(marketplace, "NewSale");
        expect(await nft.ownerOf(tokenId1)).to.equal(buyer1.address);
    });
  });

  describe("Buying from Listing (ERC20 Token)", function () {
    let listingId: bigint;
    const erc20Price = ethers.parseUnits("100", 18); // 100 MTK

    beforeEach(async function() {
        // Create a listing that primarily uses ETH but allows ERC20
        const listingParams = {
            assetContract: await nft.getAddress(), tokenId: tokenId0, quantity: 1n, currency: NATIVE_TOKEN_ADDRESS, // Main currency ETH
            pricePerToken: ONE_ETHER, startTimestamp: BigInt(await getCurrentTimestamp()), endTimestamp: BigInt(await getCurrentTimestamp() + 3600), reserved: false,
          };
        await marketplace.connect(seller).createListing(listingParams);
        listingId = 0n;

        // Seller approves ERC20 token as an alternative currency
        await marketplace.connect(seller).approveCurrencyForListing(listingId, await erc20Token.getAddress(), erc20Price);

        // Buyer1 approves marketplace to spend their ERC20 tokens
        await erc20Token.connect(buyer1).approve(marketplace.target, erc20Price);
    });

    it("should fail to buy with ERC20 if ETH is sent (msg.value > 0)", async function () {
        await expect(marketplace.connect(buyer1).buyFromListing(listingId, buyer1.address, 1n, await erc20Token.getAddress(), erc20Price, { value: ONE_ETHER }))
            .to.be.revertedWith("Marketplace: msg.value must be 0 for ERC20 payments");
    });

    it("should fail to buy with ERC20 if insufficient allowance", async function () {
        await erc20Token.connect(buyer1).approve(marketplace.target, ethers.parseUnits("10", 18)); // Lower allowance
        await expect(marketplace.connect(buyer1).buyFromListing(listingId, buyer1.address, 1n, await erc20Token.getAddress(), erc20Price, { value: 0 }))
            .to.be.revertedWith("Marketplace: Check ERC20 allowance"); // Or specific ERC20 error like "transfer amount exceeds allowance"
    });

    it("should fail to buy with ERC20 if currency not approved for listing", async function () {
        const ERC20Preset = await ethers.getContractFactory("MockERC20");
        const unapprovedToken = await ERC20Preset.deploy("Unapproved", "UAT");
        await unapprovedToken.waitForDeployment();
        await unapprovedToken.mint(buyer1.address, erc20Price);
        await unapprovedToken.connect(buyer1).approve(marketplace.target, erc20Price);


        await expect(marketplace.connect(buyer1).buyFromListing(listingId, buyer1.address, 1n, await unapprovedToken.getAddress(), erc20Price, { value: 0 }))
            .to.be.revertedWith("Marketplace: Currency not accepted or approved for this listing");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function() {
        const now = await getCurrentTimestamp();
        const params1 = { assetContract: await nft.getAddress(), tokenId: tokenId0, quantity: 1n, currency: NATIVE_TOKEN_ADDRESS, pricePerToken: ONE_ETHER, startTimestamp: BigInt(now), endTimestamp: BigInt(now + 3600), reserved: false };
        const params2 = { assetContract: await nft.getAddress(), tokenId: tokenId1, quantity: 1n, currency: NATIVE_TOKEN_ADDRESS, pricePerToken: POINT_FIVE_ETHER, startTimestamp: BigInt(now), endTimestamp: BigInt(now + 1800), reserved: false }; // Shorter duration
        await marketplace.connect(seller).createListing(params1); // ID 0
        await marketplace.connect(seller).createListing(params2); // ID 1
    });

    it("should return total listings", async function () {
        expect(await marketplace.totalListings()).to.equal(2n);
      });

    it("should get a specific listing", async function () {
      const listing0 = await marketplace.getListing(0n);
      expect(listing0.tokenId).to.equal(tokenId0);
      expect(listing0.pricePerToken).to.equal(ONE_ETHER);

      await expect(marketplace.getListing(2n)).to.be.revertedWith("Marketplace: Listing does not exist");
    });

    it("should get all listings in a range", async function () {
      // This test assumes _listingCounter requires _endId < _listingCounter.
      // If no listings, it would revert. Here we have 2 listings (IDs 0, 1)
      let listings = await marketplace.getAllListings(0n, 1n);
      expect(listings.length).to.equal(2);
      expect(listings[0].tokenId).to.equal(tokenId0);
      expect(listings[1].tokenId).to.equal(tokenId1);

      listings = await marketplace.getAllListings(0n, 0n);
      expect(listings.length).to.equal(1);
      expect(listings[0].tokenId).to.equal(tokenId0);

      await expect(marketplace.getAllListings(0n, 2n)).to.be.revertedWith("Marketplace: End ID exceeds total listings");
      await expect(marketplace.getAllListings(1n, 0n)).to.be.revertedWith("Marketplace: Invalid range");
    });

    it("should get all valid listings in a range", async function () {
        // Expire listing 1 (ID 1)
        await increaseTime(2000); // Listing 1 (1800s duration) is now expired, Listing 0 (3600s) is still active.

        const validListings = await marketplace.getAllValidListings(0n, 1n);
        expect(validListings.length).to.equal(1);
        expect(validListings[0].tokenId).to.equal(tokenId0); // Only listing 0 should be valid
    });
  });

});