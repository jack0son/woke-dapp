import axios from 'axios'
//import http from 'http'
import https from 'https'

import config from '../../config/config';

const serverConfig = config.server[process.env.NODE_ENV];

//const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });
// on the instance
const instance = axios.create({
	//httpAgent,
	httpsAgent,
});

const AUTH_TABLE = 'Authentications'
const USER_TABLE = 'Users'

const requestToServer = async (axiosRequestObj) => {
  axiosRequestObj.baseURL = serverConfig.url;

	console.log('STARTING WALLET SERVER REQUEST')
	console.dir(axiosRequestObj);
  try {
    const resp = await axios(axiosRequestObj, {httpsAgent})
    if (resp.status === 200) {
      return resp.data
    } else {
      throw new Error('Server returned error: ' + resp.status.toString() + ' ' + resp.data['error'])
    }
  } catch (e) {
    throw new Error('Server returned error: ' + e.response.status.toString() + ' ' + e.response.data['error'])
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
