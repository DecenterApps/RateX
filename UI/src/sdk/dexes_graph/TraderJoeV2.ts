import { parse } from 'graphql';
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality, PoolInfo } from '../DEXGraphFunctionality';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';

export default class TraderJoeV2 implements DEXGraphFunctionality {

  endpoint: string = "https://api.thegraph.com/subgraphs/name/traderjoe-xyz/joe-v2-arbitrum"

  static initialize(): DEXGraphFunctionality {
    return new TraderJoeV2()
  }

  async topPools(numPools: number): Promise<PoolInfo[]> {
    
    const poolsInfo: PoolInfo[] = []
    const result = await request(this.endpoint, topPoolsFunction(numPools));
    result.pairs.forEach((pair: any) => {
      poolsInfo.push({
        poolId: pair.id,
        dexId: 'TraderJoeV2',
        token0: pair.tokenX.id,
        token1: pair.tokenY.id
      })
    })

    return poolsInfo
  }

  async matchBothTokens(token1: string, token2: string, first: number): Promise<PoolInfo[]> {
    
    const poolsInfo: PoolInfo[] = []
    const result = await request(this.endpoint, matchBothTokensFunction(token1, token2, first));
    result.pairs.forEach((pair: any) => {
      poolsInfo.push({
        poolId: pair.id,
        dexId: 'TraderJoeV2',
        token0: pair.tokenX.id,
        token1: pair.tokenY.id
      })
    })

    return poolsInfo
  }

  async matchOneToken(token: string, first: number): Promise<PoolInfo[]>  {
    
    const poolsInfo: PoolInfo[] = []
    const result = await request(this.endpoint, matchOneTokenFunction(token, first));
    result.pairs.forEach((pair: any) => {
      poolsInfo.push({
        poolId: pair.id,
        dexId: 'TraderJoeV2',
        token0: pair.tokenX.id,
        token1: pair.tokenY.id
      })
    })

    return poolsInfo
  }
}

function topPoolsFunction(first: number): TypedDocumentNode<any, Record<string, unknown>> {

    return parse(gql`
    {
      lbpairs(orderBy: volumeUSD, orderDirection: desc, first: ${first}){
        id
        name
        tokenX {
          id
          symbol
          name
          totalSupply
          decimals
        }
        tokenY {
          id
          symbol
          name
          totalSupply
          decimals
        }
        totalValueLockedUSD
      }
    }
  `);
}

function matchBothTokensFunction(token1: string, token2:string, first:number): TypedDocumentNode<any, Record<string, unknown>>{

    return parse(gql`{
      lbpairs(first: ${first}, orderBy: volumeUSD, orderDirection: desc, where: {
        or: [
          {
            and: [
              { tokenX_: "${token1.toLowerCase()}" },
              { tokenY_: "${token2.toLowerCase()}" }
            ]
          },
          {
            and: [
              { tokenX_: "${token2.toLowerCase()}" },
              { tokenY_: "${token1.toLowerCase()}" }
            ]
          }
        ]
      }) {
        id
        name
        tokenX {
          id
          symbol
          name
          totalSupply
          decimals
        }
        tokenY {
          id
          symbol
          name
          totalSupply
          decimals
        }
        totalValueLockedUSD
      }
    }`);
}

function matchOneTokenFunction(token: string, first: number): TypedDocumentNode<any, Record<string, unknown>> {
    
    return parse(gql`{
      lbpairs(first: ${first}, orderBy: volumeUSD, orderDirection: desc, where: {
        or: [
          { tokenX_: "${token.toLowerCase()}" },
          { tokenY_: "${token.toLowerCase()}" }
        ]
      }) {
        id
        name
        tokenX {
          id
          symbol
          name
          totalSupply
          decimals
        }
        tokenY {
          id
          symbol
          name
          totalSupply
          decimals
        }
        totalValueLockedUSD
      }
    }`); 
}
