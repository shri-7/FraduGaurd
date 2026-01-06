const assert = require('assert');
(async () => {
  console.log('ML Scorer tests starting...');
  const ml = require('..');
  await ml.init();

  const claim = {
    patientWallet: '0x1111111111111111111111111111111111111111',
    providerWallet: '0x2222222222222222222222222222222222222222',
    amountInr: 65000,
    claimType: 'Hospitalization',
    description: 'Appendectomy surgery and recovery',
    billingCodes: ['SURG001','MED001','MED002'],
    serviceDate: new Date(Date.now() - 3*24*3600*1000).toISOString(),
    serviceTokenIssuedAt: new Date(Date.now() - 2*24*3600*1000).toISOString(),
    serviceTokenId: 'token-abc',
    createdAt: new Date().toISOString(),
  };

  const ctx = {
    patient: { nationalIdHash: 'deadbeef' },
    patientClaims: [
      { createdAt: new Date(Date.now() - 20*24*3600*1000).toISOString(), amountInr: 40000, description: 'Fracture treatment' },
      { createdAt: new Date(Date.now() - 50*24*3600*1000).toISOString(), amountInr: 15000, description: 'Lab tests' },
    ],
    providerClaims: [
      { status: 'APPROVED', amountInr: 50000, fraudFlags: [] },
      { status: 'APPROVED', amountInr: 60000, fraudFlags: [] },
      { status: 'REJECTED', amountInr: 120000, fraudFlags: ['HIGH_AMOUNT'] },
    ],
  };

  const result = await ml.scoreClaim(claim, ctx);
  console.log('Score:', result.score01);
  console.log('Top features:', result.details.top_features);
  assert.ok(result.features, 'features must be present');
  assert.ok(Array.isArray(result.details.top_features), 'top_features must be array');
  assert.ok(result.details.top_features.length > 0 && result.details.top_features.length <= 3, 'top_features must have 1..3');
  if (result.score01 !== null) {
    assert.ok(result.score01 >= 0 && result.score01 <= 1, 'score01 must be within [0,1]');
  }

  // IPFS mock test
  const ipfs = require('../../services/ipfsService');
  const hash = await ipfs.uploadToIPFS({ hello: 'world' }, 'test.json');
  console.log('IPFS hash:', hash);
  assert.ok(typeof hash === 'string' && hash.length > 0, 'ipfs hash must be a string');

  console.log('All ML tests passed.');
})();
