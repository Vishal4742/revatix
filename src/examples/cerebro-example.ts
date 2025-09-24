/**
 * Cerebro Example Implementation
 * Based on Nitrolite TypeScript SDK
 * 
 * Cerebro is an advanced state channel application that demonstrates:
 * - Multi-participant state management
 * - Complex state transitions
 * - Real-time synchronization
 * - Advanced dispute resolution
 */

import { NitroliteClient } from '@erc7824/nitrolite';
import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';
import { ENV_CONFIG } from '../config/environment';
import { nitroliteClient } from '../utils/yellowNetwork';

// Cerebro State Management
export interface CerebroState {
  participants: string[];
  gameState: {
    currentPlayer: string;
    board: string[][];
    score: Record<string, number>;
    moves: Array<{
      player: string;
      position: { x: number; y: number };
      timestamp: number;
    }>;
  };
  version: number;
  lastUpdate: number;
}

export interface CerebroMove {
  player: string;
  position: { x: number; y: number };
  action: 'place' | 'remove' | 'move';
  timestamp: number;
}

export class CerebroGame {
  private channelId: string | null = null;
  private participants: string[] = [];
  private gameState: CerebroState | null = null;
  private isHost: boolean = false;

  constructor(participants: string[], isHost: boolean = false) {
    this.participants = participants;
    this.isHost = isHost;
  }

