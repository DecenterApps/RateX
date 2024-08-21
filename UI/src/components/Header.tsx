import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'

interface HeaderProps {
  chainIdState: [number, React.Dispatch<React.SetStateAction<number>>]
  walletState: [string, React.Dispatch<React.SetStateAction<string>>]
}

function Header({ chainIdState, walletState }: HeaderProps) {
  const [wallet, setWallet] = walletState
  const { address } = useAccount()

  useEffect(() => {
    async function checkWalletConnection() {
      if (address) {
        setWallet(address) // Set the wallet only if the address is defined
      } else {
        setWallet('') // Or set to an empty string or handle the undefined case as needed
      }
    }

    checkWalletConnection()
  }, [address, setWallet])

  return (
    <>
      <header>
        <div className="leftHeader">
          <Link to="/" className="link">
            <img src="/rateX-white.svg" alt="RateX Logo" />
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
