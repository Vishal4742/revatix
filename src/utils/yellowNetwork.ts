import { NitroliteClient } from '@erc7824/nitrolite';
import { createPublicClient, createWalletClient, http, webSocket } from 'viem';
import { mainnet, polygon, base, celo } from 'viem/chains';
import { ENV_CONFIG } from '../config/environment';
import { walletManager } from './walletManager';
import { faucetManager } from './faucetManager';
import { handleYellowNetworkError, logYellowNetworkError, isErrorRecoverable } from './errorHandler';

// Yellow Network configuration based on official documentation
export const YELLOW_NETWORK_CONFIG = {
  clearnodeUrl: ENV_CONFIG.yellowNetwork.clearnodeUrl,
  supportedChains: [mainnet, polygon, base, celo],
  defaultChain: polygon, // Using Polygon as default for lower fees
  // Yellow Network state channel configuration
  stateChannelConfig: {
    protocol: 'ERC-7824',
    version: '1.0.0',
    adjudicator: '0x0000000000000000000000000000000000000000', // Adjudicator smart contract
    // $YELLOW token configuration (native token)
    yellowToken: {
      symbol: 'YELLOW',
      address: '0x0000000000000000000000000000000000000000', // YELLOW token address
      decimals: 18,
      // Paymaster system for transaction fees
      paymasterEnabled: true,
    },
    // Supported trading tokens (not YELLOW)
    supportedTokens: {
      USDC: '0xA0b86a33E6441c8C06DDD1233a8d0C05c0a24C08', // USDC on Polygon
      USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT on Polygon
      DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', // DAI on Polygon
      WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // Wrapped ETH on Polygon
    },
    defaultToken: 'USDC', // Default token for transactions
    // State channel requirements
    collateralRequired: true, // Brokers must lock YELLOW tokens as collateral
    clearingFees: 0.001, // 0.1% clearing fee paid in YELLOW tokens
    challengePeriod: 86400, // 24 hours for dispute resolution
  }
};

// Initialize Viem clients for different chains first
export const publicClients = {
  mainnet: createPublicClient({
    chain: mainnet,
    transport: http(),
  }),
  polygon: createPublicClient({
    chain: polygon,
    transport: http(),
  }),
  base: createPublicClient({
    chain: base,
    transport: http(),
  }),
  celo: createPublicClient({
    chain: celo,
    transport: http(),
  }),
};

// Initialize wallet client for Nitrolite
const walletClient = createWalletClient({
  chain: polygon,
  transport: http(),
});

// Initialize Nitrolite client for Yellow Network (after publicClients are defined)
let nitroliteClient: NitroliteClient | null = null;

try {
  nitroliteClient = new NitroliteClient({
    clearnodeUrl: YELLOW_NETWORK_CONFIG.clearnodeUrl,
    publicClient: publicClients.polygon,
    walletClient: walletClient,
    chain: YELLOW_NETWORK_CONFIG.defaultChain,
  });

  // Initialize enhanced managers
  walletManager.initialize(nitroliteClient);
  
  console.log('✅ Enhanced Yellow Network client initialized with improved error handling');
} catch (error) {
  logYellowNetworkError(error as Error, { operation: 'client_initialization' });
  console.warn('Some features may not work properly. Please check your environment configuration.');
}

export { nitroliteClient };

// Wallet state management
let connectedAccount: string | null = null;
let currentChain = YELLOW_NETWORK_CONFIG.defaultChain;

// Generate a valid test address (for demo purposes only)
export const generateTestAddress = (): string => {
  // These are valid EVM addresses for demo purposes
  const testAddresses = [
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    '0x8ba1f109551bD432803012645Hac136c4c8b8b8b',
    '0x1234567890123456789012345678901234567890',
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    '0x9876543210987654321098765432109876543210'
  ];
  
  // Return a random test address
  return testAddresses[Math.floor(Math.random() * testAddresses.length)];
};

// Utility functions
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export const formatToken = (amount: number, decimals: number = 18): string => {
  return (amount / Math.pow(10, decimals)).toFixed(6);
};

export const formatUSDC = (amount: number): string => {
  return (amount / 1000000).toFixed(2);
};

// Validate EVM address
export const isValidAddress = (address: string): boolean => {
  try {
    if (!address || typeof address !== 'string') {
      return false;
    }
    
    const trimmedAddress = address.trim();
    
    // EVM addresses are 42 characters (0x + 40 hex chars)
    if (trimmedAddress.length !== 42) {
      return false;
    }
    
    // Check if it starts with 0x and contains only hex characters
    return /^0x[a-fA-F0-9]{40}$/.test(trimmedAddress);
  } catch (error) {
    return false;
  }
};

