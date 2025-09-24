/**
 * Nitrolite Examples Implementation
 * Based on ERC-7824 State Channel Protocol
 * 
 * This file implements all the core examples from the Nitrolite repository
 * demonstrating state channel operations for gasless transactions.
 */

import { NitroliteClient } from '@erc7824/nitrolite';
import { createPublicClient, http } from 'viem';
import { mainnet, polygon } from 'viem/chains';
import { ENV_CONFIG } from '../config/environment';
import { nitroliteClient } from '../utils/yellowNetwork';

// Example 1: Basic State Channel Creation
export const example1_BasicStateChannel = async () => {
  console.log('🚀 Example 1: Basic State Channel Creation');
  
  try {
    // Create a new state channel
    const channel = await nitroliteClient.createChannel({
      participants: [
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Alice
        '0x8ba1f109551bD432803012645Hac136c' // Bob
      ],
      initialAllocation: {
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6': 1000, // Alice gets 1000 tokens
        '0x8ba1f109551bD432803012645Hac136c': 0 // Bob starts with 0
      },
      token: 'USDC',
      challengePeriod: 86400, // 24 hours
      adjudicator: '0x0000000000000000000000000000000000000000'
    });

    console.log('✅ State channel created:', channel.id);
    return channel;
  } catch (error) {
    console.error('❌ Failed to create state channel:', error);
    throw error;
  }
};

// Example 2: State Channel Payment
export const example2_StateChannelPayment = async (channelId: string) => {
  console.log('🚀 Example 2: State Channel Payment');
  
  try {
    // Update channel state with payment
    const updateResult = await nitroliteClient.updateChannel(channelId, {
      allocations: [
        {
          destination: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Alice
          token: '0x0000000000000000000000000000000000000000', // Native token
          amount: -100 // Alice sends 100 tokens
        },
        {
          destination: '0x8ba1f109551bD432803012645Hac136c', // Bob
          token: '0x0000000000000000000000000000000000000000', // Native token
          amount: 100 // Bob receives 100 tokens
        }
      ],
      version: 1,
      data: '0x' // Additional data
    });

    console.log('✅ Payment processed:', updateResult);
    return updateResult;
  } catch (error) {
    console.error('❌ Failed to process payment:', error);
    throw error;
  }
};

// Example 3: Multi-Participant State Channel
export const example3_MultiParticipantChannel = async () => {
  console.log('🚀 Example 3: Multi-Participant State Channel');
  
  try {
    const participants = [
      '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Alice
      '0x8ba1f109551bD432803012645Hac136c', // Bob
      '0x1234567890123456789012345678901234567890' // Charlie
    ];

    const channel = await nitroliteClient.createChannel({
      participants,
      initialAllocation: {
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6': 2000, // Alice
        '0x8ba1f109551bD432803012645Hac136c': 1000, // Bob
        '0x1234567890123456789012345678901234567890': 500 // Charlie
      },
      token: 'USDC',
      challengePeriod: 86400,
      adjudicator: '0x0000000000000000000000000000000000000000'
    });

    console.log('✅ Multi-participant channel created:', channel.id);
    return channel;
  } catch (error) {
    console.error('❌ Failed to create multi-participant channel:', error);
    throw error;
  }
};

// Example 4: Channel State Query
export const example4_ChannelStateQuery = async (channelId: string) => {
  console.log('🚀 Example 4: Channel State Query');
  
  try {
    const channelInfo = await nitroliteClient.getChannel(channelId);
    
    console.log('✅ Channel state retrieved:', {
      id: channelInfo.id,
      status: channelInfo.status,
      participants: channelInfo.participants,
      version: channelInfo.version,
      state: channelInfo.state
    });
    
    return channelInfo;
  } catch (error) {
    console.error('❌ Failed to query channel state:', error);
    throw error;
  }
};

// Example 5: Channel Challenge (Dispute Resolution)
export const example5_ChannelChallenge = async (channelId: string) => {
  console.log('🚀 Example 5: Channel Challenge (Dispute Resolution)');
  
  try {
    const challengeResult = await nitroliteClient.challengeChannel(channelId, {
      reason: 'Disputed state update',
      challenger: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
    });

    console.log('✅ Channel challenged:', challengeResult);
    return challengeResult;
  } catch (error) {
    console.error('❌ Failed to challenge channel:', error);
    throw error;
  }
};

// Example 6: Channel Closure
export const example6_ChannelClosure = async (channelId: string) => {
  console.log('🚀 Example 6: Channel Closure');
  
  try {
    const closeResult = await nitroliteClient.closeChannel(channelId, {
      finalState: true,
      reason: 'Channel closure requested by participants'
    });

    console.log('✅ Channel closed:', closeResult);
    return closeResult;
  } catch (error) {
    console.error('❌ Failed to close channel:', error);
    throw error;
  }
};

