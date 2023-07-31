import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from "antd"
import chainList from "../constants/chainList.json"
import detectEthereumProvider from "@metamask/detect-provider"

interface HeaderProps {
    chainIdState: [number, React.Dispatch<React.SetStateAction<number>>];
    walletState: [string, React.Dispatch<React.SetStateAction<string>>];
}

function Header ({chainIdState, walletState}: HeaderProps) {

    const [chainId, setChainId] = chainIdState;
    const [wallet, setWallet] = walletState;
    const [isOpenModal, setIsOpenModal] = useState(false)

    const currentChainData = chainList.find((chain) => chain.chainId === chainId)

    useEffect(() => {

        async function checkWalletConnection(){
            // window.ethereum.on("accountsChanged", refreshAccounts);
            const provider = await detectEthereumProvider()
            if(!provider) return

            const accountsRes = await window.ethereum.request({method: 'eth_accounts'})      
            if (accountsRes.length)
                setWallet(accountsRes[0])
            else
                console.log("Metamask is not already connected")
        }

        checkWalletConnection()
        return () => {                                            
            window.ethereum?.removeListener('accountsChanged', refreshAccounts)
        }  
    }, [])

    function modifyChain (index: number) {
        setChainId(chainList[index].chainId)
        setIsOpenModal(false)
    }

    function isWalletConnected() {
        return wallet !== "0x0000000000000000000000000000000000000000"
    }

    async function connectWallet() {  
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setWallet(accounts[0])
    }

    async function refreshAccounts() {
        const resAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (resAccounts.length !== 0 && resAccounts[0] === wallet) {
          setWallet(resAccounts[0]);
        }
        console.log("refreshedAccounts", wallet);
    }
      
    return (
        <>
        <Modal open={isOpenModal} footer={null} onCancel={()=>setIsOpenModal(false)} title="Select a chain">
            <div className="modalContent">
                {chainList.map((chain, index) => {
                    return (
                        <div className="chainChoice" key={index} onClick={() => modifyChain(index)}>
                            <img src={chain.img} alt={chain.name} className="chainLogo"/>
                            <div className="tokenName"> {chain.name} </div>
                        </div>
                )})}
            </div>
        </Modal>
        <header>
            <div className="leftHeader">
                <Link to="/" className="link">
                <div className="headerItem"> Swap </div>
                </Link>
                <Link to="/tokens" className="link">
                <div className="headerItem"> Tokens </div>
                </Link>
            </div>
            <div className="rightHeader">
                <button className="chooseChain" onClick={() => setIsOpenModal(true)}> {currentChainData?.name} </button>
                <button className="connectButton" onClick={connectWallet}> 
                    {isWalletConnected() ? `Connected: ${wallet}` : 'Connect Wallet'}
                </button>
            </div>
        </header>
        </>
    )
}

export default Header