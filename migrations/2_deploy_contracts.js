let ProxyFactory = artifacts.require('./ProxyFactory.sol');
let BondingCurve = artifacts.require('./EthPolynomialCurvedToken.sol');

module.exports = function (deployer) {
  deployer.deploy(ProxyFactory);
  deployer.deploy(BondingCurve);
};
