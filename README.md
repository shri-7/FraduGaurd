# Fraud Detection in Privacy Preserving Health Insurance using Blockchain

A comprehensive blockchain-based system for detecting insurance fraud while preserving patient privacy. This monorepo project combines smart contracts, backend fraud detection algorithms, and a modern React frontend to create a transparent and secure insurance claim processing platform.

## 🏗️ Architecture Overview

```
fraud-insurance-blockchain/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API and blockchain clients
│   │   ├── store/           # Zustand state management
│   │   └── contracts/       # ABI and contract addresses (synced)
│   └── scripts/
│       └── sync-abi.cjs     # Syncs contract ABI from backend
│
├── backend/                  # Node.js + Express + Hardhat
│   ├── contracts/           # Solidity smart contracts
│   ├── scripts/             # Deployment scripts
│   ├── services/            # Fraud detection, IPFS, blockchain
│   ├── index.js             # Express server
│   └── hardhat.config.js    # Hardhat configuration
│
└── package.json             # Root workspace configuration
```

## 🔑 Key Features

### 1. **Advanced Fraud Detection**
- **Identity Fraud Check**: Detects duplicate national IDs, emails, and similar names
- **Claim Risk Scoring**: Evaluates high amounts, frequent claims, and early claims
- **Weighted Scoring**: Combines identity and claim risk factors for comprehensive assessment
- **Fraud Flags**: Generates actionable fraud indicators for review

### 2. **Privacy-Preserving Design**
- Sensitive claim data stored on IPFS via Pinata
- Only fraud scores, flags, and IPFS hashes recorded on-chain
- National IDs hashed before blockchain storage
- Complete audit trail with immutable records

### 3. **Blockchain Integration**
- **Smart Contract**: `InsuranceFraudSystem.sol` manages patients, providers, and claims
- **On-Chain Storage**: Fraud results, claim status, and IPFS references
- **Event Logging**: Comprehensive events for all transactions
- **Role-Based Access**: Owner, fraud oracle, and provider roles

### 4. **Multi-Role System**
- **Patients**: Register, submit claims, view claim history
- **Insurance Providers**: Review claims, approve/reject based on fraud assessment
- **System Administrators**: Manage providers, view system statistics

### 5. **Modern UI/UX**
- Responsive design with Tailwind CSS
- Real-time fraud assessment feedback
- Interactive dashboards with charts and analytics
- Metamask wallet integration

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Routing**: React Router v6
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form
- **Charts**: Recharts
- **Blockchain**: ethers.js
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### Backend
- **Runtime**: Node.js
- **Server**: Express.js
- **Blockchain**: Hardhat + ethers.js
- **Smart Contracts**: Solidity 0.8.20
- **IPFS**: Pinata API
- **Environment**: dotenv
- **Utilities**: UUID, Crypto

### Blockchain
- **Network**: Ganache (local Ethereum)
- **Wallet**: Metamask
- **Contract Standard**: OpenZeppelin (Ownable, Counters)

## 📋 Prerequisites

- Node.js v16+ and npm v8+
- Metamask browser extension
- Ganache CLI or Ganache GUI (for local blockchain)
- Pinata account (for IPFS storage)

## 🚀 Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 2. Configure Environment Variables

**Backend** (`backend/.env`):
```bash
# Copy from .env.example
cp backend/.env.example backend/.env

# Edit backend/.env with your values
GANACHE_RPC_URL=http://127.0.0.1:8545
DEPLOYER_PRIVATE_KEY=0x...  # From Ganache
CHAIN_ID=5777
PINATA_JWT=your_pinata_jwt_token
PINATA_GATEWAY_BASE=https://gateway.pinata.cloud/ipfs
PORT=4000
```

**Frontend** (`frontend/.env`):
```bash
# Copy from .env.example
cp frontend/.env.example frontend/.env

# Edit frontend/.env
VITE_API_BASE_URL=http://localhost:4000
VITE_CHAIN_ID=5777
VITE_GANACHE_RPC_URL=http://127.0.0.1:8545
```

### 3. Start Ganache

```bash
# Using Ganache CLI
ganache-cli --deterministic --accounts 10 --host 127.0.0.1 --port 8545

# Or use Ganache GUI and configure to run on port 8545
```

### 4. Compile and Deploy Smart Contracts

```bash
cd backend

# Compile contracts
npm run compile

# Deploy to Ganache
npm run deploy

# Note: deployment.json will be created with contract address and ABI
```

### 5. Start Backend Server

```bash
cd backend
npm run start
# Server runs on http://localhost:4000
```

### 6. Start Frontend Development Server