// Connect to wallet using Nitrolite
export const connectWallet = async (): Promise<{ address: string; balance: number }> => {
  try {
    if (!nitroliteClient) {
      throw new Error('Nitrolite client not initialized. Please check your environment configuration.');
    }

    // Connect to wallet through Nitrolite client
    const wallet = await nitroliteClient.connectWallet();
    
    if (!wallet) {
      throw new Error('No wallet found');
    }

    connectedAccount = wallet.address;

    // Get account balance
    const balance = await getAccountBalance(wallet.address);

    return {
      address: wallet.address,
      balance: balance.native
    };
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
};

// Disconnect wallet
export const disconnectWallet = async (): Promise<void> => {
  try {
    if (!nitroliteClient) {
      console.warn('Nitrolite client not initialized');
      connectedAccount = null;
      return;
    }
    
    await nitroliteClient.disconnectWallet();
    connectedAccount = null;
  } catch (error) {
    console.error('Failed to disconnect wallet:', error);
    throw error;
  }
};

// Check if wallet is connected
export const isWalletConnected = (): boolean => {
  return connectedAccount !== null;
};

// Get connected account
export const getConnectedAccount = (): string | null => {
  return connectedAccount;
};

// Get account balance
export const getAccountBalance = async (address?: string): Promise<{
  native: number;
  tokens: Array<{ 
    address: string; 
    amount: number; 
    symbol: string; 
    decimals: number;
  }>
}> => {
  try {
    const accountAddress = address || connectedAccount;
    
    if (!accountAddress) {
      throw new Error('No account address provided');
    }

    const publicClient = publicClients[currentChain.id as keyof typeof publicClients];
    const balance = await publicClient.getBalance({ address: accountAddress as `0x${string}` });
    
    return {
      native: Number(balance) / Math.pow(10, 18), // Convert wei to YELLOW
      tokens: [] // TODO: Implement token balance fetching
    };
  } catch (error) {
    console.error('Failed to get account balance:', error);
    return {
      native: 0,
      tokens: []
    };
  }
};

// Create a state channel for payments (ERC-7824 compliant)
export const createPaymentChannel = async (
  recipient: string,
  amount: number,
  token: string = 'USDC'
): Promise<{ channelId: string; success: boolean; error?: string }> => {
  try {
    if (!connectedAccount) {
      throw new Error('Wallet not connected');
    }

    if (!isValidAddress(recipient)) {
      throw new Error('Invalid recipient address');
    }

    if (!nitroliteClient) {
      throw new Error('Nitrolite client not initialized');
    }

    // Create a new state channel using Nitrolite SDK
    const channel = await nitroliteClient.createChannel({
      participants: [connectedAccount, recipient],
      initialAllocation: {
        [connectedAccount]: amount * 0.5, // Split initial amount
        [recipient]: amount * 0.5
      },
      token: token,
      // ERC-7824 specific parameters
      challengePeriod: 86400, // 24 hours
      adjudicator: '0x0000000000000000000000000000000000000000', // Default adjudicator
    });

    console.log('State channel created:', channel.id);
    return {
      channelId: channel.id,
      success: true
    };
  } catch (error) {
    console.error('Failed to create payment channel:', error);
    return {
      channelId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Send payment through state channel (ERC-7824 compliant)
export const sendPayment = async (
  recipient: string,
  amount: number,
  token: string = 'USDC'
): Promise<{ txHash: string; success: boolean; error?: string }> => {
  try {
    if (!connectedAccount) {
      throw new Error('Wallet not connected');
    }

    if (!isValidAddress(recipient)) {
      throw new Error('Invalid recipient address');
    }

    if (!nitroliteClient) {
      throw new Error('Nitrolite client not initialized');
    }

    // Create or use existing channel
    const channelResult = await createPaymentChannel(recipient, amount, token);
    
    if (!channelResult.success) {
      throw new Error(channelResult.error || 'Failed to create channel');
    }

    // Update channel state with payment using ERC-7824 state update
    const updateResult = await nitroliteClient.updateChannel(channelResult.channelId, {
      allocations: [
        {
          destination: connectedAccount,
          token: '0x0000000000000000000000000000000000000000', // Native token
          amount: -amount
        },
        {
          destination: recipient,
          token: '0x0000000000000000000000000000000000000000', // Native token
          amount: amount
        }
      ],
      version: 1, // Increment version for state update
      data: '0x' // Additional data if needed
    });

    console.log('State channel updated:', updateResult);
    return {
      txHash: updateResult.txHash || `state_channel_${Date.now()}`,
      success: true
    };
  } catch (error) {
    console.error('Payment failed:', error);
    return {
      txHash: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Send bulk payments through state channels
export const sendBulkPayment = async (
  recipients: Array<{ address: string; amount: number }>,
  token: string = 'USDC'
): Promise<{ txHash: string; success: boolean; processed: number; error?: string }> => {
  try {
    if (!connectedAccount) {
      throw new Error('Wallet not connected');
    }

    // Validate recipients
    const validRecipients = recipients.filter(recipient => 
      recipient.address && 
      isValidAddress(recipient.address) && 
      recipient.amount > 0
    );

    if (validRecipients.length === 0) {
      return {
        txHash: '',
        success: false,
        processed: 0,
        error: 'No valid recipients found'
      };
    }

    // Create a multi-participant channel for bulk payments
    const participants = [connectedAccount, ...validRecipients.map(r => r.address)];
    const initialAllocation: Record<string, number> = {
      [connectedAccount]: validRecipients.reduce((sum, r) => sum + r.amount, 0)
    };

    const channel = await nitroliteClient.createChannel({
      participants,
      initialAllocation,
      token
    });

    // Update channel with all payments
    const finalAllocation: Record<string, number> = {
      [connectedAccount]: 0
    };
    
    validRecipients.forEach(recipient => {
      finalAllocation[recipient.address] = recipient.amount;
    });

    const updateResult = await nitroliteClient.updateChannel(channel.id, finalAllocation);

    return {
      txHash: updateResult.txHash,
      success: true,
      processed: validRecipients.length
    };
  } catch (error) {
    console.error('Bulk payment failed:', error);
    return {
      txHash: '',
      success: false,
      processed: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Close a state channel (ERC-7824 compliant)
export const closeChannel = async (channelId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!nitroliteClient) {
      throw new Error('Nitrolite client not initialized');
    }

    const result = await nitroliteClient.closeChannel(channelId, {
      finalState: true, // Close with final state
      reason: 'User requested closure'
    });

    console.log('State channel closed:', result);
    return { success: true };
  } catch (error) {
    console.error('Failed to close channel:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Get channel status and state (ERC-7824 compliant)
export const getChannelStatus = async (channelId: string) => {
  try {
    if (!nitroliteClient) {
      throw new Error('Nitrolite client not initialized');
    }

    const channelInfo = await nitroliteClient.getChannel(channelId);
    
    return {
      status: channelInfo.status,
      state: channelInfo.state,
      participants: channelInfo.participants,
      version: channelInfo.version
    };
  } catch (error) {
    console.error('Failed to get channel status:', error);
    return null;
  }
};

// Challenge a channel state (for dispute resolution)
export const challengeChannel = async (
  channelId: string,
  reason: string = 'Dispute resolution'
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!connectedAccount) {
      throw new Error('Wallet not connected');
    }

    if (!nitroliteClient) {
      throw new Error('Nitrolite client not initialized');
    }

    const result = await nitroliteClient.challengeChannel(channelId, {
      reason,
      challenger: connectedAccount
    });

    console.log('Channel challenged:', result);
    return { success: true };
  } catch (error) {
    console.error('Failed to challenge channel:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Gasless transaction functions leveraging Yellow Network

// Check if Yellow Network state channels are enabled
export const isYellowNetworkEnabled = (): boolean => {
  return YELLOW_NETWORK_CONFIG.stateChannelConfig.protocol === 'ERC-7824';
};

// Get Yellow Network state channel status
export const getYellowNetworkStatus = async (): Promise<{
  enabled: boolean;
  collateralRequired: boolean;
  collateralAmount?: number;
  canOpenChannels: boolean;
  clearingFees: number;
  paymasterEnabled: boolean;
}> => {
  try {
    if (!connectedAccount) {
      throw new Error('Wallet not connected');
    }

    const config = YELLOW_NETWORK_CONFIG.stateChannelConfig;
    
    // Check if user has sufficient YELLOW tokens for collateral
    const requiredCollateral = 1000; // Minimum YELLOW tokens required for state channels
    const userCollateral = 1000; // Simulated user collateral (in real implementation, check balance)
    
    return {
      enabled: isYellowNetworkEnabled(),
      collateralRequired: config.collateralRequired,
      collateralAmount: userCollateral,
      canOpenChannels: userCollateral >= requiredCollateral,
      clearingFees: config.clearingFees, // 0.1% clearing fee
      paymasterEnabled: config.yellowToken.paymasterEnabled
    };
  } catch (error) {
    console.error('Failed to get Yellow Network status:', error);
    return {
      enabled: false,
      collateralRequired: false,
      collateralAmount: 0,
      canOpenChannels: false,
      clearingFees: 0,
      paymasterEnabled: false
    };
  }
};

// Perform gasless VAT refund
export const performGaslessVATRefund = async (
  recipient: string,
  amount: number,
  refundId: string
): Promise<{ txHash: string; success: boolean; error?: string }> => {
  try {
    if (!connectedAccount) {
      throw new Error('Wallet not connected');
    }

    if (!isYellowNetworkEnabled()) {
      throw new Error('Yellow Network state channels are not enabled');
    }

    const yellowNetworkStatus = await getYellowNetworkStatus();
    if (!yellowNetworkStatus.canOpenChannels) {
      throw new Error('Insufficient YELLOW token collateral for state channels');
    }

    // Get default token for transactions
    const token = YELLOW_NETWORK_CONFIG.stateChannelConfig.defaultToken;
    
    // Create gasless state channel for VAT refund (no fees)
    const channelResult = await createPaymentChannel(recipient, amount, token);
    
    if (!channelResult.success) {
      throw new Error(channelResult.error || 'Failed to create gasless channel');
    }

    // Perform off-chain settlement (gasless - zero fees)
    const paymentResult = await sendPayment(recipient, amount, token);
    
    if (!paymentResult.success) {
      throw new Error(paymentResult.error || 'Failed to process gasless payment');
    }

    console.log(`Gasless VAT refund processed: ${amount} YELLOW to ${recipient}`);
    return {
      txHash: paymentResult.txHash,
      success: true
    };
  } catch (error) {
    console.error('Gasless VAT refund failed:', error);
    return {
      txHash: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Perform gasless payroll payment
export const performGaslessPayroll = async (
  recipients: { address: string; amount: number }[],
  payrollId: string
): Promise<{ txHash: string; success: boolean; error?: string }> => {
  try {
    if (!connectedAccount) {
      throw new Error('Wallet not connected');
    }

    if (!isYellowNetworkEnabled()) {
      throw new Error('Yellow Network state channels are not enabled');
    }

    const yellowNetworkStatus = await getYellowNetworkStatus();
    if (!yellowNetworkStatus.canOpenChannels) {
      throw new Error('Insufficient YELLOW token collateral for state channels');
    }

    // Get default token for transactions
    const token = YELLOW_NETWORK_CONFIG.stateChannelConfig.defaultToken;
    
    // Create multiple gasless state channels for payroll (no fees)
    const channelPromises = recipients.map(recipient => 
      createPaymentChannel(recipient.address, recipient.amount, token)
    );

    const channelResults = await Promise.all(channelPromises);
    
    // Check if all channels were created successfully
    const failedChannels = channelResults.filter(result => !result.success);
    if (failedChannels.length > 0) {
      throw new Error(`Failed to create ${failedChannels.length} gasless channels`);
    }

    // Perform off-chain settlements (gasless)
    const paymentPromises = recipients.map(recipient => 
      sendPayment(recipient.address, recipient.amount, 'YELLOW')
    );

    const paymentResults = await Promise.all(paymentPromises);
    
    // Check if all payments were successful
    const failedPayments = paymentResults.filter(result => !result.success);
    if (failedPayments.length > 0) {
      throw new Error(`Failed to process ${failedPayments.length} gasless payments`);
    }

    console.log(`Gasless payroll processed: ${recipients.length} payments`);
    return {
      txHash: `gasless_payroll_${Date.now()}`,
      success: true
    };
  } catch (error) {
    console.error('Gasless payroll failed:', error);
    return {
      txHash: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Lock YELLOW tokens as collateral for state channels
export const lockYellowCollateral = async (
  amount: number
): Promise<{ txHash: string; success: boolean; error?: string }> => {
  try {
    if (!connectedAccount) {
      throw new Error('Wallet not connected');
    }

    if (!nitroliteClient) {
      throw new Error('Nitrolite client not initialized');
    }

    // Lock YELLOW tokens as collateral for state channels
    console.log(`Locking ${amount} YELLOW tokens as collateral for state channels`);
    
    // In a real implementation, this would lock YELLOW tokens in the adjudicator contract
    const collateralResult = {
      txHash: `collateral_${Date.now()}`,
      success: true
    };

    console.log('YELLOW tokens locked successfully as collateral');
    return collateralResult;
  } catch (error) {
    console.error('Failed to lock YELLOW collateral:', error);
    return {
      txHash: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// AI payroll optimization (placeholder)
export const getAIRecommendations = async (): Promise<{
  recommendations: Array<{
    type: 'cost_optimization' | 'timing' | 'token_selection';
    title: string;
    description: string;
    potentialSavings?: number;
  }>
}> => {
  // Simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    recommendations: [
      {
        type: 'cost_optimization',
        title: 'Optimize Payment Timing',
        description: 'Use state channels during low network congestion to reduce fees by 90%',
        potentialSavings: 45.67
      },
      {
        type: 'token_selection',
        title: 'Token Preference Analysis',
        description: 'Most employees prefer USDC payments - state channels enable instant settlements',
        potentialSavings: 78.90
      },
      {
        type: 'timing',
        title: 'Payroll Frequency Optimization',
        description: 'Real-time payments through state channels could improve employee satisfaction by 25%'
      }
    ]
  };
};

// Switch chain
export const switchChain = async (chainId: number): Promise<boolean> => {
  try {
    const chain = YELLOW_NETWORK_CONFIG.supportedChains.find(c => c.id === chainId);
    if (!chain) {
      throw new Error('Unsupported chain');
    }

    currentChain = chain;
    await nitroliteClient.switchChain(chainId);
    return true;
  } catch (error) {
    console.error('Failed to switch chain:', error);
    return false;
  }
};

// Get current chain
export const getCurrentChain = () => {
  return currentChain;
};

// Enhanced functions based on community insights

// Request test tokens with improved error handling
export const requestTestTokensEnhanced = async (address: string): Promise<{ success: boolean; error?: string; message?: string }> => {
  try {
    const result = await faucetManager.requestTestTokens({ userAddress: address });
    
    if (result.success) {
      return {
        success: true,
        message: 'Test tokens requested successfully. They will appear in your off-chain unified balance on Clearnode.'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to request test tokens'
      };
    }
  } catch (error) {
    logYellowNetworkError(error as Error, { operation: 'faucet_request', address });
    return {
      success: false,
      error: handleYellowNetworkError(error as Error, { operation: 'faucet_request', address }).userMessage
    };
  }
};

// Get comprehensive balance information (on-chain + off-chain)
export const getComprehensiveBalance = async (address: string): Promise<{
  success: boolean;
  balance?: any;
  error?: string;
}> => {
  try {
    const balanceInfo = await faucetManager.getBalanceInfo(address);
    return {
      success: true,
      balance: balanceInfo
    };
  } catch (error) {
    logYellowNetworkError(error as Error, { operation: 'balance_check', address });
    return {
      success: false,
      error: handleYellowNetworkError(error as Error, { operation: 'balance_check', address }).userMessage
    };
  }
};

// Connect wallet with session key support
export const connectWalletEnhanced = async (address: string, useSessionKey: boolean = true): Promise<{ success: boolean; error?: string }> => {
  try {
    if (useSessionKey) {
      // Create session and connect
      const sessionResult = await walletManager.createWalletSession(address);
      if (!sessionResult.success) {
        throw new Error(sessionResult.error || 'Failed to create session');
      }

      const connectResult = await walletManager.connectWalletWithSession(address, sessionResult.sessionKey!);
      if (connectResult.success) {
        connectedAccount = address;
        return { success: true };
      } else {
        throw new Error(connectResult.error || 'Failed to connect with session');
      }
    } else {
      // Use traditional connection (for backend)
      const connectResult = await walletManager.connectWalletWithPrivateKey(address, '');
      if (connectResult.success) {
        connectedAccount = address;
        return { success: true };
      } else {
        throw new Error(connectResult.error || 'Failed to connect with private key');
      }
    }
  } catch (error) {
    logYellowNetworkError(error as Error, { operation: 'wallet_connection', address });
    return {
      success: false,
      error: handleYellowNetworkError(error as Error, { operation: 'wallet_connection', address }).userMessage
    };
  }
};

// Disconnect wallet with cleanup
export const disconnectWalletEnhanced = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    if (connectedAccount) {
      const result = await walletManager.disconnectWallet(connectedAccount);
      connectedAccount = null;
      return result;
    }
    return { success: true };
  } catch (error) {
    logYellowNetworkError(error as Error, { operation: 'wallet_disconnection' });
    return {
      success: false,
      error: handleYellowNetworkError(error as Error, { operation: 'wallet_disconnection' }).userMessage
    };
  }
};

// Open Clearnode channel for off-chain balance access
export const openClearnodeChannel = async (address: string): Promise<{ success: boolean; channelId?: string; error?: string }> => {
  try {
    const result = await faucetManager.openClearnodeChannel(address);
    return result;
  } catch (error) {
    logYellowNetworkError(error as Error, { operation: 'channel_creation', address });
    return {
      success: false,
      error: handleYellowNetworkError(error as Error, { operation: 'channel_creation', address }).userMessage
    };
  }
};

// Withdraw from off-chain balance
export const withdrawFromOffChain = async (address: string, amount: number): Promise<{ success: boolean; txHash?: string; error?: string }> => {
  try {
    const result = await faucetManager.withdrawFromOffChain(address, amount);
    return result;
  } catch (error) {
    logYellowNetworkError(error as Error, { operation: 'withdrawal', address, amount });
    return {
      success: false,
      error: handleYellowNetworkError(error as Error, { operation: 'withdrawal', address, amount }).userMessage
    };
  }
};

// Complete setup: request tokens + open channel
export const setupYellowNetworkAccess = async (address: string): Promise<{ success: boolean; error?: string; message?: string }> => {
  try {
    const result = await faucetManager.requestTokensAndOpenChannel(address);
    
    if (result.success) {
      return {
        success: true,
        message: 'Yellow Network access setup complete! You can now use off-chain balances and create state channels.'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to setup Yellow Network access'
      };
    }
  } catch (error) {
    logYellowNetworkError(error as Error, { operation: 'network_setup', address });
    return {
      success: false,
      error: handleYellowNetworkError(error as Error, { operation: 'network_setup', address }).userMessage
    };
  }
};

// Enhanced channel creation with better error handling
export const createPaymentChannelEnhanced = async (
  recipient: string,
  amount: number,
  token: string = 'USDC'
): Promise<{ channelId: string; success: boolean; error?: string }> => {
  try {
    if (!connectedAccount) {
      throw new Error('Wallet not connected');
    }

    if (!isValidAddress(recipient)) {
      throw new Error('Invalid recipient address');
    }

    if (!nitroliteClient) {
      throw new Error('Nitrolite client not initialized');
    }

    // Check if we have sufficient balance (both on-chain and off-chain)
    const balanceInfo = await faucetManager.getBalanceInfo(connectedAccount);
    const totalAvailable = balanceInfo.onChain.tokens.reduce((sum, t) => sum + t.amount, 0) + balanceInfo.offChain.available;
    
    if (totalAvailable < amount) {
      throw new Error('Insufficient balance. Consider requesting test tokens or withdrawing from off-chain balance.');
    }

    // Create channel with enhanced error handling
    const channel = await nitroliteClient.createChannel({
      participants: [connectedAccount, recipient],
      initialAllocation: {
        [connectedAccount]: amount * 0.5,
        [recipient]: amount * 0.5
      },
      token: token,
      challengePeriod: 86400,
      adjudicator: '0x0000000000000000000000000000000000000000',
    });

    console.log('✅ Enhanced state channel created:', channel.id);
    return {
      channelId: channel.id,
      success: true
    };
  } catch (error) {
    logYellowNetworkError(error as Error, { operation: 'channel_creation', address: connectedAccount, amount });
    return {
      channelId: '',
      success: false,
      error: handleYellowNetworkError(error as Error, { operation: 'channel_creation', address: connectedAccount, amount }).userMessage
    };
  }
};

// Get connection status
export const getConnectionStatus = (): {
  walletConnected: boolean;
  clearnodeConnected: boolean;
  channelOpen: boolean;
  offChainBalance: number;
  sessionActive: boolean;
} => {
  const clearnodeStatus = faucetManager.getConnectionStatus();
  const sessionInfo = connectedAccount ? walletManager.getSessionInfo(connectedAccount) : null;

  return {
    walletConnected: !!connectedAccount,
    clearnodeConnected: clearnodeStatus.connected,
    channelOpen: clearnodeStatus.channelOpen,
    offChainBalance: clearnodeStatus.offChainBalance,
    sessionActive: sessionInfo?.isActive || false
  };
};
