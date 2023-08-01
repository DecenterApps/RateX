import { gql } from 'graphql-request';
import { DocumentNode, parse } from 'graphql';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';

type ArbitrumQueries = {
  [key: string]: TypedDocumentNode<any, Record<string, unknown>>;
};

const SushiV2ArbitrumQuery: TypedDocumentNode<any, Record<string, unknown>> = parse(gql`
  {
    pairs {
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
    }
  }
`);

const UniV3ArbitrumQuery: TypedDocumentNode<any, Record<string, unknown>> = parse(gql`
  {
    pools {
      id
      token0 {
        symbol
      }
      token1 {
        symbol
      }
    }
  }
`);

export const arbitrumQueries: ArbitrumQueries = {
  'SushiswapV2': SushiV2ArbitrumQuery,
  'UniswapV3': UniV3ArbitrumQuery,
};
