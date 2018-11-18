import sys
from os import path

import web3
import websockets
import requests
import os
import asyncio
import json


from PyQt5.QtWidgets import QApplication, QWidget, QInputDialog, QLineEdit, QVBoxLayout, QHBoxLayout
from PyQt5.QtWidgets import QLabel, QPushButton, QComboBox, QMessageBox, QDialog, QDialogButtonBox
from PyQt5 import QtWebSockets
from PyQt5.QtCore import pyqtSlot, QUrl
from PyQt5.QtGui import QIntValidator



ENDPOINT = "http://localhost:3000"
WS_ENDPOINT = "ws://localhost:3000"
W3_ENDPOINT = "http://127.0.0.1:7545"



def get_tokens():
    return requests.get(path.join(ENDPOINT, "tokens")).json()


def load_erc20_abi():
    with open("erc20.json") as f:
        return json.load(f)


class TransactionDialog(QDialog):
    def __init__(self, transaction, parent=None):
        super().__init__(parent)
        self.transaction = transaction
        self.initUI()
     
    def initUI(self):
        self.setWindowTitle("Transaction offer received")
        self.setFixedSize(400, 200)
        layout = QVBoxLayout()
        layout.addWidget(QLabel("Source token: {0}".format(self.transaction["source"])))
        layout.addWidget(QLabel("Source amount: {0}".format(self.transaction["sourceAmount"])))
        layout.addWidget(QLabel("Target token: {0}".format(self.transaction["target"])))
        layout.addWidget(QLabel("Target amount: {0}".format(self.transaction["targetAmount"])))

        buttonBox = QDialogButtonBox(QDialogButtonBox.Ok | QDialogButtonBox.Cancel)
        buttonsLayout = QHBoxLayout()
        buttonBox.accepted.connect(self.accept)
        buttonBox.rejected.connect(self.reject)
        buttonsLayout.addWidget(buttonBox)
        layout.addLayout(buttonsLayout)
        self.setLayout(layout)
         
    @classmethod
    def showTransactionDialog(cls, transaction, parent=None):
        c = cls(transaction, parent)
        b = c.exec_()
        return b
        


class App(QWidget):
    def __init__(self, account_number):
        super().__init__()
        self.title = 'Ordex Decentralized Exchange'
        self.layout = QVBoxLayout()
        self.tokens = get_tokens()
        self.w3 = web3.Web3(web3.HTTPProvider(W3_ENDPOINT))
        self.initUI()
        self.ordex_address = os.environ.get("ORDEX_ADDRESS", "0x97a0D266F6DE4669698De2a07714552AEc643717")
        self.erc20_abi = load_erc20_abi()

        self.account = self.w3.personal.listAccounts[account_number]
        self.w3.eth.defaultAccount = self.account
        self.connect_websocket()

    def initUI(self):
        self.setWindowTitle(self.title)
        self.setLayout(self.layout)
        self.setGeometry(10, 10, 840, 680)
        # self.setFixedSize(300, 150)
        self.source = self.add_row("Source token", widget=self.token_combo_box())
        self.target = self.add_row("Target token", widget=self.token_combo_box())
        self.source_amount = self.add_row("Source amount")
        self.source_amount.setValidator(QIntValidator(1, 1_000_000))
        self.target_amount = self.add_row("Target amount")
        self.target_amount.setValidator(QIntValidator(1, 1_000_000))
        button = QPushButton("Send")
        button.clicked.connect(self.handle_send)
        self.layout.addWidget(button)

        self.show()

    def connect_websocket(self):
        self.client = QtWebSockets.QWebSocket("", QtWebSockets.QWebSocketProtocol.Version13, None)
        self.client.error.connect(self.handle_error)

        self.client.open(QUrl(WS_ENDPOINT))
        self.client.connected.connect(self._on_connected)
        self.client.textMessageReceived.connect(self._on_message_received)

    @pyqtSlot()
    def handle_error(self, err):
        print("error", err)

    @pyqtSlot()
    def _on_connected(self):
        message = dict(action="register", args=dict(address=self.account))
        self.client.sendTextMessage(json.dumps(message))

    def _on_message_received(self, text):
        parsed = json.loads(text)
        if parsed["action"] == "requireSignature":
            self.prompt_signature(parsed["args"])
    
    def prompt_signature(self, args):
        res = TransactionDialog.showTransactionDialog(args["transaction"], self)
        if res:
            self.send_signature(args)

    def send_signature(self, args):
        signature = "TODO: generate real signature"
        print(args)
        r = requests.post(self._endpoint("signature"), json=dict(
            signature=signature,
            address=self.account,
            transactionID=args["id"],
        ))
        if r.status_code == 200:
            self.show_success("Transaction accepted", "Your transaction has been accepted and is being processed")
        else:
            self.show_failure("Transaction refused", "Your transaction has been declined")

    @pyqtSlot()
    def handle_send(self):
        self.send_request()

    def send_request(self):
        source_amount = int(self.source_amount.text())
        source_token = self.source.currentText()
        self.approve_transaction(source_token, source_amount)

        r = requests.post(self._endpoint("offer"), json=dict(
            sourceAmount=source_amount,
            targetAmount=int(self.target_amount.text()),
            sourceToken=source_token,
            targetToken=self.target.currentText(),
            address=self.account
        ))

        if r.status_code == 200:
            self.show_success("Order status", "Order has been successfully submitted")
        else:
            self.show_failure("Order status", "Failure submitting order, please try again")
            

    def show_success(self, title, message):
        success = QMessageBox(self)
        success.setText(message)
        success.setWindowTitle(title)
        success.setIcon(QMessageBox.Information)
        success.setStandardButtons(QMessageBox.Ok)
        success.exec_()

    def show_failure(self, title, message):
        failure = QMessageBox(self)
        failure.setText(message)
        failure.setWindowTitle(title)
        failure.setIcon(QMessageBox.Critical)
        failure.setStandardButtons(QMessageBox.Ok)
        failure.exec_()

    def approve_transaction(self, source_token, source_amount):
        address = [v["address"] for v in self.tokens if v["name"] == source_token][0]
        address = self.w3.toChecksumAddress(address)
        contract = self.w3.eth.contract(abi=self.erc20_abi, address=address)
        contract.functions.approve(self.ordex_address, source_amount).call()

    def add_row(self, label_text, widget=None):
        row_layout = QHBoxLayout()
        row_layout.addWidget(QLabel(label_text))
        if widget is None:
            widget = QLineEdit()
        row_layout.addWidget(widget)
        self.layout.addLayout(row_layout)
        return widget

    def token_combo_box(self):
        box = QComboBox()
        box.addItems([v["name"] for v in self.tokens])
        return box

    @staticmethod
    def _endpoint(route):
        return path.join(ENDPOINT, route)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--account-number", default=0, type=int)
    args = parser.parse_args()
    app = QApplication(sys.argv)
    ex = App(args.account_number)
    sys.exit(app.exec_())


