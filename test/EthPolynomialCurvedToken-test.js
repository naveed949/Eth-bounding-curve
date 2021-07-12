const EthPolynomialCurvedToken = artifacts.require('EthPolynomialCurvedToken')

const BN = require("bn.js")
const ipfsHash = {
  digest: '0x2eb21ce8d9aebc80380d1ceb03a23b044aa42abcfa139560575818d59f02c4ef',
  hashFunction: 18,
  size: 32
}


contract('EthPolynomialCurvedToken', accounts => {
  let polyBondToken1
  const creator = accounts[0]
  const user1 = accounts[1]
  const user2 = accounts[2]
  const slope = 1000;

  before(async () => {
    polyBondToken1 = await EthPolynomialCurvedToken.new()
    await polyBondToken1.initContract('oed curve', 18, 'OCU', 2, slope,ipfsHash.digest,
    ipfsHash.hashFunction,
    ipfsHash.size);
    // await EthPolynomialCurvedToken.at('0xeb8abdba5331c5ac087999367b050fcc08c0eb4b');

  })

  it('Is initiated correcly', async () => {
    const poolBalance = await polyBondToken1.poolBalance.call()
    assert.equal(poolBalance, 0)
    const totalSupply = await polyBondToken1.totalSupply.call()
    assert.equal(totalSupply, 0)
    const exponent = await polyBondToken1.exponent.call()
    assert.equal(exponent, 2)
  })

  describe('Curve integral calulations', async () => {
    // priceToMint is the same as the internal function curveIntegral if
    // totalSupply and poolBalance is zero
    const testWithExponent = async exponent => {
      // const tmpPolyToken = await EthPolynomialCurvedToken.new( 'oed curve', 18, 'OCU', exponent, slope)
      const tmpPolyToken = await EthPolynomialCurvedToken.new()
      await tmpPolyToken.initContract('oed curve', 18, 'OCU', exponent, slope,ipfsHash.digest,
      ipfsHash.hashFunction,
      ipfsHash.size);
      const e = await tmpPolyToken.exponent.call()
      let amount = function (num){
        return ""+(num * 1e18);
      }
      let res
      let jsres
      let last = new BN(0)
      for (let i = 1; i < 5; i ++) {
        res = (await polyBondToken1.priceToMint.call(amount(i))).toString()
      
        assert.isAbove(parseFloat(res), parseFloat(last), 'should calculate curveIntegral correctly ' + i)
        last = res.toString()
        
      }
    }
    it('works with exponent = 1', async () => {
      await testWithExponent(1)
    })
    it('works with exponent = 2', async () => {
      await testWithExponent(2)
    })
    it('works with exponent = 3', async () => {
      await testWithExponent(3)
    })
    it('works with exponent = 4', async () => {
      await testWithExponent(4)
    })
  })

  it('Can mint tokens with ether', async function() {
    let balance = await polyBondToken1.balanceOf(user1)
    assert.equal(balance.toNumber(), 0)
      let amount = ""+(1 * 1e18);
    const priceToMint1 = await polyBondToken1.priceToMint.call(amount)
    let tx = await polyBondToken1.mint(amount, {value: priceToMint1, from: user1})
    assert.equal(tx.logs[0].args.amount, amount, 'amount minted should be ${amount}')
    balance = await polyBondToken1.balanceOf(user1)
    assert.equal(tx.logs[0].args.totalCost.toNumber(), priceToMint1)
    const poolBalance1 = await polyBondToken1.poolBalance.call()
    assert.equal(poolBalance1.toNumber(), priceToMint1.toNumber(), 'poolBalance should be correct')

    const priceToMint2 = await polyBondToken1.priceToMint.call(amount)
    assert.isAbove(priceToMint2.toNumber(), priceToMint1.toNumber())
    tx = await polyBondToken1.mint(amount, {value: priceToMint2, from: user2})
    assert.equal(tx.logs[0].args.amount, amount, 'amount minted should be ${amount}')
    assert.equal(tx.logs[0].args.totalCost.toNumber(), priceToMint2)
    const poolBalance2 = await polyBondToken1.poolBalance.call()
    assert.equal(poolBalance2.toNumber(), priceToMint1.toNumber() + priceToMint2.toNumber(), 'poolBalance should be correct')

    const totalSupply = await polyBondToken1.totalSupply.call()
    assert.equal(totalSupply, 2 * 1e18)

    let didThrow = false
    const priceToMint3 = await polyBondToken1.priceToMint.call(amount)
    try {
      tx = await polyBondToken1.mint(amount, {value: priceToMint3.toNumber() - 1, from: user2})
    } catch (e) {
      didThrow = true
    }
    assert.isTrue(didThrow)
  })

  it('should not be able to burn tokens user dont have', async () => {
    let amount = 2 * 1e18;
    let didThrow = false
    try {
      tx = await polyBondToken1.burn(amount, {from: user2})
    } catch (e) {
      didThrow = true
    }
    assert.isTrue(didThrow)
  })

  it('Can burn tokens and receive ether', async () => {
    const poolBalance1 = await polyBondToken1.poolBalance.call()
    const totalSupply1 = await polyBondToken1.totalSupply.call()

    let amount = ""+(1 * 1e18);
    let reward1 = await polyBondToken1.rewardForBurn.call(amount)
    let tx = await polyBondToken1.burn(amount, {from: user1})
    assert.equal(tx.logs[0].args.amount, amount, "amount burned should be `${amount}`")
    assert.equal(tx.logs[0].args.reward.toNumber(), reward1)
    let balance = await polyBondToken1.balanceOf(user1)
    assert.equal(balance.toNumber(), 0)

    const poolBalance2 = await polyBondToken1.poolBalance.call()
    assert.equal(poolBalance2.toNumber(), poolBalance1.toNumber() - reward1.toNumber())
    const totalSupply2 = await polyBondToken1.totalSupply.call()
    assert.equal(totalSupply2, totalSupply1 - 1e18)

    let reward2 = await polyBondToken1.rewardForBurn.call(amount)
    tx = await polyBondToken1.burn(amount, {from: user2})
    assert.equal(tx.logs[0].args.amount, amount, 'amount burned should be ${amount}')
    assert.equal(tx.logs[0].args.reward.toNumber(), reward2)
    balance = await polyBondToken1.balanceOf(user2)
    assert.equal(balance.toNumber(), 0)
    assert.isBelow(reward2.toNumber(), reward1.toNumber())

    const poolBalance3 = await polyBondToken1.poolBalance.call()
    assert.equal(poolBalance3.toNumber(), 0)
    const totalSupply3 = await polyBondToken1.totalSupply.call()
    assert.equal(totalSupply3, 0)
  })
})
