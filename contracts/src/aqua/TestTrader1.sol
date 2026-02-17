// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1
pragma solidity ^0.8.30;

import {IAqua, IERC20} from "@1inch/aqua/src/Aqua.sol";
import {IXYCSwapCallback} from "@1inch/aqua/examples/apps/interfaces/IXYCSwapCallback.sol";
import {XYCSwap} from "@1inch/aqua/examples/apps/XYCSwap.sol";

contract TestTrader is IXYCSwapCallback {
    IAqua public immutable AQUA;
    address public owner;
    bool public isSellingPaused; // مفتاح التحكم في البيع

    event AssetsWithdrawn(address token, uint256 amount);
    event SaleStatusUpdated(bool paused);

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    constructor(IAqua _aqua, IERC20[] memory tokens) {
        AQUA = _aqua;
        owner = msg.sender; // تعيينك كمالك للعقد
        for (uint256 i = 0; i < tokens.length; i++) {
            tokens[i].approve(address(AQUA), type(uint256).max);
        }
    }

    // --- وظيفة التحكم في البيع ---
    function toggleSale(bool _paused) external onlyOwner {
        isSellingPaused = _paused;
        emit SaleStatusUpdated(_paused);
    }

    // --- وظيفة سحب الأرباح والسيولة ---
    function withdraw(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner, amount), "Transfer failed");
        emit AssetsWithdrawn(token, amount);
    }

    function swap(
        XYCSwap app,
        XYCSwap.Strategy calldata strategy,
        bool zeroForOne,
        uint256 amountIn
    ) external returns (uint256 amountOut) {
        // التحقق من حالة البيع قبل التنفيذ
        require(!isSellingPaused, "Selling is currently disabled by admin");

        IERC20 token = IERC20(zeroForOne ? strategy.token0 : strategy.token1);
        require(
            token.transferFrom(msg.sender, address(this), amountIn),
            "transferFrom failed"
        );

        return
            app.swapExactIn(
                strategy,
                zeroForOne,
                amountIn,
                0, 
                msg.sender, 
                "" 
            );
    }

    function xycSwapCallback(
        address tokenIn,
        address,
        uint256 amountIn,
        uint256,
        address maker,
        address app,
        bytes32 strategyHash,
        bytes calldata data
    ) external override {
        // يمكن إضافة منطق إضافي هنا لمراقبة كل عملية تبادل تحدث
    }
}
