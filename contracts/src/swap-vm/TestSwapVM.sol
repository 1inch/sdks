pragma solidity ^0.8.30;

import {SwapVM} from "@1inch/swap-vm/SwapVM.sol";

contract TestSwapVM is SwapVM {
    constructor(address aqua, string memory name, string memory version) SwapVM(aqua, name, version) {}
}
