pragma solidity ^0.5.0;

import "./Structs.sol";
import "../Math/LogNormalPDF.sol";
import "../WokeToken.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

library Distribution {
	using SafeMath for uint256;

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

	function _calcAllocation(uint40 _weight, uint48 _sum, uint256 _pool)
		internal pure
		returns (uint256)
	{
		//uint256 ratio = (uint256(_weight) << 4).div(_sum);
		//return (ratio * _pool) >> 4;
		return ((uint256(_weight) << 4).div(_sum) * _pool) >> 4;
	}

	// @param _bonusPool: Pool of tokens to be distributed to tributors
	// returns: Deducted tribute bonus amount 
	function _distributeTributeBonuses(
		mapping(string => Structs.User) storage _users,
		mapping(address => string) storage _userIds,
		address _wokeTokenAddress,
		address lnpdfAddress,
		string memory _id,
		uint256 _bonusPool
	)
		public
		returns (uint256)
	{
		WokeToken wokeToken = WokeToken(_wokeTokenAddress);
		Structs.User storage user = _users[_id];
		Structs.User storage tributor = _users[_id];

		// 1. Create weight groups
		Structs.WeightGroup[] memory groups = new Structs.WeightGroup[](user.referrers.length);
		for(uint32 i = 0; i < _users[_id].referrers.length; i++) {
			address referrer = _users[_id].referrers[i];
			tributor = _users[_userIds[referrer]];
			uint256 amount = _users[_id].referralAmount[referrer]; // not available outside of storage

			groups[i] = Structs.WeightGroup(tributor.followers, amount, wokeToken.balanceOf(referrer), 0);
		}

		// 2. Calculae and transfer bonuses
		uint256[] memory bonuses = _calcAllocations(groups, _bonusPool, lnpdfAddress);
		//uint256[] memory bonuses = new uint256[](groups.length);
		uint256 total = 0;
		for(uint i = 0; i < user.referrers.length; i++) {
			address referrer = user.referrers[i];
			tributor = _users[_userIds[referrer]];
			wokeToken.internalTransfer(user.account, tributor.account, bonuses[i]);
			total = total.add(bonuses[i]);
		}

		require(total == _bonusPool, 'bonuses != tributeBonusPool');
		return total;
	}


	function _calcAllocations(Structs.WeightGroup[] memory _groups, uint256 _pool, address _lnpdfAddress)
		internal
		returns (uint256[] memory allocations)
	{
		allocations = new uint256[](_groups.length);
		LogNormalPDF logNormalPDF = LogNormalPDF(_lnpdfAddress);
		// 1. find highest influence weight in tributors
		uint64 sum = 0;
		for(uint i = 0; i < _groups.length; i++) {
			_groups[i].weight = logNormalPDF.lnpdf(_groups[i].followers);
			sum += _groups[i].weight;
		}

		uint256 minAmount = _pool;
		uint32 min = 0;
		uint256 total = 0;
		for(uint32 i = 0; i < _groups.length; i++) {

			// Calculate ratio of group weight to total weights
			uint256 ratio = (uint256(_groups[i].weight) << 4).div(sum);
			allocations[i] = (ratio * _pool) >> 4;
			total += allocations[i];

			emit Allocation(i, allocations[i], _groups[i].weight);

			if(allocations[i] < minAmount) {
				minAmount = allocations[i];
				min = i;
			}
		}


		allocations[min] += _pool.sub(total); // give remainder to smallest beneficiary
		total += _pool.sub(total);
		emit Allocation(min, allocations[min], _groups[min].weight);
		emit TraceUint256('totalAllocations', total);
		return allocations;
	}
	event Allocation(uint32 i, uint256 amount, uint40 weight);
	event TraceUint256(string m, uint256 v);
}
