const { Logger } = require('@woke/lib');
const bindCommands = require('./src/cli.js');
const utils = require('./src/utils');
const debug = Logger('cli');

if (require.main === module) {
	//debug.debug.enabled = true;
	var argv = process.argv.slice(2);
	const [command, ...args] = argv;

	const usage = {
		getTweetText: '<userId>',
		getLodgedTweets: '<userId>',
		getUser: '<userId>',
		getClaimedEvents: '[userId, address]',
		getTransferEvents: '[[from,to] <userId>]',
		getBonusEvents: '[[claimer,referrer] <userId>]',
		supply: '[minted]',
	};

	const cmdUsage = (cmd) => `${cmd} ${usage[cmd]}`;
	const printCmdUsage = () => console.log(`Usage: ${cmdUsage(command)}`);

	const start = async () => {
		const commands = Object.keys(usage).includes(command) && (await bindCommands()); // don't work for nothing

		switch (command) {
			case 'supply': {
				const showMintEvents = args[0];
				return await commands.supply(showMintEvents);
			}

			case 'getTweetText': {
				const userId = args[0];
				if (!utils.nonEmptyString(userId)) {
					console.log('No value provided for userId');
					printCmdUsage();
					return;
				}
				debug.d('Getting tweet text for user ', userId);

				return await commands.getTweetText(userId);
			}

			case 'getLodgedTweets': {
				const userId = args[0];
				if (utils.nonEmptyString(userId)) {
					debug.d('Getting tweet text for user ', userId);
				}

				return await commands.getLodgedTweets(userId);
			}

			case 'getUser': {
				const userId = args[0];
				if (utils.nonEmptyString(userId)) {
					debug.d('Getting data for user', userId);
				}

				return await commands.getUser(userId);
			}

			case 'getClaimedEvents': {
				return await commands.getClaimedEvents();
			}

			case 'getBonusEvents': {
				const [selectRole, userId] = args;
				debug.d('Getting bonus events', selectRole ? `for ${selectRole} ${userId}` : '');
				switch (selectRole) {
					case 'claimer':
						return await commands.getBonusEvents(userId);
					case 'referrer':
						return await commands.getBonusEvents(undefined, userId);
					default:
						return await commands.getBonusEvents();
				}
			}

			case 'getTransferEvents': {
				const [type, userId] = args; // type: <from, to>
				debug.d('Getting transfers', type ? ` for ${type} ${userId}` : '');
				switch (type) {
					case 'from':
						return await commands.getTransferEvents(userId);
					case 'to':
						return await commands.getTransferEvents(undefined, userId);
					default:
						return await commands.getTransferEvents();
				}
			}

			case 'help':
			case '--help':
			case '-h':
			default:
				{
					console.log('Woke Contracts CLI v0.1.0\nUsage: ');
					Object.keys(usage).forEach((c) => console.log(`  ${cmdUsage(c)}`));
				}

				return;
		}
	};

	start()
		.then(() => process.exit()) // web3 connection keeps script alive
		.catch(console.log);
}
