const j0 = require('../jack0son');
const eg = 'secret.twitter.oracle-bot';

const dotenv = require('dotenv');

const secrets = require('./secrets');

const diff = j0.propsAddedGen(process.env);
secrets('twitter', 'oracle-bot');
secrets('infura', 'staging');
console.dir(secrets.get());
console.log(diff());
