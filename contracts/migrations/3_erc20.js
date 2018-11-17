var erc20_1 = artifacts.require("./erc20.sol");
var erc20_2 = artifacts.require("./erc20.sol");

module.exports = function(deployer) {
  deployer.deploy(erc20_1, "CatToken");
  deployer.deploy(erc20_2, "DogToken");
};
