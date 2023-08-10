import {useEffect, useState} from "react"
import { checkFetchPoolsData, checkGetPoolIdsForTokenPairs } from "../sdk/testing/fetchPools"
import { call } from "web3/lib/commonjs/eth.exports"

function Token() {
  const callCheckFetchPoolsData = async () => {
    await checkFetchPoolsData()
  }
  const callCheckGetPoolIdsForTokenPairs = async () => {
    await checkGetPoolIdsForTokenPairs()
  }

  return (
    <div>
      <h1>Token</h1>
      <button onClick={callCheckFetchPoolsData}>Call checkFetchPoolsData</button>
      <button onClick={callCheckGetPoolIdsForTokenPairs}>Call checkGetPoolIdsForTokenPairs</button>
    </div>
  )
}

export default Token