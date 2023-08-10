import {useEffect, useState} from "react"
import {Input, Popover, Radio, Modal} from "antd"
import {ArrowDownOutlined, DownOutlined, SettingOutlined} from "@ant-design/icons"
import RoutingDiagram from "../components/RoutingDiagram"
import tokenList from "../constants/tokenList.json"
import {Token} from "../constants/Interfaces"
import {getTokenPrice} from "../providers/OracleProvider"
import {initGetQuote, swap} from "../sdk/quoter/front_communication"
import Web3 from "web3";
import initRPCProvider from "../providers/RPCProvider";
import {QuoteResultEntry} from "../sdk/types";
import {notification} from "./notifications";
const web3: Web3 = initRPCProvider(42161);

interface SwapProps {
    chainIdState: [number, React.Dispatch<React.SetStateAction<number>>];
    walletState: [string, React.Dispatch<React.SetStateAction<string>>];
}

function Swap({chainIdState, walletState}: SwapProps) {

    const [chainId, setChainId] = chainIdState;
    const [wallet, setWallet] = walletState;
    const [slippage, setSlippage] = useState(0.5)
    const [tokenOneAmount, setTokenOneAmount] = useState<number>(0)
    const [tokenOnePrice, setTokenOnePrice] = useState(0)
    const [tokenTwoAmount, setTokenTwoAmount] = useState(0)
    const [tokenTwoPrice, setTokenTwoPrice] = useState(0)
    const [tokenOne, setTokenOne] = useState<Token>(tokenList[3])
    const [tokenTwo, setTokenTwo] = useState<Token>(tokenList[4])
    const [isOpen, setIsOpen] = useState(false)
    const [changeToken, setChangeToken] = useState(1)
    const [loadingQuote, setLoadingQuote] = useState(false);
    const [loadingSwap, setLoadingSwap] = useState(false);
    const [quote, setQuote] = useState<QuoteResultEntry>();

    useEffect(() => {
        async function getPrices() {
            const tokenOnePrice = await getTokenPrice(tokenOne.ticker, chainId)
            tokenOnePrice === -1 ? setTokenOnePrice(0) : setTokenOnePrice(tokenOnePrice)
            const tokenTwoPrice = await getTokenPrice(tokenTwo.ticker, chainId)
            tokenTwoPrice === -1 ? setTokenOnePrice(0) : setTokenTwoPrice(tokenTwoPrice)
        }
        getPrices()
    }, [])

    // for now commented, to reduce quote contracts calls
    // useEffect(() => {
    //     const interval = setInterval(() => {
    //       getQuote()
    //     }, 5000)
    //     return () => clearInterval(interval)
    // }, [tokenOneAmount, tokenOne, tokenTwo])

    useEffect(() => {
        getQuote()
    }, [tokenOneAmount, tokenOne, tokenTwo])

    function handleSlippage(e: any) {
        setSlippage(e.target.value)
    }

    function changeAmount(e: any) {
        setTokenOneAmount(e.target.value)
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

    function calculatePriceImpact(): number {
        let tokenOneMarketPrice = tokenOneAmount * tokenOnePrice
        let tokenTwoMarketPrice = tokenTwoAmount * tokenTwoPrice
        let percentage = 100.0 * tokenTwoMarketPrice / tokenOneMarketPrice
        if(isNaN(percentage)) return 0
        return percentage - 100
    }

    function priceImpactColor(): string {
        const impact = calculatePriceImpact()
        if(impact > -1) return "#339900"
        if(impact > -3) return "#99cc33"
        if(impact > -5) return "#ffcc00"
        if(impact > -15) return "#ff9966"
        return "#cc3300"
    }

    function getQuote() {
        if (tokenOneAmount <= 0 || isNaN(tokenOneAmount)) {
            setTokenTwoAmount(0)
            return
        }
        const amount = web3.utils.toBigInt(tokenOneAmount * (10 ** tokenOne.decimals))

        setLoadingQuote(true)
        initGetQuote(tokenOne.address[chainId], tokenTwo.address[chainId], amount)
            .then((q: QuoteResultEntry) => {
                setTokenTwoAmount(Number(q.amountOut) / (10 ** tokenTwo.decimals))
                setLoadingQuote(false)
                setQuote(q);
            })
            .catch((error: string) => {
                setLoadingQuote(false)
                console.log(error)
            })
    }

    function commitSwap() {
        if (quote === undefined) return

        setLoadingSwap(true);

        const amountIn = web3.utils.toBigInt(tokenOneAmount * (10 ** tokenOne.decimals))

        swap(tokenOne.address[chainId], tokenTwo.address[chainId], quote, amountIn, slippage, wallet, chainId)
            .then((res) => {
                setLoadingSwap(false);
                // for now hardcode it for testing purposes
                res.isSuccess ? notification.success({message: `<a  href="https://dashboard.tenderly.co/shared/fork/884a44ff-40a1-422f-af02-c47fc64908ff/transactions/" style="color:#ffffff;">Tx hash: ${res.txHash}</a>`}) :
                                notification.error({message: res.errorMessage})
            })
            .catch((error: string) => {
                setLoadingSwap(false)
                notification.open({message: error})
            });
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
                {
                    loadingQuote ?
                    <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div> :
                    <div className="inputs">
                        <Input placeholder="0" value={tokenTwoAmount.toFixed(4)} disabled={true} />
                        <div className="tokenTwoAmountUSD">
                            {`$${(tokenOneAmount * tokenOnePrice).toFixed(4)}`}
                            (<span style={{color:priceImpactColor()}}>{calculatePriceImpact().toFixed(2)}%</span>)
                        </div>
                    </div>
                }
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
                <RoutingDiagram></RoutingDiagram>
                {
                    loadingSwap ?
                        <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div> :
                        <button className="swapButton" onClick={commitSwap} disabled={tokenTwoAmount == 0}>Swap</button>
                }
            </div>
        </div>
        </>
    )
}

export default Swap