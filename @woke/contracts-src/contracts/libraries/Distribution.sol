pragma solidity ^0.5.0;

import "./Structs.sol";
import "../Math/LogNormalPDF.sol";
import "../WokeToken.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

library Distribution {
	using SafeMath for uint256;

	// @param _bonusPool: 
	// returns: Deducted tribute bonus amount 
	function _distributeTributeBonuses(
		mapping(string => Structs.User) storage _users,
		mapping(address => string) storage _userIds,
		address _wokeTokenAddress,
		string memory _id,
		uint256 _bonusPool,
		uint256 _noTributePool
	)
		internal
		returns (uint256, uint256)
	{
		WokeToken wokeToken = WokeToken(_wokeTokenAddress);
		Structs.User storage user = _users[_id];
		Structs.User memory tributor;

		// No tributors
		if(user.referrers.length == 0) {
			// If the user's followers is less than aggregate followers, claim the pool
			if(user.followers <= wokeToken.followerBalance() - user.followers) {
				wokeToken.internalTransfer(address(this), user.account, _noTributePool);
				_noTributePool = 0;
				return (0, _noTributePool); 
			}

			// If the user's followers is greater than aggregate followers, bonus goes to pool
			if(user.followers > wokeToken.followerBalance() - user.followers) {
				wokeToken.internalTransfer(user.account, address(this), _bonusPool);
				_noTributePool += _bonusPool;
				return (_bonusPool, _noTributePool);
			}
		}

		// 1. Create weighting groups
		Structs.WeightingGroup[] memory groups = new Structs.WeightingGroup[](user.referrers.length);
		//for(uint i = 0; i < user.referrers.length; i++) {
		//	address referrer = user.referrers[i];
		//	tributor = users[userIds[referrer]];
		//	uint256 amount = user.referralAmount[referrer]; // not available outside of storage
		//	groups[i] = Structs.WeightingGroup(tributor.followers, amount, wokeToken.balanceOf(referrer), 0);
		//}
		for(uint32 i = 0; i < _users[_id].referrers.length; i++) {
			address referrer = _users[_id].referrers[i];
			tributor = _users[_userIds[referrer]];
			uint256 amount = _users[_id].referralAmount[referrer]; // not available outside of storage

			groups[i] = Structs.WeightingGroup(tributor.followers, amount, wokeToken.balanceOf(referrer), 0);
		}

		// 2. Calculae and transfer bonuses
		//uint256[] memory bonuses = Distribution._calcAllocations(groups, _bonusPool, lnpdfAddress);
		uint256[] memory bonuses = new uint256[](groups.length);
		uint256 total = 0;
		for(uint i = 0; i < user.referrers.length; i++) {
			address referrer = user.referrers[i];
			tributor = _users[_userIds[referrer]];
			wokeToken.internalTransfer(user.account, tributor.account, bonuses[i]);
			total = total.add(bonuses[i]);
		}

		require(total == _bonusPool, 'bonuses != tributeBonusPool');
		return (total, _noTributePool);
	}

	function _calcTributeBonus(
		mapping(string => Structs.User) storage _users,
		mapping(address => string) storage _userIds,
		string memory _id,
		uint256 _minted,
		address _lnpdfAddress
	)
		internal //view
		returns (uint256)
	{
		LogNormalPDF logNormalPDF = LogNormalPDF(_lnpdfAddress);
		// 1. find highest influence weighting in tributors
		uint256 maxWeight = 0;
		uint32 followers;
		Structs.User memory tributor;
		uint256 tributePool = 0;
		emit TraceUint256('tributors', _users[_id].referrers.length);
		for(uint i = 0; i < _users[_id].referrers.length; i++) {
			address referrer = _users[_id].referrers[i];
			tributePool += _users[_id].referralAmount[referrer];
			tributor = _users[_userIds[referrer]];
			uint256 lnpdf = logNormalPDF.lnpdf(tributor.followers);
			if(lnpdf > maxWeight) {
				maxWeight = lnpdf;
				followers = tributor.followers;
			}
		}
		uint256 balance = _minted + tributePool;

		// 2. Calc influence weights
		Structs.WeightingGroup memory userWeights = Structs.WeightingGroup(_users[_id].followers, _minted, balance, 0);
		Structs.WeightingGroup memory tWeights = Structs.WeightingGroup(followers, tributePool, balance, 0);
		Structs.WeightingGroup[] memory groups = new Structs.WeightingGroup[](2);
		groups[0] = userWeights;
		groups[1] = tWeights;
		//groups = [userWeights, tWeights];
		//Structs.WeightingGroup[2] memory groups = [userWeights, tWeights];
		uint256[] memory allocations = _calcAllocations(groups, _minted, _lnpdfAddress);
		//uint256[] memory allocations = new uint256[](groups.length);

		return allocations[1];
	}

	function _calcAllocations(Structs.WeightingGroup[] memory _groups, uint256 _pool, address _lnpdfAddress)
		internal
		returns (uint256[] memory allocations)
	{
		allocations = new uint256[](_groups.length);
		LogNormalPDF logNormalPDF = LogNormalPDF(_lnpdfAddress);
		// 1. find highest influence weighting in tributors
		uint64 sum = 0;
		for(uint i = 0; i < _groups.length; i++) {
			_groups[i].weighting = logNormalPDF.lnpdf(_groups[i].followers);
			sum += _groups[i].weighting;
		}

		uint256 minAmount = _pool;
		uint32 min = 0;
		uint256 total = 0;
		for(uint32 i = 0; i < _groups.length; i++) {

			// Calculate ratio of group weighting to total weightings
			allocations[i] = (((_groups[i].weighting << 8)/sum) * _pool) >> 8;
			total += allocations[i];

			emit Allocation(i, allocations[i]);

			if(allocations[i] < minAmount) {
				minAmount = allocations[i];
				min = i;
			}
		}


		allocations[min] += _pool.sub(total); // give remainder to smallest beneficiary
		total += _pool.sub(total);
		emit Allocation(min, allocations[min]);
		emit TraceUint256('totalAllocations', total);
		return allocations;
	}
	event Allocation(uint32 i, uint256 amount);
	event TraceUint256(string m, uint256 v);
}
