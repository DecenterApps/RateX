import React, { useEffect, useRef, useState, Fragment } from 'react'
import { Input, Modal, Popover, Radio, Button } from 'antd'
import { ArrowDownOutlined, DownOutlined, SettingOutlined } from '@ant-design/icons'
import {ethers, keccak256, toUtf8Bytes } from 'ethers'
import { SwapStep } from '../types'
import { ERC20_ABI } from '../contracts/abi/common/ERC20_ABI'
import tokenList from '../constants/tokenList.json'
import { Token } from '../constants/Interfaces'
import { notification } from './notifications'
import { useDebouncedEffect } from '../utils/useDebouncedEffect'
import { Quote } from '../types'
import './Swap.scss'
import { swap, findQuote } from '../swap/front_communication'
import RoutingDiagram from './RoutingDiagram'
import { getTokenPrice } from '../providers/OracleProvider'
import initRPCProvider from '../providers/RPCProvider'
import { useConnect, useAccount, useWriteContract, useWaitForTransactionReceipt  } from 'wagmi'
import { write } from 'fs'
import { arbitrum } from 'viem/chains'
import { CreateRateXContract } from '../contracts/rateX/RateX'
import { RateXAbi } from '../contracts/abi/RateXAbi'

interface SwapProps {
  chainIdState: [number, React.Dispatch<React.SetStateAction<number>>]
  walletState: [string, React.Dispatch<React.SetStateAction<string>>]
}

