pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

// is owner

// Curve value precision ?
contract LogNormalPDFValues is Ownable {

	//uint40[1250] internal yArray4;
	//uint40[625] internal yArray8;
	//uint40[625] internal yArray16;
	//uint40[313] internal yArray32;
	//uint40[156] internal yArray64;
	//uint40[78] internal yArray128;

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
		//valueArrays[4] = yArray4;
		//valueArrays[8] = yArray8;
		//valueArrays[16] = yArray16;
		//valueArrays[32] = yArray32;
		//valueArrays[64] = yArray64;
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





