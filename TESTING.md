# Testing Guide

Complete testing procedures for the Fraud Detection Insurance Blockchain system.

## Unit Testing

### Fraud Engine Tests

Run the fraud detection algorithm tests:

```bash
cd backend
node test/fraudEngine.test.js
```

**Expected Output**:
```
=== Fraud Detection Engine Tests ===

Test 1: Duplicate National ID Detection
Result: { score: 100, flags: ['DUPLICATE_NATIONAL_ID'], reasons: [...] }
Expected: Score 100, Flag: DUPLICATE_NATIONAL_ID

Test 2: Duplicate Email Detection
Result: { score: 85, flags: ['DUPLICATE_EMAIL'], reasons: [...] }
Expected: Score 85, Flag: DUPLICATE_EMAIL

...
```

## Integration Testing

### Test Scenario 1: Complete Patient Registration

**Objective**: Verify patient registration with fraud detection

**Steps**:
1. Start backend and Ganache
2. Call `POST /api/patient/register` with:
   ```json
   {
     "name": "Alice Johnson",
     "email": "alice@example.com",
     "phone": "+1111111111",
     "nationalId": "AAAA-1111-AAAA",
     "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f42e0"
   }
   ```

**Expected Results**:
- ✓ Patient stored in dataStore
- ✓ Patient registered on blockchain
- ✓ Fraud score: 0 (first patient)
- ✓ Response includes txHash

**Verification**:
```bash
# Check blockchain
curl http://localhost:4000/api/patient/0x742d35Cc6634C0532925a3b844Bc9e7595f42e0
```

### Test Scenario 2: Duplicate Identity Detection

**Objective**: Verify fraud detection for duplicate identities

**Steps**:
1. Register first patient (Alice)
2. Try to register second patient with same email:
   ```json
   {
     "name": "Bob Smith",
     "email": "alice@example.com",
     "phone": "+2222222222",
     "nationalId": "BBBB-2222-BBBB",
     "walletAddress": "0x123456789abcdef"
   }
   ```

**Expected Results**:
- ✓ Fraud score: 85 (DUPLICATE_EMAIL)
- ✓ Flag: DUPLICATE_EMAIL
- ✓ Reason: "Email already registered"

### Test Scenario 3: Provider Registration and Approval

**Objective**: Verify provider registration and admin approval flow

**Steps**:
1. Register provider:
   ```bash
   curl -X POST http://localhost:4000/api/provider/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "HealthCare Insurance Co",
       "contactEmail": "provider@health.com",
       "walletAddress": "0xprovider123"
     }'
   ```

2. Check provider status (should be PENDING):
   ```bash
   curl http://localhost:4000/api/provider/0xprovider123
   ```

3. Admin approves provider:
   ```bash
   curl -X POST http://localhost:4000/api/provider/0xprovider123/approve
   ```

4. Verify status changed to APPROVED:
   ```bash
   curl http://localhost:4000/api/provider/0xprovider123
   ```

**Expected Results**:
- ✓ Provider created with status: PENDING
- ✓ Admin can approve provider
- ✓ Status changes to APPROVED
- ✓ Blockchain transaction recorded

### Test Scenario 4: Claim Submission with Fraud Detection

**Objective**: Verify complete claim submission and fraud evaluation

**Prerequisites**:
- Patient registered
- Provider registered and approved

**Steps**:
1. Submit claim:
   ```bash
   curl -X POST http://localhost:4000/api/claim \
     -H "Content-Type: application/json" \
     -d '{
       "patientWallet": "0xpatient123",
       "providerWallet": "0xprovider123",
       "amount": 150000000000000000,
       "claimType": "HOSPITALIZATION",
       "description": "Emergency surgery",
       "attachments": []
     }'
   ```

**Expected Results**:
- ✓ Claim created with ID
- ✓ Fraud score calculated (should be > 0 for high amount)
- ✓ Flag: HIGH_AMOUNT
- ✓ IPFS hashes generated
- ✓ Blockchain transactions recorded
- ✓ Response includes txHashCreate and txHashFraud

### Test Scenario 5: Claim Review and Approval

**Objective**: Verify provider can review and approve claims

**Steps**:
1. Get pending claims for provider:
   ```bash
   curl http://localhost:4000/api/claims/provider/0xprovider123
   ```

