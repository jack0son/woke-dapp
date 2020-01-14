import React, { useMemo } from 'react';
import { getContract } from '../../lib/web3/web3-utils'

export default (web3, artifacts, networkId) => (contractName) => 
	useMemo(
		() => getContract(web3, artifacts[contractName], networkId),
		[contractName]
	)

