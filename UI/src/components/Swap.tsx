import { useEffect, useState } from "react"
import { Input, Popover, Radio, Modal } from "antd"
import { ArrowDownOutlined, DownOutlined, SettingOutlined } from "@ant-design/icons"
import RoutingDiagram from "../components/RoutingDiagram"
import tokenList from "../constants/tokenList.json"
import { Token } from "../constants/Interfaces"
import { getTokenPrice } from "../providers/OracleProvider"
import { initGetQuote } from "../sdk/quoter/front_communication"
import Web3 from "web3"
import initRPCProvider from "../providers/RPCProvider"
import './Swap.scss'

const web3: Web3 = initRPCProvider(42161)

interface SwapProps {
    chainIdState: [number, React.Dispatch<React.SetStateAction<number>>]
    walletState: [string, React.Dispatch<React.SetStateAction<string>>]
}

function Swap({chainIdState, walletState}: SwapProps) {

    const [chainId, setChainId] = chainIdState

    const [slippage, setSlippage] = useState(0.5)
    const [tokenFromAmount, setTokenFromAmount] = useState<number>(0)
    const [tokenFromPrice, setTokenFromPrice] = useState(0)
    const [tokenToAmount, setTokenToAmount] = useState(0)
    const [tokenToPrice, setTokenToPrice] = useState(0)
    const [tokenFrom, setTokenFrom] = useState<Token>(tokenList[3])
    const [tokenTo, setTokenTo] = useState<Token>(tokenList[4])
    const [isOpenModal, setIsOpenModal] = useState(false)
    const [changeToken, setChangeToken] = useState(1)

    useEffect(() => {
        async function getPrices() {
            const tokenFromPrice = await getTokenPrice(tokenFrom.ticker, chainId)
            tokenFromPrice === -1 ? setTokenFromPrice(0) : setTokenFromPrice(tokenFromPrice)
            const tokenToPrice = await getTokenPrice(tokenTo.ticker, chainId)
            tokenToPrice === -1 ? setTokenFromPrice(0) : setTokenToPrice(tokenToPrice)
        }
        getPrices()
    }, [])

    useEffect(() => {
        const interval = setInterval(() => {
            getQuote()
        }, 5000)
        return () => clearInterval(interval)
    }, [tokenFromAmount, tokenFrom, tokenTo])

    useEffect(() => {
        getQuote()
    }, [tokenFromAmount, tokenFrom, tokenTo])

    function handleSlippage(e: any) {
        setSlippage(e.target.value)
    }

    function changeAmount(e: any) {
        setTokenFromAmount(e.target.value)
    }

    function switchTokens() {
        const tempToken = tokenFrom
        setTokenFrom(tokenTo)
        setTokenTo(tempToken)

        const tempPrice = tokenFromPrice
        setTokenFromPrice(tokenToPrice)
        setTokenToPrice(tempPrice)

        // doing it the opposite direction because the state values have not been updated until the next render
        const tokenToAmount = tokenFromAmount * tokenToPrice / tokenFromPrice
        setTokenToAmount(tokenToAmount)
    }

    function openModal(token: number) {
        setChangeToken(token)
        setIsOpenModal(true)
    }

    async function modifyToken(index: number) {
        if (changeToken === 1) {
            setTokenFrom(tokenList[index])
            const _tokenFromPrice = await getTokenPrice(tokenList[index].ticker, chainId)
            console.log("Fetched price", _tokenFromPrice, "for", tokenList[index].ticker)
            setTokenFromPrice(_tokenFromPrice === -1 ? 0 : _tokenFromPrice)

            const tokenToAmount = tokenFromAmount * _tokenFromPrice / tokenToPrice
            setTokenToAmount(tokenToAmount)
        } else {
            setTokenTo(tokenList[index])
            const _tokenToPrice = await getTokenPrice(tokenList[index].ticker, chainId)
            console.log("Fetched price", _tokenToPrice, "for", tokenList[index].ticker)
            setTokenToPrice(_tokenToPrice === -1 ? 0 : _tokenToPrice)

            const tokenToAmount = tokenFromAmount * tokenFromPrice / _tokenToPrice
            setTokenToAmount(tokenToAmount)
        }

        setIsOpenModal(false)
    }

    function calculatePriceImpact(): number {
        let tokenFromMarketPrice = tokenFromAmount * tokenFromPrice
        let tokenToMarketPrice = tokenToAmount * tokenToPrice
        let percentage = 100.0 * tokenToMarketPrice / tokenFromMarketPrice
        if(isNaN(percentage)) return 0
        return percentage - 100
    }

    function priceImpactColor(): string {
        const impact = calculatePriceImpact()
        if(impact > -1 ) return "#339900"
        if(impact > -3 ) return "#99cc33"
        if(impact > -5 ) return "#ffcc00"
        if(impact > -15) return "#ff9966"
        return "#cc3300"
    }

    function getQuote() {
        if (tokenFromAmount <= 0 || isNaN(tokenFromAmount)) {
            setTokenToAmount(0)
            return
        }
        const amount = web3.utils.toBigInt(tokenFromAmount * (10 ** tokenFrom.decimals))
        initGetQuote(tokenFrom.address[chainId], tokenTo.address[chainId], amount, chainId)
            .then((value: bigint) => {
                setTokenToAmount(Number(value) / (10 ** tokenTo.decimals))
            })
            .catch((error: string) => {
                console.log(error)
            })
    }

    function commitSwap() {
        
    }

    const settings = (
        <>
            <div> Slippage Tolerance</div>
            <div>
                <Radio.Group value={slippage} onChange={handleSlippage}>
                    <Radio.Button value={0.1}> 0.1% </Radio.Button>
                    <Radio.Button value={0.5}> 0.5% </Radio.Button>
                    <Radio.Button value={1.0}> 1.0% </Radio.Button>
                </Radio.Group>
            </div>
        </>
    )

    return (
        <>
        <Modal open={isOpenModal} footer={null} onCancel={()=>setIsOpenModal(false)} title="Select a token">
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
                <Input placeholder="0" value={tokenFromAmount} onChange={changeAmount} />
                <div className="tokenFromAmountUSD">
                    {`$${(tokenFromAmount * tokenFromPrice).toFixed(4)}`} 
                </div>
                <Input placeholder="0" value={tokenToAmount.toFixed(4)} disabled={true} />
                <div className="tokenToAmountUSD">
                    {`$${(tokenToAmount * tokenToPrice).toFixed(4)}`} (<span style={{color:priceImpactColor()}}>{calculatePriceImpact().toFixed(2)}%</span>)
                </div>
                <div className="assetFrom" onClick={() => openModal(1)}>
                    <img src={tokenFrom.img} alt="assetFromLogo" className="assetLogo"/>
                    {tokenFrom.ticker}
                    <DownOutlined />
                </div>
                <div className="switchButton" onClick={switchTokens}>
                    <ArrowDownOutlined className="switchArrow" />
                </div>
                <div className="assetTo" onClick={() => openModal(2)}>
                    <img src={tokenTo.img} alt="assetFromLogo" className="assetLogo"/>
                    {tokenTo.ticker}
                    <DownOutlined />
                </div>
                {/* <RoutingDiagram></RoutingDiagram> */}
                <button className="swapButton" onClick={commitSwap} disabled={false}>Swap</button>
            </div>
        </div>
        </>
    )
}

export default Swap