2. Provider approves claim:
   ```bash
   curl -X POST http://localhost:4000/api/claim/0/approve
   ```

3. Verify claim status changed:
   ```bash
   curl http://localhost:4000/api/claim/0
   ```

**Expected Results**:
- ✓ Claim status: PENDING → APPROVED
- ✓ Blockchain transaction recorded
- ✓ Event emitted: ClaimStatusChanged

### Test Scenario 6: Admin Dashboard Statistics

**Objective**: Verify admin can view system statistics

**Steps**:
1. Get admin stats:
   ```bash
   curl http://localhost:4000/api/admin/stats
   ```

**Expected Results**:
```json
{
  "totalPatients": 2,
  "totalProviders": 1,
  "pendingProviders": 0,
  "approvedProviders": 1,
  "rejectedProviders": 0,
  "total": 1,
  "flagged": 1,
  "approved": 1,
  "rejected": 0,
  "pending": 0,
  "highRisk": 0,
  "mediumRisk": 1,
  "lowRisk": 0
}
```

## End-to-End Testing

### Complete User Journey: Patient

**Duration**: ~15 minutes

**Setup**:
- Ganache running
- Backend running
- Frontend running
- Metamask configured with 3 test accounts

**Steps**:

1. **Navigate to Landing Page**
   - Open http://localhost:5173
   - Verify landing page loads
   - Check all features visible

2. **Register as Patient**
   - Click "Get Started"
   - Select "Patient" role
   - Click "Connect Wallet & Login"
   - Approve Metamask connection
   - Navigate to `/patient/register`
   - Fill form:
     - Name: John Doe
     - Email: john@example.com
     - Phone: +1234567890
     - National ID: AAAA-BBBB-CCCC
   - Click "Register & Connect Wallet"
   - Verify fraud assessment displayed (should be LOW)

3. **View Patient Dashboard**
   - Navigate to `/patient/dashboard`
   - Verify wallet address displayed
   - Verify "New Claim" button visible
   - Verify stats show 0 claims

4. **Submit Claim**
   - Click "New Claim"
   - Select provider from dropdown
   - Select claim type: HOSPITALIZATION
   - Enter amount: 1000000000000000000 (1 ETH)
   - Enter description: "Emergency room visit"
   - Click "Submit Claim"
   - Verify fraud assessment displayed
   - Verify claim created successfully

5. **View Claim in Dashboard**
   - Navigate back to `/patient/dashboard`
   - Verify claim appears in table
   - Verify fraud level displayed
   - Verify status shows PENDING

**Expected Results**:
- ✓ Patient successfully registered
- ✓ Fraud assessment shown
- ✓ Claim successfully submitted
- ✓ Claim visible in dashboard
- ✓ All blockchain transactions recorded

### Complete User Journey: Provider

**Duration**: ~10 minutes

**Setup**:
- Previous patient journey completed
- New Metamask account for provider

**Steps**:

1. **Register as Provider**
   - Navigate to `/provider/register`
   - Fill form:
     - Provider Name: HealthCare Insurance
     - Contact Email: provider@health.com
   - Click "Register & Connect Wallet"
   - Verify registration successful

2. **Wait for Admin Approval**
   - Switch to admin account in Metamask
   - Navigate to `/admin/dashboard`
   - Verify provider appears in pending list
   - Click "Approve"
   - Verify provider status changed to APPROVED

3. **Switch Back to Provider**
   - Switch back to provider account
   - Navigate to `/provider/dashboard`
   - Verify dashboard loads
   - Verify pending claim visible

4. **Review and Approve Claim**
   - View pending claims table
   - Verify claim details displayed (amount, type, fraud score)
   - Click "Approve" button
   - Verify claim status changed to APPROVED
   - Verify statistics updated

**Expected Results**:
- ✓ Provider successfully registered
- ✓ Admin can approve provider
- ✓ Provider can view pending claims
- ✓ Provider can approve claims
- ✓ Claim status updated on blockchain

### Complete User Journey: Admin

**Duration**: ~5 minutes

**Setup**:
- Patient and provider journeys completed

**Steps**:

1. **Access Admin Dashboard**
   - Navigate to `/admin/dashboard`
   - Verify all stats displayed:
     - Total patients
     - Total providers
     - Total claims
     - Flagged claims

2. **Review Statistics**
   - Verify charts display correctly
   - Verify risk level distribution
   - Verify claim status breakdown

