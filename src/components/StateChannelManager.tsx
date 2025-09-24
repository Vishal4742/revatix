import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  X, 
  Send, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Users,
  Activity
} from 'lucide-react';
import { 
  createPaymentChannel, 
  sendPayment, 
  closeChannel, 
  getChannelStatus, 
  challengeChannel,
  connectWallet,
  disconnectWallet
} from '../utils/yellowNetwork';

interface Channel {
  id: string;
  participants: string[];
  status: 'open' | 'closed' | 'challenged';
  version: number;
  balance: number;
  createdAt: Date;
}

interface StateChannelManagerProps {
  onClose: () => void;
}

export const StateChannelManager: React.FC<StateChannelManagerProps> = ({ onClose }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string>('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelData, setNewChannelData] = useState({
    recipient: '',
    amount: '',
    token: 'YELLOW'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      // Check if wallet is connected
      const result = await connectWallet();
      setIsConnected(true);
      setConnectedAddress(result.address);
    } catch (error) {
      setIsConnected(false);
      setConnectedAddress('');
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      const result = await connectWallet();
      setIsConnected(true);
      setConnectedAddress(result.address);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setIsConnected(false);
      setConnectedAddress('');
      setChannels([]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to disconnect wallet');
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelData.recipient || !newChannelData.amount) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await createPaymentChannel(
        newChannelData.recipient,
        parseFloat(newChannelData.amount),
        newChannelData.token
      );

      if (result.success) {
        const newChannel: Channel = {
          id: result.channelId,
          participants: [connectedAddress, newChannelData.recipient],
          status: 'open',
          version: 0,
          balance: parseFloat(newChannelData.amount),
          createdAt: new Date()
        };

        setChannels(prev => [...prev, newChannel]);
        setNewChannelData({ recipient: '', amount: '', token: 'YELLOW' });
        setShowCreateChannel(false);
      } else {
        setError(result.error || 'Failed to create channel');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create channel');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPayment = async (channelId: string, amount: number) => {
    try {
      setLoading(true);
      setError(null);

      const channel = channels.find(c => c.id === channelId);
      if (!channel) {
        setError('Channel not found');
        return;
      }

      const recipient = channel.participants.find(p => p !== connectedAddress);
      if (!recipient) {
        setError('Recipient not found');
        return;
      }

      const result = await sendPayment(recipient, amount, 'YELLOW');

      if (result.success) {
        // Update channel version
        setChannels(prev => prev.map(c => 
          c.id === channelId 
            ? { ...c, version: c.version + 1 }
            : c
        ));
      } else {
        setError(result.error || 'Failed to send payment');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send payment');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseChannel = async (channelId: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await closeChannel(channelId);

      if (result.success) {
        setChannels(prev => prev.map(c => 
          c.id === channelId 
            ? { ...c, status: 'closed' as const }
            : c
        ));
      } else {
        setError(result.error || 'Failed to close channel');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to close channel');
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeChannel = async (channelId: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await challengeChannel(channelId, 'User initiated dispute');

      if (result.success) {
        setChannels(prev => prev.map(c => 
          c.id === channelId 
            ? { ...c, status: 'challenged' as const }
            : c
        ));
      } else {
        setError(result.error || 'Failed to challenge channel');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to challenge channel');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed':
        return <X className="w-4 h-4 text-gray-500" />;
      case 'challenged':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'challenged':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">State Channel Manager</h2>
              <p className="text-sm text-gray-600">ERC-7824 State Channel Operations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Connection Status */}
        <div className="p-6 border-b border-gray-200">
          {!isConnected ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Connect Wallet</h3>
                <p className="text-sm text-gray-600">Connect your wallet to manage state channels</p>
              </div>
              <button
                onClick={handleConnect}
                disabled={loading}
                className="btn-primary px-6 py-2"
              >
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Wallet Connected</h3>
                <p className="text-sm text-gray-600 font-mono">{connectedAddress}</p>
              </div>
              <button
                onClick={handleDisconnect}
                className="btn-secondary px-4 py-2"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {!isConnected ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
              <p className="text-gray-600">Connect your wallet to start managing state channels</p>
            </div>
          ) : (
            <>
              {/* Create Channel Button */}
              <div className="mb-6">
                <button
                  onClick={() => setShowCreateChannel(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create State Channel</span>
                </button>
              </div>

              {/* Channels List */}
              <div className="space-y-4">
                {channels.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No State Channels</h3>
                    <p className="text-gray-600">Create your first state channel to get started</p>
                  </div>
                ) : (
                  channels.map((channel) => (
                    <div key={channel.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(channel.status)}
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              Channel {channel.id.slice(0, 8)}...
                            </h4>
                            <p className="text-sm text-gray-600">
                              Version {channel.version} • {channel.participants.length} participants
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(channel.status)}`}>
                          {channel.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Participants</p>
                          <div className="space-y-1">
                            {channel.participants.map((participant, index) => (
                              <p key={index} className="text-sm font-mono text-gray-700">
                                {participant === connectedAddress ? 'You' : participant.slice(0, 8)}...
                              </p>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Balance</p>
                          <p className="text-sm font-semibold text-gray-900">{channel.balance} YELLOW</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
                          <p className="text-sm text-gray-700">
                            {channel.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Channel Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSendPayment(channel.id, 1)}
                          disabled={loading || channel.status !== 'open'}
                          className="btn-primary text-sm px-3 py-1 flex items-center space-x-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send 1 YELLOW</span>
                        </button>
                        <button
                          onClick={() => handleCloseChannel(channel.id)}
                          disabled={loading || channel.status !== 'open'}
                          className="btn-secondary text-sm px-3 py-1"
                        >
                          Close Channel
                        </button>
                        <button
                          onClick={() => handleChallengeChannel(channel.id)}
                          disabled={loading || channel.status !== 'open'}
                          className="btn-secondary text-sm px-3 py-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        >
                          Challenge
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Create Channel Modal */}
        {showCreateChannel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create State Channel</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={newChannelData.recipient}
                    onChange={(e) => setNewChannelData(prev => ({ ...prev, recipient: e.target.value }))}
                    placeholder="0x..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Amount
                  </label>
                  <input
                    type="number"
                    value={newChannelData.amount}
                    onChange={(e) => setNewChannelData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token
                  </label>
                  <select
                    value={newChannelData.token}
                    onChange={(e) => setNewChannelData(prev => ({ ...prev, token: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    <option value="YELLOW">YELLOW</option>
                    <option value="USDC">USDC</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 mt-6">
                <button
                  onClick={handleCreateChannel}
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Creating...' : 'Create Channel'}
                </button>
                <button
                  onClick={() => setShowCreateChannel(false)}
                  className="btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
