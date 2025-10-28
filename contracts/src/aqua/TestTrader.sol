pragma solidity ^0.8.30;

import {IAqua, IERC20} from "@1inch/aqua/Aqua.sol";
import {IAquaTakerCallback} from "@1inch/aqua/interfaces/IAquaTakerCallback.sol";
import {XYCSwap} from "@1inch/aqua/apps/XYCSwap.sol";

contract TestTrader is IAquaTakerCallback {
    IAqua public immutable AQUA;

    constructor(IAqua _aqua, IERC20[] memory tokens) {
        AQUA = _aqua;
        for (uint256 i = 0; i < tokens.length; i++) {
            tokens[i].approve(address(AQUA), type(uint256).max);
        }
    }

    function swap(
        XYCSwap app,
        XYCSwap.Strategy calldata strategy,
        bool zeroForOne,
        uint256 amountIn
    ) external {
        app.swapExactIn(
            strategy,
            zeroForOne,
            amountIn,
            0,           // amountOutMin (calculate properly in production)
            msg.sender,  // recipient
            ""           // takerData
        );
    }

    function aquaTakerCallback(
        address tokenIn,
        address,  // tokenOut
        uint256 amountIn,
        uint256,  // amountOut
        address maker,
        address app,
        bytes32 strategyHash,
        bytes calldata
    ) external override {
        // Transfer input tokens to complete swap
        AQUA.push(maker, app, strategyHash, tokenIn, amountIn);
    }
}
