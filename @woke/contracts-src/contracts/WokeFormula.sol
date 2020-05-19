pragma solidity ^0.5.0;

import "./Math/Power.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract WokeFormula is Power {
	using SafeMath for uint256;

	uint256 public a; // curve params
	uint256 public b; // curve params
	uint256 public c; // curve params
	uint256 public scale = 10**18; // same scale as ether

	constructor(
		uint256 _maxPrice,
		uint256 _inflectionSupply,
		uint256 _steepness
	) public  
	{
		a = _maxPrice.div(2);
		b = _inflectionSupply;
		c = _steepness;
	}

	function calculatePurchaseReturn(
		uint256 _currentSupply,		// tokens in existence
		uint256 _depositAmount,		// new user num followers
		uint256 _balance			// aggregate followers
	) 
		public
	returns (uint256)
		//view
	{
		require(_currentSupply > 0);

		if(_depositAmount == 0) {
			return 0;
		}

		// If close to max supply, use remaining depositable balance ? 
		// Could just allow minting forever, if amount < 1, return 1 ?
		/*
		if(_depositAmount + _balance > carryingCapacity) {
			//deposit = carryingCapacity - _balance;
		}
		*/

		uint256 result;
		uint256 squareTerm = _currentSupply < b ? b - _currentSupply : _currentSupply - b; 
		uint256 baseN = c + squareTerm.mul(squareTerm);

		// (_baseN / _baseD) ^ (_expN / _expD) * 2 ^ precision 
		(uint256 rootTerm, uint8 precision) = power(baseN, 1, 1, 2); // sqrt(c + (s-b)^2)
		emit TraceUint8('precision', precision);

		uint256 F = _depositAmount;

		uint256 numerator = F.mul(F) + F.mul(a.mul(rootTerm));
		uint256 denom = a.mul(a).mul(_currentSupply - b + rootTerm) + a.mul(F);
		denom = denom.mul(2);

		result = numerator.div(denom);

		if(result == 0) {
			result = 1; // always mint at least one token
		}

		return result;
	}

	event TraceUint8(string m, uint8 v);
}


