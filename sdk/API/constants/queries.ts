import { gql } from 'graphql-request';
import { DocumentNode, parse } from 'graphql';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';

type ArbitrumQueries = {
  [key: string]: TypedDocumentNode<any, Record<string, unknown>>;
};

const SushiV2ArbitrumQuery: TypedDocumentNode<any, Record<string, unknown>> = parse(gql`
  {
    pairs (first: 500, orderBy: volumeUSD, orderDirection: desc){
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

const UniV3ArbitrumQuery: TypedDocumentNode<any, Record<string, unknown>> = parse(gql`
{
    liquidityPools(orderDirection: desc, orderBy: cumulativeVolumeUSD) {
      name
      activeLiquidityUSD
      totalLiquidityUSD
      id
      totalLiquidity
      cumulativeVolumeUSD
      activeLiquidity
      inputTokens {
        name
        id
      }
    }
  }
`);

const TraderJoeV2ArbitrumQuery: TypedDocumentNode<any, Record<string, unknown>> = parse(gql`
{
  lbpairs {
    id
    tokenX {
      id
      name
      decimals
      symbol
    }
    tokenY {
      id
      name
      symbol
      decimals
    }
  }
}
`);

export const arbitrumQueries: ArbitrumQueries = {
  'SushiswapV2': SushiV2ArbitrumQuery,
  'UniswapV3': UniV3ArbitrumQuery,
  'TraderJoeV2': TraderJoeV2ArbitrumQuery
};
