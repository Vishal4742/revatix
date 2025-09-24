/**
 * Enhanced Faucet Manager
 * Handles Yellow Network testnet token requests and off-chain balance management
 * Based on community insights about off-chain vs on-chain balances
 */

export interface FaucetRequest {
  userAddress: string;
  amount?: number;
  token?: string;
}

export interface FaucetResponse {
  success: boolean;
  transactionHash?: string;
  amount?: number;
  token?: string;
  message?: string;
  error?: string;
}

export interface BalanceInfo {
  onChain: {
    native: number;
    tokens: Array<{
      address: string;
      symbol: string;
      amount: number;
      decimals: number;
    }>;
  };
  offChain: {
    unified: number;
    available: number;
    locked: number;
    currency: string;
  };
  clearnode: {
    connected: boolean;
    channelOpen: boolean;
    canWithdraw: boolean;
  };
}

export class FaucetManager {
  private clearnodeUrl: string;
  private isConnected: boolean = false;
  private offChainBalance: number = 0;
  private channelOpen: boolean = false;

  constructor(clearnodeUrl: string = 'wss://testnet.yellow.com/ws') {
    this.clearnodeUrl = clearnodeUrl;
  }

  // Request test tokens from Yellow Network faucet
  async requestTestTokens(request: FaucetRequest): Promise<FaucetResponse> {
    try {
      console.log('🚰 Requesting test tokens from Yellow Network faucet...');
      
      const faucetUrl = 'https://clearnet-sandbox.yellow.com/faucet/requestTokens';
      
      const response = await fetch(faucetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: request.userAddress,
          amount: request.amount || 10, // Default 10 USDC test tokens
          token: request.token || 'USDC'
        })
      });

      if (!response.ok) {
        throw new Error(`Faucet request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('✅ Test tokens requested successfully:', {
        address: this.formatAddress(request.userAddress),
        amount: result.amount || 10,
        token: result.token || 'USDC'
      });

      // Note: Tokens go to off-chain unified balance, not visible in MetaMask
      return {
        success: true,
        amount: result.amount || 10,
        token: result.token || 'USDC',
        message: 'Tokens sent to off-chain unified balance. Check Clearnode dashboard.'
      };
    } catch (error) {
      console.error('❌ Failed to request test tokens:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Check off-chain balance on Clearnode
  async checkOffChainBalance(address: string): Promise<{ success: boolean; balance?: number; error?: string }> {
    try {
      console.log('🔍 Checking off-chain balance on Clearnode...');
      
      // In a real implementation, this would query the Clearnode API
      // For now, we'll simulate the response
      const mockBalance = Math.floor(Math.random() * 1000) + 100; // Random balance for demo
      
      console.log('✅ Off-chain balance retrieved:', {
        address: this.formatAddress(address),
        balance: mockBalance,
        currency: 'USDC'
      });

      this.offChainBalance = mockBalance;
      return { success: true, balance: mockBalance };
    } catch (error) {
      console.error('❌ Failed to check off-chain balance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Open channel with Clearnode to access off-chain balance
  async openClearnodeChannel(address: string): Promise<{ success: boolean; channelId?: string; error?: string }> {
    try {
      console.log('🔗 Opening channel with Clearnode...');
      
      // In a real implementation, this would use the Nitrolite SDK to open a channel
      const channelId = `clearnode_${address}_${Date.now()}`;
      
      this.channelOpen = true;
      this.isConnected = true;
      
      console.log('✅ Clearnode channel opened:', {
        address: this.formatAddress(address),
        channelId: channelId
      });

      return { success: true, channelId };
    } catch (error) {
      console.error('❌ Failed to open Clearnode channel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Withdraw tokens from off-chain to on-chain balance
  async withdrawFromOffChain(address: string, amount: number): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!this.channelOpen) {
        throw new Error('No Clearnode channel open. Please open a channel first.');
      }

      if (amount > this.offChainBalance) {
        throw new Error('Insufficient off-chain balance');
      }

      console.log('💸 Withdrawing from off-chain balance...');
      
      // In a real implementation, this would request a channel close/resize
      const txHash = `withdraw_${address}_${Date.now()}`;
      
      this.offChainBalance -= amount;
      
      console.log('✅ Withdrawal successful:', {
        address: this.formatAddress(address),
        amount: amount,
        txHash: txHash,
        remainingOffChain: this.offChainBalance
      });

      return { success: true, txHash };
    } catch (error) {
      console.error('❌ Failed to withdraw from off-chain:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get comprehensive balance information
  async getBalanceInfo(address: string): Promise<BalanceInfo> {
    try {
      // Check off-chain balance
      const offChainResult = await this.checkOffChainBalance(address);
      
      // In a real implementation, you would also check on-chain balance
      const onChainBalance = {
        native: 0.1, // Mock ETH balance
        tokens: [
          {
            address: '0xA0b86a33E6441c8C06DDD1233a8d0C05c0a24C08',
            symbol: 'USDC',
            amount: 50,
            decimals: 6
          }
        ]
      };

      return {
        onChain: onChainBalance,
        offChain: {
          unified: offChainResult.balance || 0,
          available: offChainResult.balance || 0,
          locked: 0,
          currency: 'USDC'
        },
        clearnode: {
          connected: this.isConnected,
          channelOpen: this.channelOpen,
          canWithdraw: this.channelOpen && (offChainResult.balance || 0) > 0
        }
      };
    } catch (error) {
      console.error('❌ Failed to get balance info:', error);
      return {
        onChain: { native: 0, tokens: [] },
        offChain: { unified: 0, available: 0, locked: 0, currency: 'USDC' },
        clearnode: { connected: false, channelOpen: false, canWithdraw: false }
      };
    }
  }

  // Request tokens and open channel in one operation
  async requestTokensAndOpenChannel(address: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🚀 Requesting tokens and opening Clearnode channel...');
      
      // Step 1: Request test tokens
      const faucetResult = await this.requestTestTokens({ userAddress: address });
      if (!faucetResult.success) {
        throw new Error(faucetResult.error || 'Failed to request test tokens');
      }

      // Step 2: Wait a moment for tokens to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Open Clearnode channel
      const channelResult = await this.openClearnodeChannel(address);
      if (!channelResult.success) {
        throw new Error(channelResult.error || 'Failed to open Clearnode channel');
      }

      console.log('✅ Tokens requested and channel opened successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to request tokens and open channel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Format address for display
  private formatAddress(address: string): string {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  // Get connection status
  getConnectionStatus(): { connected: boolean; channelOpen: boolean; offChainBalance: number } {
    return {
      connected: this.isConnected,
      channelOpen: this.channelOpen,
      offChainBalance: this.offChainBalance
    };
  }

  // Disconnect from Clearnode
  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.channelOpen = false;
    this.offChainBalance = 0;
    console.log('🔌 Disconnected from Clearnode');
  }
}

// Export singleton instance
export const faucetManager = new FaucetManager();

// Helper functions for backward compatibility
export const requestTestTokens = async (address: string, amount?: number, token?: string) => {
  return faucetManager.requestTestTokens({ userAddress: address, amount, token });
};

export const checkOffChainBalance = async (address: string) => {
  return faucetManager.checkOffChainBalance(address);
};

export const openClearnodeChannel = async (address: string) => {
  return faucetManager.openClearnodeChannel(address);
};

export const withdrawFromOffChain = async (address: string, amount: number) => {
  return faucetManager.withdrawFromOffChain(address, amount);
};

export const getBalanceInfo = async (address: string) => {
  return faucetManager.getBalanceInfo(address);
};

export const requestTokensAndOpenChannel = async (address: string) => {
  return faucetManager.requestTokensAndOpenChannel(address);
};
