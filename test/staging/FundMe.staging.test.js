// this is the last setp in the development journey

const { assert } = require("chai")
const { getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name) // staging test only run on testnets
    ? describe.skip // the question mark is a one-liner if
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          const sendValue = ethers.utils.parseEther("0.1")
          // we dont need the mock contract because we can access the real code (since staging test will be when contract is in a real testnet)
          // in the staging test we are assuming that the contract is already deployed
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })

          it("allows people to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              assert.equal(
                  endingBalance.toString(),
                  ethers.utils.parseEther("0")
              )
          })
      })
