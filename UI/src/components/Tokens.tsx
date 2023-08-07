import {useEffect, useState} from "react"
import { checkFetchPoolsData } from "../sdk/testing/fetchPools";
import { call } from "web3/lib/commonjs/eth.exports";

function Token() {
  const callCheckFetchPoolsData = async () => {
    await checkFetchPoolsData()
  }

  return (
    <div>
      <h1>Token</h1>
      <button onClick={callCheckFetchPoolsData}>Call checkFetchPoolsData</button>
    </div>
  );
}

export default Token