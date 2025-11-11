pragma solidity ^0.8.30;

import {XYCSwap, IAqua} from "@1inch/aqua/src/apps/XYCSwap.sol";

contract TestXYCSwap is XYCSwap {
    constructor(IAqua aqua_) XYCSwap(aqua_) {}
}
