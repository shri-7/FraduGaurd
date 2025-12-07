const fraudEngine = require('../services/fraudEngine');

console.log('=== Fraud Detection Engine Tests ===\n');

// Test 1: Identity Fraud - Duplicate National ID
console.log('Test 1: Duplicate National ID Detection');
const existingPatients = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    nationalId: 'AAAA-BBBB-CCCC',
  },
];

const newPatient1 = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '9876543210',
  nationalId: 'AAAA-BBBB-CCCC', // Same as John
};

const result1 = fraudEngine.checkIdentityFraud(newPatient1, existingPatients);
console.log('Result:', result1);
console.log('Expected: Score 100, Flag: DUPLICATE_NATIONAL_ID\n');

// Test 2: Identity Fraud - Duplicate Email
console.log('Test 2: Duplicate Email Detection');
const newPatient2 = {
  name: 'Jane Smith',
  email: 'john@example.com', // Same as John
  phone: '9876543210',
  nationalId: 'XXXX-YYYY-ZZZZ',
};

const result2 = fraudEngine.checkIdentityFraud(newPatient2, existingPatients);
console.log('Result:', result2);
console.log('Expected: Score 85, Flag: DUPLICATE_EMAIL\n');

// Test 3: Claim Risk - High Amount
console.log('Test 3: High Amount Claim Detection');
const claim1 = {
  amount: 150000, // Above threshold
  claimType: 'HOSPITALIZATION',
  description: 'Emergency surgery',
};

const patient1 = {
  registeredAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
};

const result3 = fraudEngine.scoreClaimRisk(claim1, patient1, []);
console.log('Result:', result3);
console.log('Expected: Score > 0, Flag: HIGH_AMOUNT, Level: MEDIUM or HIGH\n');

// Test 4: Claim Risk - Early Claim
console.log('Test 4: Early Claim Detection');
const claim2 = {
  amount: 5000,
  claimType: 'MEDICATION',
  description: 'Regular medication',
};

const patient2 = {
  registeredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
};

const result4 = fraudEngine.scoreClaimRisk(claim2, patient2, []);
console.log('Result:', result4);
console.log('Expected: Score > 0, Flag: EARLY_CLAIM, Level: MEDIUM\n');

// Test 5: Claim Risk - Frequent Claims
console.log('Test 5: Frequent Claims Detection');
const claim3 = {
  amount: 5000,
  claimType: 'OUTPATIENT',
  description: 'Regular checkup',
};

const patient3 = {
  registeredAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
};

const patientHistory = [
  { createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  { createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
  { createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
  { createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) },
  { createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
  { createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
];

const result5 = fraudEngine.scoreClaimRisk(claim3, patient3, patientHistory);
console.log('Result:', result5);
console.log('Expected: Score > 0, Flag: FREQUENT_CLAIMS, Level: MEDIUM or HIGH\n');

// Test 6: Combined Evaluation
console.log('Test 6: Combined Fraud Evaluation');
const newPatient3 = {
  name: 'Bob Johnson',
  email: 'bob@example.com',
  phone: '5555555555',
  nationalId: 'DDDD-EEEE-FFFF',
};

const claim4 = {
  amount: 200000, // High amount
  claimType: 'SURGERY',
  description: 'Major surgery',
};

const patient4 = {
  registeredAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
};

const result6 = fraudEngine.evaluateClaim(claim4, newPatient3, {
  existingPatients,
  patientClaims: [],
});

console.log('Result:', result6);
console.log('Expected: Combined score with multiple flags\n');

console.log('=== All Tests Complete ===');
