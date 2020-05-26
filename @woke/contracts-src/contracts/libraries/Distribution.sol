pragma solidity ^0.5.0;

import "./Structs.sol";
import "../Math/LogNormalPDF.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

library Distribution {
	using SafeMath for uint256;

	function _calcTributeBonus(
		mapping(string => Structs.User) storage users,
		mapping(address => string) storage userIds,
		string memory _userId,
		uint256 minted,
		address lnpdfAddress
	)
		internal
		returns (uint256)
	{
		Structs.User storage user = users[_userId];
		LogNormalPDF logNormalPDF = LogNormalPDF(lnpdfAddress);
		// 1. find highest influence weighting in tributors
		uint256 maxWeight = 0;
		uint32 followers;
		Structs.User memory tributor;
		uint256 tributePool = 0;
		for(uint i = 0; i < user.referrers.length; i++) {
			address referrer = user.referrers[i];
			tributePool += user.referralAmount[referrer];
			tributor = users[userIds[referrer]];
			uint256 lnpdf = logNormalPDF.lnpdf(tributor.followers);
			if(lnpdf > maxWeight) {
				maxWeight = lnpdf;
				followers = tributor.followers;
			}
		}
		uint256 balance = minted + tributePool;

		// 2. Calc influence weights
		Structs.WeightingGroup memory userWeights = Structs.WeightingGroup(user.followers, minted, balance, 0);
		Structs.WeightingGroup memory tWeights = Structs.WeightingGroup(followers, tributePool, balance, 0);
		Structs.WeightingGroup[] memory groups = new Structs.WeightingGroup[](2);
		groups[0] = userWeights;
		groups[1] = tWeights;
		//groups = [userWeights, tWeights];
		//Structs.WeightingGroup[2] memory groups = [userWeights, tWeights];
		uint256[] memory allocations = _calcAllocations(groups, minted, lnpdfAddress);

		return allocations[1];
	}

	function _calcAllocations(Structs.WeightingGroup[] memory groups, uint256 pool, address lnpdfAddress)
		internal
		returns (uint256[] memory allocations)
	{
		LogNormalPDF logNormalPDF = LogNormalPDF(lnpdfAddress);
		// 1. find highest influence weighting in tributors
		uint256 ratio;
		uint256 weighting;
		uint256 normal = 0;
		for(uint i = 0; i < groups.length; i++) {
			groups[i].weighting = logNormalPDF.lnpdf(groups[i].followers);
			normal += groups[i].weighting;
		}

		uint256 minRatio = 0;
		uint min = 0;
		uint256 total = 0;
		for(uint i = 0; i < groups.length; i++) {
			ratio = groups[i].weighting.div(normal);
			// TODO use integer division overflow to result in floor
			//allocations[i] = Math.floor(pool.mul(ratio));
			allocations[i] = pool.mul(ratio);

			total += allocations[i];

			if(ratio < minRatio) {
				minRatio = ratio;
				min = i;
			}
		}

		allocations[min] += pool.sub(total); // give remaineder to smallest beneficiary
		return allocations;
	}
}
