// https://polygonscan.com/address/0xb370fc5ac2846243686ff324b89c85086b453bdf#code

// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.7;


contract Originstamp {
    address public owner;
    mapping(bytes32 => uint256) public docHashTime;
    mapping(bytes32 => bytes32) public newVersions;

    event Registered(bytes32 indexed docHash);
    event NewVersionRegistered(bytes32 indexed docHash, bytes32 indexed expiredDocHash);

    modifier onlyOwner() {
        require(msg.sender == owner, "Sender not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function register(bytes32 _docHash) public onlyOwner() {
        docHashTime[_docHash] = block.timestamp;
        emit Registered(_docHash);
    }

    function registerMultiply(bytes32[] calldata _docHashes) public onlyOwner() {
        for(uint i = 0; i < _docHashes.length; i++) {
            bytes32 _docHash = _docHashes[i];
            docHashTime[_docHash] = block.timestamp;
            emit Registered(_docHash);
        }
    }

    function registerNewVersion(bytes32 _docHash, bytes32 _expiredDocHash) public onlyOwner() {
        docHashTime[_docHash] = block.timestamp;
        newVersions[_expiredDocHash] = _docHash;
        emit NewVersionRegistered(_docHash, _expiredDocHash);
    }
}
