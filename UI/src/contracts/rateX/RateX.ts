import { RateXAbi } from '../abi/RateXAbi'
import { ethers } from 'ethers'

export function CreateRateXContract(chainId: number, signer: ethers.Signer): ethers.Contract {
  const RATE_X_ADDRESS = chainId === 1 ? '0xAC64cF5B37124e62Ad716e664faF711Bd0882056' : '0x08A3985280560cc8b5f476a36178c2a3d3D866C6'

  return new ethers.Contract(RATE_X_ADDRESS, RateXAbi, signer)
}
