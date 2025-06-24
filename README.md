# ByteMe_CIH_2.0# Decentralized Learning Platform

A Web3 decentralized platform for teaching and learning 5-10 minute skills.

## Table of Contents

- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
  - [Development Server](#development-server)
  - [Production Build & Start](#production-build--start)
- [Running Tests](#running-tests)
- [Smart Contract Deployment](#smart-contract-deployment)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Key Features

- **Decentralized Skill Sharing:** Users can create, share, and learn short skills.
- **Web3 Integration:** Utilizes Ethereum smart contracts for platform logic and potentially tokenized interactions (LearningToken).
- **IPFS for Content Storage:** Skill content (videos, documents) can be stored on IPFS for decentralized and resilient access.
- **Real-time Interactions:** Socket.IO is used for features like notifications for new skills or session updates.
- **User Management:** Basic user authentication and profile management.
- **Learning Sessions:** Functionality to manage teaching and learning sessions between users.

## Technology Stack

- **Backend:** Node.js, Express.js
- **Smart Contracts:** Solidity, Hardhat, OpenZeppelin Contracts
- **Blockchain Interaction:** Ethers.js
- **Database:** MongoDB with Mongoose ODM
- **Decentralized Storage:** IPFS (via `ipfs-http-client`)
- **Real-time Communication:** Socket.IO
- **Frontend:** HTML, CSS, JavaScript (served via Express, with Webpack for potential bundling)
- **Build/Development Tools:** Webpack, Nodemon, Babel
- **Testing:** Chai, Ethereum Waffle, Hardhat Test Environment
- **Other:** Helmet (security), Morgan (logging), CORS, Compression, Dotenv

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version >=16.0.0 recommended, as per `package.json`)
- [npm](https://www.npmjs.com/) (version >=8.0.0 recommended, as per `package.json`)
- [Git](https://git-scm.com/)
- (Optional) [MetaMask](https://metamask.io/) browser extension for interacting with the Web3 features from a frontend.
- (Optional) [MongoDB](https://www.mongodb.com/try/download/community) instance (local or cloud) if you intend to run the full backend.

## Installation and Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd decentralized-learning-platform
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Environment Variables

This project uses environment variables for configuration. Create a `.env` file in the root of the project by copying the example file:

```bash
cp .env.example .env
```

Then, fill in the required values in your `.env` file. Key variables include:

-   `PORT`: The port on which the server will run (e.g., 5000).
-   `FRONTEND_URL`: The URL of the frontend application (e.g., `http://localhost:3000` or your deployed frontend URL).
-   `MONGODB_URI`: Your MongoDB connection string.
-   `PRIVATE_KEY`: Ethereum private key for deploying smart contracts and potentially for backend wallet operations. **Handle with extreme care.**
-   `POLYGON_RPC_URL`: RPC URL for the Polygon Mainnet.
-   `MUMBAI_RPC_URL`: RPC URL for the Polygon Mumbai Testnet.
-   `POLYGONSCAN_API_KEY`: Your PolygonScan API key for contract verification.
-   `LEARN_TOKEN_ADDRESS`: Address of the deployed LearnToken contract.
-   `LEARN_PLATFORM_ADDRESS`: Address of the deployed LearnPlatform contract.
-   `IPFS_GATEWAY`: URL for an IPFS gateway (e.g., `https://ipfs.io/ipfs/`).
-   `NETWORK_NAME`: Default network for contract interactions (e.g., `polygon`, `mumbai`).
-   `JWT_SECRET`: Secret key for JWT token generation and verification.
-   (Other variables as defined in `.env.example` and used by the application)

## Running the Project

### Development Server

To run the application with Nodemon for automatic restarts during development:

```bash
npm run dev
```

The server will typically start on the port specified in your `.env` file (default is 5000).

### Production Build & Start

The `package.json` includes build scripts, but the current `server.js` directly serves static files and API. If a separate frontend build is required (e.g., using Webpack for a React/Vue/Angular app in `public`), you would first build it.

To start the server (typically for production):

```bash
npm start
```

## Running Tests

To execute the smart contract tests using Hardhat:

```bash
npm test
```

Ensure your Hardhat configuration (`hardhat.config.js`) is set up correctly, especially if tests involve specific network interactions.

## Smart Contract Deployment

Smart contracts are managed with Hardhat.

1.  **Compile Contracts:**
    ```bash
    npx hardhat compile
    ```
    This is also part of the `npm run build:contracts` script.

2.  **Deploy Contracts:**
    The `package.json` provides a script to deploy to the Polygon network:
    ```bash
    npm run deploy
    ```
    This script executes `npx hardhat run scripts/deploy.js --network polygon`.
    Make sure your `.env` file has the `PRIVATE_KEY` and `POLYGON_RPC_URL` correctly set for the Polygon network. You can adapt the `--network` parameter to deploy to other configured networks like `mumbai` or `localhost`.

3.  **Verify Contracts (Optional):**
    After deployment, you might want to verify your contracts on PolygonScan. The `scripts/verify.js` (if it exists and is configured) would be used for this, typically by running:
    ```bash
    npx hardhat run scripts/verify.js --network <networkName> <contractAddress> <constructorArguments...>
    ```
    Ensure `POLYGONSCAN_API_KEY` is set in your `.env` file.

## API Endpoints

The backend exposes several API endpoints, primarily under the `/api` prefix:

-   `/api/health`: Health check for the server.
-   `/api/config`: Provides frontend with contract addresses and other configurations.
-   `/api/skills`: For managing skills (creating, fetching, etc.).
-   `/api/users`: For user registration, login, and profile management.
-   `/api/sessions`: For managing learning sessions.
-   `/api/ipfs`: For interacting with IPFS (e.g., uploading content).

Refer to the route files in the `routes/` directory for more details on specific endpoints and their functionalities.

## Project Structure

Here's a brief overview of the key directories:

-   `contracts/`: Contains the Solidity smart contracts (e.g., `LearningToken.sol`, `SkillPlatform.sol`).
-   `routes/`: Defines the API routes for the Express backend.
-   `scripts/`: Includes scripts for deployment, verification, and other tasks related to Hardhat and blockchain operations.
-   `pages/`: Contains static HTML pages served by the application.
-   `public/`: (If used) For static assets or a bundled frontend application.
-   `test/`: Contains test files for the smart contracts.
-   `utils/`: Utility functions used across the application (e.g., IPFS utilities, Web3 utilities).
-   `server.js`: The main entry point for the Express backend application.
-   `index.js`: An alternative/simpler server setup, primarily for serving static HTML pages. `server.js` is the main one.
-   `hardhat.config.js`: Configuration file for Hardhat (smart contract development environment).
-   `package.json`: Project metadata, dependencies, and scripts.
-   `.env.example`: Example environment variable file.

## Contributing

Contributions are welcome! Please follow the standard fork-and-pull-request workflow.
(Further details can be added here, like coding standards, issue reporting guidelines, etc.)

## License

This project is licensed under the MIT License. See the `LICENSE` file (if one exists) or `package.json` for more details.
(Note: A `LICENSE` file was not explicitly listed in the `ls` output, but `package.json` specifies "MIT".)