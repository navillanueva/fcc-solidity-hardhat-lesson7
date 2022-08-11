const networkConfig = {
    4: {
        // rinkeby chainID
        name: "rinkeby",
        ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    },
    137: {
        // polygon chainID
        name: "polygon",
        ethUsdPriceFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
    },
}

const developmentChains = ["hardhat", "localhost"]

// args we have to pass for the deployment of the MockV3Aggregator constructor
const DECIMALS = 8
const INITIAL_ANSWER = 200000000000

module.exports = {
    networkConfig, // we export it like this so we can import this variable in the 01-deploy-fund-me.js script
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
}
