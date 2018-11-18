var OrDex = artifacts.require("./contracts/OrDex.sol");
var ERC20 = artifacts.require("./contracts/erc20.sol");
var ERC20_2 = artifacts.require("./contracts/erc20_2.sol");


contract('1st OrDex test', async (accounts) => {

  // give account[0] some CatTokens
  it("should put 10 CatToken in the first account", async () => {
     let instance = await ERC20.deployed();
     let balance = await instance.balanceOf.call(accounts[0]);
     assert.equal(balance.valueOf(), 10);
  })

  // give account[1] some CatTokens from account[0]
  it("should transfer 10 CatToken in the second account", async () => {
     let instance = await ERC20.deployed();
     let balance = await instance.transfer(accounts[1], 10);
     let balance_1 = await instance.balanceOf.call(accounts[0]);
     assert.equal(balance_1.valueOf(), 0);
  })

  //give account[0] some DogTokens
  it("should put 20 DogToken in the first account", async () => {
     let instance = await ERC20_2.deployed();
     let balance = await instance.balanceOf.call(accounts[0]);
     assert.equal(balance.valueOf(), 20);
  })

  it("Accounts[1] call contract and approve swap", async () => {
    let instance = await OrDex.deployed();
    let cat_con = await ERC20.deployed();
    let state = await cat_con.approve(OrDex.address, 2,{from:accounts[1]});
    let allowance = await cat_con.allowance.call(accounts[1], OrDex.address,{from:accounts[1]});
    assert.equal(allowance, 2);
  })

  it("Accounts[0] call contract and approve swap", async () => {
    let instance = await OrDex.deployed();
    let dog_con = await ERC20_2.deployed();
    let state = await dog_con.approve(OrDex.address, 4,{from:accounts[0]});
    let allowance = await dog_con.allowance.call(accounts[0], OrDex.address,{from:accounts[0]});
    assert.equal(allowance, 4);
  })

  // 2 cat tokens form accounts[1] for 4 dog tokens from accounts[0]
  it("OrDex Swap", async () => {
    let instance = await OrDex.deployed();
    let dog_con = await ERC20_2.deployed();
    let cat_con = await ERC20.deployed();

    let swap = await instance.swap([accounts[0], accounts[1]], [ERC20_2.address, ERC20.address], [4, 2], [1234, 5678], [1000, 1000]);

    let balance_1 = await dog_con.balanceOf.call(accounts[0],{from:accounts[0]});
    assert.equal(balance_1.valueOf(), 16);

    let balance_2 = await cat_con.balanceOf.call(accounts[1],{from:accounts[1]});
    assert.equal(balance_2.valueOf(), 8);
  })

});
