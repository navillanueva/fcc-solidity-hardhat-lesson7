const { network } = require("hardhat")
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config") // to import the chains we have saved for development

// what happens when we want to change chains
// when going for localhost or hardhat network we want to use a mock
// if a contract doesnt exist we deploy a minimal version of it for our local testing
// to achieve this we look in the repo of the contract we are implementing and search for a mock one in the test folder inside contracts and import into our source code

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chaindId = network.config.chainId

    if (developmentChains.includes(network.name)) {
        // if statement so we only waste compute power deploying mock contracts when we are working with a development chain
        log("Local network detected! Deploying mocks...")
        await deploy("MockV3Aggregator", {
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER], // look in the github repo to find out what are the arguments of the contract constructor
        })
        log("Mocks deployed!")
        log("-------------------------------------")
    }
}

// with this command we can now specify "yarn hardhat deploy --tags {string}"
// the string value will execute all of the deployment scripts that have that tag

module.exports.tags = ["all", "mocks"]
