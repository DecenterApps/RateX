import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from 'antd'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import chainList from '../constants/chainList.json'
import initRPCProvider from '../providers/RPCProvider'
import Web3 from 'web3'
import { useAccount } from 'wagmi'

interface HeaderProps {
  chainIdState: [number, React.Dispatch<React.SetStateAction<number>>]
  walletState: [string, React.Dispatch<React.SetStateAction<string>>]
}

function Header({ chainIdState, walletState }: HeaderProps) {
  const [chainId, setChainId] = chainIdState
  const [wallet, setWallet] = walletState
  const [isOpenModal, setIsOpenModal] = useState(false)
  const { address, isConnecting, isDisconnected } = useAccount()

  useEffect(() => {
    const web3: Web3 = initRPCProvider()

    async function checkWalletConnection() {
      const accountsRes = await window.ethereum.request({ method: 'eth_accounts' })

      await switchMetamaskChain(web3, chainId)
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

  async function addMetamaskChain(web3: Web3, chainId: number) {
    const chainInfo: any = chainList.find((chain) => chain.chainId === chainId)
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainName: chainInfo.name,
          chainId: web3.utils.toHex(chainId),
          nativeCurrency: { name: chainInfo.Token.name, decimals: chainInfo.Token.decimals, symbol: chainInfo.Token.symbol },
          rpcUrls: [chainInfo.RPC],
        },
      ],
    })
  }

  async function switchMetamaskChain(web3: Web3, chainId: number) {
    try {
      if (window.ethereum.networkVersion !== chainId) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: web3.utils.toHex(chainId) }],
        })
      }
    } catch (err: any) {
      if (err.code === 4902) {
        await addMetamaskChain(web3, chainId)
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
