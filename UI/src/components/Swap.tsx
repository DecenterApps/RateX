import {useEffect, useState} from "react"
import {Input, Popover, Radio, Modal} from "antd"
import {ArrowDownOutlined, DownOutlined, SettingOutlined} from "@ant-design/icons"
import tokenList from "../constants/tokenList.json"
import {Token} from "../constants/Interfaces"
import {getTokenPrice} from "../providers/OracleProvider"
import {initGetQuote} from "../sdk/API/front_communication"
import Web3 from "web3";
import initRPCProvider from "../providers/RPCProvider";
const web3: Web3 = initRPCProvider(42161);

interface SwapProps {
    chainIdState: [number, React.Dispatch<React.SetStateAction<number>>];
    walletState: [string, React.Dispatch<React.SetStateAction<string>>];
}

function Swap({chainIdState, walletState}: SwapProps) {

    const [chainId, setChainId] = chainIdState;

    const [slippage, setSlippage] = useState(0.5)
    const [tokenOneAmount, setTokenOneAmount] = useState(0)
    const [tokenOnePrice, setTokenOnePrice] = useState(0)
    const [tokenTwoAmount, setTokenTwoAmount] = useState(0)
    const [tokenTwoPrice, setTokenTwoPrice] = useState(0)
    const [tokenOne, setTokenOne] = useState<Token>(tokenList[0])
    const [tokenTwo, setTokenTwo] = useState<Token>(tokenList[1])
    const [isOpen, setIsOpen] = useState(false)
    const [changeToken, setChangeToken] = useState(1)

    useEffect(() => {
        async function getPrices() {
            const tokenOnePrice = await getTokenPrice(tokenOne.ticker, chainId)
            tokenOnePrice === -1 ? setTokenOnePrice(0) : setTokenOnePrice(tokenOnePrice)
            const tokenTwoPrice = await getTokenPrice(tokenTwo.ticker, chainId)
            tokenTwoPrice === -1 ? setTokenOnePrice(0) : setTokenTwoPrice(tokenTwoPrice)
        }

        getPrices()
    }, [])

    function handleSlippage(e: any) {
        setSlippage(e.target.value)
    }

    function changeAmount(e: any) {
        setTokenOneAmount(e.target.value)
        // constant conversion between token1 and token2 amounts
        const tokenTwoAmount = e.target.value * tokenOnePrice / tokenTwoPrice
        setTokenTwoAmount(tokenTwoAmount)
    }

    function switchTokens() {
        const tempToken = tokenOne
        setTokenOne(tokenTwo)
        setTokenTwo(tempToken)

        const tempPrice = tokenOnePrice
        setTokenOnePrice(tokenTwoPrice)
        setTokenTwoPrice(tempPrice)

        // doing it the opposite direction because the state values have not been updated until the next render
        const tokenTwoAmount = tokenOneAmount * tokenTwoPrice / tokenOnePrice
        setTokenTwoAmount(tokenTwoAmount)
    }

    function openModal(token: number) {
        setChangeToken(token)
        setIsOpen(true)
    }

    async function modifyToken(index: number) {
        if (changeToken === 1) {
            setTokenOne(tokenList[index])
            const _tokenOnePrice = await getTokenPrice(tokenList[index].ticker, chainId)
            console.log("Fetched price", _tokenOnePrice, "for", tokenList[index].ticker)
            setTokenOnePrice(_tokenOnePrice === -1 ? 0 : _tokenOnePrice)

            const tokenTwoAmount = tokenOneAmount * _tokenOnePrice / tokenTwoPrice
            setTokenTwoAmount(tokenTwoAmount)
        } else {
            setTokenTwo(tokenList[index])
            const _tokenTwoPrice = await getTokenPrice(tokenList[index].ticker, chainId)
            console.log("Fetched price", _tokenTwoPrice, "for", tokenList[index].ticker)
            setTokenTwoPrice(_tokenTwoPrice === -1 ? 0 : _tokenTwoPrice)

            const tokenTwoAmount = tokenOneAmount * tokenOnePrice / _tokenTwoPrice
            setTokenTwoAmount(tokenTwoAmount)
        }

        setIsOpen(false)
    }

    function getQuote() {
        const amount = web3.utils.toBigInt(tokenOneAmount * (10 ** tokenOne.decimals))
        initGetQuote(tokenOne.address[chainId], tokenTwo.address[chainId], amount);
    }

    function commitSwap() {
    }

    const settings = (
        <>
            <div> Slippage Tolerance</div>
            <div>
                <Radio.Group value={slippage} onChange={handleSlippage}>
                    <Radio.Button value={0.1}> 0.1 </Radio.Button>
                    <Radio.Button value={0.5}> 0.5% </Radio.Button>
                    <Radio.Button value={1}> 1% </Radio.Button>
                </Radio.Group>
            </div>
        </>
    )

    return (
        <>
        <Modal open={isOpen} footer={null} onCancel={()=>setIsOpen(false)} title="Select a token">
        <div className="modalContent">
            {tokenList.map((token, index) => {
                return (
                    <div className="tokenChoice" key={index} onClick={() => modifyToken(index)}>
                        <img src={token.img} alt={token.ticker} className="tokenLogo"/>
                        <div className="tokenChoiceNames">
                            <div className="tokenName"> {token.name} </div>
                            <div className="tokenTicker"> {token.ticker} </div>
                        </div>
                    </div>
            )})}
        </div>
        </Modal>
        <div className="tradeBox">
            <div className="tradeBoxHeader">
                <h4> Swap </h4>
                <Popover 
                    content={settings}
                    title="Settings" trigger="click" placement="bottomRight">
                    <SettingOutlined className="cog"/>
                </Popover>
            </div>
            <div className="inputs">
                <Input placeholder="0" value={tokenOneAmount} onChange={changeAmount} />
                <div className="tokenOneAmountUSD">
                    {`$${(tokenOneAmount * tokenOnePrice).toFixed(4)}`} 
                </div>
                <Input placeholder="0" value={tokenTwoAmount.toFixed(4)} disabled={true} />
                <div className="assetOne" onClick={() => openModal(1)}>
                    <img src={tokenOne.img} alt="assetOneLogo" className="assetLogo"/>
                    {tokenOne.ticker}
                    <DownOutlined />
                </div>
                <div className="switchButton" onClick={switchTokens}>
                    <ArrowDownOutlined className="switchArrow" />
                </div>
                <div className="assetTwo" onClick={() => openModal(2)}>
                    <img src={tokenTwo.img} alt="assetOneLogo" className="assetLogo"/>
                    {tokenTwo.ticker}
                    <DownOutlined />
                </div>
                <button className="swapButton" onClick={getQuote} disabled={!tokenOneAmount}> Get Quote </button>
                <button className="swapButton" onClick={commitSwap} disabled={true}>Swap</button>
            </div>
        </div>
        </>
    )
}

export default Swap