# System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Patient    │  │   Provider   │  │    Admin     │           │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│         │                 │                  │                   │
│         └─────────────────┼──────────────────┘                   │
│                           │                                      │
│                    ┌──────▼──────┐                               │
│                    │ Zustand     │                               │
│                    │ State Store │                               │
│                    └──────┬──────┘                               │
│                           │                                      │
│         ┌─────────────────┼─────────────────┐                   │
│         │                 │                 │                   │
│    ┌────▼────┐      ┌─────▼─────┐    ┌────▼────┐               │
│    │ API     │      │ Blockchain│    │ ethers  │               │
│    │ Client  │      │ Client    │    │ .js     │               │
│    └────┬────┘      └─────┬─────┘    └────┬────┘               │
│         │                 │               │                    │
└─────────┼─────────────────┼───────────────┼────────────────────┘
          │                 │               │
          │                 │               │
┌─────────▼─────────────────▼───────────────▼────────────────────┐
│                    Backend (Express + Node)                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Express Server                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │
│  │  │   Patient   │  │   Provider  │  │   Claim     │     │  │
│  │  │   Routes    │  │   Routes    │  │   Routes    │     │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │
│  │  │   Admin     │  │   Health    │  │   Error     │     │  │
│  │  │   Routes    │  │   Check     │  │   Handler   │     │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                  │
│         │                 │                 │                  │
│    ┌────▼────────┐  ┌─────▼──────┐  ┌─────▼──────┐            │
│    │ Data Store  │  │ Fraud      │  │ Blockchain │            │
│    │ (In-Memory) │  │ Engine     │  │ Client     │            │
│    └────┬────────┘  └─────┬──────┘  └─────┬──────┘            │
│         │                 │               │                   │
│         │            ┌────▼──────┐       │                   │
│         │            │ IPFS       │       │                   │
│         │            │ Service    │       │                   │
│         │            │ (Pinata)   │       │                   │
│         │            └────┬──────┘       │                   │
│         │                 │               │                   │
└─────────┼─────────────────┼───────────────┼───────────────────┘
          │                 │               │
          │                 │               │
┌─────────▼─────────────────▼───────────────▼───────────────────┐
│                  Blockchain Layer                              │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │         Smart Contract: InsuranceFraudSystem             │ │
│  │                                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │ │
│  │  │   Patients   │  │  Providers   │  │   Claims     │  │ │
│  │  │   Mapping    │  │   Mapping    │  │   Mapping    │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Events: PatientRegistered, ProviderApproved,   │  │ │
│  │  │  ClaimCreated, ClaimFraudEvaluated, etc.        │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │         Network: Ganache (Local Ethereum)               │ │
│  │         RPC: http://127.0.0.1:8545                      │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘

          │                 │
          │                 │
┌─────────▼─────────────────▼────────────────────────────────────┐
│                  External Services                              │
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────────────┐   │
│  │   Pinata IPFS        │  │   Metamask Wallet            │   │
│  │   - Upload Claims    │  │   - Sign Transactions        │   │
│  │   - Store Reports    │  │   - Account Management       │   │
│  │   - Retrieve Data    │  │   - Network Switching        │   │
│  └──────────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components

```
App.jsx (Main Router)
├── Navbar.jsx (Shared)
├── Landing.jsx
├── Login.jsx
├── Patient Routes
│   ├── PatientRegister.jsx
│   ├── PatientDashboard.jsx
│   └── PatientNewClaim.jsx
├── Provider Routes
│   ├── ProviderRegister.jsx
│   └── ProviderDashboard.jsx
└── Admin Routes
    └── AdminDashboard.jsx
```

### Backend Services

```
index.js (Express Server)
├── services/
│   ├── fraudEngine.js
│   │   ├── checkIdentityFraud()
│   │   ├── scoreClaimRisk()
│   │   └── evaluateClaim()
│   ├── blockchainClient.js
│   │   ├── registerPatient()
│   │   ├── createClaim()
│   │   ├── setFraudResultForClaim()
│   │   └── getClaimDetails()
│   ├── ipfsService.js
│   │   ├── uploadToIPFS()
│   │   ├── retrieveFromIPFS()
│   │   └── getIPFSUrl()
│   └── dataStore.js
│       ├── upsertUser()
│       ├── createClaim()
│       ├── getClaimsByPatient()
│       └── getClaimsStats()
└── contracts/
    └── InsuranceFraudSystem.sol
```

