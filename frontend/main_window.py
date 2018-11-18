import sys
from os import path

import web3
import websockets
import requests
import os
import asyncio


from PyQt5.QtWidgets import QApplication, QWidget, QInputDialog, QLineEdit, QVBoxLayout, QHBoxLayout
from PyQt5.QtWidgets import QLabel, QPushButton, QComboBox, QMessageBox
from PyQt5.QtCore import pyqtSlot
from PyQt5.QtGui import QIntValidator



ENDPOINT = "http://localhost:3000"
W3_ENDPOINT = "http://127.0.0.1:7545"

w3 = web3.Web3(web3.HTTPProvider(W3_ENDPOINT))

async def connect(address, id):
    async with websockets.connect(address) as websocket:
        websocket.send(id)

        transaction = await websocket.recv()


def get_tokens():
    return requests.get(path.join(ENDPOINT, "tokens")).json()


class App(QWidget):
    def __init__(self):
        super().__init__()
        self.title = 'Ordex Decentralized Exchange'
        self.layout = QVBoxLayout()
        self.tokens = get_tokens()
        self.account = w3.personal.listAccounts[0]
        self.initUI()
        self.ordex_address = os.environ.get("ORDEX_ADDRESS")

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
        print(self.source.currentText())
        print(self.target.currentText())
        print(self.source_amount.text())
        print(self.target_amount.text())

    def send_request(self):
        self.approve_transaction(self.source.text())

        r = requests.post(self._endpoint("offer"), json=dict(
            sourceAmount=int(self.source_amount.text()),
            targetAmount=int(self.target_amount.text()),
            sourceToken=self.source.currentText(),
            targetToken=self.target.currentText(),
            address=self.account
        ))

        if r.status_code == 200:
            success = QMessageBox(title="Order status", text="Order has been successfully submitted")
            success.setIcon(QMessageBox.Information)
            success.setStandardButtons(QMessageBox.Ok)
            success.exec_()
        else:
            failure = QMessageBox(title="Order status"., text="Failure submitting order, please try again")
            failure.setIcon(QMessageBox.Critical)
            failure.setStandardButtons(QMessageBox.Ok)
            failure.exec_()


    def approve_transaction(self, amount):
        try:
            
            return True
        except:
            return False

    def add_row(self, label_text, widget=None):
        row_layout = QHBoxLayout()
        row_layout.addWidget(QLabel(label_text))
        if widget is None:
            widget = QLineEdit()
        row_layout.addWidget(widget)
        self.layout.addLayout(row_layout)
        return widget

    @staticmethod
    def _endpoint(route):
        return path.join(ENDPOINT, route)


if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = App()
    sys.exit(app.exec_())


