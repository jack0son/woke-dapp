import React, { useState, useEffect } from 'react'
import { useWeb3Context } from '.';

// @dev createUseEvents
// @dev Hook generator for web3 provider context
export default web3 => (contractName, eventName, opts) => {
	const { useContract } = useWeb3Context();
	const contract = useContract(contractName);

	return contract.getPastEvents(eventName, {fromBlock: 0, ...opts}); 
}
