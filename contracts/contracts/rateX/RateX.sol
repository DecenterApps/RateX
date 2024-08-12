// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IDex} from './interfaces/IDex.sol';
import {TransferHelper, IERC20} from './libraries/TransferHelper.sol';
import {Ownable2Step} from '@openzeppelin/contracts/access/Ownable2Step.sol';

/// @title RateX: DEX Aggregator
/// @notice This contract aggregates multiple decentralized exchanges (DEXs) to provide optimal swap routes
/// @dev Alpha version of the contract
contract RateX is Ownable2Step {
  /// @notice Represents a single DEX
  /// @param dexId Unique identifier for the DEX
  /// @param dexAddress Contract address of the DEX
  struct DexType {
    uint32 dexId;
    address dexAddress;
  }

  /// @notice Represents a single swap step in a route
  /// @param data Encoded swap data for the specific DEX
  /// @param dexId Identifier of the DEX to use for this step
  struct SwapStep {
    bytes data;
    uint32 dexId;
  }

  /// @notice Represents a complete swap route
  /// @param swaps Array of swap steps to execute
  /// @param amountIn Amount of input token for this route
  struct Route {
    SwapStep[] swaps;
    uint256 amountIn;
  }

  /// @notice uint256(keccak256('REENTRANCY_GUARD_SLOT')) - 1
  uint256 private constant REENTRANCY_GUARD_SLOT = 10176365415448536267786959035014641849020047300636800306623756021601666631018;

  /// @notice Indicates if the contract is paused
  bool private _paused;

  /// @notice Maps DEX IDs to their contract addresses
  mapping(uint32 => address) public dexes;

  /// @notice Emitted when a swap is executed
  event SwapEvent(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut, address recipient);

  /// @notice Emitted when a new DEX is added
  event DexAdded(uint32 dexId, address dexAddress);

  /// @notice Emitted when a DEX is replaced
  event DexReplaced(uint32 dexId, address oldAddress, address newAddress);

  /// @notice Emitted when a DEX is removed
  event DexRemoved(uint32 dexId);

  /// @notice Emitted when the contract is paused
  event Paused();

  /// @notice Emitted when the contract is unpaused
  event Unpaused();

  /// @notice Thrown when a zero address is provided where a non-zero address is required
  error RateX__ZeroAddress();

  /// @notice Thrown when attempting to add a DEX that already exists
  error RateX__DexAlreadyExists();

  /// @notice Thrown when attempting to interact with a non-existent DEX
  error RateX__DexDoesNotExist();

  /// @notice Thrown when no routes are provided for a swap
  error RateX__NoRoutes();

  /// @notice Thrown when the provided amount in doesn't match the sum of route amounts
  error RateX__AmountInDoesNotMatch();

  /// @notice Thrown when the actual output amount doesn't match the expected amount
  error RateX__AmountOutDoesNotMatch();

  /// @notice Thrown when the output amount is less than the minimum specified
  error RateX__AmountLesserThanMinAmount();

  /// @notice Thrown when a reentrant call is detected
  error RateX__ReentrantCall();

  /// @notice Thrown when trying to execute a function while the contract is paused
  error RateX__Paused();

  /// @notice Thrown when trying to pause an already paused contract
  error RateX__NotPaused();

  /// @notice Thrown when a delegate call to a DEX fails
  error RateX__DelegateCallFailed();

  modifier nonReentrant() {
    bytes4 errorSelector = RateX__ReentrantCall.selector;

    assembly {
      if tload(REENTRANCY_GUARD_SLOT) {
        mstore(0, errorSelector)
        revert(0, 4)
      }
      tstore(REENTRANCY_GUARD_SLOT, 1)
    }
    _;
    assembly {
      tstore(REENTRANCY_GUARD_SLOT, 0)
    }
  }

  modifier whenNotPaused() {
    if (_paused) {
      revert RateX__Paused();
    }
    _;
  }

  modifier whenPaused() {
    if (!_paused) {
      revert RateX__NotPaused();
    }
    _;
  }

  /// @notice Initializes the contract with a set of DEXes
  /// @param _initialDexes Array of initial DEXes to add
  constructor(DexType[] memory _initialDexes) {
    for (uint256 i = 0; i < _initialDexes.length; ++i) {
      if (_initialDexes[i].dexAddress == address(0)) {
        revert RateX__ZeroAddress();
      }
      dexes[_initialDexes[i].dexId] = _initialDexes[i].dexAddress;
    }
  }

  /// @notice Adds a new DEX to the aggregator
  /// @param _dex The DEX to add
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

  /// @notice Replaces an existing DEX with a new one
  /// @param _dex The new DEX information
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

  /// @notice Removes a DEX from the aggregator
  /// @param _dexId The ID of the DEX to remove
  function removeDex(uint32 _dexId) external onlyOwner {
    if (dexes[_dexId] == address(0)) {
      revert RateX__DexDoesNotExist();
    }

    delete dexes[_dexId];

    emit DexRemoved(_dexId);
  }

  /// @notice Withdraws stuck tokens from the contract
  /// @param _token Address of the token to withdraw
  /// @param _recipient Address to receive the withdrawn tokens
  /// @param _amount Amount of tokens to withdraw
  function rescueFunds(address _token, address _recipient, uint256 _amount) external onlyOwner {
    TransferHelper.safeTransfer(_token, _recipient, _amount);
  }

  /// @notice Pauses the contract
  function pause() external onlyOwner {
    _paused = true;
    emit Paused();
  }

  /// @notice Unpauses the contract
  function unpause() external onlyOwner whenPaused {
    _paused = false;
    emit Unpaused();
  }

  /// @notice Checks if the contract is paused
  /// @return paused The current pause status
  function isPaused() external view returns (bool paused) {
    paused = _paused;
  }

  /// @notice Executes a swap across multiple DEXes
  /// @param _foundRoutes Array of routes for the swap
  /// @param _tokenIn Address of the input token
  /// @param _tokenOut Address of the output token
  /// @param _amountIn Total amount of input tokens
  /// @param _quotedAmountWithSlippageProtection Minimum acceptable output amount
  /// @param _recipient Address to receive the output tokens
  /// @param _deadline Timestamp by which the swap must be executed
  /// @return amountOut The amount of output tokens received
  function swap(
    Route[] calldata _foundRoutes,
    address _tokenIn,
    address _tokenOut,
    uint256 _amountIn,
    uint256 _quotedAmountWithSlippageProtection,
    address _recipient,
    uint256 _deadline
  ) external nonReentrant whenNotPaused returns (uint256 amountOut) {
    if (_foundRoutes.length == 0) {
      revert RateX__NoRoutes();
    }

    _checkAmountIn(_foundRoutes, _amountIn);

    TransferHelper.safeTransferFrom(_tokenIn, msg.sender, address(this), _amountIn);

    uint256 balanceBefore = IERC20(_tokenOut).balanceOf(address(this));
    amountOut = _swapForTotalAmountOut(_foundRoutes, _deadline);
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

  function _swapForTotalAmountOut(Route[] calldata _foundRoutes, uint256 _deadline) internal returns (uint256 amountOut) {
    amountOut = 0;
    for (uint256 i = 0; i < _foundRoutes.length; ++i) {
      amountOut += _swapOnOneRoute(_foundRoutes[i], _deadline);
    }
  }

  /// @dev 1 is passed to DEX as amountOutMin as a sanity check because we have a slippage check later
  function _swapOnOneRoute(Route calldata _route, uint256 _deadline) internal returns (uint256 amountOut) {
    amountOut = _route.amountIn;

    for (uint256 i = 0; i < _route.swaps.length; ++i) {
      SwapStep memory swapStep = _route.swaps[i];

      if (dexes[swapStep.dexId] == address(0)) {
        revert RateX__DexDoesNotExist();
      }

      // Delegate call to the DEX contract's swap function
      (bool success, bytes memory result) = dexes[swapStep.dexId].delegatecall(
        abi.encodeWithSelector(IDex.swap.selector, swapStep.data, amountOut, 1, address(this), _deadline)
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
