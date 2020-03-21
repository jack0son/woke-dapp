import React, { useState } from 'react';

// Logical containers
import Claim from './claim'
import Wallet from './wallet'

// View containers
import Loading from '../views/loading'

// Dummy state
import useLinearStages from '../../hooks/fsm-linear';
import useDesignDomain from '../../hooks/design/use-domain'
import stageConfig from './stages'
const stages = stageConfig.web3;


export default function Web3Container(props) {
	// Dummy state 
	const state = useLinearStages({stageList: stages.list, initialStage: stages.initial ||stages.byName.CLAIM});
	useDesignDomain({ // Enable stage saving by stage-overlay
		domainName: 'web3',
		linearStages: state,
		stages,
	});

	const renderClaimProcess = () => (
		<Claim
			// TODO change loading to use avatar image
			handleComplete={() => state.dispatchNext()}
		/>
	);

	const renderWallet = () => (
		<Wallet/>
	);

	const renderMap = {
		[stages.byName.CLAIM]: renderClaimProcess,
		[stages.byName.WALLET]: renderWallet,
	}
	

	return (
		<>
			{ renderMap[state.stage]() }
		</>
	);
}
