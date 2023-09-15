import { fetchPoolsData } from "../sdk/swap/graph_communication"

function Token() {
  const checkFetchPoolsData = async () => {
    const res = await fetchPoolsData("0x3082cc23568ea640225c2467653db90e9250aaa0", "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", 5)
    console.log("Res: ", res)
  }

  return (
    <div>
      <h1>Token</h1>
      <button onClick={checkFetchPoolsData}>Check FetchPoolsData</button>
    </div>
  )
}

export default Token
