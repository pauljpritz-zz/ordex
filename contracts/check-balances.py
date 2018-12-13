import argparse
import json

import web3

W3_ENDPOINT = "http://127.0.0.1:7545"

parser = argparse.ArgumentParser(prog="check-balances")
parser.add_argument("address")
parser.add_argument("--endpoint", default=W3_ENDPOINT)
args = parser.parse_args()

w3 = web3.Web3(web3.HTTPProvider(args.endpoint))

with open("../frontend/static/erc20.json") as f:
    abi = json.load(f)

contract = w3.eth.contract(abi=abi, address=w3.toChecksumAddress(args.address))
print(contract.functions.balanceOf(w3.personal.listAccounts[1]).call())
