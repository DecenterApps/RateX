import { RateXAbi } from '../abi/RateXAbi'
import { ethers } from 'ethers'

export function CreateRateXContract(chainId: number, signer: ethers.Signer): ethers.Contract {
  const RATE_X_ADDRESS = chainId === 1 ? '0xb9E24094d0899Ca4BF6FC210bD4Ee7DE7bee81CB' : '0x08A3985280560cc8b5f476a36178c2a3d3D866C6'

  return new ethers.Contract(RATE_X_ADDRESS, RateXAbi, signer)
}
