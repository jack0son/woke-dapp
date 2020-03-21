import React, { useEffect, useReducer } from 'react';
import { useIsMounted } from './util-hooks';

const useLinearStages = (props) => {
	const { stageList, initialStage } = props;

	const isMounted =  useIsMounted(); 

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

			case 'SELECT': {
				if(typeof action.payload === 'string') {
					const newStage = stageMap[action.payload];
					if(newStage === undefined || newStage === null) {
						console.error('Linear state: Attmept to select invalid state');
						return state;
					}

					return {
						...state,
						stage: newStage
					}
				}

				if (!action.payload || action.payload > stageList.length -1 || action.payload < 0) {
					return state;
				}

				return {
					...state,
					stage: action.payload
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

	const select = (stage) => {
		dispatch({type: 'SELECT', payload: stage});
	}

	const dummyOnChangeEvent = (target, abortRef, delay = 1000) => {
		setTimeout(() => {
			if(isMounted.current == true && abortRef.current == true) {
				dispatchNext({ target })
			}
		}, delay)
	}

	return {
		dispatch,
		select,
		dispatchNext,
		dummyOnChangeEvent,
		stage: dummyState.stage,
		stageList,
		stageEnum,
		stageMap,
	}
};

export default useLinearStages;
