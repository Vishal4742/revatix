/**
 * Enhanced Wallet Manager
 * Handles private key constraints and session key management
 * Based on Yellow Network community insights
 */

import { NitroliteClient } from '@erc7824/nitrolite';
import { createWalletClient, createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';

export interface WalletSession {
  address: string;
  sessionKey: string;
  isActive: boolean;
  createdAt: number;
  expiresAt: number;
}

export interface WalletConfig {
  useSessionKeys: boolean;
  sessionTimeout: number; // in milliseconds
  maxSessions: number;
}

export class WalletManager {
  private sessions: Map<string, WalletSession> = new Map();
  private config: WalletConfig;
  private nitroliteClient: NitroliteClient | null = null;

  constructor(config: WalletConfig = {
    useSessionKeys: true,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxSessions: 5
  }) {
    this.config = config;
  }

  // Initialize with Nitrolite client
  async initialize(nitroliteClient: NitroliteClient): Promise<void> {
    this.nitroliteClient = nitroliteClient;
    console.log('✅ Wallet Manager initialized with session key support');
  }

  // Create a new wallet session (avoids private key constraints)
  async createWalletSession(address: string): Promise<{ success: boolean; sessionKey?: string; error?: string }> {
    try {
      // Check if we already have an active session for this address
      const existingSession = this.getActiveSession(address);
      if (existingSession) {
        console.log('🔄 Using existing session for address:', address);
        return { success: true, sessionKey: existingSession.sessionKey };
      }

      // Check session limit
      if (this.sessions.size >= this.config.maxSessions) {
        // Remove oldest session
        const oldestSession = Array.from(this.sessions.values())
          .sort((a, b) => a.createdAt - b.createdAt)[0];
        this.sessions.delete(oldestSession.address);
      }

      // Generate session key (in real implementation, this would be done securely)
      const sessionKey = this.generateSessionKey(address);
      
      const session: WalletSession = {
        address,
        sessionKey,
        isActive: true,
        createdAt: Date.now(),
        expiresAt: Date.now() + this.config.sessionTimeout
      };

      this.sessions.set(address, session);
      
      console.log('✅ New wallet session created:', {
        address: this.formatAddress(address),
        sessionKey: sessionKey.substring(0, 8) + '...',
        expiresAt: new Date(session.expiresAt).toISOString()
      });

      return { success: true, sessionKey };
    } catch (error) {
      console.error('❌ Failed to create wallet session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get active session for address
  getActiveSession(address: string): WalletSession | null {
    const session = this.sessions.get(address);
    if (!session || !session.isActive || Date.now() > session.expiresAt) {
      if (session) {
        this.sessions.delete(address);
      }
      return null;
    }
    return session;
  }

  // Validate session key
  validateSessionKey(address: string, sessionKey: string): boolean {
    const session = this.getActiveSession(address);
    return session?.sessionKey === sessionKey;
  }

  // Connect wallet using session key (frontend)
  async connectWalletWithSession(address: string, sessionKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.validateSessionKey(address, sessionKey)) {
        throw new Error('Invalid or expired session key');
      }

      if (!this.nitroliteClient) {
        throw new Error('Nitrolite client not initialized');
      }

      // Connect using session key instead of private key
      await this.nitroliteClient.connectWallet({
        address,
        sessionKey,
        useSessionAuth: true
      });

      console.log('✅ Wallet connected with session key:', this.formatAddress(address));
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to connect wallet with session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Connect wallet with private key (backend only)
  async connectWalletWithPrivateKey(address: string, privateKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.nitroliteClient) {
        throw new Error('Nitrolite client not initialized');
      }

      // Check for existing private key constraint
      try {
        await this.nitroliteClient.addPrivateKey(privateKey);
      } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          throw new Error('Private key already exists. Please create a new wallet or use session keys.');
        }
        throw error;
      }

      await this.nitroliteClient.connectWallet({
        address,
        privateKey,
        useSessionAuth: false
      });

      console.log('✅ Wallet connected with private key:', this.formatAddress(address));
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to connect wallet with private key:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Disconnect wallet and clean up session
  async disconnectWallet(address: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.nitroliteClient) {
        await this.nitroliteClient.disconnectWallet();
      }

      // Remove session
      this.sessions.delete(address);
      
      console.log('✅ Wallet disconnected and session cleaned up:', this.formatAddress(address));
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to disconnect wallet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Clean up expired sessions
  cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [address, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(address);
        console.log('🧹 Cleaned up expired session for:', this.formatAddress(address));
      }
    }
  }

  // Get all active sessions
  getActiveSessions(): WalletSession[] {
    this.cleanupExpiredSessions();
    return Array.from(this.sessions.values()).filter(session => session.isActive);
  }

  // Generate session key (simplified - in production, use proper crypto)
  private generateSessionKey(address: string): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return `session_${address}_${timestamp}_${random}`;
  }

  // Format address for display
  private formatAddress(address: string): string {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  // Get session info for debugging
  getSessionInfo(address: string): { session: WalletSession | null; isActive: boolean; timeRemaining?: number } {
    const session = this.getActiveSession(address);
    return {
      session,
      isActive: !!session,
      timeRemaining: session ? session.expiresAt - Date.now() : undefined
    };
  }
}

// Export singleton instance
export const walletManager = new WalletManager();

// Helper functions for backward compatibility
export const createWalletSession = async (address: string) => {
  return walletManager.createWalletSession(address);
};

export const connectWalletWithSession = async (address: string, sessionKey: string) => {
  return walletManager.connectWalletWithSession(address, sessionKey);
};

export const connectWalletWithPrivateKey = async (address: string, privateKey: string) => {
  return walletManager.connectWalletWithPrivateKey(address, privateKey);
};

export const disconnectWallet = async (address: string) => {
  return walletManager.disconnectWallet(address);
};

export const getActiveSession = (address: string) => {
  return walletManager.getActiveSession(address);
};

export const validateSessionKey = (address: string, sessionKey: string) => {
  return walletManager.validateSessionKey(address, sessionKey);
};
