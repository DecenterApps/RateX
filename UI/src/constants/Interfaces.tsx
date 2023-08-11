import { type } from 'os'

interface Oracle {
  ticker: string
  address: {
    [key: string]: string
  }
  ABI: any
}

interface OracleData {
  oracles: Oracle[]
}

interface Token {
  ticker: string
  img: string
  name: string
  address: {
    [key: string]: string
  }
  decimals: number
}

interface TokenData {
  tokens: Token[]
}

export type { Oracle, OracleData, Token, TokenData }