// Example 7: Batch State Updates
export const example7_BatchStateUpdates = async (channelId: string) => {
  console.log('🚀 Example 7: Batch State Updates');
  
  try {
    // Perform multiple state updates in sequence
    const updates = [
      {
        allocations: [
          {
            destination: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            token: '0x0000000000000000000000000000000000000000',
            amount: -50
          },
          {
            destination: '0x8ba1f109551bD432803012645Hac136c',
            token: '0x0000000000000000000000000000000000000000',
            amount: 50
          }
        ],
        version: 1,
        data: '0x'
      },
      {
        allocations: [
          {
            destination: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            token: '0x0000000000000000000000000000000000000000',
            amount: -25
          },
          {
            destination: '0x8ba1f109551bD432803012645Hac136c',
            token: '0x0000000000000000000000000000000000000000',
            amount: 25
          }
        ],
        version: 2,
        data: '0x'
      }
    ];

    const results = [];
    for (const update of updates) {
      const result = await nitroliteClient.updateChannel(channelId, update);
      results.push(result);
      console.log(`✅ Batch update ${results.length} completed`);
    }

    console.log('✅ All batch updates completed:', results);
    return results;
  } catch (error) {
    console.error('❌ Failed to perform batch updates:', error);
    throw error;
  }
};

// Example 8: Cross-Chain State Channel
export const example8_CrossChainChannel = async () => {
  console.log('🚀 Example 8: Cross-Chain State Channel');
  
  try {
    // Create a cross-chain state channel
    const channel = await nitroliteClient.createChannel({
      participants: [
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Ethereum address
        '0x8ba1f109551bD432803012645Hac136c' // Polygon address
      ],
      initialAllocation: {
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6': 1000,
        '0x8ba1f109551bD432803012645Hac136c': 1000
      },
      token: 'USDC',
      challengePeriod: 86400,
      adjudicator: '0x0000000000000000000000000000000000000000',
      // Cross-chain specific parameters
      crossChain: true,
      sourceChain: 'ethereum',
      targetChain: 'polygon'
    });

    console.log('✅ Cross-chain state channel created:', channel.id);
    return channel;
  } catch (error) {
    console.error('❌ Failed to create cross-chain channel:', error);
    throw error;
  }
};

// Example 9: Gasless Transaction Simulation
export const example9_GaslessTransaction = async () => {
  console.log('🚀 Example 9: Gasless Transaction Simulation');
  
  try {
    // Create a channel for gasless transactions
    const channel = await nitroliteClient.createChannel({
      participants: [
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // User
        '0x8ba1f109551bD432803012645Hac136c' // Service provider
      ],
      initialAllocation: {
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6': 1000,
        '0x8ba1f109551bD432803012645Hac136c': 0
      },
      token: 'YELLOW',
      challengePeriod: 86400,
      adjudicator: '0x0000000000000000000000000000000000000000',
      gasless: true // Enable gasless mode
    });

    // Perform gasless transaction
    const gaslessResult = await nitroliteClient.updateChannel(channel.id, {
      allocations: [
        {
          destination: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          token: '0x0000000000000000000000000000000000000000',
          amount: -10 // User pays 10 YELLOW
        },
        {
          destination: '0x8ba1f109551bD432803012645Hac136c',
          token: '0x0000000000000000000000000000000000000000',
          amount: 10 // Service provider receives 10 YELLOW
        }
      ],
      version: 1,
      data: '0x',
      gasless: true // This transaction is gasless
    });

    console.log('✅ Gasless transaction completed:', gaslessResult);
    return { channel, gaslessResult };
  } catch (error) {
    console.error('❌ Failed to perform gasless transaction:', error);
    throw error;
  }
};

// Example 10: Complete Workflow Demo
export const example10_CompleteWorkflow = async () => {
  console.log('🚀 Example 10: Complete Workflow Demo');
  
  try {
    // Step 1: Create channel
    console.log('Step 1: Creating state channel...');
    const channel = await example1_BasicStateChannel();
    
    // Step 2: Make payment
    console.log('Step 2: Making payment...');
    await example2_StateChannelPayment(channel.id);
    
    // Step 3: Query state
    console.log('Step 3: Querying channel state...');
    await example4_ChannelStateQuery(channel.id);
    
    // Step 4: Close channel
    console.log('Step 4: Closing channel...');
    await example6_ChannelClosure(channel.id);
    
    console.log('✅ Complete workflow demo finished successfully!');
    return { success: true, channelId: channel.id };
  } catch (error) {
    console.error('❌ Complete workflow demo failed:', error);
    throw error;
  }
};

// Export all examples
export const nitroliteExamples = {
  example1_BasicStateChannel,
  example2_StateChannelPayment,
  example3_MultiParticipantChannel,
  example4_ChannelStateQuery,
  example5_ChannelChallenge,
  example6_ChannelClosure,
  example7_BatchStateUpdates,
  example8_CrossChainChannel,
  example9_GaslessTransaction,
  example10_CompleteWorkflow
};

// Helper function to run all examples
export const runAllExamples = async () => {
  console.log('🚀 Running all Nitrolite examples...');
  
  const results = [];
  
  try {
    // Run examples in sequence
    for (const [name, example] of Object.entries(nitroliteExamples)) {
      console.log(`\n--- Running ${name} ---`);
      try {
        const result = await example();
        results.push({ name, success: true, result });
      } catch (error) {
        console.error(`❌ ${name} failed:`, error);
        results.push({ name, success: false, error: error.message });
      }
    }
    
    console.log('\n📊 All examples completed:', results);
    return results;
  } catch (error) {
    console.error('❌ Failed to run examples:', error);
    throw error;
  }
};
