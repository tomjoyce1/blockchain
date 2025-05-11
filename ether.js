<button onclick="createWallet()">Create Wallet</button>
<script>
  async function createWallet() {
    const wallet = ethers.Wallet.createRandom();
    document.body.innerHTML += `<pre>${wallet.address}</pre>`;
    const blob = new Blob([wallet.privateKey], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "wallet.txt";
    link.innerText = "Download Wallet";
    document.body.appendChild(link);
  }
</script>
