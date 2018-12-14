import argparse
import json

import web3

W3_ENDPOINT = "http://127.0.0.1:7545"


class W3Manager:
    def __init__(self, w3):
        self.w3 = w3
        with open("../frontend/static/erc20.json") as f:
            self.erc20_abi = json.load(f)

    def show_balance(self, token_address, account_address):
        account_address = self._get_address(account_address)
        token_address = self._get_address(token_address)
        contract = self.get_erc20_contract(token_address)
        print(contract.functions.balanceOf(account_address).call())

    def transfer_tokens(self, token_address, from_address, to_address, amount):
        token_address = self._get_address(token_address)
        from_address = self._get_address(from_address)
        to_address = self._get_address(to_address)
        contract = self.get_erc20_contract(token_address)
        contract.functions.transfer(to_address, amount).transact({"from": from_address})

    def get_erc20_contract(self, address):
        return self.w3.eth.contract(abi=self.erc20_abi, address=address)

    def _get_address(self, raw_address):
        if raw_address.isnumeric():
            return self.w3.personal.listAccounts[int(raw_address)]
        return self.w3.toChecksumAddress(raw_address)


def main():
    parser = argparse.ArgumentParser(prog="check-balances")
    parser.add_argument("--endpoint", default=W3_ENDPOINT)
    subparsers = parser.add_subparsers(dest="command")

    show_balance_parser = subparsers.add_parser("show-balance")
    show_balance_parser.add_argument("token-address")
    show_balance_parser.add_argument("-a", "--account", default="0")

    transfer_parser = subparsers.add_parser("transfer")
    transfer_parser.add_argument("token-address")
    transfer_parser.add_argument("amount", type=int)
    transfer_parser.add_argument("-f", "--from", default="0")
    transfer_parser.add_argument("-t", "--to", default="1")

    args = vars(parser.parse_args())

    w3 = web3.Web3(web3.HTTPProvider(args["endpoint"]))
    manager = W3Manager(w3)

    if args["command"] == "show-balance":
        manager.show_balance(args["token-address"], args["account"])
    elif args["command"] == "transfer":
        manager.transfer_tokens(args["token-address"], args["from"], args["to"], args["amount"])


if __name__ == "__main__":
    main()
