"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

const config = createConfig(
  getDefaultConfig({

      chains: [sepolia],
    transports: {
      // RPC URL for each chain
      [sepolia.id]: http(process.env.SEPOLIA_RPC_URL),
    },

    walletConnectProjectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
      "9ec253e9305973bfc7f365e9a2d45793",

    // Required App Info
    appName: "1inch",

    // Optional App Info
    appDescription: "1inch",
    appUrl: "https://family.co", // your app's url
    appIcon: "https://family.co/logo.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
  })
);

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme="midnight">{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
