// we can group our test based on different functions

const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat") // to be able to deploy using hardhat
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name) // unit tests only run on development chains
    ? describe.skip
    : describe("FundMe", async function () {
          // complete test

          // declaration of variables we need accesible for the test of all the functions
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.utils.parseEther("1") // using ethers is much simpler than having to write 1000000000000000000 to specify 1 ether

          // first we have to deploy the contract from our test
          beforeEach(async function () {
              // deploy our fundme contract using hardhat-deploy
              // for this we have to import it from the package
              // we want to save the deployer of the contract for testing purposes (thats why we declare it outside)
              // dont know why it has to go in between braces and .deployer
              deployer = (await getNamedAccounts()).deployer
              // fixture function allows us to run all of the scripts in the deploy folder with as many tags as we want ("all", "fundme", "mock",...)
              await deployments.fixture(["all"])
              // the function getContract gets the most recent deployment of contract there is in our machine
              // it has two parameters, name of the contract and the signer of such contract
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })
          describe("constructor", async function () {
              // subdivided into several describes that each test individually all of the functions of the contract
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })
          describe("fund", async function () {
              // code a test for each line of the function
              it("Fails if you dont send enough ETH", async function () {
                  // we want it to fail, but we dont want the test to return an error
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!" // the message has to be exactly the same
                  )
              })
              it("Updates the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue }) // we have to hardcode the value of eth sent by passing it as a parametor of thje function fund
                  const response = await fundMe.getAddressToAmountFunded(
                      // mapping of how much eth was funded by each address
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of funder", async function () {
                  // general thinking, try to test that the first instance works, not the "n" instances
                  await fundMe.fund({ value: sendValue }) // the first person doing a fund
                  const funder = await fundMe.getFunder(0) // has to be equal to the first person stored in the funders array
                  assert.equal(funder, deployer)
              })
          })
          describe("withdraw", async function () {
              // before testing the withdraw function we have to guarantee there is money in the funds
              // that is what we do with this beforeEach
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              /** Way of structuring a test:
               *                              1.- Arrange (set the test up)
               *                              2.- Act
               *                              3.- Assert
               */

              it("withdraw ETH from a single funder", async function () {
                  // Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // Act
                  const txnResponse = await fundMe.withdraw()
                  const txnReceipt = await txnResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = txnReceipt // this syntax is used to pull out objects out of another object
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // after act, saving new variables to compare in the assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer) //spends a little it of gas

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString() // important to account for gas loss
                  )
              })
              it("cheaper withdraw ETH from a single funder", async function () {
                  // Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // Act
                  const txnResponse = await fundMe.cheaperWithdraw()
                  const txnReceipt = await txnResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = txnReceipt // this syntax is used to pull out objects out of another object
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // after act, saving new variables to compare in the assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer) //spends a little it of gas

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString() // important to account for gas loss
                  )
              })
              it("withdraw ETH with multiple funders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners() // with get signers we receive a variety of addresses in our local blockchain
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          // since the deployer address was connected to the contract, we have to change this in the for loop
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue }) // once our new address is connected now we can send eth to the fund
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Act (basically the same thing as above)
                  const txnResponse = await fundMe.withdraw()
                  const txnReceipt = await txnResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = txnReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString() // important to account for gas loss
                  )
                  // also make sure that the funders reset properly
                  // the array must be empty
                  await expect(fundMe.getFunder(0)).to.be.reverted
                  // and the mapping must have 0 eth for all of the accounts
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[1]
                  )
                  await expect(
                      fundMeConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner") // it is better to specify what type of revert we should get
              })
              // test to check gas cost of our new function cheaperWithdraw with multiple accoutns
              it("cheaper withdraw ETH with multiple funders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners() // with get signers we receive a variety of addresses in our local blockchain
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          // since the deployer address was connected to the contract, we have to change this in the for loop
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue }) // once our new address is connected now we can send eth to the fund
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Act (basically the same thing as above)
                  const txnResponse = await fundMe.cheaperWithdraw()
                  const txnReceipt = await txnResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = txnReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString() // important to account for gas loss
                  )
                  // also make sure that the funders reset properly
                  // the array must be empty
                  await expect(fundMe.getFunder(0)).to.be.reverted
                  // and the mapping must have 0 eth for all of the accounts
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
          })
      })
