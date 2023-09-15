// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IDex.sol";
import "./libraries/TransferHelper.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

///@title Main contract for RateX dex aggregator
///@notice This contract aggregates multiple dexes
///and it is only contract users directly interacts with
///@dev This is first version of the contract, it does not have any optimizations
contract RateX is Ownable {

    ///@notice Event emitted when swap is executed
    event SwapEvent(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address recipient
    );

    ///@notice Event emitted when new dex is added
    event DexAdded(string dexId, address dexAddress);

    ///@notice Event emitted when dex is replaced
    event DexReplaced(string dexId, address oldAddress, address newAddress);

    ///@notice Event emitted when dex is removed
    event DexRemoved(string dexId);

    ///@notice Struct for single dex
    struct DexType {
        string dexId;
        address dexAddress;
    }

    ///@notice Struct for executing single swap
    ///@param poolId Address of the pool we are swapping through
    ///@dev we will get amount in for swap from route
    struct SwapStep {
        address poolId;
        address tokenIn;
        address tokenOut;
        string dexId;
    }

    ///@notice Single route for swap
    ///@param swaps Array of SwapStep structs
    ///@param amountIn Amount of tokenIn for swap
    ///@dev We can determine amountOut by executing swaps from swaps array
    struct Route {
        SwapStep[] swaps;
        uint256 amountIn;
    }

    ///@notice Mapping of dexId to dexAddress
    mapping(string => address) public dexes;

    ///@notice Array of supported dexes
    DexType[] public supportedDexes;

    bool private locked;

    modifier noReentrancy() {
        require(!locked, "No reentrancy");
        locked = true;
        _;
        locked = false;
    }

    ///@dev we have predefined dexes to add
    constructor(DexType[] memory _initialDexes) {
        for (uint256 i = 0; i < _initialDexes.length; ++i) {
            supportedDexes.push(
                DexType({
                    dexId: _initialDexes[i].dexId,
                    dexAddress: _initialDexes[i].dexAddress
                })
            );
        }

        for (uint256 i = 0; i < _initialDexes.length; ++i) {
            dexes[_initialDexes[i].dexId] = _initialDexes[i].dexAddress;
            supportedDexes[i] = _initialDexes[i];
        }
    }

    ///@notice Function for adding new dex, only owner can call it
    ///@dev Address of new dex should implement IDex interface
    function addDex(DexType memory _dex) external onlyOwner {
        require(dexes[_dex.dexId] == address(0), "Dex already exists");
        dexes[_dex.dexId] = _dex.dexAddress;
        supportedDexes.push(_dex);

        emit DexAdded(_dex.dexId, _dex.dexAddress);
    }

    ///@notice Function for replacing existing dex, only owner can call it
    ///@dev Address of new dex should implement IDex interface
    /// think later about how to notify users if new dex is replaced
    /// and if they can vote for that
    function replaceDex(DexType memory _dex) external onlyOwner {
        require(dexes[_dex.dexId] != address(0), "Dex does not exist");

        address oldAddress = dexes[_dex.dexId];
        dexes[_dex.dexId] = _dex.dexAddress;

        for (uint256 i = 0; i < supportedDexes.length; ++i) {
            if (keccak256(abi.encodePacked(supportedDexes[i].dexId)) == keccak256(abi.encodePacked(_dex.dexId))) {
                supportedDexes[i] = _dex;
            }
        }

        emit DexReplaced(_dex.dexId, oldAddress, _dex.dexAddress);
    }

    ///@notice Function for removing existing dex, only owner can call it
    ///@dev To save gas costs, this function will not preserve order of supportedDexes array
    /// Same as replacement and adding, think about how users should be notified
    function removeDex(string memory _dexId) external onlyOwner {
        require(dexes[_dexId] != address(0), "Dex does not exist");
        delete dexes[_dexId];

        DexType memory forRemoval;

        for (uint256 i = 0; i < supportedDexes.length; ++i) {
            if (keccak256(abi.encodePacked(supportedDexes[i].dexId)) == keccak256(abi.encodePacked(_dexId))) {
                forRemoval = supportedDexes[i];
                supportedDexes[i] = supportedDexes[supportedDexes.length - 1];
                supportedDexes[supportedDexes.length - 1] = forRemoval;
            }
        }

        supportedDexes.pop();

        emit DexRemoved(_dexId);
    }

    ///@notice Function for getting all supported dexes
    function getSupportedDexes() external view returns(DexType[] memory) {
        return supportedDexes;
    }

    ///@notice main function for executing swap
    ///@param _foundRoutes Array of routes for swap
    ///@param _tokenIn Address of token we are swapping from
    ///@param _tokenOut Address of token we are swapping to
    ///@param _amountIn Amount of tokenIn for swap
    ///@param _quotedAmountWithSlippageProtection min amount of tokenOut we want to get
    ///@param _recipient Address of recipient
    ///@return amountOut Amount of tokenOut we got
    ///@dev Right now we don't have any optimizations for gas costs and calldata size
    function swap(
        Route[] calldata _foundRoutes,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _quotedAmountWithSlippageProtection,
        address _recipient
    )
    external noReentrancy returns(uint256 amountOut)
    {
        require(_foundRoutes.length > 0, "No routes in split route");

        checkAmountIn(_foundRoutes, _amountIn);

        TransferHelper.safeTransferFrom(_tokenIn, msg.sender, address(this), _amountIn);

        uint256 balanceBefore = IERC20(_tokenOut).balanceOf(address(this));
        amountOut = swapForTotalAmountOut(_foundRoutes);
        uint256 balanceAfter = IERC20(_tokenOut).balanceOf(address(this));

        require(balanceAfter - balanceBefore == amountOut, "Amount out does not match");

        require(amountOut >= _quotedAmountWithSlippageProtection, "Amount lesser than min amount");

        TransferHelper.safeTransfer(_tokenOut, _recipient, amountOut);

        emit SwapEvent(_tokenIn, _tokenOut, _amountIn, amountOut, _recipient);
    }

    function checkAmountIn(Route[] calldata _foundRoutes, uint256 _amountIn) private pure {
        uint256 totalAmountIn = 0;
        for (uint256 i = 0; i < _foundRoutes.length; ++i) {
            totalAmountIn += _foundRoutes[i].amountIn;
        }
        require(totalAmountIn == _amountIn, "Amount in does not match");
    }

    function swapForTotalAmountOut(Route[] calldata _foundRoutes)
    internal returns(uint256 amountOut)
    {
        amountOut = 0;
        for (uint256 i = 0; i < _foundRoutes.length; ++i) {
            amountOut += swapOnOneRoute(_foundRoutes[i]);
        }
    }

    function swapOnOneRoute(Route calldata _route)
        internal returns(uint256 amountOut)
    {
        amountOut = _route.amountIn;

        for (uint256 i = 0; i < _route.swaps.length; ++i) {
            SwapStep memory swapStep = _route.swaps[i];

            require(dexes[swapStep.dexId] != address(0), "Dex does not exist");

            TransferHelper.safeApprove(swapStep.tokenIn, dexes[swapStep.dexId], amountOut);

            amountOut = IDex(dexes[swapStep.dexId]).swap(
                swapStep.poolId,
                swapStep.tokenIn,
                swapStep.tokenOut,
                amountOut,
                0,
                address(this)
            );
        }
    }
}
