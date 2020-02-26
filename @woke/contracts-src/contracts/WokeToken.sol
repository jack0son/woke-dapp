pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./libraries/Strings.sol";
import "./libraries/ECDSA.sol";
import "./libraries/Helpers.sol";

import "./mocks/TwitterOracleMock.sol";

/*
 * @title WokeToken ERC20 Contract
 * @notice Registers and stores user IDs and manages token transfers.
 */

/*
 *	Needs multisig with admin wallet that prevents spamming of claims to 
 *	large profile accounts.
 * TODO:
 *  - more rigourous invariant modifiers
 *  - could get a multiplier based on the size of the unclaimed pool
 *  - replace @notice tag with something clearer
 *  - Neccessity of sending userID with transaction with user is alread claimed?
 *  - look into replace 'Claimed' terminology with roles
 */

contract WokeToken is Ownable, ERC20 {
	struct User {
		address account;
		uint256 followers;
		uint256 unclaimedBalance;
		uint256 tipBalance;
		mapping(address => uint256) referralAmount;
		address[] referrers;
	}

	/* CONTRACT STORAGE */
	// Constants
	bool DEFAULT_TIP_ALL = true;

	// Protocol contracts
	address public tippingAgent;
	address public twitterClient;
	byte authVersion = 0x01; // Claim string / auth token version
	byte appId = 0x0A;		// Auth app, only twitter for now


	// Token generation parameters
	uint256 public maxSupply;
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
		address _twitterClient, 
		address _tippingAgent, 
		//uint32 _reward, 
		//uint32 _multiplier, 
		//uint32 _halving,
		uint32 _maxSupply
	) public payable {
		twitterClient = _twitterClient;
		tippingAgent = _tippingAgent;
		maxSupply = _maxSupply;
		//reward = _reward;
		//multiplier = _multiplier;
		userCount = 0;
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
		bytes32 queryId = client.findTweet(_user);
		//bytes32 queryId = bytes32(0);

		if(queryId == bytes32(0)) {
			// Query failure, revert
			emit TraceBytes32('failed query', queryId);
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
		require(verifyClaimString(claimer, _id, claimString), "invalid claim string");

		uint256 _followers = 1; // change to function argument

		// address _claimer

		// Link wallet and twitter handle
		userIds[claimer] = _id;
		users[_id].account = claimer;

		// Claim unclaimed transactions and join bonus
		emit Claimed(claimer, _id, claimBonus(_id, _followers));
		userCount += 1;

		emit TraceUint256('balanceClaimed', balanceOf(users[_id].account));
		if(DEFAULT_TIP_ALL) {
			_setTipBalance(_id, balanceOf(users[_id].account));
		}

		requester[_id] = address(0); // @fix delete this value
	}

	// @notice Transfer a new userId's bonus to their account
	// @param _id			User ID
	// @param _followers	Number of follwers
	// @returns Total amount claimed
	function claimBonus(string memory _id, uint256 _followers)
		private
		userIsClaimed(_id)
	returns (uint256)
	{
		// Mint new tokens based on userIds followers
		uint256 bonus = calculateBonus(_followers);

		User memory user = users[_id];
		mint(user.account, bonus);

		uint unclaimedBalance = user.unclaimedBalance;

		// Transfer the unclaimed amount and bonus from the token contract to the user
		if(unclaimedBalance > 0) {
			_transfer(address(this), user.account, unclaimedBalance); 
			// @dev this conditional should always pass
			if(user.referrers.length > 0) {
				for(uint i = 0; i < user.referrers.length; i++) {
					address referrer = user.referrers[i];
					uint reward = mint(
						referrer,
						calculateReward(users[_id].referralAmount[referrer], _followers)
					);
					if(reward > 0) {
						emit Reward(user.account, referrer, _id, userIds[referrer], reward);
					}
					delete user.referrers[i];
				}
			}
		}

		user.unclaimedBalance = 0;

		return bonus + unclaimedBalance;
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
		require(_amount > 0, 'Cannot send 0 tokens');

		_transferUnclaimed(myUser(), _toId, _amount);
	}

	// @notice Trans
	function _transferUnclaimed(string memory _fromId, string memory _toId, uint256 _amount)
		internal
		userIsClaimed(_fromId)
		userNotClaimed(_toId)
		supplyInvariant
	{
		require(_amount > 0, 'Cannot send 0 tokens');

		address from = users[_fromId].account;

		// 1. Transfer the amount from the the sender to the token contract
		// @TODO naughty naughty
		//approve(tippingAgent, _amount);
		//transferFrom(from, address(this), _amount); // @dev Use safe math
		_transfer(from, address(this), _amount); // @dev Use safe math

		// 2. Set the unclaimed balance for the receiving user
		users[_toId].unclaimedBalance += _amount;
		users[_toId].referralAmount[from] = _amount;
		users[_toId].referrers.push(from);

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
		require(_amount > 0, 'Cannot send 0 tokens');

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
		if(_amount == 0) {
			return 0;
		}

		uint256 tipBalance = users[_fromId].tipBalance;
		uint256 amount = _amount > tipBalance ? tipBalance : _amount;

		if(userClaimed(_toId)) {
			_transferClaimed(_fromId, _toId, amount);
		} else {
			_transferUnclaimed(_fromId, _toId, amount);
		}

		users[_fromId].tipBalance = tipBalance - amount;
		require(tipBalance - amount == users[_fromId].tipBalance, "Tip balance invariant violated");

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

	function verifyClaimString(address claimer, string memory _id, string memory _claimString)
	public
	returns (bool)
	{
		// Reconstruct the message hash
		// message = address + userId + appId // @fix + nonce
		bytes32 hash = keccak256(abi.encodePacked(uint256(claimer), _id, appId));
		bytes32 msgHash = ECDSA.messageHash(hash);

		// Extract signature from claim string
		(bytes memory sigHex, byte _authVersion) = Helpers.parseClaim(bytes(_claimString));
		bytes memory sig = Strings.fromHex(sigHex);

		require(_authVersion == authVersion, 'invalid auth version');

		address recovered = ECDSA.recover(msgHash, sig);
		require(recovered == claimer, 'Recovered address does not match claimer address');

		bool result = (recovered == claimer);
		emit Verification(result, recovered, claimer, _id);

		return result;
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
		require(userClaimed(_userId) == false, "User already claimed");
	}

	modifier userIsClaimed(string memory _userId) {
		_userIsClaimed(_userId);
		_;
	}
	function _userIsClaimed(string memory _userId) internal view {
		require(userClaimed(_userId) == true, "User not claimed");
	}

	// @note has<Type>() implies check for mapping of (msg.sender => <Type>)
	// @notice Check if sending account has a claimed user
	modifier hasUser() {
		_hasUser();
		_;
	}
	function _hasUser() internal view {
		bytes memory temp = bytes(userIds[msg.sender]);
		require(temp.length > 0, "Sender has no user ID");
	}

	modifier hasNoUser() {
		_hasNoUser();
		_;
	}
	function _hasNoUser() internal view {
		bytes memory temp = bytes(userIds[msg.sender]);
		require(temp.length == 0, "Sender already has user ID");
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
		require(requestMutexes[msg.sender] == false, "Sender already has a request pending");
		requestMutexes[msg.sender] = true;
	}

	// @notice Release twitterClient for account that initiated request
	// @dev Requires the request lock to be acquired
	modifier requestLocked(address _requester) {
		require(requestMutexes[_requester] == true, "Sender has no request pending");
		_;
		requestMutexes[_requester] = false;
	}

	modifier onlyClient() {
		require(msg.sender == twitterClient, "Sender not Twitter Client");
		_;
	}

	modifier onlyTipAgent() {
		_onlyTipAgent();
		_;
	}
	function _onlyTipAgent() internal view {
		require(msg.sender == tippingAgent, "Sender not tipping agent");
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
	event TraceBytes32(string m, bytes32 v);
	//event TraceBytes(string m, bytes v);
	//event TraceByte(string m, byte v);

	// @param claimed: recipient is claimed
	//event Tx(string fromId, string toId, string indexed fromId_ind, string indexed toId_ind, uint256 amount, bool claimed);
	event Tx(address indexed from, address indexed to, string fromId, string toId, uint256 amount, bool claimed);
	event Tip(string fromId, string toId, uint256 amount);

	event Claimed (address indexed account, string userId, uint256 amount);
	event Reward (address indexed claimer, address indexed referrer, string claimerId, string referrerId, uint256 amount);
	event Verification(bool value, address recovered, address claimer, string userId);
	event Lodged (address indexed claimer, string userId, bytes32 queryId);
}