function Swap({ chainIdState, walletState }: SwapProps) {
  const [chainId] = chainIdState
  const [wallet] = walletState

  const {data: approveHash, writeContractAsync : callApproveAsync}= useWriteContract()
  const {data: swapHash, writeContractAsync: callSwapAsync}= useWriteContract()

  const { data: approveConfirmed } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const [slippage, setSlippage] = useState(0.5)
  const [tokenFromAmount, setTokenFromAmount] = useState<number>(-1)
  const [tokenFromPrice, setTokenFromPrice] = useState(0)
  const [tokenToAmount, setTokenToAmount] = useState(0)
  const [tokenToPrice, setTokenToPrice] = useState(0)
  const [tokenFrom, setTokenFrom] = useState<Token>(tokenList[0])
  const [tokenTo, setTokenTo] = useState<Token>(tokenList[4])
  const [quote, setQuote] = useState<Quote>()
  const [customToken, setCustomToken] = useState('')

  const [isOpenModal, setIsOpenModal] = useState(false)
  const [changeToken, setChangeToken] = useState(1)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [loadingSwap, setLoadingSwap] = useState(false)
  const [loadingCustomToken, setLoadingCustomToken] = useState(false)
  const lastCallTime = useRef(0)
  const [isFallbackProvider, setIsFallbackProvider] = useState(false)
  

  const { provider: ethersProvider, isFallback } = initRPCProvider()


  useEffect(() => {
    setIsFallbackProvider(isFallback)
  }, [isFallback])

  useEffect(() => {
    if(swapHash)
    notification.success({
      message: `<a target="_blank" href="https://${chainId === 1 ? 'etherscan' : 'arbiscan'}.io/tx/${swapHash}" style="color:#ffffff;">Tx hash: ${
        swapHash
      }</a>`,
    })  }, [swapHash])
 
  useEffect(() => {
    function transferQuoteWithBalancerPoolIdToAddress(quote: Quote): Quote {
      quote.routes.forEach((route) =>
        route.swaps.map((swap) => {
          if (swap.poolId.length === 66) {
            swap.poolId = swap.poolId.slice(0, 42) // convert to address
          }
          return swap
        })
      )
    
      return quote
    }
    // RateX contract expects dexId to be a uint32 that represents first 4 bytes of keccak256 hash of dexId, not a string
function hashStringToInt(dexName: string): number {
  const hash = keccak256(toUtf8Bytes(dexName))
  // Take the first 4 bytes (8 hex characters) and convert to uint32
  return parseInt(hash.slice(2, 10), 16)
}

// Encode swap data for RateX contract
function encodeSwapData(swap: SwapStep) {
  const abiCoder = new ethers.AbiCoder()

  if (swap.dexId === 'BALANCER_V2' || swap.dexId === 'CURVE' || swap.dexId === 'UNI_V3') {
    // For DEXes like Balancer, Curve, UniswapV3 => we include poolId, tokenIn, and tokenOut
    return abiCoder.encode(['address', 'address', 'address'], [swap.poolId, swap.tokenIn, swap.tokenOut])
  }
  // For DEXes like Uniswap V2, Camelot, Sushiswap we include only tokenIn and tokenOut
  else return abiCoder.encode(['address', 'address'], [swap.tokenIn, swap.tokenOut])
}

    async function callRatexSwap(){
      if(!approveHash)
      {return}
      try{
      console.log("Ovo je hash" + approveHash)
      console.log("Transakcija approve je gotova")
      const signer = await ethersProvider.getSigner(wallet)
      const RateXContract = CreateRateXContract(chainId, signer)
      if(!quote)
      {return}
      const quoteParsed = transferQuoteWithBalancerPoolIdToAddress(quote)

      const routesAdjusted = quoteParsed.routes.map((route) => {
        const adjustedSwaps = route.swaps.map((swap) => {
          // Encode the swap data based on the dexId
          const encodedData = encodeSwapData(swap)
          // Convert dexId to uint32
          const dexIdUint32 = hashStringToInt(swap.dexId)
  
          return { data: encodedData, dexId: dexIdUint32 }
        })
        return { ...route, swaps: adjustedSwaps }
      })
  
      const deadline = Math.floor(Date.now() / 1000) + 60 * 30 // 30 minutes
      const amountIn = ethers.parseUnits(tokenFromAmount.toString(), tokenFrom.decimals)
      const amountOut = quote.quote
      const slippageBigInt = BigInt(slippage * 100)
      const minAmountOut = (amountOut * (BigInt(100) - slippageBigInt)) / BigInt(100)

      const data = await callSwapAsync({
        chainId:arbitrum.id,
        address: '0x08A3985280560cc8b5f476a36178c2a3d3D866C6',
        functionName: 'swap',
        abi: RateXAbi,
        args: [routesAdjusted, tokenFrom.address[chainId], tokenTo.address[chainId], amountIn, minAmountOut, wallet, deadline]
      })
      //    swap(tokenFrom.address[chainId], tokenTo.address[chainId], quote, amountIn, slippage, wallet, chainId, writeContractAsync)

      console.log("Ovo je data buraz" + data)
      
    }
    catch (err: any) {
      notification.error({
        message: err.message,
      })
    }
}
callRatexSwap()
  }, [approveConfirmed])
  
  useEffect(() => {
    async function getPrices() {
      const tokenFromPrice = await getTokenPrice(tokenFrom.ticker, chainId)
      tokenFromPrice === -1 ? setTokenFromPrice(-1) : setTokenFromPrice(tokenFromPrice)
      const tokenToPrice = await getTokenPrice(tokenTo.ticker, chainId)
      tokenToPrice === -1 ? setTokenFromPrice(-1) : setTokenToPrice(tokenToPrice)
    }
    getPrices()
  }, [chainId, tokenFrom.ticker, tokenTo.ticker])

  useDebouncedEffect(
    () => {
      getQuote(tokenFrom.address[chainId], tokenTo.address[chainId])
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
    try {
      const parsedValue = parseFloat(val)
      if (parsedValue < 0) {
        isValid = false
      }
      if (parsedValue > 1000000000000) isValid = false
    } catch (e) {
      console.log(e)
    }
    if (isValid) {
      setTokenFromAmount(val)
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
    const tokenToAmount = (Number(tokenFromAmount) * tokenToPrice) / tokenFromPrice
    setTokenToAmount(tokenToAmount)
  }

  function changeTempToken(e: any) {
    setCustomToken(e.target.value)
  }

  async function checkCustomAddedToken() {
    if (customToken === '') return setIsOpenModal(false)
    setLoadingCustomToken(true)
    try {
      const signer = await ethersProvider.getSigner(wallet)
      const tokenContract = new ethers.Contract(customToken, ERC20_ABI, signer)

      const token: Token = {
        ticker: '',
        img: 'https://images.freeimages.com/fic/images/icons/2297/super_mario/256/question_coin.png',
        name: '',
        address: {
          '1': '',
          '42161': '',
        },
        decimals: 18,
      }

      const name = await tokenContract.name()
      token.name = name

      const symbol = await tokenContract.symbol()
      token.ticker = symbol

      const decimals = await tokenContract.decimals()
      token.decimals = Number(decimals)

      let img = await fetchTokenImage(customToken)
      token.img = img

      if (token.name !== '' || token.ticker !== '' || token.decimals !== 0) {
        token.address[chainId] = customToken

        await modifyToken(0, [token])
        return setIsOpenModal(false)
      }
      setLoadingCustomToken(false)
    } catch (error: any) {
      console.log(error)
      setLoadingCustomToken(false)
      notification.error({
        message: 'Invalid custom address. Erase input or include correct address. Note: Check if you are on correct chain!',
      })
    }
  }

  function openModal(token: number) {
    setLoadingCustomToken(false)

    setChangeToken(token)
    setIsOpenModal(true)
  }
  const fetchTokenImage = async (address: string): Promise<string> => {
    const baseUrl = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/'
    const imageUrl = `${baseUrl}${address}/logo.png`

    try {
      const response = await fetch(imageUrl)
      if (response.ok) {
        return imageUrl
      }
    } catch (error) {
      console.log('Image not found in Trust Wallet repository.')
    }
    return 'https://images.freeimages.com/fic/images/icons/2297/super_mario/256/question_coin.png' // Placeholder image
  }

  async function modifyToken(index: number, tokenList: Token[]) {
    if (changeToken === 1) {
      setTokenFrom(tokenList[index])
      const _tokenFromPrice = await getTokenPrice(tokenList[index].ticker, chainId)
      setTokenFromPrice(_tokenFromPrice === -1 ? 0 : _tokenFromPrice)

      const tokenToAmount = (Number(tokenFromAmount) * _tokenFromPrice) / tokenToPrice
      setTokenToAmount(tokenToAmount)
    } else {
      setTokenTo(tokenList[index])
      const _tokenToPrice = await getTokenPrice(tokenList[index].ticker, chainId)
      setTokenToPrice(_tokenToPrice === -1 ? 0 : _tokenToPrice)

      const tokenToAmount = (Number(tokenFromAmount) * tokenFromPrice) / _tokenToPrice
      setTokenToAmount(tokenToAmount)
    }

    setIsOpenModal(false)
  }

  function calculatePriceImpact(): number {
    let tokenFromMarketPrice = Math.max(Number(tokenFromAmount) * tokenFromPrice, 0)
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

  function getQuote(fromAddress: string, toAddress: string) {
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

    const amount = ethers.parseUnits(tokenFromAmount.toString(), tokenFrom.decimals)

    setLoadingQuote(true)
    findQuote(fromAddress, toAddress, amount, chainId)
      .then((quote: Quote) => {
        if (callTime < lastCallTime.current) {
          return
        }
        setTokenToAmount(Number(quote.quote) / 10 ** tokenTo.decimals)
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

    const amountIn = ethers.parseUnits(tokenFromAmount.toString(), tokenFrom.decimals)

    swap(tokenFrom.address[chainId], tokenTo.address[chainId], quote, amountIn, slippage, wallet, chainId, callApproveAsync)
      .then((res) => {
        !res.isSuccess && notification.error({ message: res.errorMessage })
        setLoadingSwap(false)
      })
      .catch((error: string) => {
        console.log('Error on swap: ', error)
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
    <Fragment>
      <Modal
        style={{ top: '5vh' }}
        open={isOpenModal}
        footer={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}></div>}
        onCancel={() => setIsOpenModal(false)}
        title="Select a token"
      >
        <div className="modalContent">
          {tokenList.map((token, index) => {
            return (
              <div className="tokenChoice" key={index} onClick={() => modifyToken(index, tokenList)}>
                <img src={token.img} alt={token.ticker} className="tokenLogo" />
                <div className="tokenChoiceNames">
                  <div className="tokenName"> {token.name} </div>
                  <div className="tokenTicker"> {token.ticker} </div>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', flexDirection: 'column' }}>
          <Input className="tokenAddress" placeholder="Or enter token address" onChange={changeTempToken} />

          {loadingCustomToken ? (
            <div className="lds-ellipsis">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          ) : (
            <Button
              type="primary"
              className="swapButton"
              style={{ fontSize: '1em', width: '90%', marginTop: 5, height: '40px' }}
              onClick={checkCustomAddedToken}
            >
              Add Custom Token
            </Button>
          )}
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
          <Input placeholder="0" value={tokenFromAmount === -1 ? '' : tokenFromAmount} onChange={changeAmount} />
          <div className="tokenFromAmountUSD">{`${
            tokenFromPrice > -1 ? '$' + Math.max(tokenFromAmount * tokenFromPrice, 0).toFixed(4) : 'No price data available'
          }`}</div>
          <div className="assetFrom" onClick={() => openModal(1)}>
            <img src={tokenFrom.img} style={{ borderRadius: '50px' }} alt="assetFromLogo" className="assetLogo" />
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
            <Fragment>
              <Input placeholder="0" value={tokenToAmount.toFixed(4)} disabled={true} />
              <div className="tokenToAmountUSD">
                {`${tokenToPrice > 0 ? '$' + (tokenToAmount * tokenToPrice).toFixed(4) + ' ' : 'No price data available '}`}
                <span style={{ color: priceImpactColor() }}>
                  {tokenFromPrice > -1 && tokenToPrice > -1 ? calculatePriceImpact().toFixed(2) + ' %' : ''}
                </span>
              </div>
            </Fragment>
          )}
          <div className="assetTo" onClick={() => openModal(2)}>
            <img src={tokenTo.img} style={{ borderRadius: '50px' }} alt="assetFromLogo" className="assetLogo" />
            {tokenTo.ticker}
            <DownOutlined />
          </div>
        </div>
        <Fragment>
          {!loadingQuote && <RoutingDiagram quote={quote} chainId={chainId} tokenFrom={tokenFrom} tokenTo={tokenTo}></RoutingDiagram>}
        </Fragment>
        <Fragment>
          {loadingSwap ? (
            <button className="swapButton" onClick={commitSwap} disabled={tokenToAmount === 0}>
              <div className="lds-ellipsis">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            </button>
          ) : (
            <button className="swapButton" onClick={commitSwap} disabled={tokenToAmount === 0 || isFallbackProvider}>
              {isFallbackProvider ? "Connect Wallet to Swap" : "Swap"}
            </button>
          )}
        </Fragment>
      </div>
    </Fragment>
  )
}

export default Swap
