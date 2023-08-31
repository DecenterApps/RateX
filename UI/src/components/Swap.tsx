import { useEffect, useRef, useState } from 'react'
import { Input, Modal, Popover, Radio } from 'antd'
import { notification } from './notifications'
import { ArrowDownOutlined, DownOutlined, SettingOutlined } from '@ant-design/icons'
import { useDebouncedEffect } from '../utils/useDebouncedEffect'
import {ERC20_ABI} from '../contracts/abi/common/ERC20_ABI'
import tokenList from '../constants/tokenList.json'
import { Token } from '../constants/Interfaces'
import RoutingDiagram from './RoutingDiagram'
// providers
import { getTokenPrice } from '../providers/OracleProvider'
import initRPCProvider from '../providers/RPCProvider'
// sdk
import { getQuoteUniLike, getQuoteIterativeSplitting, swap } from '../sdk/quoter/front_communication'
import { TQuoteUniLike } from '../sdk/routing/uni_like_algo/types'
import { Quote } from '../sdk/types'
import Web3 from 'web3'
import './Swap.scss'

const web3: Web3 = initRPCProvider(42161)

interface SwapProps {
  chainIdState: [number, React.Dispatch<React.SetStateAction<number>>]
  walletState: [string, React.Dispatch<React.SetStateAction<string>>]
}

