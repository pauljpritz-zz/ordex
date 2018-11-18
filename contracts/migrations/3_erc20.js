var ERC20 = artifacts.require("./erc20.sol");
var ERC20_2 = artifacts.require("./erc20_2.sol");

module.exports = function(deployer) {
  deployer.deploy(ERC20, "CatToken");
  deployer.deploy(ERC20_2, "DogToken");
};
