import { parse } from 'graphql'
import { gql, request } from 'graphql-request'
import { Queries } from '../Queries'
import { arbitrumEndpoins } from './endpoints';

export class SushiswapQueries implements Queries {

    endpoint = arbitrumEndpoins['SushiswapV2'];

    async allPools(first: number, skip: number){
      return await request(this.endpoint, allPoolsFunction(first, skip));
    }

    async matchBothTokens(token1: string, token2:string){
        return await request(this.endpoint, matchBothTokensFunction(token1, token2))
    }

    async matchOneToken(token: string){
        return await request(this.endpoint, matchOneTokenFunction(token))
    }
}

function allPoolsFunction(first: number, skip: number){

    return parse(gql`{
      pairs (first: 100, skip: 0, orderBy: volumeUSD, orderDirection: desc){
        id
        token0 {
          symbol
          id
        }
        token1 {
          symbol
          id
        }
        reserveUSD
        totalSupply
        name
        reserve0
        reserve1
        reserveETH
        volumeUSD
      }
    }
  `);
}

function matchBothTokensFunction(token1: string, token2:string){

    return parse(gql`{
        query {
            pairs(first: 1000, orderBy: volumeUSD, where: {
              or: [
                {and: [
                  { token0: "${token1.toLowerCase()}" },
                  { token1: "${token2.toLowerCase()}" }
                  ]},
                {
                  and: [
                  { token0: "${token2.toLowerCase()}" },
                  { token1: "${token1.toLowerCase()}" }
                  ]
                }
              ]
              
            }) {
            id
            token0 {
                id
                symbol
            }
            token1 {
                id
                symbol
            }
            reserve0
            reserve1
            reserveETH
            reserveUSD
            totalSupply
            }
        }
    }`);
}

function matchOneTokenFunction(token: string){

    return parse(gql`{
        query {
            pairs(first: 1000, orderBy: volumeUSD, where: {
              or: [
                { token0: "${token}" },
                { token1: "${token}" }
              ]
            }) {
              id
              token0 {
                id
                symbol
              }
              token1 {
                id
                symbol
              }
              reserve0
              reserve1
              reserveETH
              reserveUSD
              totalSupply
            }
        }
    }`); 
}