## Data Flow Diagrams

### Patient Registration Flow

```
1. User fills registration form
   ↓
2. Frontend calls POST /api/patient/register
   ↓
3. Backend:
   a. Checks identity fraud against existing patients
   b. Stores user data in dataStore
   c. Hashes national ID
   d. Calls contract.registerPatient()
   ↓
4. Smart Contract:
   a. Stores patient mapping
   b. Emits PatientRegistered event
   ↓
5. Backend returns fraud assessment
   ↓
6. Frontend displays result to user
```

### Claim Submission Flow

```
1. User submits claim form
   ↓
2. Frontend calls POST /api/claim
   ↓
3. Backend:
   a. Uploads claim data to IPFS (Pinata)
   b. Gets IPFS hash for payload
   ↓
4. Fraud Engine evaluates:
   a. Checks identity fraud
   b. Scores claim risk
   c. Combines scores
   d. Generates fraud flags
   ↓
5. Backend:
   a. Uploads fraud report to IPFS
   b. Gets IPFS hash for report
   c. Calls contract.createClaim()
   d. Calls contract.setFraudResultForClaim()
   ↓
6. Smart Contract:
   a. Stores claim data
   b. Records fraud assessment
   c. Emits ClaimCreated and ClaimFraudEvaluated events
   ↓
7. Backend stores claim locally
   ↓
8. Frontend displays fraud assessment to user
```

### Claim Review Flow

```
1. Provider views pending claims in dashboard
   ↓
2. Frontend calls GET /api/claims/provider/:wallet
   ↓
3. Backend returns claims with fraud data
   ↓
4. Provider clicks Approve/Reject
   ↓
5. Frontend calls POST /api/claim/:id/approve (or reject)
   ↓
6. Backend calls contract.approveClaim() (or rejectClaim())
   ↓
7. Smart Contract:
   a. Updates claim status
   b. Emits ClaimStatusChanged event
   ↓
8. Frontend updates UI
```

## State Management

### Zustand Store (Frontend)

```javascript
useAuthStore
├── user: User object
├── walletAddress: string
├── role: "PATIENT" | "PROVIDER" | "SYS_ADMIN"
├── isConnected: boolean
├── setUser()
├── setWalletAddress()
├── setRole()
├── setIsConnected()
├── login()
└── logout()
```

### Data Store (Backend)

```javascript
dataStore
├── users: User[]
├── providers: InsuranceProvider[]
├── claims: Claim[]
├── upsertUser()
├── getUserByWallet()
├── getAllPatients()
├── upsertProvider()
├── getProviderByWallet()
├── createClaim()
├── getClaimsByPatient()
├── getClaimsByProvider()
└── getClaimsStats()
```

## Smart Contract State

```solidity
InsuranceFraudSystem
├── State Variables
│   ├── mapping(address => Patient) patients
│   ├── mapping(address => InsuranceProvider) providers
│   ├── mapping(uint256 => Claim) claims
│   ├── mapping(address => uint256[]) patientClaims
│   ├── mapping(address => uint256[]) providerClaims
│   ├── Counters.Counter claimIdCounter
│   ├── address fraudOracle
│   └── address owner (from Ownable)
└── Events
    ├── PatientRegistered
    ├── ProviderRegistered
    ├── ProviderApproved
    ├── ProviderRejected
    ├── ClaimCreated
    ├── ClaimFraudEvaluated
    └── ClaimStatusChanged
```

## Fraud Detection Pipeline

