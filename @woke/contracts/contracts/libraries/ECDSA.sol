pragma solidity ^0.5.0;

library ECDSA {

	function messageHash(bytes32 hash) internal pure
	returns(bytes32)
	{
		return keccak256(
			abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
		);
	}

	function recover(bytes32 hash, bytes memory signature) internal pure
	returns (address)
	{
		bytes32 r;
		bytes32 s;
		uint8 v;
		// Check the signature length
		if (signature.length != 65) {
			return (address(0));
		}
		// Divide the signature in r, s and v variables with inline assembly.
		assembly {
			r := mload(add(signature, 0x20))
			s := mload(add(signature, 0x40))
			v := byte(0, mload(add(signature, 0x60)))
		}
		// Version of signature should be 27 or 28, but 0 and 1 are also possible versions
		if (v < 27) {
			v += 27;
		}
		// If the version is correct return the signer address
		if (v != 27 && v != 28) {
			return (address(0));
		} else {
			// solium-disable-next-line arg-overflow
			return ecrecover(hash, v, r, s);
		}
	}

	function verifySignature(address p, bytes32 hash, uint8 v, bytes32 r, bytes32 s) 
	internal pure
	returns (bool) 
	{
		// Note: this only verifies that signer is correct.
		// Need to verify that the hash of the data is also correct.
		bool valid = ecrecover(hash, v, r, s) == p;
		return valid;
	}
}
