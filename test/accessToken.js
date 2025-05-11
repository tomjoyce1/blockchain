const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TicketToken", function () {
  let ticketToken, owner, vendor, buyer;
  const ticketPrice = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, vendor, buyer] = await ethers.getSigners();
    const TicketToken = await ethers.getContractFactory("TicketToken", owner);
    ticketToken = await TicketToken.deploy(ticketPrice, vendor.address);
    await ticketToken.waitForDeployment();
  });

  it("should initialize with correct values", async function () {
    expect(await ticketToken.ticketPrice()).to.equal(ticketPrice);
    expect(await ticketToken.vendor()).to.equal(vendor.address);
    expect(await ticketToken.name()).to.equal("TicketToken");
    expect(await ticketToken.symbol()).to.equal("TKT");
  });

  it("should revert purchaseTicket if sent funds are insufficient", async function () {
    const insufficientAmount = ethers.parseEther("0.005");
    await expect(
      ticketToken.connect(buyer).purchaseTicket({ value: insufficientAmount })
    ).to.be.revertedWith("Insufficient funds for a ticket");
  });

  it("should mint correct number of tickets when exact amount is sent", async function () {
    // buyer sends exactly 0.03 ETH, expecting 3 tickets minted
    const amountSent = ticketPrice * 3n; // big int multiplication
    const tx = await ticketToken.connect(buyer).purchaseTicket({ value: amountSent });
    const receipt = await tx.wait();

    // checks that the buyer's balance reflects 3 tickets
    const ticketsMinted = await ticketToken.balanceOf(buyer.address);
    expect(ticketsMinted).to.equal(3);

    // decodes the logs manually to find the "TicketPurchased" event
    const events = receipt.logs
      .map((log) => {
        try {
          return ticketToken.interface.parseLog(log);
        } catch (error) {
          return null;
        }
      })
      .filter((event) => event !== null);
    const event = events.find((e) => e.name === "TicketPurchased");
    expect(event.args.buyer).to.equal(buyer.address);
    expect(event.args.amountUsed).to.equal(amountSent);
    expect(event.args.ticketsMinted).to.equal(3);
  });

  it("should refund any excess funds if overpaid", async function () {
    const amountSent = ethers.parseEther("0.035");
    const expectedTickets = 3;
    const expectedUsedAmount = ticketPrice * BigInt(expectedTickets);

    // gets buyer's balance before the transaction
    const buyerInitialBalance = await ethers.provider.getBalance(buyer.address);
    const tx = await ticketToken.connect(buyer).purchaseTicket({ value: amountSent });
    const receipt = await tx.wait();
    // calculate gas cost
    const gasUsed = receipt.gasUsed * tx.gasPrice;

    // checks that the correct number of tickets are minted
    const ticketsMinted = await ticketToken.balanceOf(buyer.address);
    expect(ticketsMinted).to.equal(expectedTickets);

    // calculates the expected balance after purchase
    const expectedBalance = buyerInitialBalance - expectedUsedAmount - gasUsed;
    // allows for a small tolerance (0.001 ETH) for minor discrepancies
    const tolerance = ethers.parseEther("0.001");
    const buyerFinalBalance = await ethers.provider.getBalance(buyer.address);
    expect(buyerFinalBalance).to.be.within(expectedBalance - tolerance, expectedBalance + tolerance);

    // decodes the logs manually to find the "TicketPurchased" event
    const events = receipt.logs
      .map((log) => {
        try {
          return ticketToken.interface.parseLog(log);
        } catch (error) {
          return null;
        }
      })
      .filter((event) => event !== null);
    const event = events.find((e) => e.name === "TicketPurchased");
    expect(event.args.buyer).to.equal(buyer.address);
    expect(event.args.amountUsed).to.equal(expectedUsedAmount);
    expect(event.args.ticketsMinted).to.equal(expectedTickets);
  });

  it("should transfer the used funds to the vendor", async function () {
    // buyer sends funds for 2 tickets.
    const amountSent = ticketPrice * 2n;
    const vendorInitialBalance = await ethers.provider.getBalance(vendor.address);

    await ticketToken.connect(buyer).purchaseTicket({ value: amountSent });
    const vendorFinalBalance = await ethers.provider.getBalance(vendor.address);
    expect(vendorFinalBalance - vendorInitialBalance).to.equal(amountSent);
  });
});