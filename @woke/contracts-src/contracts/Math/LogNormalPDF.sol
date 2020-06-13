pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./LNPDFValues.sol";

contract LogNormalPDF is LogNormalPDFValues {

	function lnpdf(uint32 x) public view
		completed
	returns(uint40 y)
	{
		uint32 index;
		uint8 chunkSize = 1;

		// yArray4
		if(x >= 0 && x < 5000) {
			index = x - 0;
			chunkSize = 4;
		}
		// yArray8
		else if(x >= 5000 && x < 10000) {
			index = x - 5000;
			chunkSize = 8;
		}
		// yArray16
		else if(x >= 10000 && x < 20000) {
			index = x - 10000;
			chunkSize = 16;
		}
		// yArray32
		else if(x >= 20000 && x < 30016) {
			index = x - 20000;
			chunkSize = 32;
		}
		// yArray64
		else if(x >= 30016 && x < 39936) {
			index = x - 30016;
			chunkSize = 64;
		}
		// yArray128
		else if(x >= 39936 && x < 49920) {
			index = x - 39936;
			chunkSize = 128;
		}

		// x >= 49920
		else {
			return 0x009e3a3f48;
		}

		return valueArrays[chunkSize][index/chunkSize];
	}
}





