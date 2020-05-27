pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./WokeFormula.sol";

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


	/* CONTRACT STORAGE */
	// Constants
	uint256 public scale = 10**18; // same scale as ether

	// Protocol contracts
	address public wokeFormulaAddress;
	address public userRegistry;
	//WokeFormula wokeFormula;


	// Token generation parameters
	uint256 public maxSupply;
	uint256 public followerBalance = 0;
	//uint32 public reward;
	//uint32 public multiplier;
	//uint32 public halving;



	// Safety
	mapping(address => bool) private requestMutexes; // Oracle requests are blocking
	/*----------------*/

	// @dev Create token with given generation parameters
	// @param _maxSupply		Total supply of wokeTokens allowed to exist
	constructor(
		address _wokeFormula,
		uint32 _maxSupply
	) public payable {
		maxSupply = _maxSupply;
		wokeFormulaAddress = _wokeFormula;
		wokeFormulaAddress = _wokeFormula;

		_mint(address(this), 1);
		//reward = _reward;
		//multiplier = _multiplier;
	}

	function setUserRegistry(address _userRegistry)
		onlyOwner
		public
	{
		userRegistry = _userRegistry;
	}

	function internalTransfer(address from, address to, uint256 amount)
		onlyUserRegistry
		public
	{
		_transfer(from, to, amount);
	}


	function _curvedMint(address recipient, uint256 _followers)
		onlyUserRegistry
		public
		returns (uint256)
	{
		WokeFormula formula = WokeFormula(wokeFormulaAddress);
		uint256 amount = formula.calculatePurchaseReturn(totalSupply(),	_followers,	followerBalance);
		//uint256 amount = wokeFormula.calculatePurchaseReturn(totalSupply(),	_followers,	followerBalance);
		mint(recipient, amount);
		followerBalance = followerBalance.add(_followers);
		emit Summoned(msg.sender, amount, _followers);
		return amount;
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



	/*-----------------------------*/




	/*---------*/

	/* MODIFIERS */
	// @note using internal functions inside of modifiers reduces the amount of
	// code inlined, thus reducing bytecode for small increase in gas usage.

	// @notice Acquire twitterClient request lock for sender iniating request
	// @dev Require the request lock is available

	modifier onlyUserRegistry() {
		_onlyUserRegistry();
		_;
	}
	function _onlyUserRegistry() internal view {
		require(msg.sender == userRegistry, "sender not user reg");
	}


	/* EVENTS */
	//event TraceString(string m, string v);
	//event TraceUint256(string m, uint256 v);
	//event TraceUint32(string m, uint32 v);
	//event TraceUint64(string m, uint64 v);
	//event TraceBytes32(string m, bytes32 v);
	//event TraceBytes(string m, bytes v);
	//event TraceByte(string m, byte v);

	event Summoned (address indexed account, uint256 amount, uint256 followers);
	// @param claimed: recipient is claimed
	//event Tx(string fromId, string toId, string indexed fromId_ind, string indexed toId_ind, uint256 amount, bool claimed);
}
