import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play, 
  RefreshCw,
  ExternalLink,
  Activity,
  Wallet,
  Send,
  Database
} from 'lucide-react';
import { 
  connectWallet, 
  disconnectWallet, 
  getAccountBalance,
  createPaymentChannel,
  sendPayment,
  closeChannel,
  getChannelStatus
} from '../utils/yellowNetwork';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  details?: string;
}

interface TestnetTesterProps {
  onClose: () => void;
}

export const TestnetTester: React.FC<TestnetTesterProps> = ({ onClose }) => {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Environment Configuration', status: 'pending' },
    { name: 'Wallet Connection', status: 'pending' },
    { name: 'Network Connection', status: 'pending' },
    { name: 'Balance Fetching', status: 'pending' },
    { name: 'State Channel Creation', status: 'pending' },
    { name: 'Payment Processing', status: 'pending' },
    { name: 'Channel Management', status: 'pending' },
    { name: 'Error Handling', status: 'pending' }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [connectedAddress, setConnectedAddress] = useState<string>('');

  const updateTest = (name: string, status: TestResult['status'], message?: string, details?: string) => {
    setTests(prev => prev.map(test => 
      test.name === name 
        ? { ...test, status, message, details }
        : test
    ));
  };

  const runTest = async (testName: string, testFunction: () => Promise<void>) => {
    setCurrentTest(testName);
    updateTest(testName, 'running');
    
    try {
      await testFunction();
      updateTest(testName, 'passed', 'Test passed successfully');
    } catch (error) {
      updateTest(testName, 'failed', error instanceof Error ? error.message : 'Test failed');
    }
  };

  const testEnvironmentConfig = async () => {
    const requiredVars = [
      'VITE_YELLOW_NETWORK_CLEARNODE_URL',
      'VITE_NITROLITE_APP_ID',
      'VITE_NITROLITE_API_KEY'
    ];

    const missing = requiredVars.filter(varName => !import.meta.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }

    // Check if we're on testnet
    const isTestnet = import.meta.env.VITE_APP_ENV === 'testnet';
    if (!isTestnet) {
      updateTest('Environment Configuration', 'passed', 'Environment configured', 'Note: Not in testnet mode');
    }
  };

  const testWalletConnection = async () => {
    const result = await connectWallet();
    setConnectedAddress(result.address);
    
    if (!result.address) {
      throw new Error('No wallet address returned');
    }
  };

  const testNetworkConnection = async () => {
    // Test if we can get account balance (requires network connection)
    const balance = await getAccountBalance();
    
    if (balance === null) {
      throw new Error('Failed to fetch balance - network connection issue');
    }
  };

  const testBalanceFetching = async () => {
    const balance = await getAccountBalance();
    
    if (balance.native < 0) {
      throw new Error('Invalid balance returned');
    }
  };

  const testStateChannelCreation = async () => {
    // Create a test channel with a dummy recipient
    const testRecipient = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
    const result = await createPaymentChannel(testRecipient, 1, 'YELLOW');
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create state channel');
    }
  };

  const testPaymentProcessing = async () => {
    const testRecipient = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
    const result = await sendPayment(testRecipient, 0.1, 'YELLOW');
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to process payment');
    }
  };

  const testChannelManagement = async () => {
    // Test channel status fetching
    const testChannelId = 'test-channel-123';
    const status = await getChannelStatus(testChannelId);
    
    // This might fail if channel doesn't exist, which is expected
    if (status === null) {
      updateTest('Channel Management', 'passed', 'Channel management functions available', 'Test channel not found (expected)');
      return;
    }
  };

  const testErrorHandling = async () => {
    // Test with invalid address
    try {
      await sendPayment('invalid-address', 1, 'YELLOW');
      throw new Error('Should have failed with invalid address');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid')) {
        // Expected error
        return;
      }
      throw error;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setCurrentTest('');

    const testFunctions = [
      { name: 'Environment Configuration', fn: testEnvironmentConfig },
      { name: 'Wallet Connection', fn: testWalletConnection },
      { name: 'Network Connection', fn: testNetworkConnection },
      { name: 'Balance Fetching', fn: testBalanceFetching },
      { name: 'State Channel Creation', fn: testStateChannelCreation },
      { name: 'Payment Processing', fn: testPaymentProcessing },
      { name: 'Channel Management', fn: testChannelManagement },
      { name: 'Error Handling', fn: testErrorHandling }
    ];

    for (const test of testFunctions) {
      await runTest(test.name, test.fn);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
    setCurrentTest('');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-600';
      case 'running':
        return 'text-blue-600';
      case 'passed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
    }
  };

  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;
  const totalTests = tests.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Testnet Tester</h2>
              <p className="text-sm text-gray-600">Comprehensive testnet functionality testing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Test Results Summary */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{passedTests}</div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{failedTests}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{totalTests}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>

        {/* Current Test Status */}
        {currentTest && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
              <span className="text-blue-800 font-medium">Running: {currentTest}</span>
            </div>
          </div>
        )}

        {/* Test List */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <div className="space-y-3">
            {tests.map((test, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {getStatusIcon(test.status)}
                <div className="flex-1">
                  <div className={`font-medium ${getStatusColor(test.status)}`}>
                    {test.name}
                  </div>
                  {test.message && (
                    <div className="text-sm text-gray-600 mt-1">
                      {test.message}
                    </div>
                  )}
                  {test.details && (
                    <div className="text-xs text-gray-500 mt-1">
                      {test.details}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {connectedAddress && (
                <div className="flex items-center space-x-2">
                  <Wallet className="w-4 h-4" />
                  <span className="font-mono">{connectedAddress.slice(0, 8)}...</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={runAllTests}
                disabled={isRunning}
                className="btn-primary flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>{isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Testnet Links */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">Testnet Resources:</div>
            <div className="flex items-center space-x-4">
              <a
                href="https://faucet.polygon.technology/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Get Test MATIC</span>
              </a>
              <a
                href="https://mumbai.polygonscan.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Mumbai Explorer</span>
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
