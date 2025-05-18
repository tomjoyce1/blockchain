let signer;
let provider;

const abi = [
  "function buyTicket(uint256 quantity) external payable",
  "function ticketPrice() public view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function refundTicket(uint256 quantity) external",
  "function owner() public view returns (address)",
  "function vendorAddress() public view returns (address)",
];

async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    const manualAddress = document.getElementById("wallet-input").value;

    provider = new ethers.providers.Web3Provider(window.ethereum);

    if (manualAddress) {
      if (!ethers.utils.isAddress(manualAddress)) {
        alert("Invalid wallet address format");
        return;
      }
      signer = provider.getSigner();
      document.getElementById("wallet-address").innerText =
        "Connected: " + manualAddress + " (Read-only)";
    } else {
      await provider.send("eth_requestAccounts", []);
      signer = provider.getSigner();
      const address = await signer.getAddress();
      document.getElementById("wallet-address").innerText =
        "Connected: " + address;
    }

    const isValidNetwork = await checkNetwork();
    if (isValidNetwork) {
      const price = await getTicketPrice();
      document.getElementById(
        "ticket-price"
      ).innerText = `Ticket Price: ${price} ETH`;
    }
  } catch (error) {
    console.error("Connection error:", error);
    alert("Failed to connect wallet: " + error.message);
  }
}

async function checkNetwork() {
  if (!provider) {
    alert("Provider is not set!");
    return false;
  }

  try {
    const network = await provider.getNetwork();
    const targetChainId = parseInt(window.config.CHAIN_ID, 16);

    if (network.chainId !== targetChainId) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: window.config.CHAIN_ID }],
        });
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        return true;
      } catch (err) {
        alert("Please switch to Sepolia network manually in MetaMask");
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error("Network check failed:", err);
    return false;
  }
}

async function buyTicket() {
  const buyLoading = document.getElementById("buy-loading");
  buyLoading.classList.remove("hidden");

  if (!signer) {
    alert("Please connect your wallet first.");
    return;
  }

  try {
    const contract = new ethers.Contract(
      window.config.CONTRACT_ADDRESS,
      abi,
      signer
    );

    const isValidNetwork = await checkNetwork();
    if (!isValidNetwork) return;

    // Get quantity from input
    const quantity = parseInt(document.getElementById("buy-amount").value, 10);
    if (!quantity || quantity < 1) {
      alert("Please enter a valid ticket quantity.");
      return;
    }

    const ticketPrice = await contract.ticketPrice();
    if (ticketPrice.lte(0)) {
      alert("Ticket price is invalid!");
      return;
    }

    const totalPrice = ticketPrice.mul(quantity);

    const tx = await contract.buyTicket(quantity, { value: totalPrice });
    await tx.wait();
    alert(`Purchased ${quantity} ticket(s) successfully!`);
  } catch (err) {
    console.error(err);
    alert("Transaction failed: " + err.message);
  }
  buyLoading.classList.add("hidden");
}
async function refundTicket() {
  const refundLoading = document.getElementById("refund-loading");
  refundLoading.classList.remove("hidden");
  if (!signer) {
    alert("Please connect your wallet first.");
    return;
  }

  const button = document.getElementById("refund-ticket");
  button.disabled = true;
  button.textContent = "Processing Refund...";

  try {
    const contract = new ethers.Contract(
      window.config.CONTRACT_ADDRESS,
      abi,
      signer
    );
    const address = await signer.getAddress();
    const balance = await contract.balanceOf(address);

    if (balance.eq(0)) throw new Error("You don't have any tickets to refund");

    // Get quantity from input
    const quantity = parseInt(
      document.getElementById("refund-amount").value,
      10
    );
    if (!quantity || quantity < 1) {
      alert("Please enter a valid refund quantity.");
      return;
    }

    let tx;
    try {
      tx = await contract.refundTicket(quantity);
      await tx.wait();
    } catch (err) {
      const errorMsg = err?.message || err?.reason || err?.error?.message || "";
      if (errorMsg.includes("cannot estimate gas")) {
        alert(
          "Unable to process refund. This may be because you have no tickets, or there is a network issue. Please check your ticket balance and try again."
        );
        return;
      } else {
        throw err;
      }
    }

    const newBalance = await contract.balanceOf(address);
    alert(`Refund successful! Your new ticket balance is: ${newBalance}`);
  } catch (err) {
    console.error(err);
    alert("Refund failed: " + (err.message || "Unknown error"));
  } finally {
    button.disabled = false;
    button.textContent = "Refund Ticket(s)";
    refundLoading.classList.add("hidden");
  }
}

async function getTicketPrice() {
  try {
    const signerOrProvider = signer || provider;
    if (!signerOrProvider) throw new Error("No provider available");

    const contract = new ethers.Contract(
      window.config.CONTRACT_ADDRESS,
      abi,
      signerOrProvider
    );
    const price = await contract.ticketPrice();
    return ethers.utils.formatEther(price);
  } catch (err) {
    console.error("Error fetching ticket price:", err);
    return "Error loading price";
  }
}

window.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("connect-wallet")
    .addEventListener("click", connectWallet);

  document.getElementById("buy-ticket").addEventListener("click", buyTicket);

  document
    .getElementById("refund-ticket")
    .addEventListener("click", refundTicket);
});

const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const randomChar = () => chars[Math.floor(Math.random() * (chars.length - 1))];
const randomString = (length) =>
  Array.from(Array(length)).map(randomChar).join("");
const cards = document.querySelectorAll(".card");

cards.forEach((card) => {
  const letters = card.querySelector(".card-letters");

  const handleOnMove = (e) => {
    const rect = card.getBoundingClientRect(),
      x = e.clientX - rect.left,
      y = e.clientY - rect.top;

    letters.style.setProperty("--x", `${x}px`);
    letters.style.setProperty("--y", `${y}px`);

    letters.innerText = randomString(1500);
  };

  card.onmousemove = (e) => handleOnMove(e);
  card.ontouchmove = (e) => handleOnMove(e.touches[0]);
});

// Only add this for testing purposes!
if (typeof module !== "undefined") {
  module.exports = {
    buyTicket,
    refundTicket,
    connectWallet,
  };
}
if (typeof module !== "undefined") {
  module.exports = { randomString };
}
