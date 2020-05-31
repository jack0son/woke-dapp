pragma solidity ^0.5.0;
/*
 * @title Woke Network User Registry Contract
 * @desc Registers and stores user IDs and manages token transfers.
 */

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./WokeToken.sol";
import "./mocks/TwitterOracleMock.sol";
import "./libraries/Helpers.sol";
import "./libraries/Structs.sol";
import "./libraries/Distribution.sol";
import "./Math/LogNormalPDF.sol";

contract UserRegistry is Ownable {
	using SafeMath for uint256;

	byte constant appId = 0x0A;		// Auth app, only twitter for now
	bool DEFAULT_TIP_ALL = true;	// Tipping switch (alpha)

	// Woke Token Contracts
	address public wokeTokenAddress;
	address public lnpdfAddress;

	// Dapp Agents
	address public tippingAgent;
	address public twitterClient;

	WokeToken wokeToken;
	LogNormalPDF logNormalPDF;

	// User accounts
	uint256 public userCount;
	mapping(string => Structs.User) private users;	// userId => User
	mapping(address => string) private userIds;		// account => Twitter userId
	mapping(string => address) private requester;	// claim string needs a nonce

	// Distribution calculation
	// sizeOf weighting sum: bits >= log_2(lnpdf.maximum() * maxTributors) ~ 46 bits;
	uint32 public maxTributors;
	mapping(string => uint48) private weightSums;	// userId => sum of referrer weightingss
	mapping(string => uint40) private maxWeights;	// userId => max referrer weighting
	mapping(string => uint40) private maxFollowers;	// userId => max referrer followers

	// Bonus pool received by smaller influence users
	uint256 public noTributePool; // Excess tokens minted by influence whales

	// Safety
	mapping(address => bool) private requestMutexes; // Oracle requests are blocking

	// @desc Instantiate user registry
	// @param _twitterClient	Address of provable client contract for twitter api requests
	// @param _tippingAgent		
	constructor(
		address _wokeToken, 
		address _logNormalPdf,
		address _twitterClient, 
		address _tippingAgent,
		uint32 _maxTributors
	) public payable 
	{
		maxTributors = _maxTributors;
		twitterClient = _twitterClient;
		tippingAgent = _tippingAgent;

		wokeTokenAddress = _wokeToken;
		lnpdfAddress = _logNormalPdf;
		wokeToken = WokeToken(wokeTokenAddress);
		logNormalPDF = LogNormalPDF(lnpdfAddress);
	}

	// @desc Connect a wallet to a Twitter user ID and claim any unclaimed TXs  
	// @returns Provable query ID
	function claimUser(string calldata _userId) external payable
		hasNoUser
		userNotClaimed(_userId)
		requestUnlocked
	returns (bytes32)
	{
		requester[_userId] = msg.sender;

		TwitterOracleMock client = TwitterOracleMock(twitterClient);
		bytes32 queryId = client.query_findClaimTweet(_userId);

		require(queryId != bytes32(0), 'queryId is zero');
		//if(queryId == bytes32(0)) {
		//	// Query failure, revert
		//	//emit TraceBytes32('failed query', queryId);
		//}
		emit Lodged(msg.sender, _userId, queryId);

		return queryId;
	}

	// @desc Verify proof message
	// @param _claimString: Tweet text which should contain a signed claim string
	function verifyClaimString(address claimer, string memory _id, string memory _claimString)
		public pure
	returns (bool, uint32)
	{
		return Helpers.verifyClaimString(claimer, _id, _claimString, appId);
	}

	// @desc Finalize user claim - create user, receive unclaimed transactions and bonus
	// @param _id: User id
	function _fulfillClaim(string calldata _id) external
		userNotClaimed(_id)
		requestLocked(requester[_id])
	{
		TwitterOracleMock client = TwitterOracleMock(twitterClient);
		string memory claimString = client.getTweetText(_id);
		require(bytes(claimString).length > 0, "claim string not stored");

		(bool verified, uint32 followers) = verifyClaimString(requester[_id], _id, claimString);
		require(verified, "invalid claim string");

		// Link wallet to twitter id
		userIds[requester[_id]] = _id; // store user address
		users[_id].account = requester[_id];
		users[_id].followers = followers;
		userCount += 1;

		uint256 joinBonus = _distributeClaimBonus(_id);

		// Claim unclaimed transactions and join bonus
		emit Claimed(
			users[_id].account, _id,
			wokeToken.balanceOf(users[_id].account),
			joinBonus
		);

		// Enable tipping
		if(DEFAULT_TIP_ALL) {
			_setTipBalance(_id, wokeToken.balanceOf(users[_id].account));
		}

		requester[_id] = address(0); 
	}

	// @desc Mint new tokens then distribute to user and tributors
	// @param _id: User's twitter ID
	// @returns joinBonus: amount of minted tokens received by new user
	function _distributeClaimBonus(string memory _id) private
	returns (uint256 minted)
	{
		// 1. Mint new tokens
		uint256 prevFollowerBalance = wokeToken.followerBalance();
		minted = wokeToken.curvedMint(users[_id].account, users[_id].followers);

		// 2. Calculate tribute bonus weight, tribute bonus pool = minted - joinBonus
		// TODO pass maxWeights storage reference vs copy maxWeight value
		uint256 tributeBonusPool = Distribution._calcTributeBonus(users, maxWeights, _id, minted, lnpdfAddress);
		require(tributeBonusPool <= minted, 'TRIBUTE MISCALC');

		// 3. Calculate tribute distribution
		Structs.User storage user = users[_id];
		uint256 deducted;

		// No bonus for users without followers
		if(user.followers > 0) {
			if(user.referrers.length == 0) {
				// Limit influence whale impact on minting
				if(user.followers > prevFollowerBalance) {
					wokeToken.burnExcess(user.account, tributeBonusPool);
				}
			} else {
				// Distribute minted tokens to tributors
				deducted = Distribution._distributeTributeBonuses(
					users,
					userIds,
					wokeTokenAddress,
					lnpdfAddress,
					_id,
					tributeBonusPool,
					weightSums[_id]
				);

				// TODO check if this frees any storage 
				maxWeights[_id] = 0;
				weightSums[_id] = 0;
			}
		}

		// 4. Transfer tributes (unclaimed transactions) to new claimed user
		uint256 unclaimedBalance = users[_id].unclaimedBalance;
		if(unclaimedBalance > 0) {
			// Transfer the unclaimed amount and bonus from the token contract to the user
			wokeToken.internalTransfer(address(this), users[_id].account, unclaimedBalance);
		}
		users[_id].unclaimedBalance = 0;

		//uint256 claimedAmount = (minted - tributeBonusPool) + unclaimedBalance;
		return minted - deducted;
	}

	// @desc Transfer tokens between claimed userIds
	// @dev Off-chain interface
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

	// @desc Transfer tokens between claimed userIds
	// @dev Internal user - e.g. tipping
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

	// @desc Transfer tokens from a claimed user to an unclaimed user
	// @dev Off-chain interface
	function transferUnclaimed(string calldata _toId, uint256 _amount)
		external
		hasUser
	{
		_transferUnclaimed(myUser(), _toId, _amount);
	}

	// @desc Transfer tokens from a claimed user to an unclaimed user
	function _transferUnclaimed(string memory _fromId, string memory _toId, uint256 _amount)
		internal
		userIsClaimed(_fromId)
		userNotClaimed(_toId)
		supplyInvariant
	{
		require(_amount > 0, 'cannot send 0 tokens');

		address from = users[_fromId].account;

		// 1. Transfer the amount from the the sender to the token contract
		// @TODO should use built in approval functionality
		//approve(tippingAgent, _amount);
		wokeToken.internalTransfer(from, address(this), _amount);

		// 2. Set the unclaimed balance for the receiving user
		// Must limit tributors to avoid exceeding gas limit when sending _fulfillClaim()
		if(users[_toId].referralAmount[from] == 0) {
			// New tributor
			if(users[_toId].referrers.length < maxTributors) {
				users[_toId].referrers.push(from);
				// Store bonus weights to save gas in _fulfillClaim()
				uint40 weight = logNormalPDF.lnpdf(users[_fromId].followers);
				if(weight > maxWeights[_toId]) {
					maxWeights[_toId] = weight;
					maxFollowers[_toId] = users[_fromId].followers;
				}
				weightSums[_toId] += weight;
				users[_toId].referralAmount[from] = _amount;
			}
		} else {
			// Existing tributor
			users[_toId].referralAmount[from] += _amount;
		}

		users[_toId].unclaimedBalance += _amount;

		if(DEFAULT_TIP_ALL) {
			_setTipBalance(_fromId, wokeToken.balanceOf(from));
		}

		emit Tx(from, users[_toId].account, _fromId, _toId, _amount, false);
	}

	// @desc Authorized transfer between users
	// @dev Called by twitter tipping bot
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

	function setTipBalance(uint256 _amount) external
		hasUser
	{
		_setTipBalance(myUser(), _amount);
	}

	function _setTipBalance(string memory _userId, uint256 _amount) private
	{
		users[_userId].tipBalance = _amount > wokeToken.balanceOf(users[_userId].account) ? wokeToken.balanceOf(users[_userId].account) : _amount;
	}

	function getTipBalance(string memory _userId) public view
	returns (uint256)
	{
		return users[_userId].tipBalance;
	}

    function setMaxTributors(uint32 _maxTributors) public
		onlyOwner
	{
		maxTributors = _maxTributors;
	}

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

	function unclaimedBalanceOf(string memory _userId) public view
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

	// @desc Acquire twitterClient request lock for sender iniating request
	// @dev Require the request lock is available
	modifier requestUnlocked() {
		_requestUnlocked();
		_;
	}
	function _requestUnlocked() internal {
		require(requestMutexes[msg.sender] == false, "sender already has a request pending");
		requestMutexes[msg.sender] = true;
	}

	// @desc Release twitterClient request lock for account that initiated request
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

	// @desc Authenticate account is owner of user ID
	// @dev This should be redundant given the user claiming process, but
	//	    it is left in for added safety during development.
	modifier isUser(string memory _userId) {
		_isUser(_userId);
		_;
	}
	function _isUser(string memory _userId) internal view
	{
		string memory temp = string(userIds[msg.sender]);
		require(keccak256(abi.encodePacked((temp))) == keccak256(
			abi.encodePacked((_userId))),
			"Sender not the owner of user ID"
		);
	}

	// @desc Ensure function does not affect supply
	modifier supplyInvariant() {
		uint256 supply = wokeToken.totalSupply();
		_;
		_supplyInvariant(supply);
	}
	function _supplyInvariant(uint256 original) internal view {
		require(wokeToken.totalSupply() == original, "supply invariant");
	}

	// Events
	event Lodged (address indexed claimer, string userId, bytes32 queryId);
	event Claimed (address indexed account, string userId, uint256 amount, uint256 bonus);
	event Tx(address indexed from, address indexed to, string fromId, string toId, uint256 amount, bool claimed);
	event Tip(string fromId, string toId, uint256 amount);
}
