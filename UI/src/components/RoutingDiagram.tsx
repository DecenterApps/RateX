import { useEffect, useState } from 'react'
import { tokenAddressToImage } from '../constants/tokenAddressToImage'
import { Token } from '../constants/Interfaces'
import { ArrowRightOutlined, ExpandAltOutlined } from '@ant-design/icons'
import './RoutingDiagram.scss'
import {Quote, Route} from '../sdk/types'

function RouteComponent({ route }: { route: Route }) {
  return (
    <div className="routingDiagramPath">
      <div className="percentage">
        {route.percentage}% 
      </div>
      <TokenComponent token={route.swaps[0].tokenIn}></TokenComponent>
      {route.swaps.map((swap) => (
        <>
          <ArrowRightOutlined className="routingDiagramPoolArrow" />
          <TokenComponent token={swap.tokenOut}></TokenComponent>
        </>
      ))}
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
      <a href={`https://arbiscan.io/token/${token}`} target="_blank"><img src={img} alt="assetFromLogo" /></a>
      <span className="tooltiptext">{ticker}</span>
    </div>
  )
}

function RoutingDiagram({ quote }: { quote: Quote | undefined }) {
  if (!quote || quote.quote <= 0) {
    return (<></>)
  }
  quote.routes.sort((a, b) => a.percentage - b.percentage)
  return (
    <div className="routingDiagram">
      <h4>Order Routing</h4>
      <ExpandAltOutlined className="routingDiagramExpandIcon"></ExpandAltOutlined>
      {quote.routes.map((route) => (
        <RouteComponent route={route}></RouteComponent>
      ))}
    </div>
  )
}

export default RoutingDiagram
