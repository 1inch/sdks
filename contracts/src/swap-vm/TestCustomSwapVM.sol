// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

pragma solidity 0.8.30;

import {Simulator, SwapVM, AquaOpcodes, Context} from "@1inch/swap-vm/routers/AquaSwapVMRouter.sol";
import {Calldata} from "@1inch/solidity-utils/contracts/libraries/Calldata.sol";

library ArgsBuilder {
    using Calldata for bytes;
    error MisingAllowedTaker();

    function parseAllowedTaker(
        bytes calldata args
    ) internal pure returns (address allowedTaker) {
        allowedTaker = address(
            bytes20(args.slice(0, 20, MisingAllowedTaker.selector))
        );
    }
}

contract TestCustomSwapVM is Simulator, SwapVM, AquaOpcodes {
    error TakerNotAllowed();

    constructor(
        address aqua,
        address weth,
        address owner
    ) SwapVM(aqua, weth, owner, "TestCustomSwapVM", "1.0") AquaOpcodes(aqua) {}

    function _instructions()
        internal
        pure
        override
        returns (
            function(Context memory, bytes calldata) internal[] memory result
        )
    {
        return _opcodes();
    }

    function _opcodes()
        internal
        pure
        virtual
        override
        returns (
            function(Context memory, bytes calldata) internal[] memory result
        )
    {
        function(Context memory, bytes calldata) internal[3]
            memory instructions = [
                _notInstruction,
                _xycSwapXD,
                _onlyAllowedTaker
            ];

        // Efficiently turning sAtatic memory array into dynamic memory array
        // by rewriting _notInstruction with array length, so it's excluded from the result
        uint256 instructionsArrayLength = instructions.length - 1;
        assembly ("memory-safe") {
            result := instructions
            mstore(result, instructionsArrayLength)
        }
    }

    function _onlyAllowedTaker(
        Context memory ctx,
        bytes calldata args
    ) internal {
        address allowedTaker = ArgsBuilder.parseAllowedTaker(args);
        require(ctx.query.taker == allowedTaker, TakerNotAllowed());
    }
}
