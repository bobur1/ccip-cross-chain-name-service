import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ConfigType, S_Chain, EMPTY_STRING, GAS_LIMIT, NAME } from "./helpers/types";

describe("CrossChainNameService", function () {
    // contracts
    let ccipLocalSimulator: any;
    let crossChainNameServiceLookupSource: any;
    let crossChainNameServiceLookupDestination: any;
    let crossChainNameServiceReceiver: any;
    let crossChainNameServiceRegister: any;

    // signers
    let deployer: SignerWithAddress;
    let alice: SignerWithAddress;
    let config: ConfigType;

    beforeEach(async () => {
        // define addresses
        [deployer, alice] = await ethers.getSigners();

        // define CCIPLocalSimulator
        const CCIPLocalSimulator = await ethers.getContractFactory("CCIPLocalSimulator");
        ccipLocalSimulator = await CCIPLocalSimulator.deploy();

        // Call the configuration() function to get Router contract address.
        config = await ccipLocalSimulator.configuration();
    });

    describe("Deployment", function () {
        it("Should deploy CCIPLocalSimulator and define config", async () => {
            expect(ccipLocalSimulator.address).to.be.not.equal(ethers.constants.AddressZero);
            expect(config.chainSelector_).to.be.not.equal(ethers.constants.Zero);
            expect(config.sourceRouter_).to.be.not.equal(EMPTY_STRING);
            expect(config.destinationRouter_).to.be.not.equal(EMPTY_STRING);
            expect(config.wrappedNative_).to.be.not.equal(EMPTY_STRING);
            expect(config.linkToken_).to.be.not.equal(EMPTY_STRING);
            expect(config.ccipBnM_).to.be.not.equal(EMPTY_STRING);
            expect(config.ccipLnM_).to.be.not.equal(EMPTY_STRING);
        });

        it("Deploy CrossChainNameServiceLookup", async () => {
            // define CrossChainNameServiceLookup
            const CrossChainNameServiceLookup = await ethers.getContractFactory("CrossChainNameServiceLookup");
            const crossChainNameServiceLookup = await CrossChainNameServiceLookup.deploy();

            expect(crossChainNameServiceLookup.address).to.be.not.equal(ethers.constants.AddressZero);
        });

        it("Deploy CrossChainNameServiceRegister && CrossChainNameServiceReceiver", async () => {
            // define CrossChainNameServiceLookup
            const CrossChainNameServiceLookup = await ethers.getContractFactory("CrossChainNameServiceLookup");
            const crossChainNameServiceLookupSource = await CrossChainNameServiceLookup.deploy();
            const crossChainNameServiceLookupDestination = await CrossChainNameServiceLookup.deploy();

            // define CrossChainNameServiceRegister
            const CrossChainNameServiceRegister = await ethers.getContractFactory("CrossChainNameServiceRegister");
            const crossChainNameServiceRegister = await CrossChainNameServiceRegister.deploy(
                config.sourceRouter_,
                crossChainNameServiceLookupSource.address
            );

            // define CrossChainNameServiceReceiver
            const CrossChainNameServiceReceiver = await ethers.getContractFactory("CrossChainNameServiceReceiver");
            const crossChainNameServiceReceiver = await CrossChainNameServiceReceiver.deploy(
                config.sourceRouter_,
                crossChainNameServiceLookupDestination.address,
                config.chainSelector_
            );

            expect(crossChainNameServiceRegister.address).to.be.not.equal(ethers.constants.AddressZero);
            expect(crossChainNameServiceReceiver.address).to.be.not.equal(ethers.constants.AddressZero);
        });
    });

    describe("Functionality", function () {
        beforeEach(async () => {
            // define CrossChainNameServiceLookup
            const CrossChainNameServiceLookup = await ethers.getContractFactory("CrossChainNameServiceLookup");
            crossChainNameServiceLookupSource = await CrossChainNameServiceLookup.deploy();
            crossChainNameServiceLookupDestination = await CrossChainNameServiceLookup.deploy();

            // define CrossChainNameServiceRegister
            const CrossChainNameServiceRegister = await ethers.getContractFactory("CrossChainNameServiceRegister");
            crossChainNameServiceRegister = await CrossChainNameServiceRegister.deploy(
                config.sourceRouter_,
                crossChainNameServiceLookupSource.address
            );

            // define CrossChainNameServiceReceiver
            const CrossChainNameServiceReceiver = await ethers.getContractFactory("CrossChainNameServiceReceiver");
            crossChainNameServiceReceiver = await CrossChainNameServiceReceiver.deploy(
                config.sourceRouter_,
                crossChainNameServiceLookupDestination.address,
                config.chainSelector_
            );
        });

        it("Call enableChain()", async () => {
            await crossChainNameServiceRegister.enableChain(
                config.chainSelector_,
                crossChainNameServiceReceiver.address,
                GAS_LIMIT
            );

            const s_chains: S_Chain = await crossChainNameServiceRegister.s_chains(0);

            expect(s_chains.chainSelector).to.be.equal(config.chainSelector_);
            expect(s_chains.ccnsReceiverAddress).to.be.equal(crossChainNameServiceReceiver.address);
            expect(s_chains.gasLimit).to.be.equal(GAS_LIMIT);
        });

        it("Call register() && lookup()", async () => {
            await crossChainNameServiceLookupSource
                .setCrossChainNameServiceAddress(crossChainNameServiceRegister.address);
            await crossChainNameServiceLookupDestination
                .setCrossChainNameServiceAddress(crossChainNameServiceReceiver.address);

            await crossChainNameServiceRegister.enableChain(
                config.chainSelector_,
                crossChainNameServiceReceiver.address,
                GAS_LIMIT
            );
            await crossChainNameServiceRegister.connect(alice).register(NAME);

            const resolvedAddress = await crossChainNameServiceLookupDestination.lookup(NAME);

            expect(resolvedAddress).to.equal(alice.address);
        });
    });
});
