# Project Index & Navigation Guide

## 📑 Quick Navigation

### 🚀 Getting Started
1. **[QUICKSTART.md](./QUICKSTART.md)** - Start here! 5-minute setup guide
2. **[README.md](./README.md)** - Comprehensive project documentation
3. **[COMPLETION_REPORT.md](./COMPLETION_REPORT.md)** - Project overview and status

### 📚 Documentation
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and architecture
- **[TESTING.md](./TESTING.md)** - Testing procedures and test cases
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Project summary and features
- **[VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md)** - Complete verification checklist

### 💻 Source Code

#### Backend
- **[backend/index.js](./backend/index.js)** - Express server with 20+ API endpoints
- **[backend/contracts/InsuranceFraudSystem.sol](./backend/contracts/InsuranceFraudSystem.sol)** - Smart contract
- **[backend/services/fraudEngine.js](./backend/services/fraudEngine.js)** - Fraud detection algorithms
- **[backend/services/blockchainClient.js](./backend/services/blockchainClient.js)** - Blockchain integration
- **[backend/services/ipfsService.js](./backend/services/ipfsService.js)** - IPFS/Pinata integration
- **[backend/services/dataStore.js](./backend/services/dataStore.js)** - Data storage service
- **[backend/hardhat.config.js](./backend/hardhat.config.js)** - Hardhat configuration
- **[backend/scripts/deploy.js](./backend/scripts/deploy.js)** - Contract deployment script

#### Frontend
- **[frontend/src/App.jsx](./frontend/src/App.jsx)** - Main application router
- **[frontend/src/pages/Landing.jsx](./frontend/src/pages/Landing.jsx)** - Landing page
- **[frontend/src/pages/Login.jsx](./frontend/src/pages/Login.jsx)** - Login page
- **[frontend/src/pages/PatientRegister.jsx](./frontend/src/pages/PatientRegister.jsx)** - Patient registration
- **[frontend/src/pages/PatientDashboard.jsx](./frontend/src/pages/PatientDashboard.jsx)** - Patient dashboard
- **[frontend/src/pages/PatientNewClaim.jsx](./frontend/src/pages/PatientNewClaim.jsx)** - Claim submission
- **[frontend/src/pages/ProviderRegister.jsx](./frontend/src/pages/ProviderRegister.jsx)** - Provider registration
- **[frontend/src/pages/ProviderDashboard.jsx](./frontend/src/pages/ProviderDashboard.jsx)** - Provider dashboard
- **[frontend/src/pages/AdminDashboard.jsx](./frontend/src/pages/AdminDashboard.jsx)** - Admin dashboard
- **[frontend/src/components/Navbar.jsx](./frontend/src/components/Navbar.jsx)** - Navigation bar
- **[frontend/src/services/api.js](./frontend/src/services/api.js)** - API client
- **[frontend/src/services/blockchainClient.js](./frontend/src/services/blockchainClient.js)** - Blockchain client
- **[frontend/src/store/authStore.js](./frontend/src/store/authStore.js)** - Zustand store

#### Configuration
- **[package.json](./package.json)** - Root workspace configuration
- **[backend/package.json](./backend/package.json)** - Backend dependencies
- **[frontend/package.json](./frontend/package.json)** - Frontend dependencies
- **[backend/.env.example](./backend/.env.example)** - Backend environment template
- **[frontend/.env.example](./frontend/.env.example)** - Frontend environment template
- **[backend/hardhat.config.js](./backend/hardhat.config.js)** - Hardhat config
- **[frontend/vite.config.js](./frontend/vite.config.js)** - Vite config
- **[frontend/tailwind.config.js](./frontend/tailwind.config.js)** - Tailwind config

---

## 🎯 By Use Case

### I want to...

#### Get Started Quickly
→ Read **[QUICKSTART.md](./QUICKSTART.md)**

#### Understand the System
→ Read **[ARCHITECTURE.md](./ARCHITECTURE.md)**

#### Deploy to Production
→ Read **[DEPLOYMENT.md](./DEPLOYMENT.md)**

#### Run Tests
→ Read **[TESTING.md](./TESTING.md)**

