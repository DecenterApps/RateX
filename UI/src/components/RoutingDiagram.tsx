import { useEffect, useState } from 'react'
import { tokenAddressToImage } from '../constants/tokenAddressToImage'
import { Token } from '../constants/Interfaces'
import { ArrowRightOutlined, ExpandAltOutlined } from '@ant-design/icons'
import './RoutingDiagram.scss'
import { Quote, Route, Swap } from '../sdk/types'

function RouteComponent({ route }: { route: Route }) {
  return (
    <div className="routingDiagramPath">
      {route.percentage}%
      {route.swaps.map((swap) => (
        <>
          <ArrowRightOutlined className="routingDiagramPoolArrow" />
          <SwapComponent swap={swap}></SwapComponent>
        </>
      ))}
    </div>
  )
}

function SwapComponent({ swap }: { swap: Swap }) {
  const tokenA = swap.tokenA.toLowerCase()
  const tokenB = swap.tokenB.toLowerCase()
  const tokenAImage = tokenAddressToImage.hasOwnProperty(tokenA) ? tokenAddressToImage[tokenA].img : 'https://images.freeimages.com/fic/images/icons/2297/super_mario/256/question_coin.png'
  const tokenBImage = tokenAddressToImage.hasOwnProperty(tokenB) ? tokenAddressToImage[tokenB].img : 'https://images.freeimages.com/fic/images/icons/2297/super_mario/256/question_coin.png'

  return (
    <div className="routingDiagramPool">
      <img src={tokenAImage} alt="assetFromLogo" />
      <img src={tokenBImage} alt="assetToLogo" />
    </div>
  )
}

function RoutingDiagram({ quote }: { quote: Quote }) {
  return (
    <div className="routingDiagam">
      <h4>Order Routing</h4>
      <ExpandAltOutlined className="routingDiagramExpandIcon"></ExpandAltOutlined>
      {quote.routes.map((route) => (
        <RouteComponent route={route}></RouteComponent>
      ))}
    </div>
  )
}

export default RoutingDiagram
