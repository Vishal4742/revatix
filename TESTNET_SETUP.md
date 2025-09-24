# 🧪 Revatix Testnet Testing Guide

## Overview
This guide will help you test your Revatix project on testnets to ensure functionality before mainnet deployment.

## 1. Testnet Environment Setup

### Create `.env.local` file in your project root:

```bash
# Revatix Testnet Configuration
VITE_APP_ENV=testnet
VITE_DEBUG_MODE=true

# Yellow Network Testnet Configuration
VITE_YELLOW_NETWORK_CLEARNODE_URL=wss://testnet.yellow.com/ws
VITE_YELLOW_NETWORK_DEFAULT_CHAIN=polygon-mumbai

# Nitrolite SDK Testnet Configuration
VITE_NITROLITE_APP_ID=your-testnet-app-id
VITE_NITROLITE_API_KEY=your-testnet-api-key

# Supabase Testnet Database
VITE_SUPABASE_URL=https://your-testnet-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-testnet-anon-key

# AI Services (can use same for testing)
VITE_GOOGLE_AI_API_KEY=your-google-ai-key

# Email Services (can use same for testing)
VITE_EMAILJS_SERVICE_ID=your-service-id
VITE_EMAILJS_TEMPLATE_ID=your-template-id
VITE_EMAILJS_PUBLIC_KEY=your-public-key
```

## 2. Testnet Networks Configuration

### Yellow Network Testnet Configuration:

#### Yellow Network Testnet:
```json
{
  "chainId": "yellow-testnet",
  "chainName": "Yellow Network Testnet",
  "rpcUrls": ["wss://testnet.yellow.org/ws"],
  "blockExplorerUrls": ["https://explorer.yellow.org"],
  "nativeCurrency": {
    "name": "YELLOW",
    "symbol": "YELLOW",
    "decimals": 18
  }
}
```

#### Yellow Network Mainnet:
```json
{
  "chainId": "yellow-mainnet",
  "chainName": "Yellow Network",
  "rpcUrls": ["wss://clearnet.yellow.org/ws"],
  "blockExplorerUrls": ["https://explorer.yellow.org"],
  "nativeCurrency": {
    "name": "YELLOW",
    "symbol": "YELLOW",
    "decimals": 18
  }
}
```

## 3. Obtain Test Tokens

### Yellow Network Testnet (YELLOW):
- **Faucet API**: https://clearnet-sandbox.yellow.com/faucet/requestTokens
- **Amount**: 10 USDC test tokens per request
- **Note**: Yellow Network uses **gasless state channels**, so minimal tokens needed for testing - **zero gas fees**!

**PowerShell Command:**
```powershell
Invoke-RestMethod -Uri "https://clearnet-sandbox.yellow.com/faucet/requestTokens" -Method POST -ContentType "application/json" -Body '{"userAddress":"YOUR_WALLET_ADDRESS"}'
```

**cURL Command:**
```bash
curl -XPOST https://clearnet-sandbox.yellow.com/faucet/requestTokens -H "Content-Type: application/json" -d '{"userAddress":"YOUR_WALLET_ADDRESS"}'
```

### Cross-Chain Test Assets:
Since Yellow Network supports cross-chain operations, you may also need test tokens from:
- **Ethereum Sepolia**: https://sepoliafaucet.com/
- **Polygon Mumbai**: https://faucet.polygon.technology/
- **Base Sepolia**: https://bridge.base.org/deposit

## 4. Configure Your Wallet

### MetaMask Setup for Yellow Network:
1. Open MetaMask
2. Click network dropdown
3. Select "Add Network"
4. Enter Yellow Network testnet details:
   - **Network Name**: Yellow Network Testnet
   - **RPC URL**: wss://testnet.yellow.org/ws
   - **Chain ID**: yellow-testnet
   - **Currency Symbol**: YELLOW
   - **Block Explorer**: https://explorer.yellow.org
5. Switch to Yellow Network testnet
6. Fund with test YELLOW tokens

### WalletConnect Setup:
1. Ensure your wallet supports the testnet
2. Connect through the app
3. Verify testnet connection

## 5. Testing Checklist

### Core Functionality:
- [ ] Wallet connection on testnet
- [ ] State channel creation
- [ ] Payment processing
- [ ] VAT refund workflow
- [ ] Payroll processing
- [ ] Token balance display
- [ ] Transaction history

### State Channel Testing:
- [ ] Create payment channel
- [ ] Send payments through channels
- [ ] Update channel state
- [ ] Close channels
- [ ] Challenge channels (dispute resolution)
- [ ] Multi-participant channels

### Error Handling:
- [ ] Insufficient funds
- [ ] Network disconnection
- [ ] Invalid addresses
- [ ] Failed transactions

## 6. Monitoring and Debugging

### Tools:
- **Yellow Network Explorer**: https://explorer.yellow.org
- **Console Logs**: Monitor browser console for errors
- **Network Tab**: Check API calls and responses
- **State Channel Manager**: Use built-in channel monitoring
- **Nitrolite SDK**: Monitor state channel operations

### Common Issues:
1. **"Insufficient funds"**: Get more test YELLOW tokens from Yellow Network faucet
2. **"Network error"**: Check Yellow Network testnet connection
3. **"Invalid address"**: Verify wallet is on Yellow Network testnet
4. **"Channel creation failed"**: Check Nitrolite configuration and Yellow Network connectivity
5. **"State channel timeout"**: Yellow Network gasless state channels have specific timeout requirements
6. **"Gas fee errors"**: Remember - Yellow Network is **gasless**! No gas fees should be required

## 7. Test Scenarios

### VAT Refund Testing:
1. Connect wallet to testnet
2. Create test VAT refund request
3. Process refund through state channel
4. Verify transaction on explorer
5. Check refund history

### Payroll Testing:
1. Add test employees
2. Create payroll batch
3. Process payments through state channels
4. Verify all transactions
5. Check payment history

### State Channel Testing:
1. Create channel between two addresses
2. Send multiple payments
3. Update channel state
4. Close channel
5. Verify final settlement

## 8. Production Readiness

### Before Mainnet:
- [ ] All testnet tests pass
- [ ] Error handling works
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] User acceptance testing
- [ ] Documentation updated

## 9. Troubleshooting

### Common Commands:
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Check environment variables
npm run env:check
```

### Support:
- Check Yellow Network documentation
- Review Nitrolite SDK examples
- Test on multiple testnets
- Use browser dev tools for debugging

## 10. Next Steps

1. Set up testnet environment
2. Obtain test tokens
3. Configure wallet
4. Run comprehensive tests
5. Fix any issues found
6. Prepare for mainnet deployment

Remember: Testnets are for testing only. Never use real funds on testnets, and never use testnet tokens on mainnet.