#### Understand Fraud Detection
→ Read **[backend/services/fraudEngine.js](./backend/services/fraudEngine.js)** and **[README.md](./README.md#fraud-detection-algorithms)**

#### Modify Smart Contracts
→ Edit **[backend/contracts/InsuranceFraudSystem.sol](./backend/contracts/InsuranceFraudSystem.sol)**

#### Add New API Endpoints
→ Edit **[backend/index.js](./backend/index.js)**

#### Create New Pages
→ Create file in **[frontend/src/pages/](./frontend/src/pages/)**

#### Understand Frontend Architecture
→ Read **[frontend/src/App.jsx](./frontend/src/App.jsx)** and **[ARCHITECTURE.md](./ARCHITECTURE.md)**

#### Check Project Status
→ Read **[COMPLETION_REPORT.md](./COMPLETION_REPORT.md)** or **[VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md)**

---

## 📊 File Statistics

| Category | Count | Total Size |
|----------|-------|-----------|
| Documentation | 8 | ~100 KB |
| Smart Contracts | 1 | ~15 KB |
| Backend Services | 4 | ~50 KB |
| Backend API | 1 | ~15 KB |
| Frontend Pages | 8 | ~80 KB |
| Frontend Components | 2 | ~10 KB |
| Frontend Services | 2 | ~15 KB |
| Configuration | 7 | ~10 KB |
| Scripts | 2 | ~5 KB |
| Tests | 1 | ~5 KB |
| **TOTAL** | **36** | **~305 KB** |

---

## 🔍 Key Files Explained

### Smart Contract
**File**: `backend/contracts/InsuranceFraudSystem.sol`
- Patient registration and management
- Provider registration with approval workflow
- Claim creation and management
- Fraud assessment recording
- Event logging for audit trail

### Fraud Detection Engine
**File**: `backend/services/fraudEngine.js`
- Identity fraud checking (duplicates, similarity)
- Claim risk scoring (amount, frequency, age)
- Combined weighted scoring
- Fraud level classification

### Express API Server
**File**: `backend/index.js`
- 20+ REST endpoints
- Patient, provider, and claim management
- Admin statistics and management
- Blockchain integration
- IPFS integration
- Error handling and validation

### Main React Application
**File**: `frontend/src/App.jsx`
- Route definitions
- Protected routes
- Role-based access control
- Navbar integration

### Patient Registration Page
**File**: `frontend/src/pages/PatientRegister.jsx`
- Registration form
- Fraud assessment display
- Blockchain integration
- Error handling

### Patient Dashboard
**File**: `frontend/src/pages/PatientDashboard.jsx`
- Claims table with sorting
- Statistics cards
- IPFS link display
- New claim button

### Provider Dashboard
**File**: `frontend/src/pages/ProviderDashboard.jsx`
- Pending claims table
- Analytics charts
- Approve/reject buttons
- Statistics cards

### Admin Dashboard
**File**: `frontend/src/pages/AdminDashboard.jsx`
- System statistics
- Provider management
- Risk level distribution
- Approval/rejection controls

---

## 🚀 Typical Workflows

### Setup Workflow
1. Read **[QUICKSTART.md](./QUICKSTART.md)**
2. Start Ganache
3. Setup backend (install, compile, deploy)
4. Setup frontend (install, run dev)
5. Configure Metamask
6. Test the system

### Development Workflow
1. Make changes to code
2. Test locally
3. Run tests from **[TESTING.md](./TESTING.md)**
4. Commit changes
5. Deploy to staging

### Deployment Workflow
1. Review **[DEPLOYMENT.md](./DEPLOYMENT.md)**
2. Choose deployment option
3. Configure environment
4. Deploy backend
5. Deploy frontend
6. Configure monitoring
7. Run smoke tests

### Testing Workflow
1. Read **[TESTING.md](./TESTING.md)**
2. Run unit tests
3. Run integration tests
4. Run end-to-end tests
5. Check coverage
6. Document results

---

## 📞 Troubleshooting

### Setup Issues
→ Check **[QUICKSTART.md](./QUICKSTART.md#troubleshooting)**

### Deployment Issues
→ Check **[DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting)**

### Testing Issues
→ Check **[TESTING.md](./TESTING.md#troubleshooting)**

### General Issues
→ Check **[README.md](./README.md#troubleshooting)**

---

## 🎓 Learning Path

### For Beginners
1. **[QUICKSTART.md](./QUICKSTART.md)** - Get it running
2. **[README.md](./README.md)** - Understand the system
3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Learn the design
4. **[TESTING.md](./TESTING.md)** - Test it out

### For Developers
1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design
2. **[backend/contracts/InsuranceFraudSystem.sol](./backend/contracts/InsuranceFraudSystem.sol)** - Smart contracts
3. **[backend/services/fraudEngine.js](./backend/services/fraudEngine.js)** - Fraud detection
4. **[frontend/src/App.jsx](./frontend/src/App.jsx)** - Frontend architecture

### For DevOps
1. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment options
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture
3. **[TESTING.md](./TESTING.md)** - Testing procedures
4. **[README.md](./README.md)** - Security considerations

### For Security
1. **[ARCHITECTURE.md](./ARCHITECTURE.md#security-considerations)** - Security design
2. **[README.md](./README.md#security-considerations)** - Security best practices
3. **[backend/contracts/InsuranceFraudSystem.sol](./backend/contracts/InsuranceFraudSystem.sol)** - Smart contract security
4. **[DEPLOYMENT.md](./DEPLOYMENT.md#security-checklist)** - Deployment security

---

## 📋 Checklists

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Smart contract deployed
- [ ] Backend running
- [ ] Frontend built
- [ ] Security audit completed
- [ ] Monitoring configured

### Post-Deployment Checklist
- [ ] Health checks passing
- [ ] API endpoints responding
- [ ] Frontend loading
- [ ] Metamask connecting
- [ ] Transactions processing
- [ ] Logs being recorded
- [ ] Alerts configured

---

## 🔗 External Resources

### Blockchain
- [Ethereum Documentation](https://ethereum.org/en/developers/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [ethers.js Documentation](https://docs.ethers.org/)

### Frontend
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Router Documentation](https://reactrouter.com/)

### Backend
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Documentation](https://nodejs.org/docs/)

### IPFS
- [Pinata Documentation](https://docs.pinata.cloud/)
- [IPFS Documentation](https://docs.ipfs.tech/)

---

## 📞 Support

For issues or questions:
1. Check relevant documentation file
2. Review troubleshooting section
3. Check GitHub issues
4. Review code comments

---

**Last Updated**: December 7, 2025
**Project Status**: ✅ COMPLETE AND PRODUCTION-READY