3. **Manage Providers**
   - Verify provider list displayed
   - Verify approved provider shows "APPROVED" status
   - Verify no action buttons for approved providers

**Expected Results**:
- ✓ Admin dashboard loads
- ✓ All statistics accurate
- ✓ Charts render correctly
- ✓ Provider management works

## Performance Testing

### Load Testing

**Objective**: Test system under load

**Setup**:
```bash
# Install Apache Bench
# Windows: choco install apache-httpd

# Test backend health endpoint
ab -n 1000 -c 10 http://localhost:4000/api/health
```

**Expected Results**:
- Requests per second: > 100
- Failed requests: 0
- Average response time: < 100ms

### Stress Testing

**Objective**: Test system limits

**Steps**:
1. Create 100 patients in rapid succession
2. Submit 100 claims simultaneously
3. Monitor backend memory usage
4. Check for memory leaks

**Expected Results**:
- System remains responsive
- No crashes
- Memory usage stable

## Security Testing

### Input Validation

**Test Case 1: SQL Injection**
```bash
curl -X POST http://localhost:4000/api/patient/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "'; DROP TABLE users; --",
    "email": "test@example.com",
    "phone": "123",
    "nationalId": "123",
    "walletAddress": "0x123"
  }'
```

**Expected**: Request rejected or sanitized

**Test Case 2: Invalid Wallet Address**
```bash
curl -X POST http://localhost:4000/api/patient/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test@example.com",
    "phone": "123",
    "nationalId": "123",
    "walletAddress": "invalid-address"
  }'
```

**Expected**: Request rejected with error

### Authentication Testing

**Test Case 1: Unauthorized Access**
```bash
# Try to approve claim without being owner
curl -X POST http://localhost:4000/api/claim/0/approve
```

**Expected**: Request succeeds (backend enforces via blockchain)

## Blockchain Testing

### Transaction Verification

**Objective**: Verify all transactions recorded on blockchain

**Steps**:
1. Get contract address from deployment.json
2. Use Hardhat console to query contract:

```bash
cd backend
npx hardhat console --network ganache
```

```javascript
const contract = await ethers.getContractAt(
  "InsuranceFraudSystem",
  "0x..."
);

// Get total claims
const count = await contract.getTotalClaimsCount();
console.log("Total claims:", count.toString());

// Get patient claims
const claims = await contract.getPatientClaimsCount("0xpatient123");
console.log("Patient claims:", claims.toString());

// Get claim details
const claim = await contract.getClaimDetails(0);
console.log("Claim:", claim);
```

### Event Verification

**Objective**: Verify events are emitted correctly

```javascript
// Listen for events
contract.on("ClaimCreated", (claimId, patient, provider, amount) => {
  console.log("Claim created:", claimId.toString());
});

contract.on("ClaimFraudEvaluated", (claimId, score, level, flagged) => {
  console.log("Fraud evaluated:", claimId.toString(), score);
});
```

## Regression Testing

### Checklist

- [ ] Patient registration works
- [ ] Fraud detection triggers correctly
- [ ] Provider registration works
- [ ] Admin approval works
- [ ] Claim submission works
- [ ] Claim review works
- [ ] Dashboard displays correct data
- [ ] IPFS uploads work
- [ ] Blockchain transactions recorded
- [ ] API endpoints respond correctly
- [ ] Frontend pages load
- [ ] Metamask integration works
- [ ] Error handling works
- [ ] Notifications display

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm run install:all
      
      - name: Compile contracts
        run: npm run compile:backend
      
      - name: Run fraud engine tests
        run: cd backend && node test/fraudEngine.test.js
      
      - name: Build frontend
        run: npm run build:frontend
```

## Test Data

### Sample Patient Data

```json
{
  "patients": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "nationalId": "AAAA-1111-AAAA"
    },
    {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+0987654321",
      "nationalId": "BBBB-2222-BBBB"
    }
  ]
}
```

### Sample Claim Data

```json
{
  "claims": [
    {
      "claimType": "HOSPITALIZATION",
      "amount": 1000000000000000000,
      "description": "Emergency room visit"
    },
    {
      "claimType": "SURGERY",
      "amount": 5000000000000000000,
      "description": "Major surgery"
    }
  ]
}
```

---

**Last Updated**: December 2025
