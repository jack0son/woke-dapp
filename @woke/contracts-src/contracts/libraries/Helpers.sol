pragma solidity ^0.5.0;
import "./Strings.sol";

library Helpers {
	function bytesToBytes4(bytes memory _in) pure internal returns (bytes4 out)
	{
		if (_in.length == 0) {
			return 0x0;
		}

		assembly {
			out := mload(add(_in, 4))
		}
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

		bytes memory fBytes = Strings.fromHex(Strings.getSlice(_cs.length - followersChunkLen, _cs.length, _cs));
		uint32 followersCount = uint32(bytesToBytes4(fBytes));
		emit TraceBytes('fBytes', fBytes);
		emit TraceUint32('followers', followersCount);

		return (sig, byte(Strings.fromHexChar(uint8(version))), followersCount);
	}
	event TraceUint32(string m, uint32 v);
	event TraceBytes(string m, bytes v);
}
