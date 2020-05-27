pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract LogNormalPDFValues is Ownable {

	mapping(uint8 => uint40[]) internal valueArrays;
	bool private done = false;

	function fillArrayValues(uint8 chunkSize, uint40[] memory values)
		onlyOwner
		notCompleted
		public
	{
		for(uint32 i = 0; i < values.length; i++) {
			valueArrays[chunkSize].push(values[i]);
		}
	}

	constructor() public
	{
	}

	function fillingComplete() 
		onlyOwner
		notCompleted
		public
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





