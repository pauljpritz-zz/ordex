pragma solidity ^0.4.24;

import "./ierc20.sol";

contract OrDex {

    mapping (address => mapping (uint256 => bool)) addressNonceUsed;

    event Swap(address wallet_1, address wallet_2, IERC20 w1_token, IERC20 w2_token, uint256 w1_amount, uint256 w2_amount);

    function swap(address[2] wallet,
                  IERC20[2] token,
                  uint256[2] amount,
                  uint256[2] nonce,
                  uint256[2] expiry,
                  bytes32[2] r,
                  bytes32[2] s,
                  uint8[2] v) public {

        for (uint8 i = 0; i < 2; i++) {
            bytes32 authorization = keccak256(
                abi.encodePacked(
                    "OrDex",
                    nonce[i],
                    expiry[i],
                    address(token[i]),
                    address(token[1-i]),
                    amount[i],
                    amount[1-i]
                )
            );

            authorization = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", authorization));

            assert(block.number <= expiry[i]);
            assert(ecrecover(authorization, v[i], r[i], s[i]) == wallet[i]);

            assert(addressNonceUsed[wallet[i]][nonce[i]] == false);
            addressNonceUsed[wallet[i]][nonce[i]] = true;

            assert(token[i].transferFrom(wallet[i], wallet[1-i], amount[i]));
            emit Swap(wallet[0], wallet[1], token[0], token[1], amount[0], amount[1]);
        }
    }
}
