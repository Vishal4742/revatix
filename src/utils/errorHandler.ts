/**
 * Enhanced Error Handler for Yellow Network
 * Handles common issues and provides user-friendly solutions
 * Based on community discussions and troubleshooting insights
 */

export interface YellowNetworkError {
  code: string;
  message: string;
  userMessage: string;
  solution: string;
  documentation?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorContext {
  operation: string;
  address?: string;
  channelId?: string;
  amount?: number;
  token?: string;
}

export class YellowNetworkErrorHandler {
  private static errorMap: Map<string, YellowNetworkError> = new Map([
    // Private Key Management Errors
    ['UNIQUE_CONSTRAINT_PRIVATE_KEY', {
      code: 'UNIQUE_CONSTRAINT_PRIVATE_KEY',
      message: 'UNIQUE constraint failed: private_key_dtos.private_key',
      userMessage: 'This private key is already in use',
      solution: 'Create a new wallet in MetaMask and try again, or use session keys for frontend authentication',
      documentation: 'https://github.com/erc7824/nitrolite-example/blob/final-p2p-transfer/docs/chapter-3-session-auth.md',
      severity: 'medium'
    }],

    // Balance and Faucet Errors
    ['NO_FUNDS_AVAILABLE', {
      code: 'NO_FUNDS_AVAILABLE',
      message: 'No funds available',
      userMessage: 'Your balance appears empty',
      solution: 'Tokens are sent to off-chain unified balance. Check Clearnode dashboard or open a channel to access them',
      documentation: 'https://github.com/layer-3/docs/discussions/20',
      severity: 'medium'
    }],

    ['FAUCET_REQUEST_FAILED', {
      code: 'FAUCET_REQUEST_FAILED',
      message: 'Faucet request failed',
      userMessage: 'Could not request test tokens',
      solution: 'Try again in a few minutes. The faucet may be temporarily unavailable',
      severity: 'low'
    }],

    // Channel Management Errors
    ['CHANNEL_CREATION_FAILED', {
      code: 'CHANNEL_CREATION_FAILED',
      message: 'Failed to create channel',
      userMessage: 'Could not create state channel',
      solution: 'Ensure you have sufficient on-chain balance for channel creation. Use Sandbox WebSocket for testing',
      severity: 'high'
    }],

    ['CHANNEL_NOT_FOUND', {
      code: 'CHANNEL_NOT_FOUND',
      message: 'Channel not found',
      userMessage: 'State channel does not exist',
      solution: 'Check if the channel ID is correct or if the channel was closed',
      severity: 'medium'
    }],

    ['INSUFFICIENT_COLLATERAL', {
      code: 'INSUFFICIENT_COLLATERAL',
      message: 'Insufficient YELLOW token collateral',
      userMessage: 'Not enough YELLOW tokens for state channels',
      solution: 'Lock more YELLOW tokens as collateral or request test tokens from faucet',
      severity: 'high'
    }],

    // Network Connection Errors
    ['WEBSOCKET_CONNECTION_FAILED', {
      code: 'WEBSOCKET_CONNECTION_FAILED',
      message: 'WebSocket connection failed',
      userMessage: 'Cannot connect to Yellow Network',
      solution: 'Check your internet connection and try again. Verify the Clearnode URL is correct',
      severity: 'high'
    }],

    ['NETWORK_TIMEOUT', {
      code: 'NETWORK_TIMEOUT',
      message: 'Network timeout',
      userMessage: 'Request timed out',
      solution: 'Try again. The network may be congested',
      severity: 'medium'
    }],

    // Authentication Errors
    ['INVALID_SESSION_KEY', {
      code: 'INVALID_SESSION_KEY',
      message: 'Invalid or expired session key',
      userMessage: 'Your session has expired',
      solution: 'Reconnect your wallet to create a new session',
      severity: 'medium'
    }],

    ['WALLET_NOT_CONNECTED', {
      code: 'WALLET_NOT_CONNECTED',
      message: 'Wallet not connected',
      userMessage: 'Please connect your wallet',
      solution: 'Connect your MetaMask wallet to continue',
      severity: 'low'
    }],

    // Transaction Errors
    ['TRANSACTION_FAILED', {
      code: 'TRANSACTION_FAILED',
      message: 'Transaction failed',
      userMessage: 'Payment could not be processed',
      solution: 'Check your balance and try again. Remember Yellow Network is gasless!',
      severity: 'high'
    }],

    ['INVALID_ADDRESS', {
      code: 'INVALID_ADDRESS',
      message: 'Invalid address format',
      userMessage: 'The address is not valid',
      solution: 'Please enter a valid Ethereum address (0x...)',
      severity: 'low'
    }],

    // State Channel Errors
    ['CHANNEL_STATE_INVALID', {
      code: 'CHANNEL_STATE_INVALID',
      message: 'Invalid channel state',
      userMessage: 'Channel state is invalid',
      solution: 'The channel may be in dispute. Check channel status or challenge the state',
      severity: 'high'
    }],

    ['CHALLENGE_PERIOD_ACTIVE', {
      code: 'CHALLENGE_PERIOD_ACTIVE',
      message: 'Challenge period is active',
      userMessage: 'Channel is under dispute',
      solution: 'Wait for the challenge period to end or resolve the dispute',
      severity: 'medium'
    }]
  ]);

