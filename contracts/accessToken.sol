// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract accessToken is ERC20, Ownable {
    uint256 public ticketPrice;
    address public vendor;

    uint256 public totalFundsAvailable;
    uint256 public withdrawUnlockTime;

    constructor(uint256 _ticketPrice, address _vendor) ERC20("EventTicket", "ETIX")
    Ownable(msg.sender) {
        ticketPrice = _ticketPrice;
        vendor = _vendor;
        _mint(msg.sender, 1000 * 10 ** decimals());  
        withdrawUnlockTime = block.timestamp + 1 days; // Funds can be withdrawn after 1 day
    }

    function buyTicket() external payable {
        require(msg.value >= ticketPrice, "Not enough ETH sent.");

        _transfer(owner(), msg.sender, 1 * 10 ** decimals());

        totalFundsAvailable += msg.value;
    }

    function refundTicket() external {
        uint256 amount = 1 * 10 ** decimals();
        require(balanceOf(msg.sender) >= amount, "You don't own a ticket.");
        require(address(this).balance >= ticketPrice, "Contract has insufficient funds.");
        require(block.timestamp < withdrawUnlockTime, "Refund window has closed.");

        _transfer(msg.sender, owner(), amount); 

        // Send ETH refund
        (bool success, ) = msg.sender.call{value: ticketPrice}("");
        require(success, "Refund failed.");

        totalFundsAvailable -= ticketPrice;
    }

    function withdrawFunds() external {
        require(msg.sender == vendor, "Only vendor can withdraw.");
        require(block.timestamp >= withdrawUnlockTime, "Funds are locked.");
        require(totalFundsAvailable > 0, "No funds available.");

        uint256 amount = totalFundsAvailable;
        totalFundsAvailable = 0;

        (bool success, ) = payable(vendor).call{value: amount}("");
        require(success, "Withdraw failed.");
    }

    // Allow owner to update unlock time if needed
    function setWithdrawUnlockTime(uint256 _timestamp) external onlyOwner {
        require(_timestamp > block.timestamp, "Must be in the future.");
        withdrawUnlockTime = _timestamp;
    }

    // Allow owner to update vendor address
    function updateVendor(address newVendor) external onlyOwner {
        require(newVendor != address(0), "Invalid vendor address.");
        vendor = newVendor;
    }

    receive() external payable {}
}
