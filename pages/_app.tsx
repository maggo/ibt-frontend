import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppProps } from "next/app";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { publicProvider } from "wagmi/providers/public";
import "../styles/globals.css";

const { chains, provider, webSocketProvider } = configureChains(
  [chain.polygon, chain.mainnet],
  [
    jsonRpcProvider({
      rpc: (chain) =>
        chain.id === 137
          ? {
              http: `https://poly-mainnet.gateway.pokt.network/v1/lb/160ec40757aaf5b5e6829e97`,
            }
          : chain.id === 1
          ? {
              http: `https://eth-mainnet.gateway.pokt.network/v1/lb/160ec40757aaf5b5e6829e97`,
            }
          : null,
    }),
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_ID }),
    publicProvider(),
  ]
);

const { connectors } = getDefaultWallets({
  appName: "Iris-bound Tokens",
  chains: [chain.polygon],
});

const queryClient = new QueryClient();

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider,
  queryClient: queryClient as any,
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig client={wagmiClient}>
        <RainbowKitProvider id="rk" chains={chains} showRecentTransactions>
          <Component {...pageProps} />
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}

export default MyApp;
