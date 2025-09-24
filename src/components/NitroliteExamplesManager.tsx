import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Play, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Zap,
  Activity,
  Users,
  Eye,
  AlertTriangle,
  Trash2,
  ArrowRight,
  Globe,
  Coins
} from 'lucide-react';
import { nitroliteExamples, runAllExamples } from '../examples/nitrolite-examples';

interface NitroliteExamplesManagerProps {
  onClose: () => void;
}

interface ExampleResult {
  name: string;
  success: boolean;
  result?: any;
  error?: string;
}

export const NitroliteExamplesManager: React.FC<NitroliteExamplesManagerProps> = ({ onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentExample, setCurrentExample] = useState<string>('');
  const [results, setResults] = useState<ExampleResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const examples = [
    {
      id: 'example1',
      name: 'Basic State Channel Creation',
      description: 'Create a simple state channel between two participants',
      icon: <Activity className="w-5 h-5" />,
      color: 'bg-blue-500',
      function: nitroliteExamples.example1_BasicStateChannel
    },
    {
      id: 'example2',
      name: 'State Channel Payment',
      description: 'Process a payment through an existing state channel',
      icon: <Coins className="w-5 h-5" />,
      color: 'bg-green-500',
      function: nitroliteExamples.example2_StateChannelPayment
    },
    {
      id: 'example3',
      name: 'Multi-Participant Channel',
      description: 'Create a state channel with multiple participants',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-purple-500',
      function: nitroliteExamples.example3_MultiParticipantChannel
    },
    {
      id: 'example4',
      name: 'Channel State Query',
      description: 'Query the current state of a state channel',
      icon: <Eye className="w-5 h-5" />,
      color: 'bg-yellow-500',
      function: nitroliteExamples.example4_ChannelStateQuery
    },
    {
      id: 'example5',
      name: 'Channel Challenge',
      description: 'Challenge a channel state for dispute resolution',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'bg-red-500',
      function: nitroliteExamples.example5_ChannelChallenge
    },
    {
      id: 'example6',
      name: 'Channel Closure',
      description: 'Close a state channel and settle final state',
      icon: <Trash2 className="w-5 h-5" />,
      color: 'bg-gray-500',
      function: nitroliteExamples.example6_ChannelClosure
    },
    {
      id: 'example7',
      name: 'Batch State Updates',
      description: 'Perform multiple state updates in sequence',
      icon: <RefreshCw className="w-5 h-5" />,
      color: 'bg-indigo-500',
      function: nitroliteExamples.example7_BatchStateUpdates
    },
    {
      id: 'example8',
      name: 'Cross-Chain Channel',
      description: 'Create a cross-chain state channel',
      icon: <Globe className="w-5 h-5" />,
      color: 'bg-teal-500',
      function: nitroliteExamples.example8_CrossChainChannel
    },
    {
      id: 'example9',
      name: 'Gasless Transaction',
      description: 'Perform a completely gasless transaction',
      icon: <Zap className="w-5 h-5" />,
      color: 'bg-orange-500',
      function: nitroliteExamples.example9_GaslessTransaction
    },
    {
      id: 'example10',
      name: 'Complete Workflow',
      description: 'Run the complete state channel workflow',
      icon: <ArrowRight className="w-5 h-5" />,
      color: 'bg-pink-500',
      function: nitroliteExamples.example10_CompleteWorkflow
    }
  ];

  const runExample = async (example: any) => {
    setIsRunning(true);
    setCurrentExample(example.id);
    
    try {
      let result;
      if (example.id === 'example2' || example.id === 'example4' || example.id === 'example5' || example.id === 'example6' || example.id === 'example7') {
        // These examples need a channel ID, use a mock one
        result = await example.function('mock-channel-id');
      } else {
        result = await example.function();
      }
      
      setResults(prev => [...prev, {
        name: example.name,
        success: true,
        result
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        name: example.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
    } finally {
      setIsRunning(false);
      setCurrentExample('');
    }
  };

  const runAllExamplesHandler = async () => {
    setIsRunning(true);
    setCurrentExample('all');
    
    try {
      const allResults = await runAllExamples();
      setResults(allResults);
      setShowResults(true);
    } catch (error) {
      console.error('Failed to run all examples:', error);
    } finally {
      setIsRunning(false);
      setCurrentExample('');
    }
  };

  const clearResults = () => {
    setResults([]);
    setShowResults(false);
  };

  const getStatusIcon = (exampleId: string) => {
    const result = results.find(r => r.name === examples.find(e => e.id === exampleId)?.name);
    if (!result) return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    
    if (result.success) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-500" />;
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
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Nitrolite Examples Manager</h2>
              <p className="text-sm text-gray-600">ERC-7824 State Channel Protocol Examples</p>
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
          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={runAllExamplesHandler}
                disabled={isRunning}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>{isRunning && currentExample === 'all' ? 'Running All...' : 'Run All Examples'}</span>
              </button>
              
              {results.length > 0 && (
                <button
                  onClick={clearResults}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Clear Results
                </button>
              )}
            </div>
            
            <div className="text-sm text-gray-600">
              {results.filter(r => r.success).length} / {results.length} examples passed
            </div>
          </div>

          {/* Current Running Status */}
          {isRunning && currentExample && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-blue-800 font-medium">
                  {currentExample === 'all' ? 'Running all examples...' : `Running ${examples.find(e => e.id === currentExample)?.name}...`}
                </span>
              </div>
            </div>
          )}

          {/* Examples Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {examples.map((example) => (
              <div key={example.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 ${example.color} rounded-lg flex items-center justify-center`}>
                      {example.icon}
                    </div>
                    <span className="font-medium text-gray-900">{example.name}</span>
                  </div>
                  {getStatusIcon(example.id)}
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{example.description}</p>
                
                <button
                  onClick={() => runExample(example)}
                  disabled={isRunning}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Run Example</span>
                </button>
              </div>
            ))}
          </div>

          {/* Results Section */}
          {results.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Results</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{result.name}</div>
                        {result.error && (
                          <div className="text-sm text-red-600">{result.error}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {result.success ? 'Success' : 'Failed'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documentation */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">About Nitrolite Examples</h3>
            <p className="text-sm text-blue-800 mb-3">
              These examples demonstrate the core functionality of the ERC-7824 state channel protocol
              implemented by Nitrolite. Each example showcases different aspects of gasless transactions
              and state channel management.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">Key Features:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Gasless transactions</li>
                  <li>Instant finality</li>
                  <li>Multi-participant channels</li>
                  <li>Cross-chain support</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Use Cases:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>VAT refunds</li>
                  <li>Payroll processing</li>
                  <li>Micropayments</li>
                  <li>Dispute resolution</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
