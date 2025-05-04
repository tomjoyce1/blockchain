const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("Deploying contracts with the account:", (await ethers.getSigners())[0].address);
  console.log("Vendor Address from .env:", process.env.VENDOR_ADDRESS);

  const AccessToken = await ethers.getContractFactory("accessToken");
  const ticketPrice = ethers.parseEther("0.01");
  const vendorAddress = process.env.VENDOR_ADDRESS;

  const accessToken = await AccessToken.deploy(ticketPrice, vendorAddress);

  console.log("Deployment transaction hash:", accessToken.deploymentTransaction.hash);

  await accessToken.waitForDeployment();

  console.log("accessToken deployed to:", accessToken.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });