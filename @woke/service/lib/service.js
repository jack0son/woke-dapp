const { ActorSystem, PersistenceEngine } = require('@woke/wact');
const { Logger, configure } = require('@woke/lib');
const configureLogger = require('./config/logger-config');
const { useMonitor } = require('@woke/actors');

const VERBOSE_LOGGER_STRING = 'sys_*,actor*,-*:info';
const defaults = {
	faultMonitoring: false,
	persist: false,
	faultMonitoring: false,
	loggerString: VERBOSE_LOGGER_STRING,
};

let i = 0;

const defaultName = () => `sys_${(++i).toString().padStart(3, 0)}`;

// Service template
class Service {
	constructor(opts, _defaults, extensions) {
		const conf = configure(opts, { ...defaults, ..._defaults });
		if (conf.verbose) configureLogger({ enableString: conf.loggerString });
		this.config = conf;

		this.name = conf.name || defaultName();
		this.debug = Logger(this.name);
		this.persistent = !!conf.persist;
		this.initializers = []; // promises to be run by this.init

		const directorArgs = conf.directorOptions ? [conf.directorOptions] : [{}];
		if (this.persistent) {
			this.debug.d(`Using persistence...`);
			this.persistenceEngine = PersistenceEngine(this.config.persistenceConfig);
			directorArgs.push(this.persistenceEngine);
			const _this = this;
			this.initializers.push(() => _this.connectPersistence);
		} else {
			this.debug.d(`Persistence not enabled.`);
		}

		this.director = conf.director || ActorSystem.bootstrap(...directorArgs);
		const director = this.director;

		extensions && extensions.forEach((extension) => extension(this, conf));

		// Initialise monitor using own actor system and twitter client
		this.monitor = useMonitor({
			twitterClient: this.twitterClient,
			director,
			enabled: conf.faultMonitoring,
		});
	}

	getDirector() {
		return this.director;
	}

	async connectPersistence() {
		const _this = this;
		if (_this.persistent) {
			try {
				await _this.persistenceEngine.db.then((db) => db.connect());
			} catch (error) {
				throw error;
			}
		}
	}

	async init() {
		if (this.config.printConfig) console.log('config', this.config);
		for (let fn of this.initializers) {
			if (typeof fn !== 'function')
				throw new Error('Service initializers must be functions');
			await fn();
		}
	}

	stop(hard) {
		// @TODO Stop dependent services
		this.director.stop(); // shouldn't do this
	}
}

module.exports = Service;
