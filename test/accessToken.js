const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("accessToken", function () {
  let accessToken, owner, vendor, buyer;
  const ticketPrice = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, vendor, buyer] = await ethers.getSigners();
    const AccessToken = await ethers.getContractFactory("accessToken", owner);
    accessToken = await AccessToken.deploy(ticketPrice, vendor.address);
    await accessToken.waitForDeployment();
  });

  it("should initialize with correct values", async function () {
    expect(await accessToken.ticketPrice()).to.equal(ticketPrice);
    expect(await accessToken.vendor()).to.equal(vendor.address);
    expect(await accessToken.name()).to.equal("EventTicket");
    expect(await accessToken.symbol()).to.equal("ETIX");
  });

  it("should revert buyTicket if sent funds are insufficient", async function () {
    const quantity = 1;
    const insufficientAmount = ethers.parseEther("0.005");
    await expect(
      accessToken
        .connect(buyer)
        .buyTicket(quantity, { value: insufficientAmount })
    ).to.be.revertedWith("Not enough ETH sent.");
  });
});
