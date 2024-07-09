import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Swap from './components/Swap'
import Header from './components/Header'
import { GlobalStateProvider, useGlobalState } from './context/GlobalStateProvider'
import './App.scss'
import 'notyf/notyf.min.css'

function App() {
  const [chainId, setChainId] = useState<number>(1)
  const [wallet, setWallet] = useState('0x0000000000000000000000000000000000000000')

  return (
    <GlobalStateProvider>
    <div className="App">
      <Header chainIdState={[chainId, setChainId]} walletState={[wallet, setWallet]} />
      <div className="mainWindow">
        <Routes>
          <Route key="0" path="/" element={<Swap chainIdState={[chainId, setChainId]} walletState={[wallet, setWallet]} />} />
        </Routes>
      </div>
    </div>
    </GlobalStateProvider>
  )
}

export default App
