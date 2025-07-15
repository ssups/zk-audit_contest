// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract Entry {
    function simulate(address targetContract, address exploitContract, bytes calldata data)
        external
        payable
        returns (bool)
    {
        uint256 beforeBalance = targetContract.balance;

        (bool success,) = exploitContract.call{value: msg.value}(data);
        if (!success) return false;

        uint256 afterBalance = targetContract.balance;
        return beforeBalance > afterBalance;
    }
}
