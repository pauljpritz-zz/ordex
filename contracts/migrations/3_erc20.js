var erc20_1 = artifacts.require("./erc20imp.sol");
var erc20_2 = artifacts.require("./erc20imp.sol");

module.exports = function(deployer) {
  deployer.deploy(erc20_1);
  deployer.deploy(erc20_2);
};
