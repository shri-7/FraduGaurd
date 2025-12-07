const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying InsuranceFraudSystem contract...");

  const InsuranceFraudSystem = await hre.ethers.getContractFactory(
    "InsuranceFraudSystem"
  );
  const contract = await InsuranceFraudSystem.deploy();

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("InsuranceFraudSystem deployed to:", contractAddress);

  // Save contract address and ABI
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
  };

  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/InsuranceFraudSystem.sol/InsuranceFraudSystem.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const deploymentPath = path.join(__dirname, "../deployment.json");
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(
      {
        ...deploymentInfo,
        abi: artifact.abi,
      },
      null,
      2
    )
  );

  console.log("Deployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