```
Input: New Claim
  ↓
┌─────────────────────────────────────────┐
│ Identity Fraud Check                    │
│ ├─ Check duplicate national ID          │
│ ├─ Check duplicate email                │
│ ├─ Check duplicate phone                │
│ └─ Check name similarity                │
└─────────────────────────────────────────┘
  ↓
  Score: 0-100
  Flags: [DUPLICATE_ID, DUPLICATE_EMAIL, ...]
  ↓
  If Score >= 85: Return HIGH immediately
  ↓
┌─────────────────────────────────────────┐
│ Claim Risk Scoring                      │
│ ├─ Check high amount (>100,000)         │
│ ├─ Check frequent claims (>5 in 30d)    │
│ └─ Check early claim (<30d policy age)  │
└─────────────────────────────────────────┘
  ↓
  Score: 0-100
  Flags: [HIGH_AMOUNT, FREQUENT_CLAIMS, ...]
  ↓
┌─────────────────────────────────────────┐
│ Combined Scoring                        │
│ ├─ Identity fraud: 40% weight           │
│ ├─ Claim risk: 60% weight               │
│ └─ Final score: 0-100                   │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Fraud Level Classification              │
│ ├─ LOW: Score < 40                      │
│ ├─ MEDIUM: Score 40-69                  │
│ └─ HIGH: Score >= 70                    │
└─────────────────────────────────────────┘
  ↓
Output: {
  fraudScore: 0-100,
  fraudLevel: "LOW" | "MEDIUM" | "HIGH",
  fraudFlags: [...],
  reasons: [...]
}
```

## API Request/Response Examples

### Register Patient

**Request**:
```json
POST /api/patient/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "nationalId": "AAAA-BBBB-CCCC",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f42e0"
}
```

**Response**:
```json
{
  "success": true,
  "patient": {
    "id": "uuid",
    "role": "PATIENT",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "nationalIdHash": "sha256hash",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f42e0",
    "createdAt": "2025-12-07T10:30:00Z"
  },
  "fraudScore": 0,
  "fraudLevel": "LOW",
  "fraudFlags": [],
  "reasons": ["No existing patients to compare"],
  "txHash": "0x..."
}
```

### Create Claim

**Request**:
```json
POST /api/claim
{
  "patientWallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42e0",
  "providerWallet": "0x123456789abcdef",
  "amount": 1000000000000000000,
  "claimType": "HOSPITALIZATION",
  "description": "Emergency room visit",
  "attachments": []
}
```

**Response**:
```json
{
  "success": true,
  "claim": {
    "id": "0",
    "patientAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f42e0",
    "providerAddress": "0x123456789abcdef",
    "amount": "1000000000000000000",
    "claimType": "HOSPITALIZATION",
    "description": "Emergency room visit",
    "ipfsHashPayload": "QmXxxx...",
    "ipfsHashFraudReport": "QmYyyy...",
    "fraudScore": 25,
    "fraudLevel": "LOW",
    "fraudFlags": ["EARLY_CLAIM"],
    "status": "PENDING",
    "createdAt": "2025-12-07T10:35:00Z"
  },
  "fraudScore": 25,
  "fraudLevel": "LOW",
  "fraudFlags": ["EARLY_CLAIM"],
  "reasons": ["Policy age (15 days) is less than minimum (30 days)"],
  "ipfsHashPayload": "QmXxxx...",
  "ipfsHashFraudReport": "QmYyyy...",
  "txHashCreate": "0x...",
  "txHashFraud": "0x..."
}
```

## Security Considerations

### Frontend Security
- Private keys never stored in frontend
- All sensitive operations delegated to backend
- Metamask handles key management
- CORS enabled for backend communication

### Backend Security
- Environment variables for sensitive data
- Input validation on all endpoints
- Role-based access control
- Hashing of sensitive data before blockchain

### Smart Contract Security
- Ownable pattern for access control
- Separate fraud oracle role
- No direct fund transfers
- Event logging for audit trail

### Data Privacy
- IPFS for off-chain storage
- Only hashes on-chain
- Encrypted data possible with Pinata
- Patient data never exposed in URLs

## Scalability Considerations

### Current Limitations
- In-memory data store (not persistent)
- Single blockchain node (Ganache)
- No database
- No caching layer

### Future Improvements
- PostgreSQL/MongoDB for persistent storage
- Redis for caching
- Multi-chain support
- Horizontal scaling with load balancing
- Database indexing for fast queries
- Batch processing for fraud detection

## Deployment Architecture

### Development
- Local Ganache node
- Express server on localhost:4000
- Vite dev server on localhost:5173
- In-memory data store

### Staging
- Sepolia testnet
- AWS EC2 for backend
- S3 for IPFS backup
- RDS for database

### Production
- Ethereum mainnet or L2 (Polygon/Arbitrum)
- Kubernetes for container orchestration
- PostgreSQL with replication
- CloudFlare CDN for frontend
- Pinata for IPFS with backup

---

**Last Updated**: December 2025
