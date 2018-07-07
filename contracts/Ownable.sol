pragma solidity ^0.4.18;

contract Ownable {
    // state variables
    address owner;

    // modifiers
    modifier onlyOwner() {
        require(msg.sender == owner);
        _; // this is a placeholder for the code that modifier is applied to
    }

    function Ownable() public {
        owner = msg.sender;
    }
}