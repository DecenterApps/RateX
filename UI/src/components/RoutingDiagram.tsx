import { useEffect, useState } from "react"
import tokenList from "../constants/tokenList.json"
import { Token } from "../constants/Interfaces"
import { ArrowRightOutlined, ExpandAltOutlined } from "@ant-design/icons"

interface Pool {
    poolId: string,
    dexId: string
    tokenOne: Token,
    tokenTwo: Token
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
                tokenOne: tokenList[3],
                tokenTwo: tokenList[4]
            },
            {
                dexId: "SushiSwapV2",
                poolId: "0x0000000000000000000000000000000000000000",
                tokenOne: tokenList[4],
                tokenTwo: tokenList[2]
            },
            {
                dexId: "SushiSwapV2",
                poolId: "0x0000000000000000000000000000000000000000",
                tokenOne: tokenList[2],
                tokenTwo: tokenList[5]
            }
        ]
    },
    {
        percentage: 40,
        pools: [
            {
                dexId: "SushiSwapV2",
                poolId: "0x0000000000000000000000000000000000000000",
                tokenOne: tokenList[3],
                tokenTwo: tokenList[4]
            },
            {
                dexId: "SushiSwapV2",
                poolId: "0x0000000000000000000000000000000000000000",
                tokenOne: tokenList[4],
                tokenTwo: tokenList[5]
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
            <img src={pool.tokenOne.img} alt="assetOneLogo"/>
            <img src={pool.tokenTwo.img} alt="assetTwoLogo"/>
        </div>
    )
}

function RoutingDiagram() {
    return (
        <div className="routingDiagam">
            <h4>Order Routing (mock)</h4>
            <ExpandAltOutlined className="routingDiagramExpandIcon"></ExpandAltOutlined>
            {route.map((path) => (
                <Path path={path}></Path>
            ))}
        </div>
    )
}

export default RoutingDiagram