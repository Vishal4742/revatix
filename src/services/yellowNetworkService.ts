import { 
  nitroliteClient, 
  connectWallet, 
  disconnectWallet, 
  sendPayment, 
  sendBulkPayment,
  getAccountBalance,
  createPaymentChannel,
  closeChannel,
  getChannelStatus,
  switchChain,
  getCurrentChain
} from '../utils/yellowNetwork';
import { ENV_CONFIG } from '../config/environment';
import { Address, zeroAddress } from 'viem';

// Enhanced types for advanced state channel management
export interface ChannelConfig {
  participants: Address[];
  adjudicator: Address;
  challenge: bigint;
  nonce: bigint;
}

export interface StateUpdate {
  intent: number;
  version: bigint;
  data: string;
  allocations: Array<{
    destination: Address;
    token: Address;
    amount: bigint;
  }>;
  sigs: string[];
}

export interface PaymentRequest {
  recipient: string;
  amount: number;
  token?: Address;
  description?: string;
}

export class YellowNetworkService {
  private static instance: YellowNetworkService;
  private isConnected = false;
  private currentAccount: string | null = null;
  private activeChannels: Map<string, ChannelConfig> = new Map();
  private channelStates: Map<string, StateUpdate> = new Map();

  private constructor() {}

  public static getInstance(): YellowNetworkService {
    if (!YellowNetworkService.instance) {
      YellowNetworkService.instance = new YellowNetworkService();
    }
    return YellowNetworkService.instance;
  }

  // Wallet Management
  async connect(): Promise<{ address: string; balance: number }> {
    try {
      const result = await connectWallet();
      this.isConnected = true;
      this.currentAccount = result.address;
      return result;
    } catch (error) {
      console.error('Failed to connect to Yellow Network:', error);
      
      // Demo mode fallback
      if (error instanceof Error && error.message.includes('not initialized')) {
        console.log('Running in demo mode - using mock wallet connection');
        const mockAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
        this.isConnected = true;
        this.currentAccount = mockAddress;
        return {
          address: mockAddress,
          balance: 1.5
        };
      }
      
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await disconnectWallet();
      this.isConnected = false;
      this.currentAccount = null;
      this.activeChannels.clear();
      this.channelStates.clear();
    } catch (error) {
      console.error('Failed to disconnect from Yellow Network:', error);
      throw error;
    }
  }

  isWalletConnected(): boolean {
    return this.isConnected && this.currentAccount !== null;
  }

  getCurrentAccount(): string | null {
    return this.currentAccount;
  }

  // Balance Management
  async getBalance(address?: string): Promise<{
    native: number;
    tokens: Array<{ 
      address: string; 
      amount: number; 
      symbol: string; 
      decimals: number;
    }>
  }> {
    try {
      return await getAccountBalance(address || this.currentAccount || undefined);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return { native: 0, tokens: [] };
    }
  }

