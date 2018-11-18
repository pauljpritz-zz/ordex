var Kitty = artifacts.require("./Kitty.sol");

module.exports = function(deployer) {
  deployer.deploy(Kitty);
};
