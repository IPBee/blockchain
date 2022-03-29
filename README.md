# Site: [ipbee.github.io/blockchain](https://ipbee.github.io/blockchain)

# Height Level Solution Description

We are using Smart Contract responsible for registering document hashes in Ethereum compatable blockchains. Smart Contract source code also available in [this repository](https://github.com/IPBee/blockchain/blob/master/smart-contracts/Originstamp.sol). It is written in [Solidity programming language](https://soliditylang.org) created especially for Ethereum Virtual Machine. 

Smart Contract has read and write methods. Write methods put and update data in blockchain. You can imagine it like global data base with free read access and paid write capability. Write commission depends on blockchain and amount of writing data. [Polygon blockchain](https://polygon.technology) for now one of the cheapest Ethereum compatible blockchain.

To write Polygon blockchain we need to have account in Polygon network and [MATIC](https://polygon.technology/matic-token) coins to pay commission fees.

The one of the simplest way to create account is to use [Metamask wallet](https://metamask.io) available as [Chrome](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en) and Firefox extension.

### Document hash

Generated by ...

You always need to use 0x... format of hashes for this Smart Contract methods. Example: `0xe4142e56e449251d27732d585248d507994e400fc19184ce6158f1263cdc9e11`

### Read methods

* `docRegistrationTime` -- get [unix timestamp](https://www.unixtimestamp.com) of document hash registration 
* `newVersions` -- get new version of document hash if exists

You can use [Polygonscan][3] to try these methods.

### Write methods

* `register` -- register single document hash. Emits `Registered` event.
* `registerMultiply` -- register array of document hashes. Emits `Registered` event for each document.
* `registerNewVersion` -- register new version of document. To call it you need to know old and new document hashes. 
Emits `Registered` and `NewVersionRegistered` events.
* `registerNewVersionMultiply` -- implement `registerNewVersion` logic for each of pair of input data 

Only creator of contract can use write methods. You can use [Polygonscan][2] to try these methods. You need to click `Connect to Web3` link to connect Metamask browser 
extension, and you need to have `MATIC` tokens for commission fee. Usual commission about `0.0014 MATIC` ~ `$0.003` by current price.

### Events (Logs)

* `Registered` -- emitted for each registered document hash
* `NewVersionRegistered` -- emitted in case of `registerNewVersion` method used

[Test Smart Contract Address is 0xb370fc5ac2846243686ff324b89c85086b453bdf][1]

### Etherscan

For using read or write methods usually we need to use own Polygon Node. But also we can use third party APIs. 
One of the most popular Polygon blockchain explorer tool is [Polygonscan](https://polygonscan.com). This tool allows 
studying blockchain transactions, smart contracts, event and lot more. Also, Polygonscan allow calling Smart Contract 
read/write methods. To use write methods you need to connect Metamask Wallet with owner (Smart Contract creater) account.

# This site solution description

Each Smart Contract write method usage create a transaction which is publicly accessible. All our write methods emit
events. All emitted events written in transaction logs section. To prove what some document hash were published some 
time ago we need to prove what transaction with `Registered` event with this particular document hash was published in 
particular time. 

Example: https://polygonscan.com/tx/0x3b18c87703bd71721e419cd62843227dfe586380adfc6c40c5c511280bb3233b#eventlog

Let's study first event in this example. Most confusing part it is `topics` array. First element in topic array is 
`0x10906fae603eebfac53ddc0f103bee8a044dd7643c425c7a90f921dfa15ef62c` -- identifier of this particular event. It is hash 
computed from event signature `event Registered(bytes32 indexed)`. Second topic equal to first event parameter which is `docHash`.
So second topic equals our document has.

So to prove document has were published we need to fetch topics with `topic0` equals `0x10906fae603eebfac53ddc0f103bee8a044dd7643c425c7a90f921dfa15ef62c`
and `topic1` equals our document hash. And check transaction timestamp to get date of document publishing.

For fetching events from Polygon blockchain we are using [Polygonscan Event Log API](https://docs.polygonscan.com/api-endpoints/logs).
You can find fetching logic implementation in [js/app.js](https://github.com/IPBee/blockchain/blob/master/js/app.js) file

# Smart Contract publishing

To publish Smart Contract we need to have Polygon account. You can create your own or import test account.

## Import Test Account

Open Metamask and follow [account import instructions](https://metamask.zendesk.com/hc/en-us/articles/360015489331-How-to-import-an-Account). 
Private key for test account: `f76172e35f6da2b1f7e187bdc07fbf4dcd43c28fdc4cfcb1cbdbb4b3ce3451ea`

Test account address: `0x75ec25551e68E5827C40fC26382aa7e57C2A3380`

This account hold some small amount of `MATIC` for fees.

## Compile & Publish

1. Open [Remix](https://remix.ethereum.org)
2. Create file `Originstamp.sol` in `contracts` folder
3. Paste content of [smart-contracts/Originstamp.sol](https://github.com/IPBee/blockchain/blob/master/smart-contracts/Originstamp.sol)
4. Switch to `Solidity Compiler` tab on left panel
5. Choose Compiler `0.8.7+commit.e28d00a7`
6. Press `Compile Originstamp.sol` button
7. Switch to `Deploy & run transactions` tab
8. Choose environment `Injected Web3`
9. Make sure Metamask Network is `Polygon Mainnet` and connected account correct
10. Account address should be equal your account address, `0x75e...A3380` for test account
11. Press `Deploy` button


# Automatic testing

1. Download or clone this code
2. Switch to smart-contracts folder `cd smart-contracts`
3. Run command `npm install`
4. Run command `npx hardhat test`

# Use-cases for testing

## Environment preparations

Install [Metamask Chrome Extension](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en). We nned it only for use Smart Contract write methods


## Publish/check single document

### Publish

1. Open Smart Contract write methods on [Polygonscan][2]
2. Click `Connect to Web3` to connect to Metamask wallet
3. Use `register` method with document hash as parameter. Document hash example: `0xe4142e56e449251d27732d585248d507994e400fc19184ce6158f1263cdc9e11`
4. Press `Write` button
5. Approve transaction in Metamask
6. Press `View your transaction` button and wait until transaction finish. Sometimes you need to reload browser page after some seconds
7. Check transaction fee, should be less than $0.01
8. Switch to Logs tab
9. You should see `Registered` event with document hash in Topic 1

### Check on Polygonscan

1. Open Smart Contract read methods on [Polygonscan][3]
2. Use `docRegistrationTime` method with document hash as parameter. Document hash example: `0xe4142e56e449251d27732d585248d507994e400fc19184ce6158f1263cdc9e11`
3. Press `Query` button
4. Convert result unix timestamp to human readable format using https://www.unixtimestamp.com
5. Use `newVersions` method with same document hash as parameter
6. Response should be zero: `bytes32 :  0x0000000000000000000000000000000000000000000000000000000000000000`

### Check on this site

1. Open site https://ipbee.github.io/blockchain
2. Insert document hash
3. Compare result with Polygonscan data

## Publish a list of documents

### Publish

1. Open Smart Contract write methods on [Polygonscan][2]
2. Click `Connect to Web3` to connect to Metamask wallet
3. Use `registerMultiply` method with list of document hashes as parameter. Parameter example (two hashes): `[0x0000000000000000000000000000000000000000000000000000000000000001,0x0000000000000000000000000000000000000000000000000000000000000002]`
4. Press `Write` button
5. Approve transaction in Metamask
6. Press `View your transaction` button and wait until transaction finish. Sometimes you need to reload browser page after some seconds
7. Switch to Logs tab
8. You should see two `Registered` events. One with `0000000000000000000000000000000000000000000000000000000000000001` in Topic 1
   and second with `0000000000000000000000000000000000000000000000000000000000000002` in Topic 1

### Check

Same logic like for single document for each of document in list.

## Publish/check new version of doc

### Publish

1. Open Smart Contract write methods on [Polygonscan][2]
2. Click `Connect to Web3` to connect to Metamask wallet
3. Use `registerNewVersion` method 
4. Fill `_newDocHash` parameter input with new document hash
5. Fill `_expiredDocHash` parameter input with expired document hash
6. Press `Write` button
7. Approve transaction in Metamask
8. Press `View your transaction` button and wait until transaction finish. Sometimes you need to reload browser page after some seconds
9. Switch to Logs tab
10. You should see `Registered` and `NewVersionRegistered` events 
11. `Registered` event should have new document hash in Topic 1
12. `NewVersionRegistered` event should have new document hash in Topic 1 and old document has on Topic 2

### Check

Same logic like for single document for old and new document hashes. But for old document hash response of `newVersions` 
method should equal to new document hash.

## Publish/check new version of already expired doc

## Try to publish already existed document as single and as list

## Try to publish from non owner account

# Bitrix tasks

[1]: https://polygonscan.com/address/0xb370fc5ac2846243686ff324b89c85086b453bdf#code
[2]: https://polygonscan.com/address/0xb370fc5ac2846243686ff324b89c85086b453bdf#writeContract
[3]: https://polygonscan.com/address/0xb370fc5ac2846243686ff324b89c85086b453bdf#readContract
