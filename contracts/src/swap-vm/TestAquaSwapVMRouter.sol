pragma solidity ^0.8.30;

import {AquaSwapVMRouter} from "@1inch/swap-vm/routers/AquaSwapVMRouter.sol";

contract TestAquaSwapVMRouter is AquaSwapVMRouter {
    constructor(address aqua) AquaSwapVMRouter(aqua, "TestAquaSwapVMRouter", "1.0") {}
}
