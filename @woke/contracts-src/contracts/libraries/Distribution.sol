pragma solidity ^0.5.0;

import "./Structs.sol";
import "../Math/LogNormalPDF.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

library Distribution {
	using SafeMath for uint256;

	function _calcTributeBonus(
		mapping(string => Structs.User) storage _users,
		mapping(address => string) storage _userIds,
		string memory _id,
		uint256 _minted,
		address _lnpdfAddress
	)
		internal view
		returns (uint256)
	{
		LogNormalPDF logNormalPDF = LogNormalPDF(_lnpdfAddress);
		// 1. find highest influence weighting in tributors
		uint256 maxWeight = 0;
		uint32 followers;
		Structs.User memory tributor;
		uint256 tributePool = 0;
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

		return allocations[1];
	}

	function _calcAllocations(Structs.WeightingGroup[] memory _groups, uint256 _pool, address _lnpdfAddress)
		internal view
		returns (uint256[] memory allocations)
	{
		LogNormalPDF logNormalPDF = LogNormalPDF(_lnpdfAddress);
		// 1. find highest influence weighting in tributors
		uint256 ratio;
		uint256 normal = 0;
		for(uint i = 0; i < _groups.length; i++) {
			_groups[i].weighting = logNormalPDF.lnpdf(_groups[i].followers);
			normal += _groups[i].weighting;
		}

		uint256 minRatio = 0;
		uint min = 0;
		uint256 total = 0;
		for(uint i = 0; i < _groups.length; i++) {
			ratio = _groups[i].weighting.div(normal);
			// TODO use integer division overflow to result in floor
			//allocations[i] = Math.floor(pool.mul(ratio));
			allocations[i] = _pool.mul(ratio);

			total += allocations[i];

			if(ratio < minRatio) {
				minRatio = ratio;
				min = i;
			}
		}

		allocations[min] += _pool.sub(total); // give remainder to smallest beneficiary
		return allocations;
	}
}
