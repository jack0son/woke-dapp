pragma solidity ^0.5.0;
import "./Strings.sol";

library Helpers {
	// @param cs claim string
	function parseClaim(bytes memory _cs) internal
	returns (bytes memory, byte)
	{
		// Followers count length = 10
		uint8 followersChunkLen = 9;
		byte version = _cs[_cs.length - 1 - followersChunkLen];
		//uint prefixLen = _cs.length - 67; // [prefix][sig],<version>
		bytes memory sig = new bytes(130);

		// @fix replace loop with mload to save gas
		for(uint i = 0; i < 130; i++) {
			sig[129 - i] = _cs[_cs.length - 3 - followersChunkLen - i];
		}

		return (sig, byte(Strings.fromHexChar(uint8(version))));
	}
}
