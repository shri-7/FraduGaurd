# Deployment Guide

Instructions for deploying the Fraud Detection Insurance Blockchain system to various environments.

## Environment Configurations

### Development (Local)

**Network**: Ganache (Local Ethereum)
**RPC URL**: http://127.0.0.1:8545
**Chain ID**: 5777
**Backend**: localhost:4000
**Frontend**: localhost:5173

### Staging (Sepolia Testnet)

**Network**: Ethereum Sepolia
**RPC URL**: https://sepolia.infura.io/v3/{PROJECT_ID}
**Chain ID**: 11155111
**Backend**: AWS EC2
**Frontend**: Vercel

### Production (Ethereum Mainnet)

**Network**: Ethereum Mainnet or Layer 2 (Polygon/Arbitrum)
**RPC URL**: https://mainnet.infura.io/v3/{PROJECT_ID}
**Chain ID**: 1 (Mainnet) or 137 (Polygon)
**Backend**: AWS ECS/EKS
**Frontend**: CloudFlare CDN

## Prerequisites

### Required Tools

- Node.js v18+
- npm v9+
- Docker (for containerization)
- AWS CLI (for AWS deployments)
- Hardhat (for smart contract deployment)
- Ethers.js (for blockchain interaction)

### Accounts & Credentials

- Infura account (for RPC endpoints)
- AWS account (for hosting)
- Vercel account (for frontend)
- Pinata account (for IPFS)
- Etherscan account (for contract verification)

## Smart Contract Deployment

### Step 1: Prepare for Deployment

```bash
cd backend

# Create .env for target network
cp .env.example .env

# Update .env with:
# - GANACHE_RPC_URL (or Infura URL for testnet/mainnet)
# - DEPLOYER_PRIVATE_KEY (from funded account)
# - CHAIN_ID (11155111 for Sepolia, 1 for Mainnet)
```

### Step 2: Compile Contracts

```bash
npm run compile

# Verify compilation
ls -la artifacts/contracts/
```

### Step 3: Deploy to Sepolia Testnet

```bash
# Update hardhat.config.js to include Sepolia network
# Then run:
npm run deploy

# Output will show:
# InsuranceFraudSystem deployed to: 0x...
# Deployment info saved to deployment.json
```

### Step 4: Verify Contract on Etherscan

```bash
# Get contract address from deployment.json
CONTRACT_ADDRESS="0x..."

# Verify on Etherscan
npx hardhat verify --network sepolia $CONTRACT_ADDRESS

# Output:
# Successfully verified contract InsuranceFraudSystem on Etherscan.
```

### Step 5: Update Frontend with Contract Address

```bash
# Copy deployment.json to frontend
cp backend/deployment.json frontend/src/contracts/

# Run sync script
cd frontend
npm run predev

# Verify ABI and address synced
cat src/contracts/address.js
```

## Backend Deployment

### Option 1: AWS EC2 Deployment

#### 1. Launch EC2 Instance

```bash
# AWS Console:
# - AMI: Ubuntu 22.04 LTS
# - Instance Type: t3.medium (2 vCPU, 4GB RAM)
# - Security Group: Allow ports 80, 443, 4000, 22
# - Key Pair: Create and save .pem file
```

#### 2. Connect to Instance

```bash
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

#### 3. Deploy Application

```bash
# Clone repository
git clone https://github.com/your-repo/fraud-insurance-blockchain.git
cd fraud-insurance-blockchain/backend

# Install dependencies
npm install

# Create .env for production
cat > .env << EOF
GANACHE_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
DEPLOYER_PRIVATE_KEY=0x...
CHAIN_ID=11155111
PINATA_JWT=your_pinata_jwt
PINATA_GATEWAY_BASE=https://gateway.pinata.cloud/ipfs
PORT=4000
INSURANCE_FRAUD_SYSTEM_ADDRESS=0x...
EOF

# Compile contracts
npm run compile

# Start with PM2
pm2 start index.js --name "fraud-backend"
pm2 save
pm2 startup
```

#### 4. Setup Nginx Reverse Proxy

```bash
sudo apt install -y nginx

# Create nginx config
sudo cat > /etc/nginx/sites-available/fraud-backend << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/fraud-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Setup SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx

sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### Option 2: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application
COPY . .

# Compile contracts
RUN npm run compile

# Expose port
EXPOSE 4000

# Start application
CMD ["npm", "start"]
```

#### 2. Create Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      - GANACHE_RPC_URL=${GANACHE_RPC_URL}
      - DEPLOYER_PRIVATE_KEY=${DEPLOYER_PRIVATE_KEY}
      - CHAIN_ID=${CHAIN_ID}
      - PINATA_JWT=${PINATA_JWT}
      - PORT=4000
    volumes:
      - ./backend:/app
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_BASE_URL=http://localhost:4000
    volumes:
      - ./frontend:/app
    restart: unless-stopped
```

#### 3. Deploy with Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend
```

### Option 3: AWS ECS Deployment

#### 1. Create ECR Repository

```bash
aws ecr create-repository --repository-name fraud-backend

# Get login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

#### 2. Build and Push Image

```bash
cd backend

docker build -t fraud-backend:latest .

docker tag fraud-backend:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fraud-backend:latest

docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fraud-backend:latest
```

#### 3. Create ECS Task Definition

