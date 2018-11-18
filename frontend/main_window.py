import sys
from os import path

import web3
import websockets
import requests
import os
import asyncio
import json


from PyQt5.QtWidgets import QApplication, QWidget, QInputDialog, QLineEdit, QVBoxLayout, QHBoxLayout
from PyQt5.QtWidgets import QLabel, QPushButton, QComboBox, QMessageBox
from PyQt5.QtCore import pyqtSlot
from PyQt5.QtGui import QIntValidator



ENDPOINT = "http://localhost:3000"
W3_ENDPOINT = "http://127.0.0.1:7545"


async def connect(address, id):
    async with websockets.connect(address) as websocket:
        websocket.send(id)

        transaction = await websocket.recv()


def get_tokens():
    return requests.get(path.join(ENDPOINT, "tokens")).json()


def load_erc20_abi():
    with open("erc20.json") as f:
        return json.load(f)


class App(QWidget):
    def __init__(self):
        super().__init__()
        self.title = 'Ordex Decentralized Exchange'
        self.layout = QVBoxLayout()
        self.tokens = get_tokens()
        self.w3 = web3.Web3(web3.HTTPProvider(W3_ENDPOINT))
        self.account = self.w3.personal.listAccounts[0]
        self.initUI()
        self.ordex_address = os.environ.get("ORDEX_ADDRESS", "0x97a0D266F6DE4669698De2a07714552AEc643717")
        self.erc20_abi = load_erc20_abi()
        self.w3.eth.defaultAccount = self.w3.eth.accounts[0]

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
            success = QMessageBox()
            success.setText("Order has been successfully submitted")
            success.setWindowTitle("Order status")
            success.setIcon(QMessageBox.Information)
            success.setStandardButtons(QMessageBox.Ok)
            success.exec_()
        else:
            failure = QMessageBox()
            failure.setText("Failure submitting order, please try again")
            failure.setWindowTitle("Order status")
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
    app = QApplication(sys.argv)
    ex = App()
    sys.exit(app.exec_())


