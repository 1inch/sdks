// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1
pragma solidity ^0.8.30;

import {XYCSwap, IAqua} from "@1inch/aqua/examples/apps/XYCSwap.sol";

contract TestXYCSwap is XYCSwap {
    constructor(IAqua aqua_) XYCSwap(aqua_) {}
}
