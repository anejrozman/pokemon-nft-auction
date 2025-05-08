# Pokemon NFT Marketplace

## Overview

This project demonstrates a simple NFT marketplace specifically designed for Pokemon-themed NFTs (ERC721). Users can view NFT collections, see individual token details, list their NFTs for direct sale, and participate in English auctions. It integrates with a custom backend built using Hardhat and Solidity and utilizes the thirdweb SDK for frontend-blockchain interaction.

## Project Structure

*   **/backend**: Contains the Solidity smart contracts (`PokemonNFT.sol`, `PokemonMarketplace.sol`, `PokemonAuctionHouse.sol`), deployment scripts, minting scripts, and Hardhat configuration.
*   **/frontend**: Contains the Next.js/React application, utilizing Chakra UI for components and the thirdweb SDK for interacting with the blockchain and displaying NFT data.

## Technologies Used

*   **Backend**: Solidity, Hardhat, OpenZeppelin Contracts
*   **Frontend**: React, Next.js, TypeScript, thirdweb SDK, Chakra UI, Viem
*   **Blockchain**: Ethereum (local Hardhat node for development)

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Prerequisites

*   Node.js and npm (or yarn) installed.
*   A code editor (like VS Code).
*   A browser wallet that supports custom networks (Rabby Wallet or MetaMask recommended).

### 2. Backend Setup & Deployment

1.  **Quickstart:**
    In the `backend` directory, just run:
    ```bash
    npx hardhat node
    npm run deploy
    npm run create-sets
    ```
    That's it. Now you can use the app as normal from the frontend page.

2.  **(Advanced) Manual Steps:**
    If you want to see the manual process:
    - Install dependencies:
      ```bash
      cd backend
      npm install
      ```
    - Start the local blockchain node:
      ```bash
      npx hardhat node
      ```
    - Deploy contracts:
      ```bash
      npm run deploy
      ```
    - Mint some sample Pokemon NFTs (if needed):
      ```bash
      npm run mint
      ```
    - (Optional) Create sets:
      ```bash
      npm run create-sets
      ```

### 3. Frontend Configuration

1.  **Install Dependencies:**
    Navigate to the `frontend` directory and install the necessary packages:
    ```bash
    cd ../frontend 
    npm install
    ```

2.  **Configure NFT Contract Address:**
    Open `frontend/src/consts/nft_contracts.ts`. Replace the placeholder address with the `PokemonNFT` address you copied from the deployment step:
    ```typescript
    // frontend/src/consts/nft_contracts.ts
    export const NFT_CONTRACTS: NftContract[] = [
      {
        address: "YOUR_PokemonNFT_ADDRESS_HERE", // <-- Replace this
        chain: hardhatLocal,
        title: "Pokemon NFT Collection",
        description: "Collect and trade, and make each other jealous with Pokemon NFTs!",
        thumbnailUrl: "/images/pokemon-collection.png", // Add an image to your public folder
        type: "ERC721",
      },
    ];
    ```

3.  **Configure Marketplace & Auction Addresses:**
    Open `frontend/src/consts/marketplace_contracts.ts`. Replace the placeholder addresses with the `PokemonMarketplace` and `PokemonAuctionHouse` addresses you copied:
    ```typescript
    // frontend/src/consts/marketplace_contracts.ts
    export const MARKETPLACE_CONTRACTS: MarketplaceContract[] = [
      {
        address: "YOUR_PokemonMarketplace_ADDRESS_HERE", // <-- Replace this
        chain: hardhatLocal,
      },
      {
        address: "YOUR_PokemonAuctionHouse_ADDRESS_HERE", // <-- Replace this
        chain: hardhatLocal,
      }
    ];
    ```

4.  **Set Up thirdweb API Key:**
    *   Create an API key at [thirdweb.dev](https://thirdweb.com/dashboard/settings/api-keys).
    *   Create a file named `.env.local` in the `frontend` directory.
    *   Add your Client ID to the file:
        ```env
        # frontend/.env.local
        NEXT_PUBLIC_TW_CLIENT_ID=YOUR_THIRDWEB_CLIENT_ID_HERE 
        # SECRET_KEY is usually not needed for frontend-only interaction
        ```

### 4. Running the Frontend

Once the backend node is running and the frontend is configured, start the development server:

```bash
# Make sure you are in the frontend directory
npm run dev
```

Open your browser to `http://localhost:3000` (or the port specified in the terminal).

### 5. Local Wallet Setup (Example with Rabby Wallet)

To interact with the marketplace (list, bid, buy), you need to connect a wallet configured for your local Hardhat node.

1.  **Import Account:** Use a wallet like Rabby Wallet or MetaMask. Import one of the test accounts using the private key provided when you started `npx hardhat node`.
2.  **Add Custom Network:** Add a new network configuration in your wallet settings:
    *   **Network Name:** Hardhat (or any name you prefer)
    *   **RPC URL:** `http://127.0.0.1:8545`
    *   **Chain ID:** `31337`
    *   **Currency Symbol:** `ETH`
3.  **Connect Wallet:** In the frontend application, connect your wallet and ensure it's switched to the "Hardhat" network you just added. You should now see the minted NFTs and be able to interact with the marketplace features.


### Debug & Testing
Run `npx hardhat test` within `/backend/` folder

- It's easiest to restart the hardhat node and run the deploy and mint script, instead of copy pasting the address each time over. I noticed the deployment addresses are generated deterministically, so it's easiest to just restart the backend. 
- The first address:
```bash
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```
gets all the Pokemons as of now, so if you want to make a listing make sure to add this address and then any random address.
- Sometimes you get a nonce error, go into RabbyWallet, press 'More', scroll down to "Clear Pending Locally", select "Also reset my local nonce data and signature record" and confirm.