pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./libraries/Strings.sol";
import "./libraries/Helpers.sol";
import "./libraries/Curves.sol";

import "./WokeFormula.sol";
import "./mocks/TwitterOracleMock.sol";

/*
 * @title WokeToken ERC20 Contract
 * @notice Registers and stores user IDs and manages token transfers.
 */

/*
 *	Needs multisig with admin wallet that prevents spamming of claims to 
 *	large profile accounts.
 * TODO:
 *  - replace @notice tag with descrip or dev
 *  - Duplication of formula constants
 */

contract WokeToken is Ownable, ERC20 {
	using SafeMath for uint256;

	struct User {
		address account;
		uint32 followers;
		uint256 unclaimedBalance;
		uint256 tipBalance;
		mapping(address => uint256) referralAmount;
		address[] referrers;
	}

	/* CONTRACT STORAGE */
	// Constants
	bool DEFAULT_TIP_ALL = true;
	uint256 public scale = 10**18; // same scale as ether

	// Protocol contracts
	address public wokeFormula;
	address public tippingAgent;
	address public twitterClient;
	byte appId = 0x0A;		// Auth app, only twitter for now


	// Token generation parameters
	uint256 public maxSupply;
	uint256 public followerBalance = 0;
	//uint32 public reward;
	//uint32 public multiplier;
	//uint32 public halving;

	// User accounts
	mapping(address => string) userIds; // Mapping of addresses to twitter account IDs (handles are mutable alias for ID)
	mapping(string => User) users;
	mapping(string => address) requester; // claim string needs a nonce

	uint256 private userCount;

	// Safety
	mapping(address => bool) private requestMutexes; // Oracle requests are blocking
	/*----------------*/

	// @dev Create token with given generation parameters
	// @param _twitterClient	Address of provable client contract for twitter api requests
	// @param _tippingAgent		Address of chainlink client contract for twitter api requests
	// @param _maxSupply		Total supply of wokeTokens allowed to exist
	// @param _reward			Linear coeffient for token generation curve
	// @param _multiplier		Reward multiplier for Eth contribution
	constructor(
		address _wokeFormula,
		address _twitterClient, 
		address _tippingAgent, 
		//uint32 _reward, 
		//uint32 _multiplier, 
		//uint32 _halving,
		uint32 _maxSupply
	) public payable {
		wokeFormula = _wokeFormula;
		twitterClient = _twitterClient;
		tippingAgent = _tippingAgent;
		maxSupply = _maxSupply;
		//reward = _reward;
		//multiplier = _multiplier;
		userCount = 0;
	}

	function _curvedMint(address recipient, uint256 _followers)
		//validMint(_followers)
		internal
	returns (uint256) {
		WokeFormula forumula = WokeFormula(wokeFormula);
		uint256 amount = forumula.calculatePurchaseReturn(totalSupply(),	_followers,	followerBalance);
		mint(recipient, amount);
		followerBalance = followerBalance.add(_followers);
		emit Summoned(msg.sender, amount, _followers);
		return amount;
	}

	// @notice Connect a wallet to a Twitter user ID and claim any unclaimed TXs  
	// @returns Provable query ID
	function claimUser(string memory _user) public payable
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

	// @notice Receive claimer data from client and action claim
	// @param _id user id
	// @param _claimString tweet text which should contain a signed claim string
	function _fulfillClaim(string memory _id) public
		userNotClaimed(_id)
		requestLocked(requester[_id])
	{
		TwitterOracleMock client = TwitterOracleMock(twitterClient);
		string memory claimString = client.getTweetText(_id);
		require(bytes(claimString).length > 0, "claim string not stored");

		address claimer = requester[_id];
		(bool verified, uint32 followers) = Helpers.verifyClaimString(claimer, _id, claimString, appId);
		require(verified, "invalid claim string");

		// address _claimer

		// Link wallet and twitter handle
		userIds[claimer] = _id;
		users[_id].account = claimer;
		users[_id].followers = followers;
		userCount += 1;

		uint256 joinBonus = distributeClaimBonus(_id);

		// Claim unclaimed transactions and join bonus
		emit Claimed(claimer, _id, joinBonus);

		//emit TraceUint256('balanceClaimed', balanceOf(users[_id].account));
		if(DEFAULT_TIP_ALL) {
			_setTipBalance(_id, balanceOf(users[_id].account));
		}

		requester[_id] = address(0); // @fix delete this value
	}

	// @notice Transfer a new userId's bonus to their account
	// @param _id			User's ID
	// @returns Total amount claimed
	function distributeClaimBonus(string memory _id)
		private
		userIsClaimed(_id)
	returns (uint256)
	{
		// 1. determine amount to mint (summon new tokens)
		// 2. calc tribute bonus weighting
		// 3. calculate tribute distribution
		// 4. Distribute tribute bonuses
		// 5. Transfer tributes to new user

		User memory user = users[_id];
		// 1. Mint new tokens
		uint256 minted = _curvedMint(user.account, user.followers);

		// 2. calculate tribute bonus weighting
		//	tribute bonus pool = minted - join bonus
		uint256 tributeBonusPool = _calcTributeBonus(_id, minted);

		// 3. calculate tribute distribution
		// 4. Distribute tribute bonuses
		uint256 bonuses = _distributeTributeBonuses(_id, tributeBonusPool);
		assert(bonuses == tributeBonusPool);

		// 5. Transfer tributes 
		uint unclaimedBalance = user.unclaimedBalance;
		// Transfer the unclaimed amount and bonus from the token contract to the user
		if(unclaimedBalance > 0) {
			_transfer(address(this), user.account, unclaimedBalance); 
			// @dev this conditional should always pass
		}
		user.unclaimedBalance = 0;

		return (minted - tributeBonusPool) + unclaimedBalance;
	}

	// @param _bonusPool: 
	function _distributeTributeBonuses(string memory _userId, uint256 _bonusBool)
		internal
		userIsClaimed(_userId)
		returns (uint256)
	{
		User storage user = users[_userId];
		User memory tributor;

		// 1. Create weighting groups
		WeightingGroup[] memory groups = new WeightingGroup[](user.referrers.length);
		for(uint i = 0; i < user.referrers.length; i++) {
			address referrer = user.referrers[i];
			tributor = users[userIds[referrer]];
			uint256 amount = user.referralAmount[referrer]; // not available outside of storage
			groups[i] = WeightingGroup(tributor.followers, amount, balanceOf(referrer), 0);
		}

		// 2. Calculae and transfer bonuses
		uint256[] memory bonuses = _calcAllocations(groups, _bonusBool);
		uint256 total = 0;
		for(uint i = 0; i < user.referrers.length; i++) {
			address referrer = user.referrers[i];
			tributor = users[userIds[referrer]];
			_transfer(user.account, tributor.account, bonuses[i]);
			total = total.add(bonuses[i]);
		}

		return total;
	}

	struct WeightingGroup {
		uint32 followers;
		uint256 amount;
		uint256 balance;
		uint256 weighting;
	}

	function _calcInfluenceWeight(User memory user, uint256 poolAmount) internal
		returns (uint256)
	{
		uint256 numerator = Curves.logNormalPDF(user.followers);
		//uint256 denom = Sqrt(user.amount/(user.balance * poolAmount));
		return numerator;
	}

	function _calcAllocations(WeightingGroup[] memory groups, uint256 pool)
		internal
		returns (uint256[] memory allocations)
	{
		uint256 ratio;
		uint256 weighting;
		uint256 normal = 0;
		for(uint i = 0; i < groups.length; i++) {
			groups[i].weighting = Curves.logNormalPDF(groups[i].followers);
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

	function _calcTributeBonus(string memory _userId, uint256 minted) internal
		returns (uint256)
	{
		User storage user = users[_userId];
		// 1. find highest influence weighting in tributors
		uint256 maxWeight = 0;
		uint32 followers;
		User memory tributor;
		uint256 tributePool = 0;
		for(uint i = 0; i < user.referrers.length; i++) {
			address referrer = user.referrers[i];
			tributePool += user.referralAmount[referrer];
			tributor = users[userIds[referrer]];
			uint256 lnpdf = Curves.logNormalPDF(tributor.followers);
			if(lnpdf > maxWeight) {
				maxWeight = lnpdf;
				followers = tributor.followers;
			}
		}
		uint256 balance = minted + tributePool;

		// 2. Calc influence weights
		WeightingGroup memory userWeights = WeightingGroup(user.followers, minted, balance, 0);
		WeightingGroup memory tWeights = WeightingGroup(followers, tributePool, balance, 0);
		WeightingGroup[] memory groups = new WeightingGroup[](2);
		groups[0] = userWeights;
		groups[1] = tWeights;
		//groups = [userWeights, tWeights];
		//WeightingGroup[2] memory groups = [userWeights, tWeights];
		uint256[] memory allocations = _calcAllocations(groups, minted);

		return allocations[1];
	}


	// @notice Mint the given amount, or the remaining unminted supply
	// @returns Amount minted
	function mint(address _recipient, uint256 _amount) internal
	returns (uint256)
	{
		if(_amount + totalSupply() > maxSupply) {
			_amount = maxSupply - totalSupply();
		}
		_mint(_recipient, _amount);
		return _amount;
	}

	// @notice Trans
	//function transferUnclaimed(uint32 _from, uint32 _to, uint32 _amount)
	function transferUnclaimed(string memory _toId, uint256 _amount)
		public
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
		_transfer(from, address(this), _amount); // @dev Use safe math

		// 2. Set the unclaimed balance for the receiving user
		if(users[_toId].referralAmount[from] == 0) {
			users[_toId].referrers.push(from);
		}
		users[_toId].unclaimedBalance += _amount;
		users[_toId].referralAmount[from] = _amount;

		if(DEFAULT_TIP_ALL) {
			_setTipBalance(_fromId, balanceOf(from));
		}

		//emit Tx(userIds[msg.sender], _toId, userIds[msg.sender], _toId, _amount, false);
		emit Tx(from, users[_toId].account, _fromId, _toId, _amount, false);
	}

	// @notice Transfer tokens between claimed userIds
	function transferClaimed(string memory _toId, uint256 _amount) 
		public
		hasUser
		userIsClaimed(_toId)
		supplyInvariant
	{
		transfer(users[_toId].account, _amount);

		if(DEFAULT_TIP_ALL) {
			_setTipBalance(_toId, balanceOf(users[_toId].account));
		}

		//emit Tx(userIds[msg.sender], _toId, userIds[msg.sender], _toId, _amount, true);
		emit Tx(msg.sender, users[_toId].account, userIds[msg.sender], _toId, _amount, true);
	}

	// @notice Transfer tokens between claimed userIds
	function _transferClaimed(string memory _fromId, string memory _toId, uint256 _amount) 
		internal
		onlyTipAgent
		userIsClaimed(_toId)
		supplyInvariant
	{
		require(_amount > 0, 'cannot send 0 tokens');

		address from = users[_fromId].account;
		address to = users[_toId].account;
		// @TODO naughty naughty
		//approve(tippingAgent, _amount);
		//transferFrom(from, to, _amount);
		_transfer(from, to, _amount);

		if(DEFAULT_TIP_ALL) {
			_setTipBalance(_toId, balanceOf(to));
		}

		//emit Tx(userIds[msg.sender], _toId, userIds[msg.sender], _toId, _amount, true);
		emit Tx(from, to, _fromId, _toId, _amount, true);
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
		
		users[_userId].tipBalance = _amount > balanceOf(users[_userId].account) ? balanceOf(users[_userId].account) : _amount;
		//users[_userId].tipBalance = amount;
	}

	/* TOKEN GENERATION PARAMETERS */
	// Calculate the joining bonus based
	// @dev Defines token generation curve
	function calculateBonus(uint256 _followers) 
	public view
	returns(uint256)
	{
		// @fix factor in halving e.g. *(halving/2)
		// @fix factor in userCount
		// @fix use safeMath
		uint256 unclaimedPool = balanceOf(address(this)); // total unclaimed tokens

		uint256 count = userCount;
		if(count == 0) {
			count = 1;
		}
		
		uint256 bonus = 50 + ((_followers * unclaimedPool) / count); // * multiplier
		return bonus;
	}

	// @notice Calculate the referral reward for an unclaimed user joining
	// @param _contribution: Amount sent by referrer to unclaimed user
	// @param _followers: Unclaimed user's follwer count
	function calculateReward(uint256 _contribution, uint256 _followers) 
	public view
	returns(uint256)
	{
		uint256 count = userCount;
		if(count == 0) {
			count = 1;
		}
		uint reward = (_contribution * _followers) / count;
		return reward;
	}
	/*-----------------------------*/


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

	function userBalance(string memory _userId) public view
	returns (uint256)
	{
		// unclaimed vs claimed?
		return balanceOf(users[_userId].account);
	}

	function userClaimed(string memory _userId) public view
	returns (bool)
	{
		if(users[_userId].account == address(0)) {
			return false;
		}
		return true;
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

	/*
	function getTipBalance(string memory _userId) public view
	returns (uint256)
	{
		return users[_userId].tipBalance;
	}
	*/
	/*---------*/

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

	// @notice Acquire twitterClient request lock for sender iniating request
	// @dev Require the request lock is available
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

	modifier supplyInvariant() {
		uint256 supply = totalSupply();
		_;
		_supplyInvariant(supply);
	}
	function _supplyInvariant(uint256 original) internal view {
		require(totalSupply() == original, "supply invariant");
	}

	/* EVENTS */
	event TraceString(string m, string v);
	event TraceUint256(string m, uint256 v);
	event TraceUint32(string m, uint32 v);
	//event TraceUint64(string m, uint64 v);
	event TraceBytes32(string m, bytes32 v);
	//event TraceBytes(string m, bytes v);
	//event TraceByte(string m, byte v);

	// @param claimed: recipient is claimed
	//event Tx(string fromId, string toId, string indexed fromId_ind, string indexed toId_ind, uint256 amount, bool claimed);
	event Tx(address indexed from, address indexed to, string fromId, string toId, uint256 amount, bool claimed);
	event Tip(string fromId, string toId, uint256 amount);

	event Claimed (address indexed account, string userId, uint256 amount);
	event Summoned (address indexed account, uint256 amount, uint256 followers);
	event Reward (address indexed claimer, address indexed referrer, string claimerId, string referrerId, uint256 amount);
	event Lodged (address indexed claimer, string userId, bytes32 queryId);
}
