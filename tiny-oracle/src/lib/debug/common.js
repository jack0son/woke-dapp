const debug = require('debug');
const supportsColor = require('supports-color');
const {inspect} = require('util');
const chalk = require('chalk');

const blog = (str, d=null) => console.log(chalk.blue(inspect(str, {depth: d})));
const wrapInspect = (wrapper) => ((str, d=null) => wrapper(chalk.blue(inspect(str, {depth: d}))));
const verbose = debug('verbose');

module.exports = {debug, verbose, blog, wrapInspect, chalk};
