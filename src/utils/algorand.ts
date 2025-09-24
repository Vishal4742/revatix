// This file has been deprecated in favor of Yellow Network integration
// Please use src/utils/yellowNetwork.ts instead

// Re-export Yellow Network functions for backward compatibility
export {
  YELLOW_NETWORK_CONFIG as ALGORAND_CONFIG,
  nitroliteClient as algodClient,
  connectWallet,
  disconnectWallet,
  isWalletConnected,
  getConnectedAccount,
  sendPayment,
  sendBulkPayment,
  getAccountBalance,
  formatAddress,
  formatToken as formatAlgo,
  formatUSDC,
  isValidAddress as isValidAlgorandAddress,
  generateTestAddress,
  getAIRecommendations
} from './yellowNetwork';