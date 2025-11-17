pragma solidity ^0.8.30;

import {IMakerHooks} from "@1inch/swap-vm/interfaces/IMakerHooks.sol";

contract TestMakerHooks is IMakerHooks {
    constructor() {}

    event HookCalled(string name, bytes makerData, bytes takerData);

    function call(address target, bytes memory data) external {
        (bool success, bytes memory result) = target.call(data);
        require(success, string(result));
    }

    function preTransferIn(
        address,
        address,
        address,
        address,
        uint256,
        uint256,
        bytes32,
        bytes calldata makerData,
        bytes calldata takerData
    ) external override {
        emit HookCalled("preTransferIn", makerData, takerData);
    }

    function postTransferIn(
        address,
        address,
        address,
        address,
        uint256,
        uint256,
        bytes32,
        bytes calldata makerData,
        bytes calldata takerData
    ) external override {
        emit HookCalled("postTransferIn", makerData, takerData);
    }

    function preTransferOut(
        address,
        address,
        address,
        address,
        uint256,
        uint256,
        bytes32,
        bytes calldata makerData,
        bytes calldata takerData
    ) external override {
        emit HookCalled("preTransferOut", makerData, takerData);
    }

    function postTransferOut(
        address,
        address,
        address,
        address,
        uint256,
        uint256,
        bytes32,
        bytes calldata makerData,
        bytes calldata takerData
    ) external override {
        emit HookCalled("postTransferOut", makerData, takerData);
    }
}
