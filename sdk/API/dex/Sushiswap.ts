import { parse } from 'graphql'
import { gql, request } from 'graphql-request'
import { Queries } from '../Queries'
import { arbitrumEndpoins } from './endpoints';

export class SushiswapQueries implements Queries {

    endpoint = arbitrumEndpoins['SushiswapV2'];
    _first = 100;
    _skip = 0;

    async allPools(first: number = this._first, skip: number = this._skip){
      return await request(this.endpoint, allPoolsFunction(first, skip));
    }

    async matchBothTokens(token0: string, token1:string, first: number = this._first){
      return await request(this.endpoint, matchBothTokensFunction(token0, token1, first))
    }

    async matchOneToken(token: string, first: number = this._first){
      return await request(this.endpoint, matchOneTokenFunction(token, first))
    }
}

function allPoolsFunction(first: number, skip: number){

    return parse(gql`
    {
      pairs (first: ${first}, skip: ${skip}, orderBy: volumeUSD, orderDirection: desc){
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

function matchBothTokensFunction(token0: string, token1:string, first: number){

    return parse(gql`
      {
        pairs(first: ${first}, orderBy: volumeUSD, where: {
          or: [
            {and: [
              { token0: "${token0.toLowerCase()}" },
              { token1: "${token1.toLowerCase()}" }
              ]},
            {
              and: [
              { token0: "${token1.toLowerCase()}" },
              { token1: "${token0.toLowerCase()}" }
              ]
            }
          ]
          
        }) {
        id
        name
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
    `);
}

function matchOneTokenFunction(token: string, first: number){

    return parse(gql`
      {
        pairs(first: ${first}, orderBy: volumeUSD, where: {
          or: [
            { token0: "${token}" },
            { token1: "${token}" }
          ]
        }
        ) {
          id
          name
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
    `); 
}