```json
{
  "family": "fraud-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "fraud-backend",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fraud-backend:latest",
      "portMappings": [
        {
          "containerPort": 4000,
          "hostPort": 4000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "GANACHE_RPC_URL",
          "value": "https://sepolia.infura.io/v3/YOUR_KEY"
        },
        {
          "name": "CHAIN_ID",
          "value": "11155111"
        }
      ],
      "secrets": [
        {
          "name": "DEPLOYER_PRIVATE_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:fraud-backend-key"
        }
      ]
    }
  ]
}
```

#### 4. Create ECS Service

```bash
aws ecs create-service \
  --cluster fraud-cluster \
  --service-name fraud-backend \
  --task-definition fraud-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx]}"
```

## Frontend Deployment

### Option 1: Vercel Deployment

#### 1. Connect Repository

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd frontend
vercel
```

#### 2. Configure Environment Variables

In Vercel Dashboard:
- `VITE_API_BASE_URL`: https://your-backend-domain.com
- `VITE_CHAIN_ID`: 11155111
- `VITE_GANACHE_RPC_URL`: https://sepolia.infura.io/v3/YOUR_KEY

#### 3. Setup Auto-Deployment

```bash
# Connect GitHub repository
# Vercel will auto-deploy on push to main
```

### Option 2: AWS S3 + CloudFront

#### 1. Build Frontend

```bash
cd frontend
npm run build
```

#### 2. Create S3 Bucket

```bash
aws s3 mb s3://fraud-insurance-frontend

# Enable static website hosting
aws s3api put-bucket-website \
  --bucket fraud-insurance-frontend \
  --website-configuration file://website.json
```

#### 3. Upload Build Files

```bash
aws s3 sync dist/ s3://fraud-insurance-frontend/
```

#### 4. Create CloudFront Distribution

```bash
# AWS Console:
# - Origin: S3 bucket
# - Viewer Protocol Policy: Redirect HTTP to HTTPS
# - Default Root Object: index.html
# - Error Pages: 404 → index.html
```

### Option 3: GitHub Pages

#### 1. Update Vite Config

```javascript
export default {
  base: '/fraud-insurance-blockchain/',
  // ... rest of config
}
```

#### 2. Create GitHub Actions Workflow

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd frontend && npm install
      
      - name: Build
        run: cd frontend && npm run build
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

## Database Setup (Optional)

### PostgreSQL on AWS RDS

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier fraud-insurance-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 20
```

### Update Backend to Use Database

```javascript
// backend/services/dataStore.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Replace in-memory store with database queries
```

## Monitoring & Logging

### CloudWatch Logs

```bash
# Configure backend to send logs to CloudWatch
npm install aws-sdk

# In index.js
const CloudWatchTransport = require('winston-cloudwatch');
```

### Application Performance Monitoring

```bash
# Install New Relic
npm install newrelic

# Add to index.js
require('newrelic');
```

### Health Checks

```bash
# Configure ECS health checks
aws ecs update-service \
  --cluster fraud-cluster \
  --service fraud-backend \
  --health-check-grace-period-seconds 60
```

## Security Checklist

- [ ] Environment variables not committed to git
- [ ] Private keys stored in AWS Secrets Manager
- [ ] HTTPS enabled on all endpoints
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] Database encrypted at rest
- [ ] Backups configured
- [ ] Security groups restrict access
- [ ] DDoS protection enabled (CloudFlare)
- [ ] Contract verified on Etherscan
- [ ] Audit logs enabled

## Rollback Procedures

### Backend Rollback

```bash
# With PM2
pm2 delete fraud-backend
pm2 start index.js --name "fraud-backend"

# With Docker
docker-compose down
docker-compose up -d
```

### Frontend Rollback

```bash
# With Vercel
vercel rollback

# With S3 + CloudFront
aws s3 sync s3://fraud-insurance-frontend-backup dist/
aws cloudfront create-invalidation --distribution-id XXXXX --paths "/*"
```

### Smart Contract Rollback

**Note**: Smart contracts are immutable. Deploy new version instead.

```bash
# Deploy new contract
npm run deploy

# Update frontend with new address
# Update backend with new address
```

## Performance Optimization

### Backend

```javascript
// Add caching
const redis = require('redis');
const client = redis.createClient();

// Cache claim data
app.get('/api/claims/:id', async (req, res) => {
  const cached = await client.get(`claim:${req.params.id}`);
  if (cached) return res.json(JSON.parse(cached));
  
  // Fetch from database
  // Cache result
  await client.setex(`claim:${req.params.id}`, 3600, JSON.stringify(data));
});
```

### Frontend

```javascript
// Code splitting
const PatientDashboard = lazy(() => import('./pages/PatientDashboard'));

// Image optimization
import { Image } from 'next/image';

// Lazy loading
<img loading="lazy" src="..." />
```

## Disaster Recovery

### Backup Strategy

```bash
# Daily database backups
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz

# Weekly blockchain state snapshots
0 3 * * 0 hardhat node --fork-block-number latest
```

### Recovery Procedures

```bash
# Restore database
gunzip < /backups/db-20231207.sql.gz | psql $DATABASE_URL

# Redeploy contract
npm run deploy

# Restore frontend
aws s3 sync s3://fraud-insurance-frontend-backup s3://fraud-insurance-frontend/
```

## Maintenance Windows

**Scheduled Maintenance**: Sundays 2:00-4:00 AM UTC

```bash
# Notify users
# Stop accepting new claims
# Perform updates
# Run tests
# Resume operations
```

---

**Last Updated**: December 2025
