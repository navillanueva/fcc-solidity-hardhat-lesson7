// in the utils folder we are going to include all of the functions that can be applied to several deployment scripts
// this code is copied from the deploy script in lesson 6

const { run } = require("hardhat")

async function verify(contractAddress, args) {
    console.log("Verifying contract...")

    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already Verified!")
        } else {
            console.log(e)
        }
    }
}

module.exports = { verify }
