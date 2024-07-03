export function dexIdToUrl(dexId: string, chainId: Number): string {
  const networkName = chainId === 1 ? 'ethereum' : 'arbitrum'
  switch (dexId) {
    case 'CURVE':
      return `https://curve.fi/#/${networkName}/pools?search=ADDRESS`
    case 'SUSHI_V2':
      return `https://www.sushi.com/pool/${chainId}:ADDRESS`
    case 'UNI_V3':
      return `https://app.uniswap.org/explore/pools/${networkName}/ADDRESS`
    case 'CAMELOT':
      return `https://info.camelot.exchange/pair/v2/ADDRESS`
    case 'BALANCER_V2':
      return `https://app.balancer.fi/#/${networkName}/pool/ADDRESS`
  }
  return ''
}
