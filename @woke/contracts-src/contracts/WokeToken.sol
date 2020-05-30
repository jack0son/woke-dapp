pragma solidity ^0.5.0;
/*
 * @title Woke Network native ERC20 token contract
 * @desc Token minting and transfers.
 */

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./WokeFormula.sol";

/*
 *	Needs multisig with admin wallet that prevents spamming of claims to 
 *	large profile accounts.
 */

contract WokeToken is Ownable, ERC20 {
	using SafeMath for uint256;

	// Protocol contracts
	address public wokeFormulaAddress;
	address public userRegistry;

	// Token generation parameters
	uint256 public maxSupply;
	uint256 public followerBalance = 0;

	// @desc Instantiate Woke Token
	// @dev Influence bonding curve parameters set in WokeFormula 
	// @param _maxSupply: Total supply of wokeTokens allowed to exist
	constructor(
		address _wokeFormula,
		uint32 _maxSupply
	) public payable 
	{
		maxSupply = _maxSupply;
		wokeFormulaAddress = _wokeFormula;
		_mint(address(this), 1);
	}

	// @dev Update user registry contract
	function setUserRegistry(address _userRegistry) public
		onlyOwner
	{
		userRegistry = _userRegistry;
	}

	// @dev Same as ERC20.transferFrom(), without approval
	function internalTransfer(address from, address to, uint256 amount) public
		onlyUserRegistry
	{
		_transfer(from, to, amount);
	}

	// @desc Mint tokens along the influence bonding curve for given follower count
	// @dev User's follower count servers the role of an ETH deposit in a
	//	traditional bonding curve.
	// @param _recipient: receives the minted tokens
	// @param _followers: recipient's follower count
	// @returns Amount minted
	function _curvedMint(address recipient, uint256 _followers)
		onlyUserRegistry
		public
		returns (uint256)
	{
		if(_followers > followerBalance) {
			// Aggregate followers at most doubles
			_followers = followerBalance + 1;
		}

		WokeFormula formula = WokeFormula(wokeFormulaAddress);
		uint256 amount = formula.calculatePurchaseReturn(totalSupply(),	_followers,	followerBalance);
		amount = mint(recipient, amount); // if we reach max supply
		followerBalance = followerBalance.add(_followers);

		emit Summoned(msg.sender, amount, _followers);
		return amount;
	}

	// @desc Mint the given amount, or the remaining unminted supply (whichever smallest)
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

	// @desc Only called by Woke Network User Registry
	modifier onlyUserRegistry() {
		_onlyUserRegistry();
		_;
	}
	function _onlyUserRegistry() internal view {
		require(msg.sender == userRegistry, "sender not user reg");
	}

	event Summoned (address indexed account, uint256 amount, uint256 followers);
	//event Tx(string fromId, string toId, string indexed fromId_ind, string indexed toId_ind, uint256 amount, bool claimed);
}
