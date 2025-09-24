import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Zap, 
  Coins, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Wallet,
  Activity,
  DollarSign,
  Users
} from 'lucide-react';
import { 
  isYellowNetworkEnabled, 
  getYellowNetworkStatus, 
  performGaslessVATRefund,
  performGaslessPayroll,
  lockYellowCollateral
} from '../utils/yellowNetwork';

interface GaslessTransactionManagerProps {
  onClose: () => void;
}

export const GaslessTransactionManager: React.FC<GaslessTransactionManagerProps> = ({ onClose }) => {
  const [yellowNetworkStatus, setYellowNetworkStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stakingAmount, setStakingAmount] = useState<number>(0);
  const [showStakingModal, setShowStakingModal] = useState(false);

  useEffect(() => {
    loadYellowNetworkStatus();
  }, []);

  const loadYellowNetworkStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const status = await getYellowNetworkStatus();
      setYellowNetworkStatus(status);
    } catch (err) {
      console.error('Failed to load Yellow Network status:', err);
      setError('Failed to load Yellow Network status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStakeForGasless = async () => {
    if (stakingAmount <= 0) {
      setError('Please enter a valid staking amount');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await lockYellowCollateral(stakingAmount);
      if (result.success) {
        setSuccess(`Successfully locked ${stakingAmount} YELLOW tokens as collateral!`);
        setShowStakingModal(false);
        setStakingAmount(0);
        await loadYellowNetworkStatus(); // Refresh status
      } else {
        setError(result.error || 'Failed to lock YELLOW collateral');
      }
    } catch (err) {
      console.error('Staking failed:', err);
      setError('Failed to lock YELLOW collateral');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGaslessVATRefund = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await performGaslessVATRefund(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Test recipient
        100, // Test amount
        'test-refund-123'
      );
      
      if (result.success) {
        setSuccess('Gasless VAT refund processed successfully! Zero fees applied.');
      } else {
        setError(result.error || 'Failed to process gasless VAT refund');
      }
    } catch (err) {
      console.error('Gasless VAT refund failed:', err);
      setError('Failed to process gasless VAT refund');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGaslessPayroll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const testRecipients = [
        { address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', amount: 1000 },
        { address: '0x8ba1f109551bD432803012645Hac136c', amount: 1500 },
        { address: '0x1234567890123456789012345678901234567890', amount: 2000 }
      ];

      const result = await performGaslessPayroll(testRecipients, 'test-payroll-123');
      
      if (result.success) {
        setSuccess(`Gasless payroll processed successfully! ${testRecipients.length} payments with zero fees.`);
      } else {
        setError(result.error || 'Failed to process gasless payroll');
      }
    } catch (err) {
      console.error('Gasless payroll failed:', err);
      setError('Failed to process gasless payroll');
    } finally {
      setIsLoading(false);
    }
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
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Gasless Transaction Manager</h2>
              <p className="text-sm text-gray-600">Leverage Yellow Network's zero-fee state channels</p>
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
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">Gasless Enabled</span>
              </div>
              <p className="text-sm text-green-700">
                {yellowNetworkStatus?.enabled ? 'Yes' : 'No'}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Coins className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800">YELLOW Collateral</span>
              </div>
              <p className="text-sm text-blue-700">
                {yellowNetworkStatus?.collateralAmount || 0} YELLOW
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-800">Can Open Channels</span>
              </div>
              <p className="text-sm text-purple-700">
                {yellowNetworkStatus?.canOpenChannels ? 'Yes' : 'No'}
              </p>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>{success}</span>
              </div>
            </div>
          )}

          {/* Gasless Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* VAT Refunds */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Gasless VAT Refunds</h3>
                  <p className="text-sm text-gray-600">Zero-fee tourist refunds</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-4">
                Process VAT refunds instantly through Yellow Network's gasless state channels. 
                Tourists receive refunds with zero transaction fees.
              </p>
              <button
                onClick={handleGaslessVATRefund}
                disabled={isLoading || !yellowNetworkStatus?.canOpenChannels}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Processing...' : 'Test Gasless VAT Refund'}
              </button>
            </div>

            {/* Payroll */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Gasless Payroll</h3>
                  <p className="text-sm text-gray-600">Zero-fee bulk payments</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-4">
                Process bulk payroll payments through gasless state channels. 
                Employers save on transaction fees while employees receive instant payments.
              </p>
              <button
                onClick={handleGaslessPayroll}
                disabled={isLoading || !yellowNetworkStatus?.canOpenChannels}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Processing...' : 'Test Gasless Payroll'}
              </button>
            </div>
          </div>

          {/* Staking Section */}
          {!yellowNetworkStatus?.canOpenChannels && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800">Lock YELLOW Collateral</h3>
                  <p className="text-sm text-yellow-700">Lock YELLOW tokens as collateral for state channels</p>
                </div>
              </div>
              <p className="text-sm text-yellow-700 mb-4">
                Lock YELLOW tokens as collateral to open state channels. The more collateral you lock, 
                the more state channels you can open for gasless transactions.
              </p>
              <button
                onClick={() => setShowStakingModal(true)}
                className="bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Lock YELLOW Collateral
              </button>
            </div>
          )}

          {/* Benefits */}
          <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yellow Network Gasless Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <Zap className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Zero Transaction Fees</h4>
                  <p className="text-sm text-gray-600">No gas fees for any transactions</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Activity className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Instant Finality</h4>
                  <p className="text-sm text-gray-600">Immediate transaction settlement</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Wallet className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">State Channel Technology</h4>
                  <p className="text-sm text-gray-600">ERC-7824 compliant off-chain operations</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Staking Rewards</h4>
                  <p className="text-sm text-gray-600">Earn rewards while enabling gasless transactions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Staking Modal */}
        <AnimatePresence>
          {showStakingModal && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 relative"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <button 
                  onClick={() => setShowStakingModal(false)} 
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Lock YELLOW Collateral</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                      Amount to Lock (YELLOW)
                    </label>
                    <input
                      type="number"
                      id="amount"
                      value={stakingAmount}
                      onChange={(e) => setStakingAmount(parseFloat(e.target.value))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Staking YELLOW tokens enables gasless transactions. You'll earn rewards 
                    while providing liquidity for the gasless network.
                  </p>
                  <button
                    onClick={handleStakeForGasless}
                    disabled={isLoading || stakingAmount <= 0}
                    className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Locking...' : 'Lock YELLOW Collateral'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
