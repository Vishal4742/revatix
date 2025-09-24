import { useState, useEffect } from 'react';
import { useAccount, useDisconnect, useConnect } from 'wagmi';
import { yellowNetworkService } from '../services/yellowNetworkService';

export const useWallet = () => {
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Handle wallet connection
  const connectWallet = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Connect to Yellow Network service
      const result = await yellowNetworkService.connect();
      console.log('Wallet connected:', result);
      return result;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle wallet disconnection
  const disconnectWallet = async () => {
    try {
      // Disconnect from Yellow Network service
      await yellowNetworkService.disconnect();
      
      // Disconnect from wagmi
      disconnect();
      
      // Clear local storage
      localStorage.removeItem('wallet_connected');
      // Don't clear revatix_active_tab here - let App component handle the redirect
      
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
      throw error;
    }
  };

  // Reconnect wallet
  const reconnectWallet = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Try to reconnect using the same connector
      if (connector) {
        await connect({ connector });
        await connectWallet();
      } else {
        throw new Error('No previous connector found');
      }
    } catch (error) {
      console.error('Wallet reconnection failed:', error);
      setConnectionError(error instanceof Error ? error.message : 'Reconnection failed');
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Get wallet status
  const getWalletStatus = () => {
    return {
      isConnected,
      address,
      connector: connector?.name || null,
      isConnecting,
      connectionError,
      availableConnectors: connectors.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type
      }))
    };
  };

  // Check if wallet was previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem('wallet_connected');
    if (wasConnected && !isConnected) {
      // Wallet was disconnected, clear the flag
      localStorage.removeItem('wallet_connected');
    } else if (isConnected) {
      // Wallet is connected, set the flag
      localStorage.setItem('wallet_connected', 'true');
    }
  }, [isConnected]);

  return {
    // State
    isConnected,
    address,
    connector,
    isConnecting,
    connectionError,
    
    // Actions
    connectWallet,
    disconnectWallet,
    reconnectWallet,
    getWalletStatus,
    
    // Wagmi hooks
    connectors,
    connect,
    disconnect
  };
};
