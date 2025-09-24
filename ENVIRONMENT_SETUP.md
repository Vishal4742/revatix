# Environment Setup Guide

## Create .env.local file

Create a `.env.local` file in your project root with the following variables:

```bash
# Revatix Environment Configuration

# Environment
VITE_APP_ENV=development
VITE_DEBUG_MODE=true

# Yellow Network Configuration
VITE_YELLOW_NETWORK_CLEARNODE_URL=wss://clearnet.yellow.org/ws
VITE_YELLOW_NETWORK_DEFAULT_CHAIN=yellow-mainnet

# Nitrolite SDK Configuration
VITE_NITROLITE_APP_ID=your-app-id-here
VITE_NITROLITE_API_KEY=your-api-key-here

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# AI Services
VITE_GOOGLE_AI_API_KEY=your-google-ai-key-here

# Email Services
VITE_EMAILJS_SERVICE_ID=your-service-id-here
VITE_EMAILJS_TEMPLATE_ID=your-template-id-here
VITE_EMAILJS_PUBLIC_KEY=your-public-key-here

# WalletConnect Project ID
VITE_WALLETCONNECT_PROJECT_ID=684cdccc0de232f65a62603583571f5e
```

## Steps to Setup:

1. **Create the file**: In your project root, create `.env.local`
2. **Copy the content**: Use the configuration above
3. **Replace placeholders**: Update with your actual API keys and URLs
4. **Restart dev server**: Run `npm run dev` to apply changes

## Required Services:

- **Yellow Network**: Get credentials from Yellow Network team
- **Nitrolite SDK**: Register at Nitrolite platform
- **Supabase**: Create project at supabase.com
- **Google AI**: Get API key from Google AI Studio
- **EmailJS**: Register at emailjs.com
