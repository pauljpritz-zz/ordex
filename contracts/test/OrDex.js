const OrDex = artifacts.require("./OrDex.sol");
const cat = artifacts.require("./ERC20.sol");
const dog = artifacts.require("./ERC20_2.sol");
const utils = require('../../backend/lib/utils');

const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const { assert } = chai;


function sign(address, message) {
  return new Promise((resolve, reject) => {
    web3.eth.sign(address, message, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}


contract('1st OrDex test', async (accounts) => {

  function makeTransaction() {
    return {
      addresses: [accounts[0], accounts[1]],
      tokens: [dog.address, cat.address],
      amounts: [4, 2],
      nonces: [1234, 5678],
      expiries: [1000, 1000]
    };
  }

  async function computeSignatures(transaction) {
    const firstTransaction = utils.formatTransaction(transaction, 0);
    const secondTransaction = utils.formatTransaction(transaction, 1);
    const firstStringToSign = utils.makeStringToSign(firstTransaction);
    const secondStringToSign = utils.makeStringToSign(secondTransaction);

    const signatures = await Promise.all([
      sign(accounts[0], firstStringToSign),
      sign(accounts[1], secondStringToSign)
    ]);

    return utils.splitSignatures(signatures);
  }

  async function invokeOrdex(instance, transaction) {
    const [r, s, v] = await computeSignatures(transaction);

    return instance.swap(
      transaction.addresses,
      transaction.tokens,
      transaction.amounts,
      transaction.nonces,
      transaction.expiries,
      r, s, v
    );
  }

  // give account[0] some CatTokens
  it("should put 10 CatToken in the first account", async () => {
     const instance = await cat.deployed();
     const balance = await instance.balanceOf.call(accounts[0]);
     assert.equal(balance.valueOf(), 10);
  })

  // give account[1] some CatTokens from account[0]
  it("should transfer 10 CatToken in the second account", async () => {
     const instance = await cat.deployed();
     await instance.transfer(accounts[1], 10);
     const balance_1 = await instance.balanceOf.call(accounts[0]);
     assert.equal(balance_1.valueOf(), 0);
  })

  //give account[0] some DogTokens
  it("should put 20 DogToken in the first account", async () => {
     const instance = await dog.deployed();
     const balance = await instance.balanceOf.call(accounts[0]);
     assert.equal(balance.valueOf(), 20);
  })

  it("Accounts[1] call contract and approve swap", async () => {
    await OrDex.deployed();
    const catContract = await cat.deployed();
    await catContract.approve(OrDex.address, 2, { from: accounts[1] });
    const allowance = await catContract.allowance.call(accounts[1], OrDex.address,{ from: accounts[1] });
    assert.equal(allowance, 2);
  })

  it("Accounts[0] call contract and approve swap", async () => {
    const dogContract = await dog.deployed();
    await dogContract.approve(OrDex.address, 4, { from: accounts[0] });
    const allowance = await dogContract.allowance.call(accounts[0], OrDex.address, { from:accounts[0] });
    assert.equal(allowance, 4);
  })

  // 2 cat tokens form accounts[1] for 4 dog tokens from accounts[0]
  it("OrDex Swap", async () => {
    const instance = await OrDex.deployed();
    const dogContract = await dog.deployed();
    const catContract = await cat.deployed();

    const transaction = makeTransaction();
    await invokeOrdex(instance, transaction);

    const dogBalance = await dogContract.balanceOf.call(accounts[0],{ from:accounts[0] });
    assert.equal(dogBalance.valueOf(), 16);

    const catBalance = await catContract.balanceOf.call(accounts[1], { from:accounts[1] });
    assert.equal(catBalance.valueOf(), 8);
  });

  it('should fail when called twice with same nonce', async () => {
    const instance = await OrDex.deployed();
    const dogContract = await dog.deployed();
    const catContract = await cat.deployed();

    await dogContract.approve(OrDex.address, 4, { from: accounts[0] });
    await catContract.approve(OrDex.address, 2, { from: accounts[1] });

    const dogAllowance = await dogContract.allowance.call(accounts[0], OrDex.address, { from: accounts[0] });
    assert.equal(dogAllowance, 4);
    const catAllowance = await catContract.allowance.call(accounts[1], OrDex.address, { from: accounts[1] });
    assert.equal(catAllowance, 2);

    const dogBalance = await dogContract.balanceOf.call(accounts[0], { from: accounts[0] });
    assert.isAtLeast(parseInt(dogBalance, 10), 4);

    const catBalance = await catContract.balanceOf.call(accounts[1], { from: accounts[1] });
    assert.isAtLeast(parseInt(catBalance, 10), 2);

    const transaction = makeTransaction();

    return assert.isRejected(invokeOrdex(instance, transaction));
  });

});
