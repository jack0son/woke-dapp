pragma solidity ^0.5.0;

import "./oraclizeAPI.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
//import "openzeppelin-solidity/contracts/lifecycle/Destructible.sol";


// Claims contract will use ecrecover(bytes32 data, uint8 v, bytes32 r, bytes32 s) returns (address)
// to verify address and id originate from correct wallet

// @title TwitterClient
// @notice Use Provable to retrieve post text from Twitter
//contract UrlRequests is Ownable, Pausable, Destructible, usingOraclize {
contract TwitterOracle is Ownable, Pausable, usingOraclize {

    /* Storage */
    mapping(bytes32 => string) statusId;  // query id => tweet id
    mapping(string => string) statusText; // tweet id => tweet text

    event LogNewQuery(string description);
    event LogResult(string result, bytes proof);
    event LogUpdate(address indexed _owner, uint indexed _balance);
    event TweetStored(string userId, string tweetText);
    event FindTweetLodged(bytes32 queryId, string userId);

    event TraceUint(string m, uint256 v);
    event QueryString(string m);

    constructor() public payable {
        emit LogUpdate(owner(), address(this).balance);

        //OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
        OAR = OraclizeAddrResolverI(0x6abc93b0e36cdF449E121c6225eb25DB8671523C);
        oraclize_setProof(proofType_Android | proofStorage_IPFS);
        //oraclize_setProof(proofType_TLSNotary | proofStorage_IPFS);
    }

   /*
    * @notice Fallback function 
    * @dev Always revert
    */
    function() external {
        revert("Fallback function");
    }

   /* @notice Callback for Provable to return query response
    * @dev Will store the text of a tweet into this contract's storage
    * @param _queryId query ID generated when calling oraclize_query
    * @param _result query result from Provable, should be the tweet text
    * @param _proof authenticity proof returned by Oraclize - unused
    */
    function __callback(
        bytes32 _queryId,
        string memory _result,
        bytes memory _proof
    )
        public
		whenNotPaused
		onlyOracle
    {
        require(
            stringNotEmpty(statusId[_queryId]),
            "The Oraclize query ID does not match an Oraclize request made from this contract."
		);

        emit LogResult(_result, _proof);
	
		string memory tweetId = statusId[_queryId];
		statusText[tweetId] = _result; // @fix this should not be stored due to gas cost

		emit TweetStored(tweetId, _result);
    }

    // example post id 1146384868630130689
    // @dev Retrieve text for a specific tweet id
    function findTweet(string memory _userId)
        public
        payable
	returns (bytes32)
    {
        // Use computation-resource to add headers to GET request - access app-only Twitter API
		// TODO: move query string to separate contract for updating (twitter constantly changing their API)
	
	string memory query = string(abi.encodePacked("https://api.twitter.com/1.1/statuses/user_timeline.json?id=", _userId, "932596541822418944&trim_user=false&tweet_mode=extended&include_entities=false&count=1&exclude_replies=false&include_rts=false"));
	bytes32 queryId = request(
		"json(QmdKK319Veha83h6AYgQqhx9YRsJ9MJE7y33oCXyZ4MqHE).[0].full_text",
                "GET",
		query,
                "{'headers': {'content-type': 'json', 'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAADqP%2FAAAAAAAO%2BuD4C5pzXOMYBYQ9%2BcriYYkPwE%3D7OzTjWo4KxdMbPqdvJqQnMaoWMfjicSbQxyMe8WSZKFUYdOaIn'}}"
        );

        statusId[queryId] = _userId;
	emit FindTweetLodged(queryId, _userId);

	return queryId;
    }

    /**
     * @dev Sends a custom content-type in header and returns the header used
     * as result. Wrap first argument of computation ds with helper needed,
     * such as json in this case
     */
    function request(
        string memory _query,
        string memory _method,
        string memory _url,
        string memory _kwargs
    ) 
        public
	returns (bytes32)
    {
	uint queryPrice = oraclize_getPrice("computation");
	emit TraceUint("query price", queryPrice);
        if (queryPrice > address(this).balance) {
            emit LogNewQuery("Provable query NOT sent, add ETH to cover the query fee");
	    // revert?
        } else {
            emit LogNewQuery("Provable query sent, stand-by for response");
            bytes32 queryId = oraclize_query("computation",
                [_query,
                _method,
                _url,
                _kwargs]
		, 500000
            );

	    return queryId;
        }
    }
    /// @notice This function returns the text of a specific Twitter post stored in this contract
    /// @dev This function will return an empty string in the situation where the Twitter post has not been stored yet
    /// @param _userId status ID for status text to be retrieved
    /// @return Returns the text of the twitter post, or an empty string in the case where the post has not been stored yet
    function getTweetText(string memory _userId)
    public
    view
    returns(string memory)
    {
      //  bytes32 postHash = keccak256(abi.encodePacked(_postId));
        string memory text = statusText[_userId];
	require(stringNotEmpty(text), "No tweet text stored for this user.");
	return text;
    }

    /// @notice Returns the balance of this contract
    /// @dev This contract needs ether to be able to interact with the oracle
    /// @return Returns the ether balance of this contract
    function getBalance()
    public
    view
    returns (uint _balance)
    {
        return address(this).balance;
    }

    /// @notice An internal function which checks that a particular string is not empty
    /// @dev To be used in the Oraclize callback function to make sure the resulting text is not null
    /// @param _s The string to check if empty/null
    /// @return Returns false if the string is empty, and true otherwise
    function stringNotEmpty(string memory _s)
    internal
    pure
    returns(bool)
    {
        bytes memory tempString = bytes(_s);
        if (tempString.length == 0) {
            return false;
        } else {
            return true;
        }
    }

    modifier onlyOracle {
        require(
            msg.sender == oraclize_cbAddress(),
            "The caller of this function is not the offical Oraclize Callback Address."
            );
	_;
    }
}
