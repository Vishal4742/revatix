# 🚨 Yellow Network Troubleshooting Guide

## Overview
This guide addresses common issues developers face when working with Yellow Network testnet, based on community discussions and real-world experiences.

## 🔑 Private Key Management Issues

### Issue: "UNIQUE constraint failed: private_key_dtos.private_key"

**Problem**: Trying to import a private key that already exists in the system.

**Solutions**:
1. **Create a new wallet in MetaMask** and use its private key
2. **Import with a different name** (if supported by your implementation)
3. **Use session keys for frontend** instead of private keys

**Reference**: [Nitrolite Session Auth Documentation](https://github.com/erc7824/nitrolite-example/blob/final-p2p-transfer/docs/chapter-3-session-auth.md)

### Best Practices:
- **Backend**: Use private keys directly
- **Frontend**: Use session keys for security
- **Testing**: Create fresh wallets for each test scenario

## 💰 Token Faucet Issues

### Issue: "Tokens sent but no funds available"

**Problem**: Tokens are sent to off-chain unified balance, not visible in MetaMask.

**Explanation**:
- Tokens go to **off-chain unified balance** on Clearnode
- Not visible in MetaMask until withdrawn
- Check balance on Clearnode dashboard

**Solutions**:
1. **Check Clearnode Dashboard**: View your off-chain balance
2. **Open Channel with Clearnode**: Required for on-chain access
3. **Request Close/Resize**: Triggers withdrawal process
4. **Withdraw Tokens**: Move to on-chain balance

### Faucet Command (Working):
```bash
curl -X POST https://clearnet-sandbox.yellow.com/faucet/requestTokens \
  -H "Content-Type: application/json" \
  -d "{\"userAddress\": \"YOUR_METAMASK_ADDRESS\"}"
```

**PowerShell Version**:
```powershell
Invoke-RestMethod -Uri "https://clearnet-sandbox.yellow.com/faucet/requestTokens" -Method POST -ContentType "application/json" -Body '{"userAddress":"YOUR_METAMASK_ADDRESS"}'
```

## 🔗 Channel Creation Issues

### Issue: "Need ETH for channel creation"

**Problem**: Channel creation requires some on-chain tokens for initial setup.

**Solutions**:
1. **Use Sandbox WebSocket**: Recommended for testing
2. **Get Test ETH**: From Ethereum Sepolia faucet
3. **Use Cross-Chain**: Yellow Network supports multiple chains

### Recommended Approach:
- **For Testing**: Use Sandbox WebSocket connection
- **For Production**: Ensure proper token balance on supported chains

## 📊 Balance Display Issues

### Issue: "Balance not updating after faucet request"

**Problem**: Off-chain vs on-chain balance confusion.

**Solutions**:
1. **Wait for Update**: Sometimes takes time to reflect
2. **Check Clearnode**: View unified balance
3. **Refresh Application**: Clear cache and reload
4. **Contact Support**: If persistent issues

**Note**: Yellow Network team actively monitors and fixes balance update issues.

## 🛠️ Development Workflow

### Recommended Testing Flow:
1. **Create Fresh Wallet**: New MetaMask wallet for testing
2. **Request Test Tokens**: Use faucet command
3. **Check Clearnode Balance**: Verify off-chain balance
4. **Open Channel**: Connect to Clearnode
5. **Test Transactions**: Use state channels
6. **Withdraw if Needed**: Move to on-chain balance

### Environment Setup:
```bash
# Testnet Configuration
VITE_YELLOW_NETWORK_CLEARNODE_URL=wss://testnet.yellow.com/ws
VITE_YELLOW_NETWORK_DEFAULT_CHAIN=polygon-mumbai
```

## 🔍 Debugging Tips

### Common Debugging Steps:
1. **Check Console Logs**: Browser developer tools
2. **Verify Network Connection**: WebSocket connectivity
3. **Check Wallet Connection**: MetaMask status
4. **Verify Address Format**: Correct wallet address
5. **Check Token Balance**: Both on-chain and off-chain

### Useful Commands:
```bash
# Check environment variables
npm run env:check

# Run development server
npm run dev

# Build for production
npm run build
```

## 📚 Additional Resources

### Documentation:
- [Yellow Network Documentation](https://github.com/layer-3/docs)
- [Nitrolite SDK Examples](https://github.com/erc7824/nitrolite-example)
- [Clearnode Sandbox FAQ](https://github.com/layer-3/docs/discussions/20)

### Community Support:
- **Yellow Network Discord**: Active community support
- **GitHub Discussions**: Technical questions and answers
- **Documentation Issues**: Report bugs and improvements

## 🚀 Best Practices

### Security:
- **Never share private keys**
- **Use session keys for frontend**
- **Test with fresh wallets**
- **Keep testnet and mainnet separate**

### Development:
- **Use testnet for all development**
- **Test thoroughly before mainnet**
- **Follow Yellow Network guidelines**
- **Keep documentation updated**

### Testing:
- **Create comprehensive test scenarios**
- **Test error handling**
- **Verify state channel operations**
- **Test cross-chain functionality**

## 🆘 Getting Help

### When to Ask for Help:
- **Persistent balance issues**
- **Channel creation failures**
- **WebSocket connection problems**
- **SDK integration issues**

### How to Get Help:
1. **Check existing documentation**
2. **Search community discussions**
3. **Create detailed issue reports**
4. **Provide error logs and steps to reproduce**

### Community Guidelines:
- **Be respectful and patient**
- **Provide detailed information**
- **Search before asking**
- **Help others when possible**

## 📝 Common Error Messages

### "UNIQUE constraint failed: private_key_dtos.private_key"
- **Cause**: Duplicate private key
- **Solution**: Create new wallet or use different name

### "No funds available"
- **Cause**: Off-chain balance not visible
- **Solution**: Check Clearnode dashboard, open channel

### "Failed to create channel"
- **Cause**: Insufficient on-chain balance
- **Solution**: Get test tokens, use Sandbox WebSocket

### "WebSocket connection failed"
- **Cause**: Network or configuration issue
- **Solution**: Check URL, verify network connection

## 🔄 Regular Updates

This troubleshooting guide is updated based on:
- **Community feedback**
- **New issues discovered**
- **Yellow Network updates**
- **Best practices evolution**

**Last Updated**: January 2025
**Version**: 1.0

---

**Remember**: Yellow Network is constantly evolving. Stay updated with the latest documentation and community discussions for the most current solutions.
