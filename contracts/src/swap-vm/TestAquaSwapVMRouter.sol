// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1
pragma solidity ^0.8.30;

import {AquaSwapVMRouterDebug} from "@1inch/swap-vm/routers/AquaSwapVMRouterDebug.sol";

contract TestAquaSwapVMRouter is AquaSwapVMRouterDebug {
    constructor(
        address aqua,
        address weth,
        address owner
    ) AquaSwapVMRouterDebug(aqua, weth, owner, "TestAquaSwapVMRouter", "1.0") {}
}
