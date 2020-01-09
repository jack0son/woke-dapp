import React, { useEffect, useReducer } from 'react';

const useLinearStages = (props) => {
	const { stageList, initialStage } = props;

	// These objects are cheap to build and very useful
	const stageEnum = {};
	const stageMap = {};

	//useEffect(() => {
		stageList.forEach((stage, i) => {
			stageEnum[i] = stage;
			stageMap[stage] = i;
		});
	//}, []);

	const reducer = (state, action) => {
		switch (action.type) {
			case 'NEXT': {
				if(state.stage < stageList.length - 1) {
					//console.log('got stage', state.stage);
					//console.log('target ', action.payload);
					return {
						...state,
						stage: state.stage + 1
					}
				}
				return state;
			}

			case 'PREV': {
				if (state.stage === 0) {
					return {
						...state
					};
				}

				return {
					...state,
					stage: state.stage - 1
				}
			}

			default: {
				return {
					...state
				};
			}
		}
	};

	const [dummyState, dispatch] = useReducer(reducer, {stage: initialStage});

	const dispatchNext = (event) => {
		//dispatch({type: 'NEXT', payload: event.target});
		dispatch({type: 'NEXT', payload: event});
	}

	const dummyAsyncJob = (message, delay = 1000) => {
		{setTimeout(() => dispatchNext({target: message}), delay)}
	}

	return {
		dispatch,
		dispatchNext,
		dummyAsyncJob,
		stage: dummyState.stage,
		stageList,
		stageEnum,
		stageMap,
	}
};

export default useLinearStages;
