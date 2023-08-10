import { useEffect, useState } from "react"
import tokenList from "../constants/tokenList.json"
import { Token } from "../constants/Interfaces"
import { ArrowRightOutlined, ExpandAltOutlined } from "@ant-design/icons"
import './RoutingDiagram.scss'

interface Pool {
    poolId: string,
    dexId: string
    tokenFrom: Token,
    tokenTo: Token
}

interface Path {
    percentage: number,
    pools: Pool[]
}

// mock data
let route: Path[] = [
    {
        percentage: 60,
        pools: [
            {
                dexId: "SushiSwapV2",
                poolId: "0x0000000000000000000000000000000000000000",
                tokenFrom: tokenList[3],
                tokenTo: tokenList[4]
            },
            {
                dexId: "SushiSwapV2",
                poolId: "0x0000000000000000000000000000000000000000",
                tokenFrom: tokenList[4],
                tokenTo: tokenList[2]
            },
            {
                dexId: "SushiSwapV2",
                poolId: "0x0000000000000000000000000000000000000000",
                tokenFrom: tokenList[2],
                tokenTo: tokenList[5]
            }
        ]
    },
    {
        percentage: 40,
        pools: [
            {
                dexId: "SushiSwapV2",
                poolId: "0x0000000000000000000000000000000000000000",
                tokenFrom: tokenList[3],
                tokenTo: tokenList[4]
            },
            {
                dexId: "SushiSwapV2",
                poolId: "0x0000000000000000000000000000000000000000",
                tokenFrom: tokenList[4],
                tokenTo: tokenList[5]
            }
        ]
    }
]

function Path({path}: {path: Path}) {
    return (
        <div className="routingDiagramPath">
            {path.percentage}%
            {path.pools.map((pool) => (
                <>
                    <ArrowRightOutlined className="routingDiagramPoolArrow"/>
                    <Pool pool={pool}></Pool> 
                </>
            ))}
        </div>
    )
}

function Pool({pool}: {pool: Pool}) {
    return (
        <div className="routingDiagramPool">
            <img src={pool.tokenFrom.img} alt="assetFromLogo"/>
            <img src={pool.tokenTo.img} alt="assetToLogo"/>
        </div>
    )
}

function RoutingDiagram() {
    return (
        <div className="routingDiagam">
            <h4>Order Routing</h4>
            <ExpandAltOutlined className="routingDiagramExpandIcon"></ExpandAltOutlined>
            {route.map((path) => (
                <Path path={path}></Path>
            ))}
        </div>
    )
}

export default RoutingDiagram