import React, { useEffect, useReducer } from 'react';
import { useIsMounted } from './util-hooks';

const useLinearStages = (props) => {
	const { stageList, initialStage, handleLastStage } = props;

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
				
				if(handleLastStage) {
					handleLastStage();
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
		if(event && event.target && event.target.log) console.log(event.target.value);
		dispatch({type: 'NEXT', payload: event});
	}

	const select = (stage) => {
		dispatch({type: 'SELECT', payload: stage});
	}

	const dummyOnChangeEvent = (delay, opts) => {
		const {target, abortRef} = opts || {};
		setTimeout(() => {
			if(isMounted.current == true && (abortRef == undefined || abortRef.current == true)) {
				dispatchNext({ target })
			}
		}, delay || 500)
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
