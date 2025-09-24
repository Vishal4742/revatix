// Revatix Environment Configuration

export const ENV_CONFIG = {
  // Supabase Configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key',
  },

  // Yellow Network Configuration
  yellowNetwork: {
    clearnodeUrl: import.meta.env.VITE_YELLOW_NETWORK_CLEARNODE_URL || 'wss://clearnet.yellow.org/ws',
    testnetUrl: import.meta.env.VITE_YELLOW_NETWORK_TESTNET_URL || 'https://clearnet-sandbox.yellow.com',
    faucetUrl: import.meta.env.VITE_YELLOW_NETWORK_FAUCET_URL || 'https://clearnet-sandbox.yellow.com/faucet/requestTokens',
    defaultChain: import.meta.env.VITE_YELLOW_NETWORK_DEFAULT_CHAIN || 'yellow-mainnet',
  },

  // Nitrolite SDK Configuration
  nitrolite: {
    appId: import.meta.env.VITE_NITROLITE_APP_ID || '',
    apiKey: import.meta.env.VITE_NITROLITE_API_KEY || '',
  },

  // AI Services
  ai: {
    googleApiKey: import.meta.env.VITE_GOOGLE_AI_API_KEY || '',
  },

  // Email Services
  email: {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
  },

  // Development
  app: {
    env: import.meta.env.VITE_APP_ENV || 'development',
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
  },
};

// Log warnings for missing environment variables (only in development)
if (ENV_CONFIG.app.debugMode) {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('Missing Supabase environment variables. Using placeholder values for development.');
  }

  if (!import.meta.env.VITE_NITROLITE_APP_ID || !import.meta.env.VITE_NITROLITE_API_KEY) {
    console.warn('Missing Nitrolite environment variables. Some features may not work properly.');
  }
}
