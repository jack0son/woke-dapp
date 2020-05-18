pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

//import "./Math/Power.sol";

contract WokeFormula {
	using SafeMath for uint256;

	uint256 public a, b c; // curve params
	uint256 public scale = 10**18; // same scale as ether

	constructor(
		uint256 _maxPrice,
		uint256 _inflectionSupply,
		uint256 _steepness,
	) public  
	{
		a = _maxPrice.div(2);
		b = _inflectionSupply;
		c = _steepness;
	}

	function jk}
}


