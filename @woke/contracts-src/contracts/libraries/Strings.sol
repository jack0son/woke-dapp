pragma solidity ^0.5.0;

library Strings {
	// Convert an hexadecimal character to their value
	function fromHexChar(uint8 c) internal pure returns (uint8) {
		if (byte(c) >= byte('0') && byte(c) <= byte('9')) {
			return c - uint8(byte('0'));
		}
		if (byte(c) >= byte('a') && byte(c) <= byte('f')) {
			return 10 + c - uint8(byte('a'));
		}
		if (byte(c) >= byte('A') && byte(c) <= byte('F')) {
			return 10 + c - uint8(byte('A'));
		}
	}

	// Convert an hexadecimal string to raw bytes
	function fromHex(bytes memory ss) internal pure returns (bytes memory) {
		//bytes memory ss = bytes(s);
		//emit TraceUint256('hex str len', ss.length);
		require(ss.length%2 == 0, 'Attempt to convert uneven hex string'); // length must be even
		bytes memory res = new bytes(ss.length/2);
		for (uint i=0; i<ss.length/2; ++i) {
			uint8 l =(uint8(ss[2*i]));
			uint8 r =(uint8(ss[2 * i + 1]));

			res[i] = byte(fromHexChar(l)*16 + fromHexChar(r));
		}
		return res;
	}

	function getSlice(uint256 begin, uint256 end, bytes memory buffer)
	internal pure 
	returns (bytes memory) {
		bytes memory a = new bytes(end-begin);
		for(uint i=0;i<end-begin;i++){
			a[i] = buffer[begin+i];
		}
		return a;    
	}
}
