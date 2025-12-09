# MetaMask Configuration for FraudGuard

## Network Configuration

### Add Custom Network to MetaMask

1. Open MetaMask extension
2. Click network dropdown (top-left corner)
3. Click **"Add a custom network"**
4. Fill in these exact values:

```
Network name:        Ganache UI
New RPC URL:         http://127.0.0.1:8545
Chain ID:            1337
Currency symbol:     ETH
Block explorer URL:  (leave empty)
```

5. Click **Save**

---

## Admin Account Configuration

### Import Admin Account

1. Click account icon (top-right corner)
2. Click **"Import Account"**
3. Select **"Private Key"**
4. Paste this private key:
   ```
   0x05d9ec48f1417b43d0a2ad3d8232f40d3e63b3156faa319c00cb8d88709f6e2e
   ```
5. Click **Import**
6. Account name: `Admin Account` (or any name you prefer)

### Admin Account Details

```
Account Name:        Admin Account
Address:             0x179EDCfca47a04142905320902A472305a3205DF
Private Key:         0x05d9ec48f1417b43d0a2ad3d8232f40d3e63b3156faa319c00cb8d88709f6e2e
Balance:             100 ETH
Network:             Ganache UI (Chain ID 1337)
```

---

## Switch to Ganache Network

1. Click network dropdown in MetaMask
2. Select **"Ganache UI"**
3. You should see:
   - Network name: "Ganache UI"
   - Balance: 100 ETH
   - Chain ID: 1337

---

## Verification Checklist

- [ ] Network "Ganache UI" added to MetaMask
- [ ] RPC URL is `http://127.0.0.1:8545`
- [ ] Chain ID is `1337`
- [ ] Admin account imported
- [ ] Admin account shows 100 ETH balance
- [ ] MetaMask is switched to "Ganache UI" network

---

## Troubleshooting

### MetaMask shows "Wrong Chain ID"

**Solution:**
1. Delete the network from MetaMask
2. Add it again with exact values:
   - Chain ID: `1337` (not 5777 or other values)
   - RPC URL: `http://127.0.0.1:8545`

### MetaMask shows 0 ETH balance

**Solution:**
1. Disconnect from Ganache UI network
2. Switch to another network (e.g., Ethereum Mainnet)
3. Switch back to Ganache UI
4. Refresh the page
5. Balance should update to 100 ETH

### Admin account not showing in MetaMask

**Solution:**
1. Click account icon (top-right)
2. Click "Import Account"
3. Paste private key: `0x05d9ec48f1417b43d0a2ad3d8232f40d3e63b3156faa319c00cb8d88709f6e2e`
4. Click "Import"

### MetaMask can't connect to Ganache

**Solution:**
1. Ensure Ganache UI is running
2. Ensure RPC URL is correct: `http://127.0.0.1:8545`
3. Test connection: `curl http://127.0.0.1:8545`
4. Restart MetaMask if needed

---

## Quick Reference

### Network Details
| Setting | Value |
|---------|-------|
| Network Name | Ganache UI |
| RPC URL | http://127.0.0.1:8545 |
| Chain ID | 1337 |
| Currency | ETH |

### Admin Account
| Setting | Value |
|---------|-------|
| Account Name | Admin Account |
| Address | 0x179EDCfca47a04142905320902A472305a3205DF |
| Private Key | 0x05d9ec48f1417b43d0a2ad3d8232f40d3e63b3156faa319c00cb8d88709f6e2e |
| Balance | 100 ETH |

---

## Using Admin Account for Login

1. Ensure MetaMask is switched to "Ganache UI" network
2. Ensure admin account is selected in MetaMask
3. Go to: `http://localhost:5173/login`
4. Select: "System Administrator"
5. Enter password: `Sit@1234`
6. Click: "Connect Wallet & Login"
7. MetaMask popup will appear
8. Click "Connect" to approve

---

## Additional Accounts (Optional)

If you want to import other accounts from Ganache UI:

1. Open Ganache UI application
2. Go to **ACCOUNTS** tab
3. Click the key icon next to any account
4. Copy the private key
5. In MetaMask:
   - Click account icon
   - Click "Import Account"
   - Paste the private key
   - Click "Import"

---

## Network Switching

To switch between networks in MetaMask:

1. Click network dropdown (top-left)
2. Select desired network:
   - "Ganache UI" (for local development)
   - "Ethereum Mainnet" (for production)
   - Other networks as needed

---

## Security Notes

⚠️ **For Development Only**
- Private keys are visible in this file (for demo purposes)
- Never use these keys on mainnet
- Never share private keys
- This is a local development setup only

---

## Support

If you have issues with MetaMask configuration:
1. Check the troubleshooting section above
2. Verify Ganache UI is running
3. Verify RPC URL is correct
4. Verify Chain ID is 1337
5. Try refreshing the page
6. Try restarting MetaMask

---

**MetaMask is configured! You're ready to login. 🚀**