  // Payment Operations
  async sendPayment(
    recipient: string,
    amount: number,
    token: string = 'USDC'
  ): Promise<{ txHash: string; success: boolean; error?: string }> {
    try {
      if (!this.isConnected) {
        throw new Error('Wallet not connected');
      }
      return await sendPayment(recipient, amount, token);
    } catch (error) {
      console.error('Payment failed:', error);
      return {
        txHash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendBulkPayments(
    recipients: Array<{ address: string; amount: number }>,
    token: string = 'USDC'
  ): Promise<{ txHash: string; success: boolean; processed: number; error?: string }> {
    try {
      if (!this.isConnected) {
        throw new Error('Wallet not connected');
      }
      return await sendBulkPayment(recipients, token);
    } catch (error) {
      console.error('Bulk payment failed:', error);
      return {
        txHash: '',
        success: false,
        processed: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Advanced State Channel Management (ERC-7824)
  async createStateChannel(participants: Address[], initialDeposit: bigint = 0n): Promise<string> {
    try {
      if (!this.isConnected || !this.currentAccount) {
        throw new Error('Wallet not connected');
      }

      const channelConfig: ChannelConfig = {
        participants,
        adjudicator: zeroAddress, // Use default adjudicator
        challenge: 0n,
        nonce: BigInt(Date.now())
      };

      const channelId = `channel_${channelConfig.nonce}`;
      this.activeChannels.set(channelId, channelConfig);

      // Initialize channel state
      const initialState: StateUpdate = {
        intent: 0, // StateIntent.CREATED
        version: 0n,
        data: '0x',
        allocations: participants.map(participant => ({
          destination: participant,
          token: zeroAddress,
          amount: initialDeposit / BigInt(participants.length)
        })),
        sigs: []
      };

      this.channelStates.set(channelId, initialState);

      console.log('Advanced state channel created:', channelId);
      return channelId;
    } catch (error) {
      console.error('Failed to create state channel:', error);
      throw error;
    }
  }

  async updateChannelState(channelId: string, stateUpdate: StateUpdate): Promise<void> {
    try {
      if (!this.activeChannels.has(channelId)) {
        throw new Error('Channel not found');
      }

      const currentState = this.channelStates.get(channelId);
      if (!currentState) {
        throw new Error('Channel state not found');
      }

      // Validate state transition
      if (stateUpdate.version <= currentState.version) {
        throw new Error('Invalid state version');
      }

      // Update channel state
      this.channelStates.set(channelId, stateUpdate);
      console.log('Channel state updated:', channelId, stateUpdate);
    } catch (error) {
      console.error('Failed to update channel state:', error);
      throw error;
    }
  }

  async checkpointChannel(channelId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.activeChannels.has(channelId)) {
        throw new Error('Channel not found');
      }

      const state = this.channelStates.get(channelId);
      if (!state) {
        throw new Error('Channel state not found');
      }

      // In a real implementation, this would checkpoint the state on-chain
      console.log('Channel checkpointed:', channelId);
      return { success: true };
    } catch (error) {
      console.error('Failed to checkpoint channel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async challengeChannel(channelId: string, challengerSig: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.activeChannels.has(channelId)) {
        throw new Error('Channel not found');
      }

      // In a real implementation, this would initiate a challenge
      console.log('Channel challenged:', channelId, challengerSig);
      return { success: true };
    } catch (error) {
      console.error('Failed to challenge channel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async closeStateChannel(channelId: string, finalState: StateUpdate): Promise<void> {
    try {
      if (!this.activeChannels.has(channelId)) {
        throw new Error('Channel not found');
      }

      this.activeChannels.delete(channelId);
      this.channelStates.delete(channelId);
      console.log('State channel closed:', channelId);
    } catch (error) {
      console.error('Failed to close state channel:', error);
      throw error;
    }
  }

  // Get active channels
  getActiveChannels(): string[] {
    return Array.from(this.activeChannels.keys());
  }

  // Get channel configuration
  getChannelConfig(channelId: string): ChannelConfig | undefined {
    return this.activeChannels.get(channelId);
  }

  // Get channel state
  getChannelState(channelId: string): StateUpdate | undefined {
    return this.channelStates.get(channelId);
  }

  // State Channel Management (Legacy - for backward compatibility)
  async createChannel(
    recipient: string,
    amount: number,
    token: string = 'USDC'
  ): Promise<{ channelId: string; success: boolean; error?: string }> {
    try {
      if (!this.isConnected) {
        throw new Error('Wallet not connected');
      }
      return await createPaymentChannel(recipient, amount, token);
    } catch (error) {
      console.error('Channel creation failed:', error);
      return {
        channelId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async closeChannel(channelId: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await closeChannel(channelId);
    } catch (error) {
      console.error('Channel closure failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getChannelStatus(channelId: string) {
    try {
      return await getChannelStatus(channelId);
    } catch (error) {
      console.error('Failed to get channel status:', error);
      return null;
    }
  }

  // Chain Management
  async switchToChain(chainId: number): Promise<boolean> {
    try {
      return await switchChain(chainId);
    } catch (error) {
      console.error('Failed to switch chain:', error);
      return false;
    }
  }

  getCurrentChain() {
    return getCurrentChain();
  }

  // VAT Refund Operations
  async processVATRefund(
    touristAddress: string,
    refundAmount: number,
    invoiceHash: string,
    claimId: string
  ): Promise<{ channelId: string; success: boolean; error?: string }> {
    try {
      if (!this.isConnected) {
        throw new Error('Wallet not connected');
      }

      // Create a state channel for the VAT refund
      const channelResult = await this.createChannel(touristAddress, refundAmount, 'USDC');
      
      if (!channelResult.success) {
        throw new Error(channelResult.error || 'Failed to create refund channel');
      }

      // Log the refund transaction
      console.log('VAT Refund processed:', {
        channelId: channelResult.channelId,
        touristAddress,
        refundAmount,
        invoiceHash,
        claimId,
        timestamp: new Date().toISOString()
      });

      return channelResult;
    } catch (error) {
      console.error('VAT refund processing failed:', error);
      return {
        channelId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Payroll Operations
  async processPayroll(
    employees: Array<{ address: string; amount: number; employeeId: string }>,
    payrunId: string
  ): Promise<{ channelIds: string[]; success: boolean; processed: number; error?: string }> {
    try {
      if (!this.isConnected) {
        throw new Error('Wallet not connected');
      }

      const channelIds: string[] = [];
      let processed = 0;

      // Process employees in batches to avoid overwhelming the network
      const batchSize = 10;
      for (let i = 0; i < employees.length; i += batchSize) {
        const batch = employees.slice(i, i + batchSize);
        
        // Create individual channels for each employee in the batch
        for (const employee of batch) {
          const channelResult = await this.createChannel(
            employee.address, 
            employee.amount, 
            'USDC'
          );
          
          if (channelResult.success) {
            channelIds.push(channelResult.channelId);
            processed++;
            
            // Log the payroll transaction
            console.log('Payroll processed:', {
              channelId: channelResult.channelId,
              employeeAddress: employee.address,
              employeeId: employee.employeeId,
              amount: employee.amount,
              payrunId,
              timestamp: new Date().toISOString()
            });
          }
        }
      }

      return {
        channelIds,
        success: processed > 0,
        processed,
        error: processed === 0 ? 'No payments were processed' : undefined
      };
    } catch (error) {
      console.error('Payroll processing failed:', error);
      return {
        channelIds: [],
        success: false,
        processed: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Utility Methods
  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  formatAmount(amount: number, decimals: number = 18): string {
    return (amount / Math.pow(10, decimals)).toFixed(6);
  }

  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Get service status
  getServiceStatus(): {
    connected: boolean;
    account: string | null;
    chain: any;
    clearnodeUrl: string;
  } {
    return {
      connected: this.isConnected,
      account: this.currentAccount,
      chain: this.getCurrentChain(),
      clearnodeUrl: ENV_CONFIG.yellowNetwork.clearnodeUrl
    };
  }
}

// Export singleton instance
export const yellowNetworkService = YellowNetworkService.getInstance();
