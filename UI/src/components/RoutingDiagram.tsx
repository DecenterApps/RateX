import { useEffect, useState } from 'react'
import { tokenAddressToImage } from '../constants/tokenAddressToImage'
import { Token } from '../constants/Interfaces'
import { ArrowRightOutlined, ExpandAltOutlined } from '@ant-design/icons'
import './RoutingDiagram.scss'
import { Quote, Route, Swap } from '../sdk/types'

function RouteComponent({ route }: { route: Route }) {
  return (
    <div className="routingDiagramPath">
      <div className="percentage">
        {route.percentage}% 
      </div>
      <TokenComponent token={route.swaps[0].tokenA}></TokenComponent>
      {route.swaps.map((swap) => (
        <>
          <ArrowRightOutlined className="routingDiagramPoolArrow" />
          <TokenComponent token={swap.tokenB}></TokenComponent>
        </>
      ))}
    </div>
  )
}

function TokenComponent({ token }: { token: string }) {
  let img = 'empty-token.webp'
  let ticker = `${token.substring(0, 6)}...` 
  if (token in tokenAddressToImage) {
    img = tokenAddressToImage[token].img
    ticker = tokenAddressToImage[token].ticker
  }
  return (
    <div className="routingDiagramToken">
      <a href={`https://arbiscan.io/token/${token}`} target="_blank"><img src={img} alt="assetFromLogo" /></a>
    </div>
  )
}

function RoutingDiagram({ quote }: { quote: Quote }) {
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
