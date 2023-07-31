import { useState } from "react"
import { Input, Popover, Radio, Modal, message } from "antd"
import { ArrowDownOutlined, DownOutlined, SettingOutlined } from "@ant-design/icons"
import tokenList from "../constants/tokenList.json"

function Swap () {

    const [slippage, setSlippage] = useState(0.5)
    const [tokenOneAmount, setTokenOneAmount] = useState(0)
    const [tokenTwoAmount, setTokenTwoAmount] = useState(0)
    const [tokenOne, setTokenOne] = useState(tokenList[0])
    const [tokenTwo, setTokenTwo] = useState(tokenList[1])
    const [isOpen, setIsOpen] = useState(false)
    const [changeToken, setChangeToken] = useState(1)

    function handleSlippage (e: any) {
        setSlippage(e.target.value)
    }

    function changeAmount (e: any) {
        setTokenOneAmount(e.target.value)
    }

    function switchTokens () {
        const temp = tokenOne   
        setTokenOne(tokenTwo)
        setTokenTwo(temp)
    }

    function openModal (token: number) {
        setChangeToken(token)
        setIsOpen(true)
    }

    function modifyToken (index: number) {
        if (changeToken === 1)
            setTokenOne(tokenList[index])
        else
            setTokenTwo(tokenList[index])
        setIsOpen(false)
    }

    function commitSwap () {
    }
    
    const settings = (
        <>
        <div> Slippage Tolerance </div>
        <div>
            <Radio.Group value={slippage} onChange={handleSlippage}>
                <Radio.Button value={0.1}> 0.1 </Radio.Button>
                <Radio.Button value={0.5}> 0.5% </Radio.Button>
                <Radio.Button value={1}> 1% </Radio.Button>
            </Radio.Group>
        </div>
        </>
    )

    return (
        <>
        <Modal open={isOpen} footer={null} onCancel={()=>setIsOpen(false)} title="Select a token">
        <div className="modalContent">
            {tokenList.map((token, index) => {
                return (
                    <div className="tokenChoice" key={index} onClick={() => modifyToken(index)}>
                        <img src={token.img} alt={token.ticker} className="tokenLogo"/>
                        <div className="tokenChoiceNames">
                            <div className="tokenName"> {token.name} </div>
                            <div className="tokenTicker"> {token.ticker} </div>
                        </div>
                    </div>
            )})}
        </div>
        </Modal>
        <div className="tradeBox">
            <div className="tradeBoxHeader">
                <h4> Swap </h4>
                <Popover 
                    content={settings}
                    title="Settings" trigger="click" placement="bottomRight">
                    <SettingOutlined className="cog"/>
                </Popover>
            </div>
            <div className="inputs">
                <Input placeholder="0" value={tokenOneAmount} onChange={changeAmount} />
                <Input placeholder="0" value={tokenTwoAmount} disabled={true} />
                <div className="assetOne" onClick={() => openModal(1)}>
                    <img src={tokenOne.img} alt="assetOneLogo" className="assetLogo"/>
                    {tokenOne.ticker}
                    <DownOutlined />
                </div>
                <div className="switchButton" onClick={switchTokens}>
                    <ArrowDownOutlined className="switchArrow" />
                </div>
                <div className="assetTwo" onClick={() => openModal(2)}>
                    <img src={tokenTwo.img} alt="assetOneLogo" className="assetLogo"/>
                    {tokenTwo.ticker}
                    <DownOutlined />
                </div>
                <button className="swapButton" onClick={commitSwap} disabled={!tokenOneAmount}>Swap</button>
            </div>
        </div>
        </>
    )
}

export default Swap