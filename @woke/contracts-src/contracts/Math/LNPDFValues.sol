pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract LogNormalPDFValues is Ownable {

	mapping(uint8 => uint40[]) internal valueArrays;
	uint40 public maximum = 0x24ae7a7ae6;
	uint32 public max_x = 220;
	bool private done = false;

	function fillArrayValues(uint8 chunkSize, uint40[] calldata values)
		external
		onlyOwner
		notCompleted
		returns(uint32)
	{
		uint32 i;
		for(; i < values.length; i++) {
			valueArrays[chunkSize].push(values[i]);
		}
		return i;
	}

	constructor() public
	{
	}

	function fillingComplete() external
		onlyOwner
		notCompleted
	{
		done = true;
	}

	modifier notCompleted() {
		require(done == false, 'filling complete');
		_;
	}

	modifier completed() {
		require(done, 'filling incomplete');
		_;
	}
}





