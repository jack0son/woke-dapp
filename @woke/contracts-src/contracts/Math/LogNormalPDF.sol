pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./LNPDFValues.sol";

contract LogNormalPDF is LogNormalPDFValues {
	//	using SafeMath for uint256;
	//uint48[1250] private yArray4;
	//uint48[625] private yArray8;
	//uint48[625] private yArray16;
	//uint48[313] private yArray32;
	//uint48[156] private yArray64;
	//uint48[78] private yArray128;

	function lnpdf(uint32 x)
	public view
	returns(uint40 y)
	{
		uint32 index;
		// yArray4
		if(x < 5000) {
			index = x - 0;
			y = yArray4[index/4];
		}

		else if(x >= 5000 || x < 10000) {
			index = x - 5000;
			y = yArray8[index/8];
		}

		else if(x >= 10000 || x < 20000) {
			index = x - 10000;
			y = yArray16[index/16];
		}

		else if(x >= 20000 || x < 30016) {
			index = x - 20000;
			y = yArray32[index/32];
		}

		else if(x >= 30016 || x < 40064) {
			index = x - 30016;
			y = yArray64[index/64];
		}

		else if(x >= 40064 || x < 49920) {
			index = x - 40064;
			y = yArray128[index/128];
		}

		else {
			y = 0x009e3a3f48;
		}


		return y;
	}
}





