import { useEffect, useState, Fragment } from 'react'
import { tokenAddressToImage } from '../constants/tokenAddressToImage'
import { dexIdToUrl } from '../constants/dexIdToUrl'
import { ArrowRightOutlined } from '@ant-design/icons'
import './RoutingDiagram.scss'
import { Quote, Route, Swap } from '../sdk/types'

function RouteComponent({ route }: { route: Route }) {
  return (
    <div className="routingDiagramRoute">
      <div className="percentage">{route.percentage}%</div>
      <TokenComponent token={route.swaps[0].tokenA}></TokenComponent>
      {route.swaps.map((swap, index) => (
        <Fragment key={index}>
          <TokenArrow swap={swap}></TokenArrow>
          <TokenComponent token={swap.tokenB}></TokenComponent>
        </Fragment>
      ))}
    </div>
  )
}

function TokenArrow({ swap }: { swap: Swap }) {
  return (
    <div className="routingDiagramArrow">
      <a href={dexIdToUrl[swap.dexId].replace('ADDRESS', swap.poolId)} target="_blank">
        <div className="arrow">
          <ArrowRightOutlined />
        </div>
        <div className="dex">{swap.dexId}</div>
      </a>
    </div>
  )
}

function TokenComponent({ token }: { token: string }) {
  let img = 'empty-token.webp'
  let ticker = `${token.substring(0, 10)}...`
  if (token in tokenAddressToImage) {
    img = tokenAddressToImage[token].img
    ticker = tokenAddressToImage[token].ticker
  }
  return (
    <div className="routingDiagramToken tooltip">
      <a href={`https://arbiscan.io/token/${token}`} target="_blank">
        <img src={img} alt="assetFromLogo" />
      </a>
      <span className="tooltiptext">{ticker}</span>
    </div>
  )
}

function RoutingDiagram({ quote }: { quote: Quote | undefined }) {
  if (!quote || quote.amountOut <= 0) {
    return <></>
  }
  quote.routes.sort((a, b) => b.percentage - a.percentage)
  return (
    <div className="routingDiagram">
      <h4>Order Routing</h4>
      {quote.routes.map((route, index) => (
        <RouteComponent key={-index} route={route}></RouteComponent>
      ))}
    </div>
  )
}

export default RoutingDiagram
