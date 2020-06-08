import axios from 'axios'
//import http from 'http'
import https from 'https'

import config from '../../config/config';

const serverEnv = process.env.REACT_APP_SERVER_ENV || process.env.NODE_ENV;
const serverConfig = config.server[serverEnv];

//const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });
// on the instance
const instance = axios.create({
	//httpAgent,
	httpsAgent,
	timeout: 2000,
});

const AUTH_TABLE = 'Authentications'
const USER_TABLE = 'Users'

const requestToServer = async (axiosRequestObj) => {
  axiosRequestObj.baseURL = serverConfig.url;

	let req = {
		timeout: 12000,
		...axiosRequestObj,
	};

  try {
    const resp = await axios(req, {httpsAgent})
    if (resp.status === 200) {
      return resp.data
    } else {
      throw new Error('Server returned error: ' + resp.status.toString() + ' ' + resp.data['error'])
    }
  } catch (e) {
		if(e && e.response)
			console.error('Server returned error: ' + e.response.status.toString() + ' ' + e.response.data['error'])
		throw e;
  }
}

const setAuthFn = async (obj) => {
  await requestToServer({
    url: '/authentication',
    method: 'post',
    data: obj
  })
}

const setUserFn = async (obj) => {
  await requestToServer({
    url: '/user',
    method: 'post',
    data: obj
  })
}

const getFn = async (obj) => {
  return requestToServer({
    url: '/authentication',
    method: 'get',
    params: obj
  })
}

try {
	//	getFn();
} catch (e) {
	console.log('dummy request err', e);
}

export default {
	setAuthFn,
	setUserFn,
	getFn
}
