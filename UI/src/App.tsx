import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Swap from './components/Swap'
import Header from './components/Header'
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  mainnet,
  arbitrum,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

import './App.scss'
import 'notyf/notyf.min.css'
import '@rainbow-me/rainbowkit/styles.css';
import { getChainId } from '@wagmi/core'

const config = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: 'YOUR_PROJECT_ID',
  chains: [mainnet, arbitrum],
  ssr: false, // If your dApp uses server side rendering (SSR)
});
const queryClient = new QueryClient();

function App() {
  const [chainId, setChainId] = useState<number>(getChainId(config))
  const [wallet, setWallet] = useState('0x0000000000000000000000000000000000000000')


  const fetchChainId = async () => {
    const chainIdNew = await getChainId(config);
    if (chainIdNew != chainId)
      setChainId(chainIdNew);
  };

  useEffect(() => {
    // Poll the chain ID every 5 seconds
    fetchChainId(); // Fetch initially
    const interval = setInterval(fetchChainId, 3000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider  theme={darkTheme()} >
    <div className="App">
      <Header chainIdState={[chainId, setChainId]} walletState={[wallet, setWallet]} />
      <div className="mainWindow">
        <Routes>
          <Route key="0" path="/" element={<Swap chainIdState={[chainId, setChainId]} walletState={[wallet, setWallet]} />} />
        </Routes>
      </div>
    </div>
    </RainbowKitProvider>
    </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
