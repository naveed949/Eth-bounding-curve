  
const HDWalletProvider = require('truffle-hdwallet-provider')
const {
  readFileSync
} = require('fs')
const path = require('path')

module.exports = {
  networks: {
    rinkeby: {
      provider: function () {
      //  const mnemonic = readFileSync(path.join(__dirname, 'rinkeby_mnemonic'), 'utf-8')
     
        return new HDWalletProvider('31FD7CA64D288601A03D7CE693F552D33B35A2E29D419720403B23487CD7B526', `https://rinkeby.infura.io/v3/a9f521235df94d829754f89f68101a76`)
      },
      network_id: 4,
      gasPrice: 15000000001,
      skipDryRun: true
    }
  },
  compilers: {
    solc: {
      version: "0.4.24"
    }
  }
}