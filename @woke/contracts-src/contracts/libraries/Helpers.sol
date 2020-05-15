pragma solidity ^0.5.0;
import "./Strings.sol";

library Helpers {
	//https://github.com/GNSPS/solidity-bytes-utils/blob/master/contracts/BytesLib.sol
	function toUint32(bytes memory _bytes, uint256 _start) internal pure returns (uint32) {
		require(_bytes.length >= (_start + 4), "Read out of bounds");
		uint32 tempUint;

		assembly {
			tempUint := mload(add(add(_bytes, 0x4), _start))
		}

		return tempUint;
	}

	// @param cs claim string
	function parseClaim(bytes memory _cs) internal
	returns (bytes memory, byte, uint32)
	{
		// Followers count length = 10
		uint8 followersChunkLen = 9;
		byte version = _cs[_cs.length - 1 - followersChunkLen];

		//bytes8 followersChunk = _cs[_cs.length - followersChunkLen];
		
		//uint prefixLen = _cs.length - 67; // [prefix][sig],<version>
		bytes memory sig = new bytes(130);

		// @fix replace loop with mload to save gas
		for(uint i = 0; i < 130; i++) {
			sig[129 - i] = _cs[_cs.length - 3 - followersChunkLen - i];
		}

		bytes memory fBytes = Strings.fromHex(Strings.getSlice(_cs.length - followersChunkLen + 1, _cs.length, _cs));
		emit TraceBytes('fBytes', fBytes);
		uint32 followersCount = toUint32(fBytes, 0);
		//emit TraceUint32('followers', followersCount);

		return (sig, byte(Strings.fromHexChar(uint8(version))), followersCount);
	}
	event TraceUint32(string m, uint32 v);
	event TraceBytes(string m, bytes v);
}
