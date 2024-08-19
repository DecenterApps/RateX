import React, { useEffect, useState } from 'react'
import { Modal } from 'antd'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ethers } from 'ethers'

import chainList from '../constants/chainList.json'
import initRPCProvider from '../providers/RPCProvider'

interface HeaderProps {
  chainIdState: [number, React.Dispatch<React.SetStateAction<number>>]
  walletState: [string, React.Dispatch<React.SetStateAction<string>>]
}

function Header({ chainIdState, walletState }: HeaderProps) {
  const [chainId, setChainId] = chainIdState
  const [wallet, setWallet] = walletState
  const [isOpenModal, setIsOpenModal] = useState(false)

  useEffect(() => {
    const ethersProvider: ethers.BrowserProvider = initRPCProvider()

    async function checkWalletConnection() {
      const accountsRes = await window.ethereum.request({ method: 'eth_accounts' })

      await switchMetamaskChain(ethersProvider, chainId)
      if (accountsRes.length) {
        setWallet(accountsRes[0])
      }
    }

    checkWalletConnection()
    return () => {
      window.ethereum?.removeListener('accountsChanged', refreshAccounts)
    }
  }, [])

  async function modifyChainButton(index: number) {
    const newChainId = chainList[index].chainId

    await switchMetamaskChain(initRPCProvider(), newChainId)
    setChainId(newChainId)
    setIsOpenModal(false)
  }

  async function refreshAccounts() {
    const resAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    if (resAccounts.length !== 0 && resAccounts[0] === wallet) {
      setWallet(resAccounts[0])
    }
  }

  async function addMetamaskChain(ethersProvider: ethers.BrowserProvider, chainId: number) {
    const chainInfo: any = chainList.find((chain) => chain.chainId === chainId)
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainName: chainInfo.name,
          chainId: ethers.toBeHex(chainId),
          nativeCurrency: { name: chainInfo.Token.name, decimals: chainInfo.Token.decimals, symbol: chainInfo.Token.symbol },
          rpcUrls: [chainInfo.RPC],
        },
      ],
    })
  }

  async function switchMetamaskChain(ethersProvider: ethers.BrowserProvider, chainId: number) {
    try {
      if (window.ethereum.networkVersion !== chainId) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ethers.toBeHex(chainId) }],
        })
      }
    } catch (err: any) {
      if (err.code === 4902) {
        await addMetamaskChain(ethersProvider, chainId)
      }
    }
  }

  return (
    <>
      <Modal open={isOpenModal} footer={null} onCancel={() => setIsOpenModal(false)} title="Select a chain">
        <div className="modalContent">
          {chainList.map((chain, index) => {
            return (
              <div className="chainChoice" key={index} onClick={() => modifyChainButton(index)}>
                <img src={chain.img} alt={chain.name} className="chainLogo" />
                <div className="tokenName"> {chain.name} </div>
              </div>
            )
          })}
        </div>
      </Modal>
      <header>
        <div className="leftHeader">
          <img src="/rateX-white.svg" alt="" />
        </div>
        <div className="rightHeader">
          <ConnectButton />
        </div>
      </header>
    </>
  )
}

export default Header
