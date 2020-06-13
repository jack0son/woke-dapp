const { Logger } = require('@woke/lib');
const bindCommands = require('./src/cli.js');
const utils = require('./src/utils');
const debug = Logger('cli');

if(require.main === module) {
	//debug.debug.enabled = true;
	var argv = process.argv.slice(2);
	const [command, ...args] = argv;

	const usage = {
		getTweetText: 'getTweetText <userId>',
		getUser: 'getUser <userId>',
		getClaimedEvents: 'getClaimEvents [userId, address]',
		getTransferEvents: 'getTransferEvents [[from,to] <userId>]',
		getBonusEvents: 'getBonusEvents [[claimer,referrer] <userId>]',
		supply: 'supply [minted]',
	};

	(async () => {
		let commands = Object.keys(usage).includes(command) && (await bindCommands()); // don't work for nothing

		switch(command) {
			case 'supply': {
				const showMintEvents = args[0];
				return commands.supply(showMintEvents);
			}

			case 'getTweetText': {
				const userId = args[0];
				if(!utils.nonEmptyString(userId)) {
					console.log('No value provided for userId');
					console.log(usage.getTweetText);
					return;
				}
				debug.d('Getting tweet text for user ', userId);

				return commands.getTweetText(userId)
			}

			case 'getUser': {
				const userId = args[0];
				if(utils.nonEmptyString(userId)) {
					debug.d('Getting data for user', userId);
				}

				return commands.getUser(userId)
			}

			case 'getClaimedEvents': {
				return commands.getClaimedEvents();
			}

			case 'getBonusEvents': {
				const [selectRole, userId] = args;
				debug.d('Getting bonus events', selectRole ? `for ${selectRole} ${userId}` : '');
				switch(selectRole) {
					case 'claimer':
						return commands.getBonusEvents(userId)
					case 'referrer':
						return commands.getBonusEvents(undefined, userId)
					default:
						return commands.getBonusEvents()
				}
			}

			case 'getTransferEvents': {
				const [type, userId] = args; // type: <from, to>
				debug.d('Getting transfers', type ? ` for ${type} ${userId}` : '');
				switch(type) {
					case 'from':
						return commands.getTransferEvents(userId)
					case 'to':
						return commands.getTransferEvents(undefined, userId)
					default: 
						return commands.getTransferEvents()
				}
			}

			case 'help':
			case '--help':
			case '-h':
			default: {
				console.log('Woke Contracts CLI v0.1.0\nUsage: ');
				Object.keys(usage).forEach(c => console.log('  ' + usage[c]))
			}

				return;
		}
	})().catch(console.log);
}

