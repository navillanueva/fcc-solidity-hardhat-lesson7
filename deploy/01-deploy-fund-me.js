// all of the deployment files inside the deploy folder get executed when we run the command "yarn hardhat deploy"
// this is why we number the files, so that they deploy in the order we want them to
// for now, we only want to deploy one contract (FundMe.sol) but later on this will lead to better code organization

// THIS DEPLOYMENT SCRIPT ALLOWS US TO SWITCH BETWEEN LOCAL AND TESTNET NETWORKS WITHOUT HAVING TO HARDCODE ANYTHING
// TO ADD NEW NETWORK WE JUST HAVE TO ADD IT TO hardhat.config.js AND helper-hardhat-config.js

const { network, getNamedAccounts, deployments } = require("hardhat")

const { networkConfig, developmentChains } = require("../helper-hardhat-config") // importing the network configurations

const { verify } = require("../utils/verify") // importing verify function from the utils folder

/**
 *  Normally our deploy code was organized the following way:
 *
 *              // imports
 *                  [code...]
 *              // main function
 *                  [code...]
 *              // calling of main function
 *                  [code...]
 *
 *  Now with the deploy command we dont need to declare a main function or call the main function
 *  When we run hardhat deploy it will run a function that we specify in this script in module.exports
 *
 *  There are two different ways of doing this
 */

/**     ALTERNATIVE 1
 *
 *      function deployFunc() {
 *          console.log("Hi!")
 *      }
 *
 *      module.exports.default = deployFunc // specification of which function "hardhat deploy" has to run
 *
 */

// ALTERNATIVE 2 (this is the one used in the course)

/** 
module.exports = async (hre) => {   // hre = hardhat runtime environment
    // importing or pulling these two variables from the HRE
    const {getNamedAccounts, deployments} = hre 
    // the same as writing:                            hre.getNamedAccounts()
    //                                                 hre.deployments()
    // but written in a more elegant way
}
*/

//we can write this even faster by doing module.exports = async ({ getNamedAccounts, deployments })

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments // we now extract these variables from the imported hre functions
    const { deployer } = await getNamedAccounts()
    const chaindId = network.config.chainId

    // if chaindId is X use address Y
    // this way we can always select the correct chain
    // const ethUsdPriceFeedAddress = networkConfig[chaindId]["ethUsdPriceFeed"]    --> we dont want this to be a constant because we want to be able to update it

    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        // we check if it is a development chain
        const ethUsdAggregator = await deployments.get("MockV3Aggregator") // we get the address like this
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        // if it isnt then we get the information from our helper-hardhat-config.js file
        ethUsdPriceFeedAddress = networkConfig[chaindId]["ethUsdPriceFeed"]
    }
    log("---------------------------------------------")
    log("Deploying FundMe and waiting for confirmations...")

    // put priceFeed address
    const args = [ethUsdPriceFeedAddress]
    log(deployer)
    log(ethUsdPriceFeedAddress)
    // Contract deployment saved in a variable
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress], // code saving by saving the argument as a constant variable
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1, // if no blockConfirmations is specified in the hardhat.config.js then we wait 1 block
    })

    log(`FundMe deployed at ${fundMe.address}`)

    //

    // verifying the contract if we deploy to a real testnet or network

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        // verify
        await verify(fundMe.address, [ethUsdPriceFeedAddress])
    }
    log("-------------------------------------------")
}

module.exports.tags = ["all", "fundme"]
