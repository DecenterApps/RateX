import { parse } from 'graphql'
import { gql, request } from 'graphql-request'
import { Queries } from '../Queries'
import { arbitrumEndpoins } from './endpoints';

export class UniswapQueries implements Queries {

    endpoint = arbitrumEndpoins['UniswapV3'];
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
      liquidityPools(first:${first}, skip:${skip}, orderDirection: desc, orderBy: cumulativeVolumeUSD) {
        name
        id
        cumulativeVolumeUSD
        inputTokens {
          symbol
          id
        }
      }
    }
  `);
}

function matchBothTokensFunction(token1: string, token2:string, first: number){

    return parse(gql`{
      liquidityPools(first: ${first}, orderDirection: desc, orderBy: cumulativeVolumeUSD, where: {
        and: [
          {inputTokens_: {id: "${token1.toLowerCase()}"}},
          {inputTokens_: {id: "${token2.toLowerCase()}"}}
        ]
      }
      ) {
        name
        id
        cumulativeVolumeUSD
        inputTokens {
          symbol
          id
        }
      }
    }`);
}

function matchOneTokenFunction(token: string, first: number){

    return parse(gql`{
      liquidityPools(first: ${first}, orderDirection: desc, orderBy: cumulativeVolumeUSD, where: {
          inputTokens_: { id: "${token.toLowerCase()}" }
      }
      ) {
        name
        id
        cumulativeVolumeUSD
        inputTokens {
          symbol
          id
        }
      }
    }`); 
}