  // Handle and categorize errors
  static handleError(error: Error, context?: ErrorContext): YellowNetworkError {
    const errorMessage = error.message;
    
    // Try to match known error patterns
    for (const [code, errorInfo] of this.errorMap.entries()) {
      if (this.matchesError(errorMessage, errorInfo.message)) {
        return {
          ...errorInfo,
          message: errorMessage, // Use actual error message
          solution: this.customizeSolution(errorInfo.solution, context)
        };
      }
    }

    // Handle generic errors
    return this.handleGenericError(error, context);
  }

  // Check if error message matches known pattern
  private static matchesError(actualMessage: string, pattern: string): boolean {
    // Simple pattern matching - in production, use more sophisticated matching
    return actualMessage.toLowerCase().includes(pattern.toLowerCase()) ||
           pattern.toLowerCase().includes(actualMessage.toLowerCase());
  }

  // Customize solution based on context
  private static customizeSolution(solution: string, context?: ErrorContext): string {
    if (!context) return solution;

    let customizedSolution = solution;

    // Add context-specific advice
    if (context.operation === 'faucet_request') {
      customizedSolution += ' Use the PowerShell command: Invoke-RestMethod -Uri "https://clearnet-sandbox.yellow.com/faucet/requestTokens" -Method POST -ContentType "application/json" -Body \'{"userAddress":"' + (context.address || 'YOUR_ADDRESS') + '"}\'';
    }

    if (context.operation === 'channel_creation') {
      customizedSolution += ' Consider using Sandbox WebSocket for testing.';
    }

    if (context.operation === 'balance_check') {
      customizedSolution += ' Remember: Yellow Network uses off-chain unified balances that are not visible in MetaMask until withdrawn.';
    }

    return customizedSolution;
  }

  // Handle generic/unknown errors
  private static handleGenericError(error: Error, context?: ErrorContext): YellowNetworkError {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      userMessage: 'An unexpected error occurred',
      solution: 'Please try again. If the problem persists, check the troubleshooting guide or contact support.',
      documentation: 'https://github.com/Vishal4742/revatix/blob/main/YELLOW_NETWORK_TROUBLESHOOTING.md',
      severity: 'medium'
    };
  }

  // Get user-friendly error message
  static getUserMessage(error: Error, context?: ErrorContext): string {
    const handledError = this.handleError(error, context);
    return handledError.userMessage;
  }

  // Get solution for error
  static getSolution(error: Error, context?: ErrorContext): string {
    const handledError = this.handleError(error, context);
    return handledError.solution;
  }

  // Get error severity
  static getSeverity(error: Error, context?: ErrorContext): 'low' | 'medium' | 'high' | 'critical' {
    const handledError = this.handleError(error, context);
    return handledError.severity;
  }

  // Check if error is recoverable
  static isRecoverable(error: Error, context?: ErrorContext): boolean {
    const severity = this.getSeverity(error, context);
    return severity !== 'critical';
  }

  // Get all known error codes
  static getKnownErrorCodes(): string[] {
    return Array.from(this.errorMap.keys());
  }

  // Add custom error mapping
  static addErrorMapping(code: string, errorInfo: YellowNetworkError): void {
    this.errorMap.set(code, errorInfo);
  }

  // Log error with context
  static logError(error: Error, context?: ErrorContext): void {
    const handledError = this.handleError(error, context);
    
    const logLevel = this.getLogLevel(handledError.severity);
    const logMessage = `[${handledError.code}] ${handledError.message}`;
    
    if (context) {
      console[logLevel](logMessage, {
        context,
        solution: handledError.solution,
        documentation: handledError.documentation
      });
    } else {
      console[logLevel](logMessage, {
        solution: handledError.solution,
        documentation: handledError.documentation
      });
    }
  }

  // Get appropriate log level based on severity
  private static getLogLevel(severity: string): 'log' | 'warn' | 'error' {
    switch (severity) {
      case 'low': return 'log';
      case 'medium': return 'warn';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'warn';
    }
  }

  // Create error with context
  static createError(code: string, message: string, context?: ErrorContext): Error {
    const error = new Error(message);
    error.name = code;
    
    // Add context to error object
    if (context) {
      (error as any).context = context;
    }
    
    return error;
  }

  // Validate error context
  static validateContext(context: ErrorContext): boolean {
    if (!context.operation) return false;
    
    // Validate address format if provided
    if (context.address && !this.isValidAddress(context.address)) {
      return false;
    }
    
    // Validate amount if provided
    if (context.amount && context.amount <= 0) {
      return false;
    }
    
    return true;
  }

  // Simple address validation
  private static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

// Export convenience functions
export const handleYellowNetworkError = (error: Error, context?: ErrorContext) => {
  return YellowNetworkErrorHandler.handleError(error, context);
};

export const getUserFriendlyMessage = (error: Error, context?: ErrorContext) => {
  return YellowNetworkErrorHandler.getUserMessage(error, context);
};

export const getErrorSolution = (error: Error, context?: ErrorContext) => {
  return YellowNetworkErrorHandler.getSolution(error, context);
};

export const logYellowNetworkError = (error: Error, context?: ErrorContext) => {
  YellowNetworkErrorHandler.logError(error, context);
};

export const isErrorRecoverable = (error: Error, context?: ErrorContext) => {
  return YellowNetworkErrorHandler.isRecoverable(error, context);
};
