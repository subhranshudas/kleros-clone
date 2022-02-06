const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const EscrowManager = await hre.ethers.getContractFactory("EscrowManager");
    const escrowManager = await EscrowManager.deploy();

    await escrowManager.deployed();
    console.log("EscrowManager Contract address:", escrowManager.address);

    saveFrontendFiles(escrowManager);

}

function saveFrontendFiles(contract) {
    const fs = require("fs");
    const contractsDir = __dirname + "/../src/abis";

    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir);
    }

    fs.writeFileSync(
        contractsDir + "/contract-address.json",
        JSON.stringify({ EscrowManager: contract.address }, undefined, 2)
    );

    const EscrowManagerArtifact = artifacts.readArtifactSync("EscrowManager");

    fs.writeFileSync(
        contractsDir + "/EscrowManager.json",
        JSON.stringify(EscrowManagerArtifact, null, 2)
    );
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.log(error);
        process.exit(1);
    });