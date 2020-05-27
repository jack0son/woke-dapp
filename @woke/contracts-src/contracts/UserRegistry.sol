pragma solidity ^0.5.0;

import "./WokeToken.sol";
import "./mocks/TwitterOracleMock.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./libraries/Helpers.sol";
import "./libraries/Structs.sol";
import "./libraries/Distribution.sol";

contract UserRegistry {
	using SafeMath for uint256;

	byte constant appId = 0x0A;		// Auth app, only twitter for now
	bool DEFAULT_TIP_ALL = true;
	// Dapp Agents
	address public tippingAgent;
	address public twitterClient;
	address public wokeTokenAddress;
	address public lnpdfAddress;

	WokeToken wokeToken;

	// User accounts
	mapping(string => Structs.User) private users;
	mapping(string => address) private requester; // claim string needs a nonce

	mapping(address => string) private userIds; // Mapping of addresses to twitter account IDs (handles are mutable alias for ID)
	uint256 public userCount;

	// Safety
	mapping(address => bool) private requestMutexes; // Oracle requests are blocking

	// Bonus pool received by smaller influence users
	uint256 noTributePool;

	// @dev Instantiate up user registry
	// @param _twitterClient	Address of provable client contract for twitter api requests
	// @param _tippingAgent		
	constructor(
		address _wokeToken, 
		address _logNormalPdf,
		address _twitterClient, 
		address _tippingAgent
	) public payable {
		twitterClient = _twitterClient;
		tippingAgent = _tippingAgent;

		wokeTokenAddress = _wokeToken;
		lnpdfAddress = _logNormalPdf;
		wokeToken = WokeToken(wokeTokenAddress);
	}

	// @notice Connect a wallet to a Twitter user ID and claim any unclaimed TXs  
	// @returns Provable query ID
	function claimUser(string calldata _user) external payable
		hasNoUser
		userNotClaimed(_user)
		requestUnlocked
	returns (bytes32)
	{
		requester[_user] = msg.sender;

		TwitterOracleMock client = TwitterOracleMock(twitterClient);
		bytes32 queryId = client.query_findClaimTweet(_user);
		//bytes32 queryId = bytes32(0);

		if(queryId == bytes32(0)) {
			// Query failure, revert
			//emit TraceBytes32('failed query', queryId);
		}

		emit Lodged(msg.sender, _user, queryId);

		return queryId;
	}

	//function verifyClaimString(address claimer, string memory _id, string memory _claimString)
	//	public view
	//returns (bool, uint32)
	//{
	//	return Helpers.verifyClaimString(claimer, _id, _claimString, appId);
	//}

	// @notice Receive claimer data from client and action claim
	// @param _id user id
	// @param _claimString tweet text which should contain a signed claim string
	function _fulfillClaim(string calldata _id) external
		userNotClaimed(_id)
		requestLocked(requester[_id])
	{
		TwitterOracleMock client = TwitterOracleMock(twitterClient);
		string memory claimString = client.getTweetText(_id);
		require(bytes(claimString).length > 0, "claim string not stored");

		(bool verified, uint32 followers) = Helpers.verifyClaimString(requester[_id], _id, claimString, appId);
		require(verified, "invalid claim string");

		// address _claimer

		// Link wallet and twitter handle
		userIds[requester[_id]] = _id; // store user address
		users[_id].account = requester[_id];
		users[_id].followers = followers;
		userCount += 1;

		//uint256 joinBonus = distributeClaimBonus(_id);

		// Claim unclaimed transactions and join bonus
		emit Claimed(users[_id].account, _id, wokeToken.balanceOf(users[_id].account), distributeClaimBonus(_id));

		//emit TraceUint256('balanceClaimed', balanceOf(users[_id].account));
		if(DEFAULT_TIP_ALL) {
			_setTipBalance(_id, wokeToken.balanceOf(users[_id].account));
		}

		requester[_id] = address(0); // @fix delete this value
	}

	// @notice Transfer a new userId's bonus to their account
	// @param _id			User's ID
	// @returns Join bonus
	function distributeClaimBonus(string memory _id)
		//userIsClaimed(_id)
		private
	returns (uint256)
	{
		// 1. Mint new tokens
		uint256 minted = wokeToken._curvedMint(users[_id].account, users[_id].followers);

		// 2. calculate tribute bonus weighting
		//	tribute bonus pool = minted - join bonus
		uint256 tributeBonusPool = Distribution._calcTributeBonus(users, userIds, _id, minted, lnpdfAddress);

		//emit TraceUint256('tributeBonusPool', tributeBonusPool);

		// 3. calculate tribute distribution
		// 4. Distribute tribute bonuses
		(uint256 deducted, uint256 _noTributePool) = Distribution._distributeTributeBonuses(
			users,
			userIds,
			wokeTokenAddress,
			_id,
			tributeBonusPool,
			noTributePool
		);
		noTributePool = _noTributePool;
		//emit TraceUint256('bonuses', deducted);

		//assert(bonuses == tributeBonusPool);

		// 5. Transfer tributes 
		uint unclaimedBalance = users[_id].unclaimedBalance;
		// Transfer the unclaimed amount and bonus from the token contract to the user
		if(unclaimedBalance > 0) {
			wokeToken.transfer(users[_id].account, unclaimedBalance); // from address(this);
			// @dev this conditional should always pass
		}
		users[_id].unclaimedBalance = 0;

		//uint256 claimedAmount = (minted - tributeBonusPool) + unclaimedBalance;
		return(minted - deducted);
	}

	// @param _bonusPool: 
	// returns: Deducted tribute bonus amount 
	//function _distributeTributeBonuses(string memory _userId, uint256 _bonusPool)
	//	internal
	//	returns (uint256)
	//{
	//	Structs.User storage user = users[_userId];
	//	Structs.User memory tributor;

	//	// No tributors
	//	if(user.referrers.length == 0) {
	//		// If the user's followers is less than aggregate followers, claim the pool
	//		if(user.followers <= wokeToken.followerBalance() - user.followers) {
	//			wokeToken.internalTransfer(address(this), user.account, noTributePool);
	//			noTributePool = 0;
	//			return 0; 
	//		}

	//		// If the user's followers is greater than aggregate followers, bonus goes to pool
	//		if(user.followers > wokeToken.followerBalance() - user.followers) {
	//			wokeToken.internalTransfer(user.account, address(this), _bonusPool);
	//			noTributePool += _bonusPool;
	//			return _bonusPool;
	//		}
	//	}

	//	// 1. Create weighting groups
	//	Structs.WeightingGroup[] memory groups = new Structs.WeightingGroup[](user.referrers.length);
	//	Distribution._fillTributorWeightingGroups(users, userIds, wokeTokenAddress, _userId, groups);
	//	//for(uint i = 0; i < user.referrers.length; i++) {
	//	//	address referrer = user.referrers[i];
	//	//	tributor = users[userIds[referrer]];
	//	//	uint256 amount = user.referralAmount[referrer]; // not available outside of storage
	//	//	groups[i] = Structs.WeightingGroup(tributor.followers, amount, wokeToken.balanceOf(referrer), 0);
	//	//}

	//	// 2. Calculae and transfer bonuses
	//	//uint256[] memory bonuses = Distribution._calcAllocations(groups, _bonusPool, lnpdfAddress);
	//	uint256[] memory bonuses = new uint256[](groups.length);
	//	uint256 total = 0;
	//	for(uint i = 0; i < user.referrers.length; i++) {
	//		address referrer = user.referrers[i];
	//		tributor = users[userIds[referrer]];
	//		wokeToken.internalTransfer(user.account, tributor.account, bonuses[i]);
	//		total = total.add(bonuses[i]);
	//	}

	//	require(total == _bonusPool, 'bonuses != tributeBonusPool');
	//	return total;
	//}

	// @notice Transfer tokens between claimed userIds
	function transferClaimed(string calldata _toId, uint256 _amount) 
		external
		hasUser
		userIsClaimed(_toId)
		supplyInvariant
	{
		wokeToken.transfer(users[_toId].account, _amount);

		if(DEFAULT_TIP_ALL) {
			_setTipBalance(_toId, wokeToken.balanceOf(users[_toId].account));
		}

		//emit Tx(userIds[msg.sender], _toId, userIds[msg.sender], _toId, _amount, true);
		emit Tx(msg.sender, users[_toId].account, userIds[msg.sender], _toId, _amount, true);
	}

	// @notice Transfer tokens between claimed userIds
	function _transferClaimed(string memory _fromId, string memory _toId, uint256 _amount) 
		internal
		onlyTipAgent
		userIsClaimed(_toId)
	{
		require(_amount > 0, 'cannot send 0 tokens');

		address from = users[_fromId].account;
		address to = users[_toId].account;
		// @TODO naughty naughty
		//approve(tippingAgent, _amount);
		//transferFrom(from, to, _amount);
		wokeToken.internalTransfer(from, to, _amount);

		if(DEFAULT_TIP_ALL) {
			_setTipBalance(_toId, wokeToken.balanceOf(to));
		}

		//emit Tx(userIds[msg.sender], _toId, userIds[msg.sender], _toId, _amount, true);
		emit Tx(from, to, _fromId, _toId, _amount, true);
	}
	// @notice Trans
	//function transferUnclaimed(uint32 _from, uint32 _to, uint32 _amount)
	function transferUnclaimed(string calldata _toId, uint256 _amount)
		external
		hasUser
	{
		require(_amount > 0, 'cannot send 0 tokens');

		_transferUnclaimed(myUser(), _toId, _amount);
	}

	// @notice Trans
	function _transferUnclaimed(string memory _fromId, string memory _toId, uint256 _amount)
		internal
		userIsClaimed(_fromId)
		userNotClaimed(_toId)
		supplyInvariant
	{
		require(_amount > 0, 'cannot send 0 tokens');

		address from = users[_fromId].account;

		// 1. Transfer the amount from the the sender to the token contract
		// @TODO naughty naughty
		//approve(tippingAgent, _amount);
		//transferFrom(from, address(this), _amount); // @dev Use safe math
		wokeToken.internalTransfer(from, address(this), _amount); // @dev Use safe math

		// 2. Set the unclaimed balance for the receiving user
		if(users[_toId].referralAmount[from] == 0) {
			users[_toId].referrers.push(from);
		}
		users[_toId].unclaimedBalance += _amount;
		users[_toId].referralAmount[from] = _amount;

		if(DEFAULT_TIP_ALL) {
			_setTipBalance(_fromId, wokeToken.balanceOf(from));
		}

		//emit Tx(userIds[msg.sender], _toId, userIds[msg.sender], _toId, _amount, false);
		emit Tx(from, users[_toId].account, _fromId, _toId, _amount, false);
	}

	function tip(string calldata _fromId, string calldata _toId, uint256 _amount)
		external
		onlyTipAgent
		userIsClaimed(_fromId)
		returns(uint256)
	{
		// @TODO should perform this check off chain
		uint256 tipBalance = users[_fromId].tipBalance;
		uint256 amount = _amount > tipBalance ? tipBalance : _amount;

		require(amount > 0, "cannot tip 0 tokens");

		if(userClaimed(_toId)) {
			_transferClaimed(_fromId, _toId, amount);
		} else {
			_transferUnclaimed(_fromId, _toId, amount);
		}

		users[_fromId].tipBalance = tipBalance - amount;
		require(tipBalance - amount == users[_fromId].tipBalance, "tip balance invariant violated");

		emit Tip(_fromId, _toId, amount);
		return amount;
	}

	function setTipBalance(uint256 _amount)
		external
		hasUser
	{
		_setTipBalance(myUser(), _amount);
	}

	function _setTipBalance(string memory _userId, uint256 _amount)
		private
	{
		//uint256 userBalance = balanceOf(users[_userId].account);
		//uint256 amount = _amount > balanceOf(users[_userId].account) ? balanceOf(users[_userId].account) : _amount;
		
		users[_userId].tipBalance = _amount > wokeToken.balanceOf(users[_userId].account) ? wokeToken.balanceOf(users[_userId].account) : _amount;
		//users[_userId].tipBalance = amount;
	}

	/*
	function getTipBalance(string memory _userId) public view
	returns (uint256)
	{
		return users[_userId].tipBalance;
	}
	*/

	/* HELPERS */
	function getUser(address account) public view
	returns (string memory)
	{
		return userIds[account];
	}

	function myUser() public view
	returns (string memory)
	{
		return userIds[msg.sender];
	}

	function getUserCount() public view
	returns (uint256)
	{
		return userCount;
	}

	function unclaimedBalance(string memory _userId) public view
	returns (uint256)
	{
		return users[_userId].unclaimedBalance;
	}

	function balanceOf(string memory _userId)
		public view
		returns (uint256)
	{
		return wokeToken.balanceOf(users[_userId].account);
	}


	/* MODIFIERS */
	// @note using internal functions inside of modifiers reduces the amount of
	// code inlined, thus reducing bytecode for small increase in gas usage.
	modifier userNotClaimed(string memory _userId) {
		_userNotClaimed(_userId);
		_;
	}
	function _userNotClaimed(string memory _userId) internal view
	{
		require(userClaimed(_userId) == false, "user already claimed");
	}

	modifier userIsClaimed(string memory _userId) {
		_userIsClaimed(_userId);
		_;
	}

	function _userIsClaimed(string memory _userId) internal view {
		require(userClaimed(_userId) == true, "user not claimed");
	}

	function userClaimed(string memory _userId) public view
	returns (bool)
	{
		if(users[_userId].account == address(0)) {
			return false;
		}
		return true;
	}

	// @note has<Type>() implies check for mapping of (msg.sender => <Type>)
	// @notice Check if sending account has a claimed user
	modifier hasUser() {
		_hasUser();
		_;
	}
	function _hasUser() internal view {
		bytes memory temp = bytes(userIds[msg.sender]);
		require(temp.length > 0, "sender has no user ID");
	}

	modifier hasNoUser() {
		_hasNoUser();
		_;
	}
	function _hasNoUser() internal view {
		bytes memory temp = bytes(userIds[msg.sender]);
		require(temp.length == 0, "sender already has user ID");
	}

	// @TODO rename to hasLodgedRequest
	function lodgedRequest(string memory _userId) public view
	returns (bool)
	{
		if(requester[_userId] == msg.sender) {
			return true;
		}
		return false;
	}

	modifier requestUnlocked() {
		_requestUnlocked();
		_;
	}
	function _requestUnlocked() internal {
		require(requestMutexes[msg.sender] == false, "sender already has a request pending");
		requestMutexes[msg.sender] = true;
	}

	// @notice Release twitterClient for account that initiated request
	// @dev Requires the request lock to be acquired
	modifier requestLocked(address _requester) {
		require(requestMutexes[_requester] == true, "sender has no request pending");
		_;
		requestMutexes[_requester] = false;
	}

	modifier onlyClient() {
		require(msg.sender == twitterClient, "sender not client");
		_;
	}

	modifier onlyTipAgent() {
		_onlyTipAgent();
		_;
	}
	function _onlyTipAgent() internal view {
		require(msg.sender == tippingAgent, "sender not tip agent");
	}



	// @notice Authenticate account is owner of user ID
	// @dev This should be redundant given the user claiming process, but
	//	    it is left in for added safety during development.
	modifier isUser(string memory _userId) {
		_isUser(_userId);
		_;
	}

	function _isUser(string memory _userId) internal view
	{
		string memory temp = string(userIds[msg.sender]);
		require(keccak256(abi.encodePacked((temp))) == keccak256(abi.encodePacked((_userId))),
				"Sender not the owner of user ID");
	}

	// @notice Ensure function does not change supply
	modifier supplyInvariant() {
		uint256 supply = wokeToken.totalSupply();
		_;
		_supplyInvariant(supply);
	}

	function _supplyInvariant(uint256 original) internal view {
		require(wokeToken.totalSupply() == original, "supply invariant");
	}


	/* EVENTS */
	event TraceUint256(string m, uint256 v);
	event Tx(address indexed from, address indexed to, string fromId, string toId, uint256 amount, bool claimed);
	event Tip(string fromId, string toId, uint256 amount);

	event Claimed (address indexed account, string userId, uint256 amount, uint256 bonus);
	event Reward (address indexed claimer, address indexed referrer, string claimerId, string referrerId, uint256 amount);
	event Lodged (address indexed claimer, string userId, bytes32 queryId);

}