  // Initialize Cerebro game
  async initialize(): Promise<{ success: boolean; channelId?: string; error?: string }> {
    try {
      console.log('🧠 Initializing Cerebro game...');

      // Create state channel for Cerebro
      const channel = await nitroliteClient.createChannel({
        participants: this.participants,
        initialAllocation: this.participants.reduce((acc, participant) => {
          acc[participant] = 1000; // Each player starts with 1000 points
          return acc;
        }, {} as Record<string, number>),
        token: 'CEREBRO',
        challengePeriod: 86400, // 24 hours
        adjudicator: '0x0000000000000000000000000000000000000000'
      });

      this.channelId = channel.id;

      // Initialize game state
      this.gameState = {
        participants: this.participants,
        gameState: {
          currentPlayer: this.participants[0],
          board: this.initializeBoard(),
          score: this.participants.reduce((acc, participant) => {
            acc[participant] = 0;
            return acc;
          }, {} as Record<string, number>),
          moves: []
        },
        version: 0,
        lastUpdate: Date.now()
      };

      console.log('✅ Cerebro game initialized:', {
        channelId: this.channelId,
        participants: this.participants,
        gameState: this.gameState
      });

      return { success: true, channelId: this.channelId };
    } catch (error) {
      console.error('❌ Failed to initialize Cerebro game:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Initialize game board
  private initializeBoard(): string[][] {
    const board: string[][] = [];
    for (let i = 0; i < 8; i++) {
      board[i] = [];
      for (let j = 0; j < 8; j++) {
        board[i][j] = '';
      }
    }
    return board;
  }

  // Make a move in the game
  async makeMove(move: CerebroMove): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.channelId || !this.gameState) {
        throw new Error('Game not initialized');
      }

      if (move.player !== this.gameState.gameState.currentPlayer) {
        throw new Error('Not your turn');
      }

      // Validate move
      if (!this.isValidMove(move)) {
        throw new Error('Invalid move');
      }

      // Update game state
      this.updateGameState(move);

      // Update state channel
      const updateResult = await nitroliteClient.updateChannel(this.channelId, {
        allocations: this.calculateAllocations(),
        version: this.gameState.version,
        data: JSON.stringify({
          type: 'cerebro_move',
          move: move,
          gameState: this.gameState.gameState
        })
      });

      console.log('✅ Move made successfully:', move);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to make move:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Validate move
  private isValidMove(move: CerebroMove): boolean {
    if (!this.gameState) return false;

    const { position, action } = move;
    const { board } = this.gameState.gameState;

    // Check bounds
    if (position.x < 0 || position.x >= 8 || position.y < 0 || position.y >= 8) {
      return false;
    }

    switch (action) {
      case 'place':
        return board[position.x][position.y] === '';
      case 'remove':
        return board[position.x][position.y] !== '';
      case 'move':
        // More complex validation for move action
        return true;
      default:
        return false;
    }
  }

  // Update game state
  private updateGameState(move: CerebroMove): void {
    if (!this.gameState) return;

    const { position, action, player } = move;
    const { board, moves, score } = this.gameState.gameState;

    // Update board
    switch (action) {
      case 'place':
        board[position.x][position.y] = player;
        score[player] += 10; // Points for placing
        break;
      case 'remove':
        board[position.x][position.y] = '';
        score[player] += 5; // Points for removing
        break;
      case 'move':
        // Handle move action
        score[player] += 3; // Points for moving
        break;
    }

    // Add move to history
    moves.push(move);

    // Switch to next player
    const currentIndex = this.participants.indexOf(player);
    const nextIndex = (currentIndex + 1) % this.participants.length;
    this.gameState.gameState.currentPlayer = this.participants[nextIndex];

    // Update version and timestamp
    this.gameState.version++;
    this.gameState.lastUpdate = Date.now();
  }

  // Calculate allocations based on game state
  private calculateAllocations(): Array<{
    destination: string;
    token: string;
    amount: number;
  }> {
    if (!this.gameState) return [];

    const allocations = [];
    const { score } = this.gameState.gameState;

    for (const participant of this.participants) {
      allocations.push({
        destination: participant,
        token: '0x0000000000000000000000000000000000000000',
        amount: score[participant] || 0
      });
    }

    return allocations;
  }

  // Get current game state
  getGameState(): CerebroState | null {
    return this.gameState;
  }

  // Get channel ID
  getChannelId(): string | null {
    return this.channelId;
  }

  // Challenge game state (dispute resolution)
  async challengeState(reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.channelId) {
        throw new Error('Game not initialized');
      }

      const challengeResult = await nitroliteClient.challengeChannel(this.channelId, {
        reason: `Cerebro game challenge: ${reason}`,
        challenger: this.participants[0] // First participant challenges
      });

      console.log('✅ Game state challenged:', challengeResult);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to challenge game state:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Close game and settle final state
  async closeGame(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.channelId) {
        throw new Error('Game not initialized');
      }

      const closeResult = await nitroliteClient.closeChannel(this.channelId, {
        finalState: true,
        reason: 'Cerebro game completed'
      });

      console.log('✅ Game closed:', closeResult);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to close game:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Sync game state from channel
  async syncGameState(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.channelId) {
        throw new Error('Game not initialized');
      }

      const channelInfo = await nitroliteClient.getChannel(this.channelId);
      
      if (channelInfo.state) {
        // Parse game state from channel data
        const gameData = JSON.parse(channelInfo.state.data || '{}');
        if (gameData.type === 'cerebro_move') {
          this.gameState = {
            participants: this.participants,
            gameState: gameData.gameState,
            version: channelInfo.version,
            lastUpdate: Date.now()
          };
        }
      }

      console.log('✅ Game state synced');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to sync game state:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Cerebro Example Functions
export const cerebroExample1_InitializeGame = async () => {
  console.log('🧠 Cerebro Example 1: Initialize Game');
  
  const participants = [
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Alice
    '0x8ba1f109551bD432803012645Hac136c' // Bob
  ];

  const game = new CerebroGame(participants, true);
  const result = await game.initialize();
  
  if (result.success) {
    console.log('✅ Cerebro game initialized successfully');
    return { game, result };
  } else {
    throw new Error(result.error || 'Failed to initialize game');
  }
};

export const cerebroExample2_MakeMoves = async (game: CerebroGame) => {
  console.log('🧠 Cerebro Example 2: Make Moves');
  
  const moves: CerebroMove[] = [
    {
      player: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      position: { x: 0, y: 0 },
      action: 'place',
      timestamp: Date.now()
    },
    {
      player: '0x8ba1f109551bD432803012645Hac136c',
      position: { x: 1, y: 1 },
      action: 'place',
      timestamp: Date.now()
    },
    {
      player: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      position: { x: 2, y: 2 },
      action: 'place',
      timestamp: Date.now()
    }
  ];

  const results = [];
  for (const move of moves) {
    const result = await game.makeMove(move);
    results.push({ move, result });
    console.log(`Move result:`, result);
  }

  console.log('✅ All moves completed');
  return results;
};

export const cerebroExample3_ChallengeState = async (game: CerebroGame) => {
  console.log('🧠 Cerebro Example 3: Challenge Game State');
  
  const result = await game.challengeState('Disputed move sequence');
  
  if (result.success) {
    console.log('✅ Game state challenged successfully');
  } else {
    console.error('❌ Failed to challenge game state:', result.error);
  }
  
  return result;
};

export const cerebroExample4_CloseGame = async (game: CerebroGame) => {
  console.log('🧠 Cerebro Example 4: Close Game');
  
  const result = await game.closeGame();
  
  if (result.success) {
    console.log('✅ Game closed successfully');
  } else {
    console.error('❌ Failed to close game:', result.error);
  }
  
  return result;
};

export const cerebroExample5_CompleteWorkflow = async () => {
  console.log('🧠 Cerebro Example 5: Complete Workflow');
  
  try {
    // Step 1: Initialize game
    const { game } = await cerebroExample1_InitializeGame();
    
    // Step 2: Make moves
    await cerebroExample2_MakeMoves(game);
    
    // Step 3: Sync game state
    await game.syncGameState();
    
    // Step 4: Close game
    await cerebroExample4_CloseGame(game);
    
    console.log('✅ Complete Cerebro workflow finished successfully!');
    return { success: true, game };
  } catch (error) {
    console.error('❌ Complete Cerebro workflow failed:', error);
    throw error;
  }
};

// Export all Cerebro examples
export const cerebroExamples = {
  cerebroExample1_InitializeGame,
  cerebroExample2_MakeMoves,
  cerebroExample3_ChallengeState,
  cerebroExample4_CloseGame,
  cerebroExample5_CompleteWorkflow
};

// Helper function to run all Cerebro examples
export const runAllCerebroExamples = async () => {
  console.log('🧠 Running all Cerebro examples...');
  
  const results = [];
  
  try {
    // Run examples in sequence
    for (const [name, example] of Object.entries(cerebroExamples)) {
      console.log(`\n--- Running ${name} ---`);
      try {
        const result = await example();
        results.push({ name, success: true, result });
      } catch (error) {
        console.error(`❌ ${name} failed:`, error);
        results.push({ name, success: false, error: error.message });
      }
    }
    
    console.log('\n📊 All Cerebro examples completed:', results);
    return results;
  } catch (error) {
    console.error('❌ Failed to run Cerebro examples:', error);
    throw error;
  }
};
