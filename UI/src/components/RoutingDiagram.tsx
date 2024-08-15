import { Fragment } from 'react'
import { tokenAddressToImage } from '../constants/tokenAddressToImage'
import { dexIdToUrl } from '../constants/dexIdToUrl'
import { ArrowRightOutlined } from '@ant-design/icons'
import './RoutingDiagram.scss'
import { Quote, Route, SwapStep } from '../types'
import { Token } from '../constants/Interfaces'
import React from 'react'

function RouteComponent({ route, chainId, tokenFrom, tokenTo }: { route: Route; chainId: Number; tokenFrom: Token; tokenTo: Token }) {
  return (
    <div className="routingDiagramRoute">
      <div className="percentage">{route.percentage}%</div>
      <TokenInComponent token={route.swaps[0]?.tokenIn} chainId={chainId} tokenFrom={tokenFrom}></TokenInComponent>
      {route.swaps.map((swap, index) => (
        <Fragment key={index}>
          <TokenArrow swap={swap} chainId={chainId}></TokenArrow>
          <TokenOutComponent
            token={swap.tokenOut}
            chainId={chainId}
            tokenTo={tokenTo}
            isLast={route.swaps.length - 1 == index}
          ></TokenOutComponent>
        </Fragment>
      ))}
    </div>
  )
}

function TokenArrow({ swap, chainId }: { swap: SwapStep; chainId: Number }) {
  return (
    <div className="routingDiagramArrow">
      <a href={dexIdToUrl(swap.dexId, chainId).replace('ADDRESS', swap.poolId)} target="_blank">
        <div className="arrow">
          <ArrowRightOutlined />
        </div>
        <div className="dex">{swap.dexId}</div>
      </a>
    </div>
  )
}

function TokenInComponent({ token, chainId, tokenFrom }: { token: string; chainId: Number; tokenFrom: Token }) {
  let img = 'empty-token.webp'
  let ticker = `${token.substring(0, 10)}...`
  if (token in tokenAddressToImage) {
    img = tokenAddressToImage[token].img
    ticker = tokenAddressToImage[token].ticker
  } else {
    tokenFrom.img && (img = tokenFrom.img)
    tokenFrom.ticker && (ticker = tokenFrom.ticker)
  }

  return (
    <div className="routingDiagramToken tooltip">
      {chainId === 1 ? (
        <a href={`https://etherscan.io/token/${token}`} target="_blank">
          <img src={img} style={{ borderRadius: '50px' }} alt="assetFromLogo" />
        </a>
      ) : (
        <a href={`https://arbiscan.io/token/${token}`} target="_blank">
          <img src={img} style={{ borderRadius: '50px' }} alt="assetFromLogo" />
        </a>
      )}
      <span className="tooltiptext">{ticker}</span>
    </div>
  )
}

function TokenOutComponent({ token, chainId, tokenTo, isLast }: { token: string; chainId: Number; tokenTo: Token; isLast: boolean }) {
  let img = 'empty-token.webp'
  let ticker = `${token.substring(0, 10)}...`
  if (token in tokenAddressToImage) {
    img = tokenAddressToImage[token].img
    ticker = tokenAddressToImage[token].ticker
  } else if (isLast) {
    tokenTo.img && (img = tokenTo.img)
    tokenTo.ticker && (ticker = tokenTo.ticker)
  }

  return (
    <div className="routingDiagramToken tooltip">
      {chainId === 1 ? (
        <a href={`https://etherscan.io/token/${token}`} target="_blank">
          <img src={img} style={{ borderRadius: '50px' }} alt="assetFromLogo" />
        </a>
      ) : (
        <a href={`https://arbiscan.io/token/${token}`} target="_blank">
          <img src={img} style={{ borderRadius: '50px' }} alt="assetFromLogo" />
        </a>
      )}
      <span className="tooltiptext">{ticker}</span>
    </div>
  )
}

function RoutingDiagram({
  quote,
  chainId,
  tokenFrom,
  tokenTo,
}: {
  quote: Quote | undefined
  chainId: Number
  tokenFrom: Token
  tokenTo: Token
}) {
  const newQuote: Quote | undefined = structuredClone(quote)
  if (!newQuote) {
    return <></>
  }
  newQuote.routes.sort((a, b) => b.percentage - a.percentage)
  if (quote?.quote !== BigInt(0)) {
    return (
      <div className="routingDiagram">
        <h4>Order Routing</h4>
        {newQuote.routes.map((route, index) => (
          <RouteComponent key={-index} route={route} chainId={chainId} tokenFrom={tokenFrom} tokenTo={tokenTo} />
        ))}
      </div>
    )
  } else {
    return (
      <div className="routingDiagram">
        <h4>Can't find Route</h4>
      </div>
    )
  }
}

export default RoutingDiagram
