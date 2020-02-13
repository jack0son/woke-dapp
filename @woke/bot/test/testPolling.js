//const mocha = require('mocha');
const assert = require('assert');

actors = require('../src/actors');
bootstrap = require('../src/actor-system');

const actorStub = {
	properties: {},
	actions: {
		'callback': (msg, ctx, state) => {
			msg.callback();
		}
	}
}

context('Polling', function() {
	let director, a_polling, a_stub; // actor instances

	beforeEach(function start_actors(done) {
		director = bootstrap();
		a_polling = director.start_actor('polling_service', actors.polling);
		a_stub = director.start_actor('stub', actorStub);
		done();
	})

	afterEach(function stop_actors() {
		director.stop();
	})

	describe('#poll', function() {
		it('should dispatch the target action after a delay', function (done) {
			let waiting = true;
			const delay = 10;
			director.dispatch(a_polling, {type: 'poll',
				target: a_stub,
				action: 'callback',
				period: delay,
				args: {
					callback: () => {
						waiting = false;
						console.log('DONE A');
						done();
					}
				},
			});

			setTimeout(() => {
				if(waiting) {
					assert(false, 'Action not called in time');
				}
				director.dispatch(a_polling, {type: 'interupt'})
				done();
				console.log('DONE B');
			}, delay); 
		})
	})
})
