import { Fragment } from 'react'
import { tokenAddressToImage } from '../constants/tokenAddressToImage'
import { dexIdToUrl } from '../constants/dexIdToUrl'
import { ArrowRightOutlined } from '@ant-design/icons'
import './RoutingDiagram.scss'
import { Quote, Route, SwapStep } from '../sdk/types'

function RouteComponent({ route, chainId }: { route: Route; chainId: Number }) {
  return (
    <div className="routingDiagramRoute">
      <div className="percentage">{route.percentage}%</div>
      <TokenComponent token={route.swaps[0]?.tokenIn} chainId={chainId}></TokenComponent>
      {route.swaps.map((swap, index) => (
        <Fragment key={index}>
          <TokenArrow swap={swap}></TokenArrow>
          <TokenComponent token={swap.tokenOut} chainId={chainId}></TokenComponent>
        </Fragment>
      ))}
    </div>
  )
}

function TokenArrow({ swap }: { swap: SwapStep }) {
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

function TokenComponent({ token, chainId }: { token: string; chainId: Number }) {
  let img = 'empty-token.webp'
  let ticker = `${token.substring(0, 10)}...`
  if (token in tokenAddressToImage) {
    img = tokenAddressToImage[token].img
    ticker = tokenAddressToImage[token].ticker
  }
  return (
    <div className="routingDiagramToken tooltip">
      {chainId === 1 ? (
        <a href={`https://etherscan.io/token/${token}`} target="_blank">
          <img src={img} alt="assetFromLogo" />
        </a>
      ) : (
        <a href={`https://arbiscan.io/token/${token}`} target="_blank">
          <img src={img} alt="assetFromLogo" />
        </a>
      )}
      <span className="tooltiptext">{ticker}</span>
    </div>
  )
}

function RoutingDiagram({ quote, chainId }: { quote: Quote | undefined; chainId: Number }) {
  if (!quote || quote.quote <= 0) {
    return <></>
  }
  quote.routes.sort((a, b) => b.percentage - a.percentage)
  return (
    <div className="routingDiagram">
      <h4>Order Routing</h4>
      {quote.routes.map((route, index) => (
        <RouteComponent key={-index} route={route} chainId={chainId} />
      ))}
    </div>
  )
}

export default RoutingDiagram
