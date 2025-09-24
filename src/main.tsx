import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { WagmiProvider } from "wagmi";
import { createAppKit } from '@reown/appkit/react'
import { polygon, mainnet, base, celo } from '@reown/appkit/networks'
import App from "./App";
import "./index.css";
const queryClient = new QueryClient();

// Yellow Network supports multiple EVM chains for cross-chain state channels
// These chains are used for initial connections, while Yellow Network handles the state channel operations
const networks = [polygon, mainnet, base, celo]
const projectId = '684cdccc0de232f65a62603583571f5e'

const metadata = {
  name: 'Revatix',
  description: 'Global Remittance Infrastructure for VAT Claims & Payroll',
  url: 'https://example.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}
// 4. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true
})
createAppKit({
  adapters: [wagmiAdapter],
  networks: [networks[0], ...networks.slice(1)],
  projectId,
  metadata,
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  },
  themeVariables: {
    "--w3m-accent": "#4F46E5",     // Accent color
    "--w3m-background": "#262626",  // Background color
    "--w3m-font-size-master": "12px", // Base font size
  }
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}><App /></QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
