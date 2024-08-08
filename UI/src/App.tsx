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
import { getChainId } from '@wagmi/core'
let run = false;

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
    /*setTimeout(async () => {
          const NETWORK_ID = 1;
          if (run)
            return;
          run = true;
          const wallet = new ethers.Wallet("df57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e");
          //@ts-ignore
          const provider = new ethers.JsonRpcProvider((NETWORK_ID == 1) ? "https://rpc.tenderly.co/fork/5424345d-f910-421b-8993-621a614c7f47" : "https://rpc.tenderly.co/fork/91d949da-3eb9-4766-a2b9-3e4d11c5260f");
          const walletWithProvider = wallet.connect(provider);
    
          const poolObject = {
            "poolId": "0x11b815efb8f581194ae79006d24e0d814b7697f6",
            "dexId": "UNI_V3",
            "tokens": [
                {
                    "_address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                    "decimals": "18",
                    "name": "Wrapped Ether"
                },
                {
                    "_address": "0xdac17f958d2ee523a2206206994597c13d831ec7",
                    "decimals": "6",
                    "name": "Tether USD"
                }
            ]
        };
    
          console.log("poolObject je (App.tsx)")
          console.log(poolObject)
          const result = await testPool(poolObject, walletWithProvider, 1);
          console.log("Test result: ")
          console.log(result);
        }, 2000)*/

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
