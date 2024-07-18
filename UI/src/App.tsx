import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Swap from './components/Swap'
import Header from './components/Header'
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import './App.scss'
import 'notyf/notyf.min.css'
import '@rainbow-me/rainbowkit/styles.css';

const config = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: 'YOUR_PROJECT_ID',
  chains: [mainnet, arbitrum],
  ssr: true, // If your dApp uses server side rendering (SSR)
});
const queryClient = new QueryClient();

function App() {
  const [chainId, setChainId] = useState<number>(1)
  const [wallet, setWallet] = useState('0x0000000000000000000000000000000000000000')

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
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
