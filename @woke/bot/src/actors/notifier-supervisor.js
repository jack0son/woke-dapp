const {
	ActorSystem,
	adapt,
	adapters,
	actors: { TaskSupervisor },
} = require('@woke/wact');
const { dispatch, spawnStateless, stop, block } = ActorSystem;
const { useNotifyOnCrash } = require('@woke/actors');
const { action_setTweeter } = require('./actions');
const { TaskStatuses: Statuses } = TaskSupervisor;

let idx = 0;
const spawn_tweet_promise = (task, _ctx) => {
	const notifier = _ctx.self;
	return spawnStateless(
		notifier,
		(msg, ctx) => {
			const updateStatus = (status, reason = null) => {
				dispatch(
					noitifer,
					{ type: 'update', task: { ...task, status, reason } },
					ctx.self
				);
				stop(ctx.self);
			};

			const { type, tweet, error } = msg;
			if (error) {
				_ctx.debug.error(msg, `Promise from tweeter: ${error}`);
				// @TODO fix this error condition
				updateStatus(Statuses.failed, error);
			} else if (type == 'tweet') {
				if (tweet) {
					updateStatus(Statuses.done);
				} else {
					// @TODO fix this error condition
					updateStatus(Statuses.failed, 'Tweeter did not tweet');
				}
			}
			stop(ctx.self);
		},
		`tweet_promise-${idx++}`
	);
};

async function effect_unclaimedTx(state, msg, ctx) {
	const { task } = msg;
	const { a_contract_UserRegistry, a_tweeter } = state;
	let balance;
	try {
		// Contract version incompatible (missing unclaimedBalance method)
		const balanceCall = await block(
			a_contract_UserRegistry,
			{
				type: 'call',
				method: 'unclaimedBalanceOf',
				args: [task.event.toId],
				sinks: [],
			}
			// 5 * 1000
		);
		balance = balanceCall.result;
	} catch (error) {
		ctx.debug.error(msg, 'call to UserRegistry.unclaimedBalance() failed', error);
		throw error;
	}

	const a_promise = spawn_tweet_promise(task, ctx);
	dispatch(
		a_tweeter,
		{
			type: 'tweet',
			tweetType: 'unclaimed-transfer',
			tip: {
				toId: task.event.toId,
				fromId: task.event.fromId,
				amount: task.event.amount,
			},
			recipientBalance: balance,
		},
		a_promise
	);

	return state;
}

function handleQuerySubscription(state, msg, ctx) {
	const { eventName, log } = msg;
	switch (eventName) {
		case 'Tx': {
			// Event update from subscription
			dispatch(ctx.self, { type: 'submit', task: log }, ctx.self);
			break;
		}

		default: {
			ctx.debug.info(msg, `No action defined for subscription to '${eventName}' events`);
		}
	}
}

function handleContractResponse(state, msg, ctx) {
	const { a_sub } = msg;
	// Once subscription received from contract, start the subscription
	switch (msg.action) {
		case 'subscribe_log': {
			const { a_sub } = msg;
			// Once subscription received from contract, start the subscription
			if (a_sub) {
				const a_unclaimed_tx_sub = a_sub;
				dispatch(a_unclaimed_tx_sub, { type: 'start' }, ctx.self);
				return { ...state, a_unclaimed_tx_sub };
			}
		}
		default: {
			ctx.debug.d(msg, `No handler defined for response to ${action}`);
		}
	}
}

function action_subscribeToTransfers(state, msg, ctx) {
	const { a_contract_UserRegistry } = state;

	// Subscribe to unclaimed transfers

	// Rely on subscription to submit logs from block 0
	// @TODO persist last seen block number
	dispatch(
		a_contract_UserRegistry,
		{
			type: 'subscribe_log',
			eventName: 'Tx',
			opts: { fromBlock: 0 },
			filter: (e) => e.claimed == false,
			// filter: (e) => e.claimed == false,
		},
		ctx.self
	);
}

function NotifierSupervisor(a_contract_UserRegistry, a_tweeter, opts) {
	const earliestId = (opts && opts.earliestId) || 0;
	const getId = (log) => log.transactionHash;

	const ignoreTask = (tip) =>
		earliestId && tip.id < earliestId
			? 'log event before the line in the sand...'
			: false;

	const isValidTask = (tip) => true; // @TODO is a log event

	const effects = {
		[Statuses.ready]: effect_unclaimedTx,
		[Statuses.done]: ({ onTaskComplete }, { task }) => {
			onTaskComplete && onTaskComplete(task);
		},
		//[Statuses.invalid]: notify(Statuses.invalid),
		[Statuses.failed]: () => {},
	};

	return adapt(
		{
			actions: {
				...adapters.SinkReduce(),
				action_subscribeToTransfers,
				action_setTweeter,
			},
			properties: {
				persistenceKey: 'notifier-supervisor', // only ever 1, static key OK
				onCrash: useNotifyOnCrash(),
				initialState: {
					a_contract_UserRegistry,
					a_tweeter,
					sinkHandlers: {
						subscription: handleQuerySubscription,
						a_contract: handleContractResponse,
					},
				},
			},
		},
		// [actionArgs, propertyArgs]
		TaskSupervisor.Definition([getId, isValidTask, { effects, ignoreTask }])
	);
}

module.exports = NotifierSupervisor;
