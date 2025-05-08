import { expect } from "chai";
import { ethers } from "hardhat";

describe("PokemonDutchAuction", function () {
  let auction: any;
  let nft: any;
  let owner: any, seller: any, buyer: any;

  beforeEach(async function () {
    [owner, seller, buyer] = await ethers.getSigners();
  
    // Deploy NFT
    const MockNFT = await ethers.getContractFactory("PokemonNFT");
    nft = await MockNFT.deploy(
      owner.address, "PokemonNFT", "PKMN", owner.address, 500
    );
  
    // Create a card set as owner
    await nft.connect(owner).createCardSet(
      "Auction Set", ["ipfs://card1"], [10000], 10, ethers.parseEther("0.1")
    );
  
    // Mint as seller (tokenId 0)
    await nft.connect(seller).mintFromCardSet(0, { value: ethers.parseEther("0.1") });
  
    // Deploy auction
    const Auction = await ethers.getContractFactory("PokemonDutchAuction");
    auction = await Auction.deploy(250);
  
    // Approve auction contract for tokenId 0
    await nft.connect(seller).approve(auction.target, 0);
  });

  it("should create an auction", async function () {
    await auction.connect(seller).createDutchAuction(
      nft.target, 0, ethers.parseEther("1"), ethers.parseEther("0.5"), 3600, 1, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    );
    const auc = await auction.auctions(0);
    expect(auc.seller).to.equal(seller.address);
    expect(auc.tokenId).to.equal(0);
    expect(auc.startPrice).to.equal(ethers.parseEther("1"));
    expect(auc.active).to.be.true;
  });

  it("should revert on invalid params", async function () {
    await expect(
      auction.connect(seller).createDutchAuction(
        nft.target, 0, ethers.parseEther("0.5"), ethers.parseEther("1"), 3600, 1, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
      )
    ).to.be.revertedWith("Start price must be greater than end price");

    await expect(
      auction.connect(seller).createDutchAuction(
        nft.target, 0, ethers.parseEther("1"), ethers.parseEther("0.5"), 0, 1, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
      )
    ).to.be.revertedWith("Duration must be greater than 0");

    await expect(
      auction.connect(seller).createDutchAuction(
        nft.target, 0, ethers.parseEther("1"), ethers.parseEther("0.5"), 3600, 0, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
      )
    ).to.be.revertedWith("Decay exponent must be positive");
  });

  it("should decay price over time", async function () {
    await auction.connect(seller).createDutchAuction(
      nft.target, 0, ethers.parseEther("1"), ethers.parseEther("0.5"), 3600, 1, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    );
    await ethers.provider.send("evm_increaseTime", [1800]);
    await ethers.provider.send("evm_mine", []);
    const price = await auction.getCurrentPrice(0);
    expect(price).to.equal(ethers.parseEther("0.75"));
  });

  it("should buy and transfer NFT", async function () {
    await auction.connect(seller).createDutchAuction(
      nft.target, 0, ethers.parseEther("1"), ethers.parseEther("0.5"), 3600, 1, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    );
    await auction.connect(buyer).buy(0, { value: ethers.parseEther("1") });
    expect(await nft.ownerOf(0)).to.equal(buyer.address);
  });

  it("should revert on insufficient payment", async function () {
    await auction.connect(seller).createDutchAuction(
      nft.target, 0, ethers.parseEther("1"), ethers.parseEther("0.5"), 3600, 1, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    );
    await expect(
      auction.connect(buyer).buy(0, { value: ethers.parseEther("0.5") })
    ).to.be.revertedWith("Insufficient payment");
  });

  it("should pause and unpause", async function () {
    await auction.pause();
    expect(await auction.paused()).to.be.true;
    await auction.unpause();
    expect(await auction.paused()).to.be.false;
  });
});