const models = require('../models')
const { handleResponse, successResponse, errorResponseBadRequest } = require('../lib/apiHelpers')
var express = require('express')
var router = express.Router()
//const debug = require('debug')('server:auth-router');

/**
 * Create record in Authentications table
 * req.body should contain {iv, cipherText, lookupKey}
 */
function AuthenticationRouter({ fundingSystem }) {
	router.post('/', handleResponse(async (req, res, next) => {
		//debug(req);
		let body = req.body
		if (body && body.iv && body.cipherText && body.lookupKey) {
			try {
				await models.Authentication.create({ iv: body.iv, cipherText: body.cipherText, lookupKey: body.lookupKey })
				return successResponse()
			} catch (err) {
				console.error('Error signing up a user', err)
				return errorResponseBadRequest('Error signing up a user')
			}
		} else return errorResponseBadRequest('Missing one of the required fields: iv, cipherText, lookupKey')
	}))

	/**
	 * Check if a authentication record exists in the database.
	 * @param lookupKey {String} primary key in the db used to lookup auth records
	 */
	router.get('/', handleResponse(async (req, res, next) => {
		let queryParams = req.query
		//debug(req);
		if (queryParams && queryParams.lookupKey) {
			const existingAuth = await models.Authentication.findOne({
				where: {
					lookupKey: queryParams.lookupKey
				}
			})

			if (existingAuth) {
				// @todo Trigger funder
				return successResponse(existingAuth)
			}

			return errorResponseBadRequest('Username or password is incorrect')
		}

		return errorResponseBadRequest('Missing field: lookupKey')
	}))

	return router;
}

module.exports = AuthenticationRouter;
