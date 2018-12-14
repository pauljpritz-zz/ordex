# contracts

Smart contracts used to perform the token exchanges.

The contracts are developed using the [Truffle Suite][truffle].

## Configuring

If [Ganache][ganache] (or other tool to run Ethereum locally) is
not running on port `7545`, the port can be customized by setting
the `ETH_NETWORK_PORT` environment variable.

## Deploying contracts

Contracts can be deployed by using

```
truffle migrate
```

## Inspecting ERC20 tokens

`contracts-manager.py` provide a few utilities to check and modify
the state of ERC20 tokens.
For example, the following command can be used to get the
balance of the ERC20 token at address `ADDRESS` of the account `1` (`personal.listAccounts[1]`)

```
./contract-manager.py balance ADDRESS -a1
```

See `./contract-manager.py -h` for more information

## Running tests

Tests can be run using

```
truffle test
```

[truffle]: https://truffleframework.com/
[ganache]: https://truffleframework.com/ganache
