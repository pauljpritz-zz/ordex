import sys
import websockets
import asyncio
from PyQt5.QtWidgets import QApplication, QWidget, QInputDialog, QLineEdit, QVBoxLayout, QHBoxLayout
from PyQt5.QtWidgets import QLabel, QPushButton
from PyQt5.QtCore import pyqtSlot


import requests

ENDPOINT = "http://localhost:3000/offer"


async def connect(address, id):
    async with websockets.connect(address) as websocket:
        websocket.send(id)

        transaction = await websocket.recv()



class App(QWidget):

    def __init__(self):
        super().__init__()
        self.title = 'Ordex Decentralized Exchange'
        self.left = 10
        self.top = 10
        self.width = 840
        self.height = 680
        self.layout = QVBoxLayout()
        self.initUI()

    def initUI(self):
        self.setWindowTitle(self.title)
        self.setLayout(self.layout)
        self.setGeometry(self.left, self.top, self.width, self.height)
        self.setFixedSize(300, 150)
        self.source = self.add_row("source")
        self.target = self.add_row("target")
        self.source_amount = self.add_row("source_amount")
        self.target_amount = self.add_row("target_amount")
        button = QPushButton("Send")
        button.clicked.connect(self.handle_send)
        self.layout.addWidget(button)
        # self.getSource()
        # self.getTarget()
        # self.getSourceAmount()
        # self.getTargetAmount()
        # self.getSignature()

        self.show()

    @pyqtSlot()
    def handle_send(self):
        print(self.source.text())
        print(self.target.text())
        print(self.source_amount.text())
        print(self.target_amount.text())

    def send_request(self):
        r = requests.post(ENDPOINT, json=dict(
            sourceAmount=self.source_amount.text(),
            targetAmount=self.target_amount.text(),
            sourceToken=self.source.text(),
            targetToken=self.target.text(),
            address=self.get_address()
        ))
        if r.status_code == 200:
            pass
            # TODO: show a dialog for success
        else:
            pass
            # TODO: show a failure dialog

    def get_address(self):
        # TODO: do something useful
        return "123467"

    def add_row(self, label_text):
        row_layout = QHBoxLayout()
        row_layout.addWidget(QLabel(label_text))
        line_edit = QLineEdit()
        row_layout.addWidget(line_edit)
        self.layout.addLayout(row_layout)
        return line_edit


    def getSource(self):
        items = ("ETH", "BTC")
        i, okPressed = self.source.getText(self, "Source", "Source currency:", items, 0, False)
        if okPressed:
            print(i)

    def getTarget(self):
        items = ("ETH", "BTC")
        i, okPressed = QInputDialog.getItem(self, "Source", "Source currency:", items, 0, False)
        if okPressed:
            print(i)

    def getTargetAmount(self):
        target_amount, okPressed = QInputDialog.getDouble(self, "Target Amount", "Target Amount", 10, 0, 1000, 10)
        if okPressed:
            print(target_amount)

    def getSourceAmount(self):
        target_amount, okPressed = QInputDialog.getDouble(self, "Target Amount", "Target Amount", 10, 0, 1000, 10)
        if okPressed:
            print(target_amount)

    def getSignature(self):
        text, okPressed = QInputDialog.getText(self, "User signature", "Signature:", QLineEdit.Normal, "")
        if okPressed and text != '':
            print(text)


if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = App()
    sys.exit(app.exec_())


