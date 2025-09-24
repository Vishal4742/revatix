import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Coins, 
  CheckCircle, 
  AlertCircle, 
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { ENV_CONFIG } from '../config/environment';

interface YellowNetworkFaucetProps {
  onClose: () => void;
}

interface FaucetResponse {
  success: boolean;
  message: string;
  amount?: number;
  asset?: string;
  destination?: string;
}

export const YellowNetworkFaucet: React.FC<YellowNetworkFaucetProps> = ({ onClose }) => {
  const { address, isConnected } = useAccount();
  const [isRequesting, setIsRequesting] = useState(false);
  const [result, setResult] = useState<FaucetResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customAddress, setCustomAddress] = useState('');

  const requestTokens = async (userAddress: string) => {
    setIsRequesting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(ENV_CONFIG.yellowNetwork.faucetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: userAddress
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      console.log('Faucet response:', data);
    } catch (err) {
      console.error('Faucet request failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to request tokens');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleRequestTokens = async () => {
    const addressToUse = isConnected && address ? address : customAddress;
    
    if (!addressToUse) {
      setError('Please connect your wallet or enter a custom address');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(addressToUse)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    await requestTokens(addressToUse);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getPowerShellCommand = (address: string) => {
    return `Invoke-RestMethod -Uri "${ENV_CONFIG.yellowNetwork.faucetUrl}" -Method POST -ContentType "application/json" -Body '{"userAddress":"${address}"}'`;
  };

  const getCurlCommand = (address: string) => {
    return `curl -XPOST ${ENV_CONFIG.yellowNetwork.faucetUrl} -H "Content-Type: application/json" -d '{"userAddress":"${address}"}'`;
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Yellow Network Faucet</h2>
              <p className="text-sm text-gray-600">Get test tokens for gasless transactions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Wallet Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Wallet Status</h3>
            {isConnected && address ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Connected Wallet:</p>
                  <p className="font-mono text-sm text-gray-900">{address}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-red-600">Wallet not connected</span>
              </div>
            )}
          </div>

          {/* Custom Address Input */}
          {!isConnected && (
            <div className="mb-6">
              <label htmlFor="customAddress" className="block text-sm font-medium text-gray-700 mb-2">
                Enter Wallet Address
              </label>
              <input
                type="text"
                id="customAddress"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="0x..."
              />
            </div>
          )}

          {/* Request Tokens Button */}
          <div className="mb-6">
            <button
              onClick={handleRequestTokens}
              disabled={isRequesting || (!isConnected && !customAddress)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isRequesting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Requesting Tokens...</span>
                </>
              ) : (
                <>
                  <Coins className="w-5 h-5" />
                  <span>Request Test Tokens</span>
                </>
              )}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Tokens Sent Successfully!</h3>
              </div>
              <div className="space-y-2 text-sm text-green-700">
                <p><strong>Amount:</strong> {result.amount} {result.asset?.toUpperCase()}</p>
                <p><strong>Destination:</strong> {result.destination}</p>
                <p><strong>Message:</strong> {result.message}</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-800">Request Failed</h3>
              </div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* API Commands */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">API Commands</h3>
            
            <div className="space-y-4">
              {/* PowerShell Command */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">PowerShell Command:</label>
                  <button
                    onClick={() => copyToClipboard(getPowerShellCommand(isConnected && address ? address : customAddress))}
                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <code className="text-sm text-gray-800 break-all">
                    {getPowerShellCommand(isConnected && address ? address : customAddress)}
                  </code>
                </div>
              </div>

              {/* cURL Command */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">cURL Command:</label>
                  <button
                    onClick={() => copyToClipboard(getCurlCommand(isConnected && address ? address : customAddress))}
                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <code className="text-sm text-gray-800 break-all">
                    {getCurlCommand(isConnected && address ? address : customAddress)}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">About Yellow Network Testnet</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• <strong>Amount:</strong> 10 USDC test tokens per request</p>
              <p>• <strong>Gasless:</strong> All transactions are gasless on Yellow Network</p>
              <p>• <strong>State Channels:</strong> Uses ERC-7824 protocol for instant finality</p>
              <p>• <strong>Cross-Chain:</strong> Supports multiple EVM chains</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
