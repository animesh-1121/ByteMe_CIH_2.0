// scripts/deploy.js
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Starting deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");

  // Deploy LearnToken first
  console.log("\n--- Deploying LearnToken ---");
  const LearnToken = await ethers.getContractFactory("LearnToken");
  const learnToken = await LearnToken.deploy();
  await learnToken.deployed();
  
  console.log("LearnToken deployed to:", learnToken.address);
  console.log("Transaction hash:", learnToken.deployTransaction.hash);

  // Deploy LearnPlatform with LearnToken address
  console.log("\n--- Deploying LearnPlatform ---");
  const LearnPlatform = await ethers.getContractFactory("LearnPlatform");
  const learnPlatform = await LearnPlatform.deploy(learnToken.address);
  await learnPlatform.deployed();
  
  console.log("LearnPlatform deployed to:", learnPlatform.address);
  console.log("Transaction hash:", learnPlatform.deployTransaction.hash);

  // Transfer ownership of LearnToken to LearnPlatform for minting
  console.log("\n--- Setting up permissions ---");
  const transferOwnershipTx = await learnToken.transferOwnership(learnPlatform.address);
  await transferOwnershipTx.wait();
  console.log("LearnToken ownership transferred to LearnPlatform");

  // Verify the setup
  console.log("\n--- Verifying deployment ---");
  const tokenName = await learnToken.name();
  const tokenSymbol = await learnToken.symbol();
  const totalSupply = await learnToken.totalSupply();
  
  console.log("Token Name:", tokenName);
  console.log("Token Symbol:", tokenSymbol);
  console.log("Total Supply:", ethers.utils.formatEther(totalSupply));

  // Save deployment addresses to a JSON file
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      LearnToken: {
        address: learnToken.address,
        transactionHash: learnToken.deployTransaction.hash
      },
      LearnPlatform: {
        address: learnPlatform.address,
        transactionHash: learnPlatform.deployTransaction.hash
      }
    },
    timestamp: new Date().toISOString()
  };

  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, ${hre.network.name}.json);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(\nDeployment info saved to: ${deploymentFile});

  // Create .env file with contract addresses
  const envContent = `
# Contract Addresses (${hre.network.name})
LEARN_TOKEN_ADDRESS=${learnToken.address}
LEARN_PLATFORM_ADDRESS=${learnPlatform.address}
NETWORK_NAME=${hre.network.name}
DEPLOYER_ADDRESS=${deployer.address}
`;

  const envFile = path.join(__dirname, '..', '.env.contracts');
  fs.writeFileSync(envFile, envContent);
  console.log(Contract addresses saved to: .env.contracts);

  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("LearnToken:", learnToken.address);
  console.log("LearnPlatform:", learnPlatform.address);
  console.log("Network:", hre.network.name);
  
  if (hre.network.name !== "hardhat") {
    console.log("\nTo verify contracts on Polygonscan:");
    console.log(npx hardhat verify --network ${hre.network.name} ${learnToken.address});
    console.log(npx hardhat verify --network ${hre.network.name} ${learnPlatform.address} "${learnToken.address}");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });