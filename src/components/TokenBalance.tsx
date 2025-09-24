import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Eye, Wallet, Copy, Activity, Coins, Brain } from 'lucide-react';
import { getAccountBalance, getConnectedAccount, isWalletConnected, formatAddress } from '../utils/algorand';
import { StateChannelManager } from './StateChannelManager';
import { GaslessTransactionManager } from './GaslessTransactionManager';
import { NitroliteExamplesManager } from './NitroliteExamplesManager';
import { YellowNetworkFaucet } from './YellowNetworkFaucet';
import { CerebroGameManager } from './CerebroGameManager';

export const TokenBalance: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState('');
  const [showStateChannelManager, setShowStateChannelManager] = useState(false);
  const [showGaslessManager, setShowGaslessManager] = useState(false);
  const [showNitroliteExamples, setShowNitroliteExamples] = useState(false);
  const [showYellowFaucet, setShowYellowFaucet] = useState(false);
  const [showCerebroGame, setShowCerebroGame] = useState(false);
  const [balances, setBalances] = useState({
    totalUSD: 0,
    eth: 0,
    totalCoins: 0,
    assets: [] as Array<{ 
      assetId: number; 
      amount: number; 
      name: string; 
      unitName: string; 
      decimals: number;
    }>
  });

  const fetchBalances = async () => {
    setIsLoading(true);
    try {
      const connectedAddress = getConnectedAccount();
      
      if (isWalletConnected() && connectedAddress) {
        setWalletAddress(connectedAddress);
        
        const accountBalance = await getAccountBalance();
        
        // Calculate total USD value (simplified calculation)
        const yellowPrice = 1; // Example YELLOW price in USD (gasless network)
        const totalUSD = accountBalance.native * yellowPrice;
        
        // Count total assets (YELLOW + ERC20 tokens with positive balance)
        const totalCoins = (accountBalance.native > 0 ? 1 : 0) + accountBalance.assets.length;
        
        setBalances({
          totalUSD: totalUSD,
          eth: accountBalance.native,
          totalCoins: totalCoins,
          assets: accountBalance.assets
        });
      } else {
        // Reset when wallet not connected
        setWalletAddress('');
        setBalances({
          totalUSD: 0,
          eth: 0,
          totalCoins: 0,
          assets: []
        });
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error);
      // Show fallback data on error
      setBalances({
        totalUSD: 0,
        eth: 0,
        totalCoins: 0,
        assets: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      // You could add a toast notification here
    }
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-3 sm:h-4 bg-gray-200 rounded mb-2 sm:mb-3"></div>
      <div className="h-6 sm:h-8 bg-gray-200 rounded mb-3 sm:mb-4"></div>
      <div className="h-2 sm:h-3 bg-gray-200 rounded mb-2"></div>
      <div className="h-2 sm:h-3 bg-gray-200 rounded mb-3 sm:mb-4"></div>
      <div className="h-10 sm:h-12 bg-gray-200 rounded"></div>
    </div>
  );

  const TokenRow = ({ symbol, amount, unitName }: {
    symbol: string;
    amount: number;
    unitName?: string;
  }) => (
    <div className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-200 last:border-b-0">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-gray-700">
            {(unitName || symbol).substring(0, 2).toUpperCase()}
          </span>
        </div>
        <div>
          <div className="font-medium text-gray-900 text-sm sm:text-base">{unitName || symbol}</div>
          <div className="text-xs sm:text-sm text-gray-600">
            {amount.toLocaleString(undefined, { 
              maximumFractionDigits: amount < 1 ? 6 : 2 
            })}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium text-gray-900 text-sm sm:text-base">
          {symbol === 'YELLOW' ? `$${(amount * 1).toFixed(2)}` : '--'}
        </div>
        {symbol === 'YELLOW' && (
          <div className="text-xs sm:text-sm flex items-center text-green-500">
            <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
            +2%
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Token Balance</h3>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowStateChannelManager(true)}
            className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
            title="Manage State Channels"
          >
            <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
          </button>
          <button 
            onClick={() => setShowGaslessManager(true)}
            className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
            title="Gasless Transactions"
          >
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
          </button>
          <button 
            onClick={() => setShowNitroliteExamples(true)}
            className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
            title="Nitrolite Examples"
          >
            <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
          </button>
          <button 
            onClick={() => setShowYellowFaucet(true)}
            className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
            title="Yellow Network Faucet"
          >
            <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
          </button>
          <button 
            onClick={() => setShowCerebroGame(true)}
            className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
            title="Cerebro Game Example"
          >
            <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
          </button>
          <button 
            onClick={fetchBalances}
            className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
            disabled={isLoading}
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 text-green-700 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Wallet Address */}
          {isWalletConnected() && walletAddress ? (
            <div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-gray-100 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                  <div>
                    <div className="text-xs sm:text-sm text-gray-900 font-medium">Connected Wallet</div>
                    <div className="text-xs text-gray-700 font-mono">
                      {formatAddress(walletAddress)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={copyAddress}
                  className="p-1 text-gray-700 hover:text-gray-900 transition-colors"
                  title="Copy full address"
                >
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-gray-100 border border-gray-200 rounded-lg">
              <div className="text-center">
                <div className="text-xs sm:text-sm text-gray-900 font-medium mb-1">Wallet Not Connected</div>
                <div className="text-xs text-gray-700">
                  Connect your wallet to view real balances
                </div>
              </div>
            </div>
          )}

          {/* Main Content - Responsive vertical layout */}
          <div className="space-y-4 sm:space-y-6 mb-4 sm:mb-6">
            <div className="text-center">
              <div className="text-xl sm:text-xl font-bold text-gray-900 mb-2">
                ${balances.totalUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="text-gray-600 text-xs sm:text-sm">Total Balance (USD)</div>
            </div>

            <div className="flex items-center justify-center p-3 sm:p-4 bg-gray-100 border border-gray-200 rounded-lg">
              <div className="text-center">
                <div className="text-base sm:text-lg font-bold text-gray-900 mb-1">{balances.totalCoins}</div>
                <div className="text-xs sm:text-sm text-gray-700">Total Assets</div>
              </div>
            </div>
          </div>

          {/* Token List */}
          <div className="space-y-1 mb-4 sm:mb-6">
            {/* YELLOW Balance */}
            {balances.eth > 0 && (
              <TokenRow
                symbol="YELLOW"
                amount={balances.eth}
                unitName="YELLOW"
              />
            )}

            {/* Other Assets */}
            {balances.assets.map((asset) => (
              <TokenRow
                key={asset.assetId}
                symbol={asset.unitName}
                amount={asset.amount / Math.pow(10, asset.decimals)}
                unitName={asset.name}
              />
            ))}

            {/* Empty state when no tokens */}
            {balances.eth === 0 && balances.assets.length === 0 && (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <div className="text-xs sm:text-sm">No tokens found</div>
                <div className="text-xs text-gray-400 mt-1">
                  {isWalletConnected() ? 'Your wallet appears to be empty' : 'Connect wallet to view balances'}
                </div>
              </div>
            )}
          </div>

          {/* Portfolio Actions */}
          <div className="space-y-2">
            <button className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 text-xs sm:text-sm">
              <Eye className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
              View Portfolio
            </button>
          </div>

          {/* Balance Insight */}
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 mt-4 sm:mt-6">
            <div className="text-xs text-gray-700 mb-1">Portfolio Insight</div>
            <div className="text-xs sm:text-sm text-gray-700">
              {balances.totalUSD > 0 
                ? `Your portfolio holds ${balances.totalCoins} asset${balances.totalCoins !== 1 ? 's' : ''} worth $${balances.totalUSD.toFixed(2)}`
                : isWalletConnected() 
                ? 'Consider adding YELLOW or other assets to your wallet'
                : 'Connect your wallet to see real-time balance insights'
              }
            </div>
          </div>
        </>
      )}

      {/* State Channel Manager Modal */}
      {showStateChannelManager && (
        <StateChannelManager onClose={() => setShowStateChannelManager(false)} />
      )}

      {/* Gasless Transaction Manager Modal */}
      {showGaslessManager && (
        <GaslessTransactionManager onClose={() => setShowGaslessManager(false)} />
      )}

      {/* Nitrolite Examples Manager Modal */}
      {showNitroliteExamples && (
        <NitroliteExamplesManager onClose={() => setShowNitroliteExamples(false)} />
      )}

      {/* Yellow Network Faucet Modal */}
      {showYellowFaucet && (
        <YellowNetworkFaucet onClose={() => setShowYellowFaucet(false)} />
      )}

      {/* Cerebro Game Manager Modal */}
      {showCerebroGame && (
        <CerebroGameManager onClose={() => setShowCerebroGame(false)} />
      )}
    </div>
  );
};