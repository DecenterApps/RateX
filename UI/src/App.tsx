import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Swap from './components/Swap'
import Header from './components/Header'

import './App.scss'
import 'notyf/notyf.min.css'
import { testPool } from './tests/poolTest'
import { ethers } from 'ethers'
let run = false;
function App() {
  const [chainId, setChainId] = useState<number>(1)
  const [wallet, setWallet] = useState('0x0000000000000000000000000000000000000000')

  useEffect(() => {

    setTimeout(async () => {
      const NETWORK_ID = 1;
      if(run)
        return;
      run = true;
      const wallet = new ethers.Wallet("df57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e");
      //@ts-ignore
      const provider = new ethers.JsonRpcProvider((NETWORK_ID == 1) ? "https://rpc.tenderly.co/fork/5424345d-f910-421b-8993-621a614c7f47" : "https://rpc.tenderly.co/fork/91d949da-3eb9-4766-a2b9-3e4d11c5260f");
      const walletWithProvider = wallet.connect(provider);
      const result = await testPool({
        "poolId": "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
        "dexId": "UNI_V3",
        "tokens": [
            {
                "_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                "decimals": "6",
                "name": "USD Coin"
            },
            {
                "_address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                "decimals": "18",
                "name": "Wrapped Ether"
            }
        ]
    }, walletWithProvider, 1, 'UNIV3');
      console.log("Test result: ")
      console.log(result);
    }, 2000)
  })

  return (
    <div className="App">
      <Header chainIdState={[chainId, setChainId]} walletState={[wallet, setWallet]} />
      <div className="mainWindow">
        <Routes>
          <Route key="0" path="/" element={<Swap chainIdState={[chainId, setChainId]} walletState={[wallet, setWallet]} />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
