// noinspection ES6ConvertVarToLetConst,JSDuplicatedDeclaration

// TODO: connect to test polygon network

import { ethers } from "hardhat";
import { ContractFactory, Signer } from "ethers";
import {ContractFunction} from "@ethersproject/contracts";
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {web3} from "@openzeppelin/test-environment";

chai.use(chaiAsPromised);
const expect = chai.expect;

const testHash1 = '0x0000000000000000000000000000000000000000000000000000000000000001';
const testHash2 = '0x0000000000000000000000000000000000000000000000000000000000000002';
const testHash3 = '0x0000000000000000000000000000000000000000000000000000000000000003';
const zero = '0x0000000000000000000000000000000000000000000000000000000000000000';

const registeredEventInterface = new ethers.utils.Interface(["event Registered(bytes32 indexed docHash, uint256 indexed validUntil)"]);
const registeredEventInterfaceHash = '0xc8704a622f3eb8c9fc5a2ddf1775b5ea7695359b13dec8111874e266a4d5fbc9'

const newVersionRegisteredEventInterface = new ethers.utils.Interface(["event NewVersionRegistered(bytes32 indexed newDocHash, bytes32 indexed expiredDocHash)"]);
const newVersionRegisteredEventInterfaceHash = '0xb5dac8ad49578955a20b2a5179573fe2be183efb3659e0daded600bd59b3975e'

interface Originstamp {
    docRegistrationTime(_docHash: string): Promise<string>
    newVersions(_docHash: string): Promise<string>
    validUntil(_docHash: string): Promise<string>

    register(_docHash: string, _validUntil: number): Promise<any>
    registerMultiply(_docHashes: string[], _validUntil: number[]): Promise<any>
    registerNewVersion(_newDocHash: string, _expiredDocHash: string, _newDocValidUntil: number): Promise<any>
    registerNewVersionMultiply(_newDocHash: string[], _expiredDocHash: string[], _newDocValidUntil: number[]): void

    readonly [key: string]: ContractFunction | any
}

async function makeContract(): Promise<Originstamp> {
    const TokenContract: ContractFactory = await ethers.getContractFactory(
        "Originstamp"
    );
    let contract = await TokenContract.deploy();
    return contract.deployed() as unknown as Promise<Originstamp>;
}

async function makeConnectedContract(account: Signer): Promise<Originstamp> {
    const contract = await makeContract()
    return contract.connect(account)
}

describe("Originstamp", function () {
    let accounts: Signer[];
    let contract: Originstamp;
    let ownerAddress: String;

    beforeEach(async function () {
        accounts = await ethers.getSigners();
        ownerAddress = await accounts[0].getAddress();
        contract = await makeContract()
    })

    it("Should register document", async function () {
        await contract.register(testHash1, 0)
        expect(Number(await contract.docRegistrationTime(testHash1))).to.greaterThan(1648494051);
    })

    it("Should register document with limited validation time", async function () {
        const now = Math.floor(new Date().getTime() / 1000)
        await contract.register(testHash1, now + 10)
        expect(await contract.validUntil(testHash1)).to.eq(now + 10);
    })

    it("Should register document with limited validation time fail", async () => {
        const now = Math.floor(new Date().getTime() / 1000)
        await expect(contract.register(testHash1, now - 1))
            .to.be.rejectedWith("Exception while processing transaction: revert Valid until should be in future")
    })

    it("Should register document with Registered event", async () => {
        const validUntil = Math.floor(new Date().getTime() / 1000) + 10;

        const tx = await contract.register(testHash1, validUntil)

        const receipt = await tx.wait()
        const {data, topics} = receipt.logs[0];
        expect(topics[0]).to.be.equal(registeredEventInterfaceHash)
        expect(topics[1]).to.be.equal(testHash1)
        expect(web3.utils.toBN(topics[2]).toNumber()).to.be.equal(validUntil)

        const event = registeredEventInterface.decodeEventLog("Registered", data, topics);
        expect(event.docHash).to.equal(testHash1);
        // console.log(event)
        expect(event.validUntil.toNumber()).to.equal(validUntil);
    })

    it("Should not register same document second time", async () => {
        await contract.register(testHash1, 0)
        await expect(contract.register(testHash1, 0))
            .to.be.rejectedWith("VM Exception while processing transaction: revert Document hash already registered")
    })

    it("Should register new version of document", async () => {
        await contract.register(testHash1, 0)
        await contract.registerNewVersion(testHash2, testHash1, 0)

        expect(await contract.newVersions(testHash1)).to.equal(testHash2)
        expect(await contract.newVersions(testHash2)).to.equal(zero)
    })

    it("Should register chain of new versions", async () => {
        await contract.register(testHash1, 0)
        await contract.registerNewVersion(testHash2, testHash1, 0)
        await contract.registerNewVersion(testHash3, testHash2, 0)

        expect(await contract.newVersions(testHash1)).to.equal(testHash2)
        expect(await contract.newVersions(testHash2)).to.equal(testHash3)
        expect(await contract.newVersions(testHash3)).to.equal(zero)
    })

    it("Should not register new version of document with new version exist", async () => {
        await contract.register(testHash1, 0)
        await contract.registerNewVersion(testHash2, testHash1, 0)
        const registerNewVersionAgain = contract.registerNewVersion(testHash3, testHash1, 0)

        await expect(registerNewVersionAgain).to.be
            .rejectedWith("VM Exception while processing transaction: revert " +
                "Expired document already has new version registered")
    })

    it("Should register new version of document with correct valid until", async () => {
        await contract.register(testHash1, 0)
        const newDocValidUntil = Math.floor(new Date().getTime() / 1000) + 100;
        await contract.registerNewVersion(testHash2, testHash1, newDocValidUntil)

        expect(await contract.validUntil(testHash1)).to.be.equal(0)
        expect(await contract.validUntil(testHash2)).to.be.equal(newDocValidUntil)
    })

    it("Should register new version of list of documents", async () => {
        await contract.registerMultiply([testHash1], [0])
        await contract.registerNewVersionMultiply([testHash2], [testHash1], [0])

        expect(await contract.newVersions(testHash1)).to.equal(testHash2);
        expect(await contract.newVersions(testHash2)).to.equal(zero);
    })

    it("Should register new version document with Registered and NewVersionRegistered events", async () => {
        await contract.register(testHash1, 0)
        const newDocValidUntil = Math.floor(new Date().getTime() / 1000) + 100;

        const tx = await contract.registerNewVersion(testHash2, testHash1, newDocValidUntil)

        const receipt = await tx.wait()
        // Registered event
        var {topics} = receipt.logs[0];
        console.log(receipt.logs[0])
        expect(topics[0]).to.be.eq(registeredEventInterfaceHash)
        expect(topics[1]).to.be.eq(testHash2)
        expect(web3.utils.toBN(topics[2]).toNumber()).to.be.eq(newDocValidUntil)

        // NewVersionRegistered
        var {topics} = receipt.logs[1];
        expect(topics[0]).to.be.eq(newVersionRegisteredEventInterfaceHash)
        expect(topics[1]).to.be.eq(testHash2)
        expect(topics[2]).to.be.eq(testHash1)
    })
})
