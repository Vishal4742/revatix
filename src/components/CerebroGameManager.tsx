import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Play, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Brain,
  Users,
  Target,
  AlertTriangle,
  Trash2,
  ArrowRight,
  Gamepad2,
  Trophy
} from 'lucide-react';
import { 
  CerebroGame, 
  CerebroMove, 
  cerebroExamples, 
  runAllCerebroExamples 
} from '../examples/cerebro-example';

interface CerebroGameManagerProps {
  onClose: () => void;
}

interface ExampleResult {
  name: string;
  success: boolean;
  result?: any;
  error?: string;
}

export const CerebroGameManager: React.FC<CerebroGameManagerProps> = ({ onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentExample, setCurrentExample] = useState<string>('');
  const [results, setResults] = useState<ExampleResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [game, setGame] = useState<CerebroGame | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [showGameBoard, setShowGameBoard] = useState(false);

  const examples = [
    {
      id: 'cerebro1',
      name: 'Initialize Cerebro Game',
      description: 'Create a new Cerebro game with multiple participants',
      icon: <Brain className="w-5 h-5" />,
      color: 'bg-purple-500',
      function: cerebroExamples.cerebroExample1_InitializeGame
    },
    {
      id: 'cerebro2',
      name: 'Make Game Moves',
      description: 'Execute moves in the Cerebro game',
      icon: <Gamepad2 className="w-5 h-5" />,
      color: 'bg-blue-500',
      function: cerebroExamples.cerebroExample2_MakeMoves
    },
    {
      id: 'cerebro3',
      name: 'Challenge Game State',
      description: 'Challenge the current game state for dispute resolution',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'bg-red-500',
      function: cerebroExamples.cerebroExample3_ChallengeState
    },
    {
      id: 'cerebro4',
      name: 'Close Game',
      description: 'Close the game and settle final state',
      icon: <Trash2 className="w-5 h-5" />,
      color: 'bg-gray-500',
      function: cerebroExamples.cerebroExample4_CloseGame
    },
    {
      id: 'cerebro5',
      name: 'Complete Workflow',
      description: 'Run the complete Cerebro game workflow',
      icon: <ArrowRight className="w-5 h-5" />,
      color: 'bg-green-500',
      function: cerebroExamples.cerebroExample5_CompleteWorkflow
    }
  ];

  const runExample = async (example: any) => {
    setIsRunning(true);
    setCurrentExample(example.id);
    
    try {
      let result;
      if (example.id === 'cerebro2' || example.id === 'cerebro3' || example.id === 'cerebro4') {
        // These examples need a game instance
        if (!game) {
          throw new Error('Please initialize a game first');
        }
        result = await example.function(game);
      } else {
        result = await example.function();
      }
      
      // Store game instance if it's returned
      if (result && result.game) {
        setGame(result.game);
        setGameState(result.game.getGameState());
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
      const allResults = await runAllCerebroExamples();
      setResults(allResults);
      setShowResults(true);
    } catch (error) {
      console.error('Failed to run all Cerebro examples:', error);
    } finally {
      setIsRunning(false);
      setCurrentExample('');
    }
  };

  const clearResults = () => {
    setResults([]);
    setShowResults(false);
    setGame(null);
    setGameState(null);
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

  const renderGameBoard = () => {
    if (!gameState || !gameState.gameState) return null;

    const { board, currentPlayer, score } = gameState.gameState;

    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cerebro Game Board</h3>
        
        {/* Current Player */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-800">
              Current Player: {currentPlayer.slice(0, 8)}...
            </span>
          </div>
        </div>

        {/* Game Board */}
        <div className="mb-4">
          <div className="grid grid-cols-8 gap-1 bg-gray-200 p-2 rounded-lg">
            {board.map((row: string[], x: number) =>
              row.map((cell: string, y: number) => (
                <div
                  key={`${x}-${y}`}
                  className={`w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-xs font-bold ${
                    cell ? 'bg-blue-500 text-white' : 'bg-white'
                  }`}
                >
                  {cell ? cell.slice(0, 1).toUpperCase() : ''}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(score).map(([player, points]) => (
            <div key={player} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded">
              <span className="text-sm font-medium text-gray-700">
                {player.slice(0, 8)}...
              </span>
              <div className="flex items-center space-x-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-bold text-gray-900">{points}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cerebro Game Manager</h2>
              <p className="text-sm text-gray-600">Advanced State Channel Game Example</p>
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

              {game && (
                <button
                  onClick={() => setShowGameBoard(!showGameBoard)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showGameBoard ? 'Hide' : 'Show'} Game Board
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
                  {currentExample === 'all' ? 'Running all Cerebro examples...' : `Running ${examples.find(e => e.id === currentExample)?.name}...`}
                </span>
              </div>
            </div>
          )}

          {/* Game Board */}
          {showGameBoard && gameState && renderGameBoard()}

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
          <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">About Cerebro Game</h3>
            <p className="text-sm text-purple-800 mb-3">
              Cerebro is an advanced state channel application that demonstrates complex multi-participant
              state management, real-time synchronization, and advanced dispute resolution mechanisms.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800">
              <div>
                <h4 className="font-medium mb-2">Key Features:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Multi-participant game state</li>
                  <li>Real-time move synchronization</li>
                  <li>Complex state transitions</li>
                  <li>Advanced dispute resolution</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Game Mechanics:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>8x8 game board</li>
                  <li>Turn-based gameplay</li>
                  <li>Score tracking</li>
                  <li>Move history</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
