const assert = require('assert');
const actors = require('../src/actors');
const bootstrap = require('../src/actor-system');

const actorStub = {
	properties: {},
	actions: {
		'callback': (msg, ctx, state) => {
			msg.callback(msg, ctx, state);
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
	describe('When set to non-blocking', function() {
		it('should dispatch the target action after a delay', function (done) {
			const [delay, tolerance] = [10, 2]; // ms
			let count = 0;

			const callback = () => {
				++count;
				if(count == 1) {
					setTimeout(() => {
						if(count >= 2) {
							console.log('DONE EARLY');
							assert(false, 'Action called too early');
						}
					}, delay - tolerance); 
					setTimeout(() => {
						if(count < 2) {
							console.log('DONE LATE');
							assert(false, 'Action not called in time');
						}
						done();
					}, delay + tolerance); 
				}
			}

			director.dispatch(a_polling, {type: 'poll',
				target: a_stub,
				action: 'callback',
				period: delay,
				args: { callback }
			});

		})

	describe('When set to blocking', function() {
		it('should wait for previous action to complete', function (done) {
			const [delay, tolerance] = [10, 2]; // ms
			let count = 0;

			const callback = (msg, ctx, state) => {
				const myCount = ++count;
				setTimeout(() => {
					assert(count == Mycount, 'Polling did not block until previous action complete');
					dispatch(ctx.sender, { type: 'complete'}, ctx.self);
				}, delay*3); // wait longer than polling interval
			}

			director.dispatch(a_polling, {type: 'poll',
				target: a_stub,
				action: 'callback',
				period: delay,
				args: { callback },
				blockTimeout: delay*5 // comfortable buffer
			});
		})

		it('should resume polling if blocking times out', function (done) {
		})
	})

	describe('#interupt', function() {
		it('should stop polling', function (done) {
			const [delay, tolerance] = [10, 1]; // ms
			let count = 0;
			let maxCalls = 5;

			const callback = () => {
				++count;
			}

			director.dispatch(a_polling, {type: 'poll',
				target: a_stub,
				action: 'callback',
				period: delay,
				args: { callback }
			});

			setTimeout(() => {
				director.dispatch(a_polling, {type: 'interupt'})
			}, delay*(maxCalls-1) - tolerance)//tolerance);

			setTimeout(() => {
				if(count > maxCalls) {
					assert(false, 'Action called after interupt');
				}
				done();
			}, delay*maxCalls + tolerance)
		})
	})
})
