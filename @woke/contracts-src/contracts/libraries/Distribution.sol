pragma solidity ^0.5.0;
/*
 * @title Token distribution 
 * @desc Token distiribution algorithms.
 */

import "./Structs.sol";
import "../Math/LogNormalPDF.sol";
import "../WokeToken.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

library Distribution {
	//using SafeMath for uint256;

	// @notice Calculate the proportion of minted tokens received by tributors vs new user
	function _calcTributeBonus(
		mapping(string => Structs.User) storage _users,
		mapping(string => uint40) storage _maxWeights,
		string memory _id,
		uint256 _minted,
		address _lnpdfAddress
	) public view
	returns (uint256)
	{
		if(_minted == 0) {
			return 0;
		}

		LogNormalPDF logNormalPDF = LogNormalPDF(_lnpdfAddress);
		uint40 userWeight = logNormalPDF.lnpdf(_users[_id].followers);
		uint40 tributeWeight;

		// Use highest influence weight from tributors
		if(_users[_id].referrers.length == 0) {
			//followers = logNormalPDF.max_x();
			tributeWeight = logNormalPDF.maximum();
		} else {
			// OR could use the sum of tribute weights to heavily skew the minted tokens
			// towards tributors
			//followers = _maxFollowers[_id];
			tributeWeight = _maxWeights[_id];
		}

		// TODO incorporate amount tributed
		//uint256 balance = _minted + tributePool;
		// ---------------------------------------

		return _calcAllocation(tributeWeight, userWeight + tributeWeight, _minted);
	}

	// @param _bonusPool: Pool of tokens to be distributed to tributors
	// returns: Deducted tribute bonus amount 
	function _distributeTributeBonuses(
		mapping(string => Structs.User) storage _users,
		mapping(address => string) storage _userIds,
		address _wokeTokenAddress,
		address _lnpdfAddress,
		string memory _id,
		uint256 _pool,
		uint48 _weightSum
	) public
	returns (uint256)
	{
		WokeToken wokeToken = WokeToken(_wokeTokenAddress);
		LogNormalPDF logNormalPDF = LogNormalPDF(_lnpdfAddress);
		Structs.User storage user = _users[_id];
		Structs.User storage tributor = _users[_id];

		uint256 total;
		uint256 minAmount = _pool; // Track index and amount instead of allocating an array 
		uint32 minI = uint32(_users[_id].referrers.length);

		for(uint32 i = 0; i < _users[_id].referrers.length; i++) {
			tributor = _users[_userIds[user.referrers[i]]];
			uint256 amount = _calcAllocation(logNormalPDF.lnpdf(tributor.followers),  _weightSum, _pool);
			wokeToken.internalTransfer(user.account, tributor.account, amount);
			total = total += amount;

			// @TODO is storage saving worth the gas expense?
			//user.referralAmount[tributor.account] = 0;

			// @note Too expensive 
			emit Bonus(user.account, tributor.account, amount);

			if(amount < minAmount) {
				minAmount = amount;
				minI = i;
			} 
		}

		// Transfer remainder to smallest beneficiary
		// - 1st tributor gets remainder if weights symmetrical
		// Stack too deep to store remainder
		// uint256 remainder = _pool - total;
		if(_pool - total > 0 && minI < _users[_id].referrers.length) {
			wokeToken.internalTransfer(user.account, user.referrers[minI], _pool - total);
			total += _pool - total;

			emit Bonus(user.account, user.referrers[minI], _pool - total);
		}

		require(total == _pool, 'bonuses != tributeBonusPool');
		return total;
	}

	// @dev Overflows if log_2(_pool * (2^48 - 1)) > 256, i.e. pool > 2^208 - 1
	// - assume for alpha the pool is never this absurdly large
	function _calcAllocation(uint40 _weight, uint48 _sum, uint256 _pool)
		internal pure
	returns (uint256)
	{
		//uint256 ratio = (uint256(_weight) << 4).div(_sum);
		//return (ratio * _pool) >> 4;
		//return ((uint256(_weight) << 4).div(_sum) * _pool) >> 4;
		return ((uint256(_weight) << 8)*(_pool))/(_sum) >> 8;
	}

	event Bonus (address indexed claimer, address indexed tributor, uint256 amount);
	//event Bonus (address indexed claimer, address indexed referrer, string referrerId, uint256 amount);
	//event Allocation(uint32 i, uint256 amount, uint40 weight);
	//event TraceUint256(string m, uint256 v);
}
