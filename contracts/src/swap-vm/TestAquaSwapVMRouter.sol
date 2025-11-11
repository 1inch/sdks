pragma solidity ^0.8.30;

import {AquaSwapVMRouterDebug} from "@1inch/swap-vm/routers/AquaSwapVMRouterDebug.sol";

contract TestAquaSwapVMRouter is AquaSwapVMRouterDebug {
    constructor(address aqua) AquaSwapVMRouterDebug(aqua, "TestAquaSwapVMRouter", "1.0") {}
}