```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

## 📖 Usage Guide

### Patient Flow

1. **Register**: Navigate to `/patient/register`
   - Enter personal information (name, email, phone, national ID)
   - Connect Metamask wallet
   - System performs identity fraud check
   - Receive fraud assessment

2. **Submit Claim**: Navigate to `/patient/claims/new`
   - Select insurance provider
   - Choose claim type and amount
   - Add description
   - System evaluates claim for fraud
   - Claim recorded on blockchain

3. **View Claims**: Navigate to `/patient/dashboard`
   - View all submitted claims
   - Check fraud assessment and status
   - Access IPFS data links

### Provider Flow

1. **Register**: Navigate to `/provider/register`
   - Enter provider name and contact email
   - Connect Metamask wallet
   - Wait for admin approval

2. **Review Claims**: Navigate to `/provider/dashboard`
   - View pending claims with fraud scores
   - See analytics and charts
   - Approve or reject claims
   - Monitor approval rates

### Admin Flow

1. **Login**: Select "System Administrator" role on login page

2. **Manage Providers**: Navigate to `/admin/dashboard`
   - Approve or reject pending providers
   - View provider list and status

3. **Monitor System**: View system statistics
   - Total patients and providers
   - Claims by risk level
   - Claims by status
   - Fraud detection metrics

## 🔍 Fraud Detection Algorithms

### Algorithm 1: Identity Fraud Check

**Checks**:
- Exact match of national ID (Score: 100)
- Exact match of email (Score: 85)
- Exact match of phone (Score: 80)
- Name similarity > 85% (Score: 70)

**Output**: Fraud score (0-100), flags, and reasons

### Algorithm 2: Claim Risk Scoring

**Rules**:
1. **High Amount**: Claim amount > 100,000 units
   - Score: Up to 40 points
   - Flag: `HIGH_AMOUNT`

2. **Frequent Claims**: > 5 claims in last 30 days
   - Score: 30 points
   - Flag: `FREQUENT_CLAIMS`

3. **Early Claim**: Policy age < 30 days
   - Score: 25 points
   - Flag: `EARLY_CLAIM`

**Fraud Levels**:
- **LOW**: Score < 40
- **MEDIUM**: Score 40-69
- **HIGH**: Score ≥ 70

### Algorithm 3: Combined Evaluation

Combines identity fraud (40% weight) and claim risk (60% weight) for final assessment.

## 📡 API Endpoints

### Patient Endpoints
- `POST /api/patient/register` - Register new patient
- `GET /api/patient/:walletAddress` - Get patient details
- `GET /api/claims/patient/:walletAddress` - Get patient claims

### Provider Endpoints
- `POST /api/provider/register` - Register new provider
- `GET /api/provider/:walletAddress` - Get provider details
- `POST /api/provider/:walletAddress/approve` - Approve provider (admin)
- `POST /api/provider/:walletAddress/reject` - Reject provider (admin)
- `GET /api/providers` - Get all providers

### Claim Endpoints
- `POST /api/claim` - Create new claim
- `GET /api/claim/:claimId` - Get claim details
- `GET /api/claims/patient/:walletAddress` - Get patient claims
- `GET /api/claims/provider/:walletAddress` - Get provider claims
- `POST /api/claim/:claimId/approve` - Approve claim
- `POST /api/claim/:claimId/reject` - Reject claim

### Admin Endpoints
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/users` - Get all users
- `GET /api/health` - Health check

## 🧪 Testing

### Manual Testing Workflow

1. **Create Test Accounts**:
   - Patient 1: John Doe
   - Patient 2: Jane Smith
   - Provider 1: HealthCare Insurance Co.

2. **Test Identity Fraud Detection**:
   - Register Patient 1
   - Try registering with same email (should flag)
   - Try registering with similar name (should flag)

3. **Test Claim Fraud Detection**:
   - Submit high-value claim (should flag HIGH_AMOUNT)
   - Submit multiple claims quickly (should flag FREQUENT_CLAIMS)
   - Submit claim within 30 days of registration (should flag EARLY_CLAIM)

4. **Test Provider Workflow**:
   - Register provider (status: PENDING)
   - Admin approves provider
   - Provider reviews and approves/rejects claims

## 📊 Smart Contract Details

### InsuranceFraudSystem.sol

**Key Structs**:
- `Patient`: Address, national ID hash, registration timestamp
- `InsuranceProvider`: Address, name, approval status
- `Claim`: Full claim data with fraud assessment

**Key Functions**:
- `registerPatient()`: Register patient on-chain
- `registerProvider()`: Register provider (pending approval)
- `approveProvider()`: Approve provider (owner only)
- `createClaim()`: Create claim (approved provider only)
- `setFraudResultForClaim()`: Set fraud assessment (oracle only)
- `approveClaim()`: Approve claim (owner only)
- `rejectClaim()`: Reject claim (owner only)

**Events**:
- `PatientRegistered`
- `ProviderRegistered`
- `ProviderApproved`
- `ProviderRejected`
- `ClaimCreated`
- `ClaimFraudEvaluated`
- `ClaimStatusChanged`

## 🔐 Security Considerations

1. **Private Key Management**: Never commit `.env` files with private keys
2. **IPFS Data**: Use Pinata JWT for authenticated uploads
3. **Access Control**: Role-based access via Ownable pattern
4. **Data Hashing**: National IDs hashed before on-chain storage
5. **Fraud Oracle**: Separate address for fraud assessment authority

## 🐛 Troubleshooting

### Metamask Connection Issues
- Ensure Ganache is running on correct port (8545)
- Add custom network to Metamask with RPC URL
- Import test accounts from Ganache into Metamask

### Contract Deployment Fails
- Check Ganache is running: `http://127.0.0.1:8545`
- Verify DEPLOYER_PRIVATE_KEY is valid
- Run `npm run clean` then `npm run compile`

### IPFS Upload Fails
- Verify PINATA_JWT is valid
- Check Pinata account has remaining quota
- Mock IPFS hashes are used if Pinata unavailable

### Frontend Can't Connect to Backend
- Ensure backend is running on port 4000
- Check VITE_API_BASE_URL in frontend/.env
- Verify CORS is enabled in Express

## 📈 Future Enhancements

1. **Database Integration**: Replace in-memory store with MongoDB/PostgreSQL
2. **Advanced ML**: Implement machine learning models for fraud detection
3. **Multi-Chain**: Support for Polygon, Arbitrum, and other networks
4. **Insurance Products**: Multiple insurance product types
5. **Claims History**: Detailed historical analytics
6. **Notifications**: Email/SMS alerts for claim status
7. **Document Upload**: Secure document storage and verification
8. **Audit Logs**: Comprehensive audit trail for compliance

## 📝 License

MIT License - See LICENSE file for details

## 👥 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review fraud detection algorithms

---

**Built with ❤️ for transparent and secure health insurance processing**
