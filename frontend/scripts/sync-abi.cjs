const fs = require('fs');
const path = require('path');

const backendArtifactPath = path.join(
  __dirname,
  '../../backend/artifacts/contracts/InsuranceFraudSystem.sol/InsuranceFraudSystem.json'
);

const backendDeploymentPath = path.join(
  __dirname,
  '../../backend/deployment.json'
);

const frontendContractsDir = path.join(__dirname, '../src/contracts');

// Create contracts directory if it doesn't exist
if (!fs.existsSync(frontendContractsDir)) {
  fs.mkdirSync(frontendContractsDir, { recursive: true });
}

try {
  // Check if backend artifacts exist
  if (fs.existsSync(backendArtifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(backendArtifactPath, 'utf8'));
    
    // Save ABI
    const abiContent = `export const INSURANCE_FRAUD_SYSTEM_ABI = ${JSON.stringify(artifact.abi, null, 2)};`;
    fs.writeFileSync(path.join(frontendContractsDir, 'abi.js'), abiContent);
    console.log('✓ ABI synced successfully');
  } else {
    console.warn('⚠ Backend artifacts not found. Run: cd backend && npm run compile');
  }

  // Check if deployment info exists
  if (fs.existsSync(backendDeploymentPath)) {
    const deployment = JSON.parse(fs.readFileSync(backendDeploymentPath, 'utf8'));
    
    // Save contract address
    const addressContent = `export const INSURANCE_FRAUD_SYSTEM_ADDRESS = '${deployment.contractAddress}';`;
    fs.writeFileSync(path.join(frontendContractsDir, 'address.js'), addressContent);
    console.log('✓ Contract address synced successfully');
  } else {
    console.warn('⚠ Deployment info not found. Run: cd backend && npm run deploy');
    
    // Create placeholder
    const addressContent = `export const INSURANCE_FRAUD_SYSTEM_ADDRESS = '';`;
    fs.writeFileSync(path.join(frontendContractsDir, 'address.js'), addressContent);
  }

  // Create index file
  const indexContent = `export { INSURANCE_FRAUD_SYSTEM_ABI } from './abi.js';
export { INSURANCE_FRAUD_SYSTEM_ADDRESS } from './address.js';
`;
  fs.writeFileSync(path.join(frontendContractsDir, 'index.js'), indexContent);
  console.log('✓ Contract exports synced successfully');
} catch (error) {
  console.error('Error syncing ABI:', error.message);
  process.exit(1);
}
