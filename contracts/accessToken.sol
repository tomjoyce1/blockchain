// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract accessToken is ERC20, Ownable {
    uint256 public ticketPrice;
    address public vendor;

    uint256 public totalFundsAvailable;

    constructor(uint256 _ticketPrice, address _vendor) ERC20("EventTicket", "ETIX")
    Ownable(msg.sender) {
        ticketPrice = _ticketPrice;
        vendor = _vendor;
        _mint(msg.sender, 1000 * 10 ** decimals());  
    }

    function buyTicket(uint256 quantity) external payable {
        require(quantity > 0, "Quantity must be at least 1.");
        uint256 totalPrice = ticketPrice * quantity;
        require(msg.value >= totalPrice, "Not enough ETH sent.");

        _transfer(owner(), msg.sender, quantity * 10 ** decimals());

        totalFundsAvailable += msg.value;
    }

    function refundTicket(uint256 quantity) external {
        require(quantity > 0, "Quantity must be at least 1.");
        uint256 amount = quantity * 10 ** decimals();
        uint256 totalRefund = ticketPrice * quantity;
        require(balanceOf(msg.sender) >= amount, "You don't own enough tickets.");
        require(address(this).balance >= totalRefund, "Contract has insufficient funds.");

        _transfer(msg.sender, owner(), amount);

        // Send ETH refund
        (bool success, ) = msg.sender.call{value: totalRefund}("");
        require(success, "Refund failed.");

        totalFundsAvailable -= totalRefund;
    }

    function withdrawFunds() external {
        require(msg.sender == vendor, "Only vendor can withdraw.");
        require(totalFundsAvailable > 0, "No funds available.");

        uint256 amount = totalFundsAvailable;
        totalFundsAvailable = 0;

        (bool success, ) = payable(vendor).call{value: amount}("");
        require(success, "Withdraw failed.");
    }

    // Allow owner to update vendor address
    function updateVendor(address newVendor) external onlyOwner {
        require(newVendor != address(0), "Invalid vendor address.");
        vendor = newVendor;
    }

    receive() external payable {}
}
