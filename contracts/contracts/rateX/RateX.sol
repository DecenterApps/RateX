// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './interfaces/IDex.sol';
import './libraries/TransferHelper.sol';
import '@openzeppelin/contracts/access/Ownable2Step.sol';

///@title Main contract for RateX dex aggregator
///@notice This contract aggregates multiple dexes
///and it is the only contract users directly interact with
///@dev This is the first version of the contract, it does not have any optimizations
contract RateX is Ownable2Step {
  ///@notice Struct for single dex
  struct DexType {
    uint32 dexId;
    address dexAddress;
  }

  ///@notice Struct for executing single swap
  ///@param poolId Address of the pool we are swapping through
  ///@dev we will get amount in for swap from route
  struct SwapStep {
    address poolId;
    address tokenIn;
    address tokenOut;
    uint32 dexId;
  }

  ///@notice Single route for swap
  ///@param swaps Array of SwapStep structs
  ///@param amountIn Amount of tokenIn for swap
  ///@dev We can determine amountOut by executing swaps from swaps array
  struct Route {
    SwapStep[] swaps;
    uint256 amountIn;
  }

  bool private locked;

  ///@notice Mapping of dexId to dexAddress
  mapping(uint32 => address) public dexes;

  ///@notice Event emitted when swap is executed
  event SwapEvent(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut, address recipient);

  ///@notice Event emitted when new dex is added
  event DexAdded(uint32 dexId, address dexAddress);

  ///@notice Event emitted when dex is replaced
  event DexReplaced(uint32 dexId, address oldAddress, address newAddress);

  ///@notice Event emitted when dex is removed
  event DexRemoved(uint32 dexId);

  ///@notice Error thrown when provided address is zero address
  error RateX__ZeroAddress();

  ///@notice Error thrown when dex already exists
  error RateX__DexAlreadyExists();

  ///@notice Error thrown when dex does not exist
  error RateX__DexDoesNotExist();

  ///@notice Error thrown when routes length is 0
  error RateX__NoRoutes();

  ///@notice Error thrown when amount in does not match
  error RateX__AmountInDoesNotMatch();

  ///@notice Error thrown when amount out does not match
  error RateX__AmountOutDoesNotMatch();

  ///@notice Error thrown when amount is below slippage protection
  error RateX__AmountLesserThanMinAmount();

  ///@notice Error thrown when reentrant call is detected
  error RateX__ReentrantCall();

  ///@notice Error thrown when delegate call failed
  error RateX__DelegateCallFailed();

  modifier nonReentrant() {
    if (locked) {
      revert RateX__ReentrantCall();
    }
    locked = true;
    _;
    locked = false;
  }

  ///@dev we have predefined dexes to add
  constructor(DexType[] memory _initialDexes) {
    for (uint256 i = 0; i < _initialDexes.length; ++i) {
      if (_initialDexes[i].dexAddress == address(0)) {
        revert RateX__ZeroAddress();
      }
      dexes[_initialDexes[i].dexId] = _initialDexes[i].dexAddress;
    }
  }

  ///@notice Function for adding new dex, only owner can call it
  ///@dev Address of new dex should implement IDex interface
  function addDex(DexType memory _dex) external onlyOwner {
    if (_dex.dexAddress == address(0)) {
      revert RateX__ZeroAddress();
    }
    if (dexes[_dex.dexId] != address(0)) {
      revert RateX__DexAlreadyExists();
    }

    dexes[_dex.dexId] = _dex.dexAddress;

    emit DexAdded(_dex.dexId, _dex.dexAddress);
  }

  ///@notice Function for replacing existing dex, only owner can call it
  ///@dev Address of new dex should implement IDex interface
  /// think later about how to notify users if new dex is replaced
  /// and if they can vote for that
  function replaceDex(DexType memory _dex) external onlyOwner {
    if (_dex.dexAddress == address(0)) {
      revert RateX__ZeroAddress();
    }
    address oldAddress = dexes[_dex.dexId];
    if (oldAddress == address(0)) {
      revert RateX__DexDoesNotExist();
    }

    dexes[_dex.dexId] = _dex.dexAddress;

    emit DexReplaced(_dex.dexId, oldAddress, _dex.dexAddress);
  }

  ///@notice Function for removing existing dex, only owner can call it
  ///@dev To save gas costs, this function will not preserve order of supportedDexes array
  /// Same as replacement and adding, think about how users should be notified
  function removeDex(uint32 _dexId) external onlyOwner {
    if (dexes[_dexId] == address(0)) {
      revert RateX__DexDoesNotExist();
    }

    delete dexes[_dexId];

    emit DexRemoved(_dexId);
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
  ) external nonReentrant returns (uint256 amountOut) {
    if (_foundRoutes.length == 0) {
      revert RateX__NoRoutes();
    }

    _checkAmountIn(_foundRoutes, _amountIn);

    TransferHelper.safeTransferFrom(_tokenIn, msg.sender, address(this), _amountIn);

    uint256 balanceBefore = IERC20(_tokenOut).balanceOf(address(this));
    amountOut = _swapForTotalAmountOut(_foundRoutes);
    uint256 balanceAfter = IERC20(_tokenOut).balanceOf(address(this));

    if (balanceAfter - balanceBefore != amountOut) {
      revert RateX__AmountOutDoesNotMatch();
    }

    if (amountOut < _quotedAmountWithSlippageProtection) {
      revert RateX__AmountLesserThanMinAmount();
    }

    TransferHelper.safeTransfer(_tokenOut, _recipient, amountOut);

    emit SwapEvent(_tokenIn, _tokenOut, _amountIn, amountOut, _recipient);
  }

  function _swapForTotalAmountOut(Route[] calldata _foundRoutes) internal returns (uint256 amountOut) {
    amountOut = 0;
    for (uint256 i = 0; i < _foundRoutes.length; ++i) {
      amountOut += _swapOnOneRoute(_foundRoutes[i]);
    }
  }

  function _swapOnOneRoute(Route calldata _route) internal returns (uint256 amountOut) {
    amountOut = _route.amountIn;

    for (uint256 i = 0; i < _route.swaps.length; ++i) {
      SwapStep memory swapStep = _route.swaps[i];

      if (dexes[swapStep.dexId] == address(0)) {
        revert RateX__DexDoesNotExist();
      }

      // Delegate call to the DEX contract's swap function
      (bool success, bytes memory result) = dexes[swapStep.dexId].delegatecall(
        abi.encodeWithSignature(
          'swap(address,address,address,uint256,uint256,address)',
          swapStep.poolId,
          swapStep.tokenIn,
          swapStep.tokenOut,
          amountOut,
          0,
          address(this)
        )
      );

      if (!success) {
        revert RateX__DelegateCallFailed();
      }
      amountOut = abi.decode(result, (uint256));
    }
  }

  function _checkAmountIn(Route[] calldata _foundRoutes, uint256 _amountIn) private pure {
    uint256 totalAmountIn = 0;
    for (uint256 i = 0; i < _foundRoutes.length; ++i) {
      totalAmountIn += _foundRoutes[i].amountIn;
    }
    if (totalAmountIn != _amountIn) {
      revert RateX__AmountInDoesNotMatch();
    }
  }
}
