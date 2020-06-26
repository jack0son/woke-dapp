const debug = require('debug')('server:model-user');
const models = require('../models')
const { handleResponse, successResponse, errorResponseBadRequest, errorResponseServerError} = require('../lib/apiHelpers')
var express = require('express')
var router = express.Router()

const WalletFunder = require('../lib/walletFunder');

const funder = new WalletFunder();

/**
 * Create record in Users table
 * body should contain {username, walletAddress}
 */
function UserRouter({ fundingSystem }) {
	router.post('/', handleResponse(async (req, res, next) => {
		let body = req.body
		if (body.username && body.walletAddress) {
			const username = body.username.toLowerCase()
			const walletAddress = body.walletAddress;
			const existingUser = await models.User.findOne({
				where: {
					username: username
				}
			})

			if (existingUser) {
				return errorResponseBadRequest('User already exits')
			}
			debug('Found no existing user');

			const userObj = { username: username, walletAddress: walletAddress };

			try {
				await models.User.create(userObj);

				debug(`Created new user ${username}, signalling funder`);

				// @TODO Check funder has not crashed
				fundingSystem.fundAccount(walletAddress, username);

				return successResponse()
			} catch (err) {
				console.error('Error creating user', err)
				return errorResponseServerError('Error signing up a user')
			}
		} else return errorResponseBadRequest('Missing one of the required fields: username, walletAddress')
	}))

	return router;
}

module.exports = UserRouter;
