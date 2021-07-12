const ProxyFactory = artifacts.require('ProxyFactory')
const EthPolynomialCurvedToken = artifacts.require('EthPolynomialCurvedToken')

const ipfsHash = {
  digest: '0x2eb21ce8d9aebc80380d1ceb03a23b044aa42abcfa139560575818d59f02c4ef',
  hashFunction: 18,
  size: 32
}

function printData(parent) {
  let contract = web3.eth.contract(parent.abi).at(parent.address);
  let myWeb3 = require('web3');


  myWeb3 = new myWeb3();
  let data = myWeb3.eth.abi.encodeFunctionCall({
        name: 'initContract',
        type: 'function',
        inputs: [{
            type: 'string',
            name: '_name'
        },{
            type: 'uint8',
            name: '_decimals'
        },{
            type: 'string',
            name: '_symbol'
        },{
            type: 'uint8',
            name: '_exponent'
        },{
            type: 'uint32',
            name: '_slope'
        },{
          type: 'bytes32',
          name: '_hash'
        },{
          type: 'uint8',
          uint8: '_hashFunction'
        },{
          type: 'uint8',
          uint8: '_size'
        }
        ]
    }, [
      'slava\'s sweet token',
      '18',
      'nu token',
      '3',
      '1000',
      ipfsHash.digest,
      ipfsHash.hashFunction,
      ipfsHash.size
      ]
    );
  console.log('data ', data);
}


contract('ProxyFactory', accounts => {
  let instance;
  const slope = 1000;
  const address = '0xeb8abdba5331c5ac087999367b050fcc08c0eb4b';
  let parent;
  let deployed;
  let token;
  let token2;

  const user1 = accounts[1]
  const user2 = accounts[2]

  before(async () => {
    instance = await ProxyFactory.new();
    parent = await EthPolynomialCurvedToken.new();
    // printData(parent);
  })


  it('Should create bonding curve correctly', async () => {
    // let data = '0x38d7880d00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000003e80000000000000000000000000000000000000000000000000000000000000004746573740000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000037473740000000000000000000000000000000000000000000000000000000000';
    // let data2 = '0x38d7880d00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000003e80000000000000000000000000000000000000000000000000000000000000013736c617661277320737765657420746f6b656e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000086e7520746f6b656e000000000000000000000000000000000000000000000000';

    let data = '0xd8896f21000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000003e82eb21ce8d9aebc80380d1ceb03a23b044aa42abcfa139560575818d59f02c4ef000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000013736c617661277320737765657420746f6b656e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000086e7520746f6b656e000000000000000000000000000000000000000000000000';

    let tx = await instance.createProxy(parent.address, data);
   // console.log('gas used to deploy contract', tx.receipt.gasUsed);
    console.log('token address ', tx.logs[0].args);

    let deployed = tx.logs[0].args.proxyAddress;
    token = await EthPolynomialCurvedToken.at(deployed);

    tx = await instance.createProxy(parent.address, data);
    deployed = tx.logs[0].args.proxyAddress;
    token2 = await EthPolynomialCurvedToken.at(deployed);

  })

  it('First contract initiated correcly', async () => {
    const name = await token.name.call()
    assert.equal(name, 'slava\'s sweet token')
    const symbol = await token.symbol.call()
    assert.equal(symbol, 'nu token')

    const poolBalance = await token.poolBalance.call()
    assert.equal(poolBalance, 0)
    const totalSupply = await token.totalSupply.call()
    assert.equal(totalSupply, 0)
    const exponent = await token.exponent.call()
    assert.equal(exponent.toNumber(), 3)
    const slope = await token.slope.call()
    assert.equal(slope.toNumber(), 1000)
  })

  it('Second contract initiated correcly', async () => {
    const name = await token2.name.call()
    assert.equal(name, 'slava\'s sweet token')
    const symbol = await token2.symbol.call()
    assert.equal(symbol, 'nu token')
  })

it('Can mint tokens with ether', async function() {
    let balance = await token.balanceOf(user1)
    assert.equal(balance.toNumber(), 0)
    let amount = ""+(1 * 1e18);

    const priceToMint1 = await token.priceToMint.call(amount)
	// console.log(priceToMint1.toNumber());

    let tx = await token.mint(amount, {value: priceToMint1, from: user1})
    assert.equal(tx.logs[0].args.amount, amount, 'amount minted should be 50')
    balance = await token.balanceOf(user1)
    assert.equal(tx.logs[0].args.totalCost.toNumber(), priceToMint1)
    const poolBalance1 = await token.poolBalance.call()
    assert.equal(poolBalance1.toNumber(), priceToMint1.toNumber(), 'poolBalance should be correct')

    const priceToMint2 = await token.priceToMint.call(amount)
    assert.isAbove(priceToMint2.toNumber(), priceToMint1.toNumber())
    tx = await token.mint(amount, {value: priceToMint2, from: user2})
    assert.equal(tx.logs[0].args.amount, amount, 'amount minted should be 50')
    assert.equal(tx.logs[0].args.totalCost.toNumber(), priceToMint2)
    const poolBalance2 = await token.poolBalance.call()
    assert.equal(poolBalance2.toNumber(), priceToMint1.toNumber() + priceToMint2.toNumber(), 'poolBalance should be correct')

    const totalSupply = await token.totalSupply.call()
    assert.equal(totalSupply, amount * 2)

    let didThrow = false
    const priceToMint3 = await token.priceToMint.call(amount)
    try {
      tx = await token.mint(amount, {value: token2.toNumber() - 1, from: user2})
    } catch (e) {
      didThrow = true
    }
    assert.isTrue(didThrow)
  })

  // now this is stored in logs - needs test
  // it('Should be able to save hash', async () => {
  //   const imageHash = await token.imageHash.call();
  //   assert.equal(imageHash[0], ipfsHash.digest);
  //   assert.equal(imageHash[1].toNumber(), ipfsHash.hashFunction);
  //   assert.equal(imageHash[2].toNumber(), ipfsHash.size);
  // })
})
