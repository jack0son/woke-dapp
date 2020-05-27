pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./LNPDFValues.sol";

contract LogNormalPDF is LogNormalPDFValues {

	function lnpdf(uint32 x)
		completed
		public view
	returns(uint40 y)
	{
		uint32 index;
		uint8 chunkSize;
		// yArray4
		if(x < 5000) {
			index = x - 0;
			chunkSize = 4;
		}

		else if(x >= 5000 && x < 10000) {
			index = x - 5000;
			chunkSize = 8;
		}

		else if(x >= 10000 && x < 20000) {
			index = x - 10000;
			chunkSize = 16;
		}

		else if(x >= 20000 && x < 30016) {
			index = x - 20000;
			chunkSize = 32;
		}

		else if(x >= 30016 && x < 40064) {
			index = x - 30016;
			chunkSize = 64;
		}

		else if(x >= 40064 && x < 49920) {
			index = x - 40064;
			chunkSize = 128;
		}

		else {
			y = 0x009e3a3f48;
		}

		if(y == 0) {
			y = valueArrays[chunkSize][index/chunkSize];
		}

		return y;
	}
}





