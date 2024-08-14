import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi';

interface HeaderProps {
  chainIdState: [number, React.Dispatch<React.SetStateAction<number>>]
  walletState: [string, React.Dispatch<React.SetStateAction<string>>]
}

function Header({ chainIdState, walletState }: HeaderProps) {
  const [wallet, setWallet] = walletState
  const { address, isConnected } = useAccount();

  useEffect(() => {

    async function checkWalletConnection() {
      const accountsRes = isConnected && address ? [address] : [];
      console.log("account is this" + accountsRes)
      if (accountsRes.length) {
        setWallet(accountsRes[0])
      }
    }

    checkWalletConnection()
    return () => {
      window.ethereum?.removeListener('accountsChanged', refreshAccounts)
    }
  }, [wallet])


  async function refreshAccounts() {
    const resAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    if (resAccounts.length !== 0 && resAccounts[0] === wallet) {
      setWallet(resAccounts[0])
    }
  }

  return (
    <>
      <header>
        <div className="leftHeader">
          <Link to="/" className="link">
            <div className="headerItem"> RateX </div>
          </Link>
        </div>
        <div className="rightHeader">
          <ConnectButton />
        </div>
      </header>
    </>
  )
}

export default Header
