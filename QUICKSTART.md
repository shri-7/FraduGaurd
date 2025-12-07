# Quick Start Guide

Get the Fraud Detection Insurance Blockchain system running in 10 minutes.

## Prerequisites Checklist

- [ ] Node.js v16+ installed
- [ ] npm v8+ installed
- [ ] Ganache CLI installed: `npm install -g ganache-cli`
- [ ] Metamask browser extension installed
- [ ] Pinata account created (optional, system works with mock IPFS)

## Step 1: Start Ganache (Terminal 1)

```bash
ganache-cli --deterministic --accounts 10 --host 127.0.0.1 --port 8545
```

**Output should show**:
```
Ganache CLI v6.x.x (ganache-core: 2.x.x)
...
Listening on 127.0.0.1:8545
```

**Save the first private key** - you'll need it for deployment.

## Step 2: Setup Backend (Terminal 2)

```bash
cd d:\FraduGaurd\backend

# Copy environment file
copy .env.example .env

# Edit .env with:
# - DEPLOYER_PRIVATE_KEY from Ganache output
# - GANACHE_RPC_URL=http://127.0.0.1:8545
# - CHAIN_ID=5777

# Install dependencies
npm install

# Compile contracts
npm run compile

# Deploy to Ganache
npm run deploy

# Start backend server
npm start
```

**Expected output**:
```
Server running on http://localhost:4000
Blockchain client initialized with contract: 0x...
```

## Step 3: Setup Frontend (Terminal 3)

```bash
cd d:\FraduGaurd\frontend

# Copy environment file
copy .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

**Expected output**:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

## Step 4: Configure Metamask

1. **Open Metamask** in your browser
2. **Add Custom Network**:
   - Network Name: `Ganache`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `5777`
   - Currency Symbol: `ETH`
3. **Import Accounts**:
   - Click "Import Account"
   - Paste private keys from Ganache output
   - Import at least 3 accounts (for patient, provider, admin)

## Step 5: Test the System

### Access the Application

Open browser to: `http://localhost:5173`

### Test Patient Registration

1. Click "Get Started" or "Sign In Now"
2. Select "Patient" role
3. Click "Connect Wallet & Login"
4. Approve Metamask connection
5. Go to `/patient/register`
6. Fill in form:
   - Name: John Doe
   - Email: john@example.com
   - Phone: +1234567890
   - National ID: AAAA-BBBB-CCCC
7. Click "Register & Connect Wallet"
8. View fraud assessment result

### Test Provider Registration

1. Go to `/provider/register`
2. Fill in form:
   - Provider Name: HealthCare Insurance
   - Contact Email: provider@example.com
3. Click "Register & Connect Wallet"
4. Switch to admin account in Metamask
5. Go to `/admin/dashboard`
6. Approve the provider

### Test Claim Submission

1. Switch back to patient account
2. Go to `/patient/claims/new`
3. Select provider
4. Fill in claim:
   - Type: HOSPITALIZATION
   - Amount: 1000000000000000000 (1 ETH)
   - Description: Emergency room visit
5. Click "Submit Claim"
6. View fraud assessment
7. Go to `/patient/dashboard` to see claim

### Test Provider Review

1. Switch to provider account
2. Go to `/provider/dashboard`
3. View pending claims
4. Click "Approve" or "Reject"
5. View updated statistics

## Troubleshooting

### Metamask Shows "Wrong Network"
- Ensure Ganache is running on port 8545
- Verify custom network RPC URL is correct
- Restart Metamask

### Backend Won't Start
```bash
# Check if port 4000 is in use
netstat -ano | findstr :4000

# Kill process if needed
taskkill /PID <PID> /F
```

### Frontend Can't Connect to Backend
- Verify backend is running: `http://localhost:4000/api/health`
- Check VITE_API_BASE_URL in frontend/.env
- Clear browser cache and restart dev server

### Contract Deployment Fails
```bash
cd backend
npm run clean
npm run compile
npm run deploy
```

### Ganache Keeps Resetting
- Use `--deterministic` flag to keep same accounts
- Don't close Ganache window during testing

## Common Workflows

### Create Multiple Test Claims

```bash
# Terminal: Run fraud engine tests
cd backend
node test/fraudEngine.test.js
```

### View Blockchain Events

Use Hardhat console:
```bash
cd backend
npx hardhat console --network ganache
```

### Check Contract State

```javascript
// In Hardhat console
const contract = await ethers.getContractAt("InsuranceFraudSystem", "0x...");
const claims = await contract.getTotalClaimsCount();
console.log("Total claims:", claims.toString());
```

### Reset Everything

```bash
# Stop all servers (Ctrl+C in each terminal)

# Clear Ganache state
ganache-cli --deterministic --accounts 10 --host 127.0.0.1 --port 8545

# Restart backend
cd backend && npm start

# Restart frontend
cd frontend && npm run dev
```

## Next Steps

1. **Explore the Code**: Check `backend/services/fraudEngine.js` for fraud detection logic
2. **Customize Thresholds**: Edit `THRESHOLDS` in `fraudEngine.js`
3. **Add More Rules**: Extend fraud detection algorithms
4. **Connect Real IPFS**: Add Pinata JWT to `.env`
5. **Deploy to Testnet**: Use Sepolia or Goerli network

## API Endpoints Reference

```bash
# Health check
curl http://localhost:4000/api/health

# Register patient
curl -X POST http://localhost:4000/api/patient/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","phone":"123","nationalId":"ABC","walletAddress":"0x..."}'

# Get claims
curl http://localhost:4000/api/claims/patient/0x...

# Admin stats
curl http://localhost:4000/api/admin/stats
```

## Support

- Check README.md for detailed documentation
- Review fraud detection algorithms in backend/services/fraudEngine.js
- Check browser console for frontend errors
- Check terminal output for backend errors

---

**Happy testing! 🚀**
