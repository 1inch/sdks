// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

pragma solidity 0.8.30;

import {XYCConcentrateArgsBuilder} from "@1inch/swap-vm/instructions/XYCConcentrate.sol";

/// @dev Test harness exposing the pinned XYCConcentrateArgsBuilder math as external calls,
///      so the TypeScript SDK (`concentrate-liquidity-math.ts`) is differentially tested
///      against the contract it mirrors instead of re-deriving the formulas by hand.
contract TestXYCConcentrate {
    function computeBalances(
        uint256 targetL,
        uint256 sqrtPspot,
        uint256 sqrtPmin,
        uint256 sqrtPmax
    ) external pure returns (uint256 bLt, uint256 bGt) {
        return XYCConcentrateArgsBuilder.computeBalances(targetL, sqrtPspot, sqrtPmin, sqrtPmax);
    }

    function computeLiquidityFromAmounts(
        uint256 availableLt,
        uint256 availableGt,
        uint256 sqrtPspot,
        uint256 sqrtPmin,
        uint256 sqrtPmax
    ) external pure returns (uint256 targetL, uint256 actualLt, uint256 actualGt) {
        return XYCConcentrateArgsBuilder.computeLiquidityFromAmounts(
            availableLt,
            availableGt,
            sqrtPspot,
            sqrtPmin,
            sqrtPmax
        );
    }

    function computeLiquidityAndPrice(
        uint256 balanceLt,
        uint256 balanceGt,
        uint256 sqrtPriceMin,
        uint256 sqrtPriceMax
    ) external pure returns (uint256 liquidity, uint256 sqrtPriceSpot) {
        return XYCConcentrateArgsBuilder.computeLiquidityAndPrice(
            balanceLt,
            balanceGt,
            sqrtPriceMin,
            sqrtPriceMax
        );
    }
}
