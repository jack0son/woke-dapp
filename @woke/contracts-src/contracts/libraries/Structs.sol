pragma solidity ^0.5.0;

library Structs {
	struct User {
		address account;
		uint32 followers;
		uint256 unclaimedBalance;
		uint256 tipBalance;
		mapping(address => uint256) referralAmount;
		address[] referrers;
	}

	struct WeightingGroup {
		uint32 followers;
		uint256 amount;
		uint256 balance;
		uint256 weighting;
	}
}