function Swap({ chainIdState, walletState }: SwapProps) {
  const [chainId, setChainId] = chainIdState
  const [wallet, setWallet] = walletState

  const [slippage, setSlippage] = useState(0.5)
  const [tokenFromAmount, setTokenFromAmount] = useState<number>(-1)
  const [tokenFromPrice, setTokenFromPrice] = useState(0)
  const [tokenToAmount, setTokenToAmount] = useState(0)
  const [tokenToPrice, setTokenToPrice] = useState(0)
  const [tokenFrom, setTokenFrom] = useState<Token>(tokenList[3])
  const [tokenTo, setTokenTo] = useState<Token>(tokenList[4])
  const [quote, setQuote] = useState<Quote>()
  const [tempToken, setTempToken] = useState('')                      // for custom token address
  const [uniLikeQuote, setUniLikeQuote] = useState<TQuoteUniLike>()

  const [isOpenModal, setIsOpenModal] = useState(false)
  const [changeToken, setChangeToken] = useState(1)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [loadingSwap, setLoadingSwap] = useState(false)
  const lastCallTime = useRef(0)

  useEffect(() => {
    async function getPrices() {
      const tokenFromPrice = await getTokenPrice(tokenFrom.ticker, chainId)
      tokenFromPrice === -1 ? setTokenFromPrice(0) : setTokenFromPrice(tokenFromPrice)
      const tokenToPrice = await getTokenPrice(tokenTo.ticker, chainId)
      tokenToPrice === -1 ? setTokenFromPrice(0) : setTokenToPrice(tokenToPrice)
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

  useDebouncedEffect(
    () => {
      getQuote()
    },
    500,
    [tokenFromAmount, tokenFrom, tokenTo]
  )

  function handleSlippage(e: any) {
    setSlippage(e.target.value)
  }

  function changeAmount(e: any) {
    let val = e.target.value
    const numberRegex = /^\d*\.?\d*$/
    let isValid = numberRegex.test(val)
    if (isValid) {
      setTokenFromAmount(Number(val))
    }
  }

  function switchTokens() {
    const tempToken = tokenFrom
    setTokenFrom(tokenTo)
    setTokenTo(tempToken)

    const tempPrice = tokenFromPrice
    setTokenFromPrice(tokenToPrice)
    setTokenToPrice(tempPrice)

    // doing it the opposite direction because the state values have not been updated until the next render
    const tokenToAmount = (tokenFromAmount * tokenToPrice) / tokenFromPrice
    setTokenToAmount(tokenToAmount)
  }

  function changeTempToken(e: any) {
    setTempToken(e.target.value)
  }

  async function checkTempToken() {
    if (tempToken === '') return setIsOpenModal(false)

    try {
      const contract = new web3.eth.Contract(ERC20_ABI, tempToken)

      const token: Token = {
        'ticker': '',
        'img': 'https://images.freeimages.com/fic/images/icons/2297/super_mario/256/question_coin.png',
        'name': '',
        'address': {
            '1': '',
            '42161': tempToken
        },
        'decimals': 18
      }
      await contract.methods.name().call().then((name: any) => {
        token.name = name
      })

      await contract.methods.symbol().call().then((symbol: any) => {
        token.ticker = symbol
      })

      await contract.methods.decimals().call().then((decimals: any) => {
        token.decimals = Number(decimals)
      })
      
      // console.log(token)
      if (token.name !== '' || token.ticker !=='' || token.decimals !== 0) {
        await modifyToken(0, [token])
        return setIsOpenModal(false)
      }
    } catch (error: any) {
      notification.error({ message: "Invalid custom address. Erase input or include correct address. Note: Check if you are on correct chain!" })
      // alert(error)
    }
  }

  function openModal(token: number) {
    setChangeToken(token)
    setIsOpenModal(true)
  }

  async function modifyToken(index: number, tokenList: Token[]) {
    if (changeToken === 1) {
      setTokenFrom(tokenList[index])
      const _tokenFromPrice = await getTokenPrice(tokenList[index].ticker, chainId)
      console.log('Fetched price', _tokenFromPrice, 'for', tokenList[index].ticker)
      setTokenFromPrice(_tokenFromPrice === -1 ? 0 : _tokenFromPrice)

      const tokenToAmount = (tokenFromAmount * _tokenFromPrice) / tokenToPrice
      setTokenToAmount(tokenToAmount)
    } else {
      setTokenTo(tokenList[index])
      const _tokenToPrice = await getTokenPrice(tokenList[index].ticker, chainId)
      console.log('Fetched price', _tokenToPrice, 'for', tokenList[index].ticker)
      setTokenToPrice(_tokenToPrice === -1 ? 0 : _tokenToPrice)

      const tokenToAmount = (tokenFromAmount * tokenFromPrice) / _tokenToPrice
      setTokenToAmount(tokenToAmount)
    }

    setIsOpenModal(false)
  }

  function calculatePriceImpact(): number {
    let tokenFromMarketPrice = Math.max(tokenFromAmount * tokenFromPrice, 0)
    let tokenToMarketPrice = tokenToAmount * tokenToPrice
    let percentage = (100.0 * tokenToMarketPrice) / tokenFromMarketPrice
    if (isNaN(percentage)) return 0
    return percentage - 100
  }

  function priceImpactColor(): string {
    const impact = calculatePriceImpact()
    if (impact > -1) return '#339900'
    if (impact > -3) return '#99cc33'
    if (impact > -5) return '#ffcc00'
    if (impact > -15) return '#ff9966'
    return '#cc3300'
  }

  function getQuote() {
    let callTime = Date.now()
    if (lastCallTime.current < callTime) {
      lastCallTime.current = callTime
    }

    if (tokenFromAmount <= 0 || isNaN(tokenFromAmount)) {
      setTokenToAmount(0)
      setLoadingQuote(false)
      setQuote(undefined)
      return
    }

    // console.log(typeof tokenFromAmount, tokenFromAmount, typeof tokenFrom.decimals, tokenFrom.decimals)
    const amount = web3.utils.toBigInt(tokenFromAmount * 10 ** tokenFrom.decimals)

    setLoadingQuote(true)
    getQuoteIterativeSplitting(tokenFrom.address[chainId], tokenTo.address[chainId], amount, callTime)
      .then((quote: Quote) => {
        if (callTime < lastCallTime.current) {
          return
        }

        setTokenToAmount(Number(quote.amountOut) / 10 ** tokenTo.decimals)
        setLoadingQuote(false)
        setQuote(quote)
      })
      .catch((error: string) => {
        setLoadingQuote(false)
        console.log(error)
      })
  }

  function commitSwap() {
    if (quote === undefined) return

    setLoadingSwap(true)

    const amountIn = web3.utils.toBigInt(tokenFromAmount * 10 ** Number(tokenFrom.decimals))

    swap(tokenFrom.address[chainId], tokenTo.address[chainId], quote, amountIn, slippage, wallet, chainId)
      .then((res) => {
        setLoadingSwap(false)
        // for now hardcode it for testing purposes
        res.isSuccess
          ? notification.success({
              message: `<a  href="https://dashboard.tenderly.co/shared/fork/884a44ff-40a1-422f-af02-c47fc64908ff/transactions/" style="color:#ffffff;">Tx hash: ${res.txHash}</a>`,
            })
          : notification.error({ message: res.errorMessage })
      })
      .catch((error: string) => {
        setLoadingSwap(false)
        notification.open({ message: error })
      })
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
      <Modal open={isOpenModal} footer={null} onCancel={() => checkTempToken()} title="Select a token">
        <div className="modalContent">
          {tokenList.map((token, index) => {
            return (
              <>
              <div className="tokenChoice" key={index} onClick={() => modifyToken(index, tokenList)}>
                <img src={token.img} alt={token.ticker} className="tokenLogo" />
                <div className="tokenChoiceNames">
                  <div className="tokenName"> {token.name} </div>
                  <div className="tokenTicker"> {token.ticker} </div>
                </div>
              </div>
              </>
            )
          })}
        <Input className='tokenAddress' placeholder='Or enter token address' onChange={changeTempToken} />
        </div>
      </Modal>
      <div className="tradeBox">
        <div className="tradeBoxHeader">
          <h4> Swap </h4>
          <Popover content={settings} title="Settings" trigger="click" placement="bottomRight">
            <SettingOutlined className="cog" />
          </Popover>
        </div>
        <div className="input">
          <Input placeholder="0" value={tokenFromAmount == -1 ? '' : tokenFromAmount} onChange={changeAmount} />
          <div className="tokenFromAmountUSD">{`$${Math.max(tokenFromAmount * tokenFromPrice, 0).toFixed(4)}`}</div>
          <div className="assetFrom" onClick={() => openModal(1)}>
            <img src={tokenFrom.img} alt="assetFromLogo" className="assetLogo" />
            {tokenFrom.ticker}
            <DownOutlined />
          </div>
          <div className="switchButton" onClick={switchTokens}>
            <ArrowDownOutlined className="switchArrow" />
          </div>
        </div>
        <div className="input">
          {loadingQuote ? (
            <div className="lds-ellipsis">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          ) : (
            <>
              <Input placeholder="0" value={tokenToAmount.toFixed(4)} disabled={true} />
              <div className="tokenToAmountUSD">
                {`$${(tokenToAmount * tokenToPrice).toFixed(4)}`}(
                <span style={{ color: priceImpactColor() }}>{calculatePriceImpact().toFixed(2)}%</span>)
              </div>
            </>
          )}
          <div className="assetTo" onClick={() => openModal(2)}>
            <img src={tokenTo.img} alt="assetFromLogo" className="assetLogo" />
            {tokenTo.ticker}
            <DownOutlined />
          </div>
        </div>
        <RoutingDiagram quote={quote}></RoutingDiagram>
        <>
          {loadingSwap ? (
            <button className="swapButton" onClick={commitSwap} disabled={tokenToAmount == 0}>
              <div className="lds-ellipsis">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            </button>
          ) : (
            <button className="swapButton" onClick={commitSwap} disabled={tokenToAmount == 0}>
              Swap
            </button>
          )}
        </>
      </div>
    </>
  )
}

export default Swap
