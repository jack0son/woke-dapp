const proxy = require('http-proxy-middleware');

var twitterApiOptions = {
  target: 'https://api.twitter.com', // target host
  changeOrigin: true, // needed for virtual hosted sites
  ws: false, // proxy websockets
  pathRewrite: {
		'^/twitter_api': '' // remove base path
  },
	 logLevel: 'debug'
};

var optionsTemplate = {
	target: 'https://api.twitter.com/1.1', // target host
  changeOrigin: true, // needed for virtual hosted sites
  ws: false, // proxy websockets
  pathRewrite: {
		//'^/twitterappapi': '/1.1', // rewrite path
		'^/twitterappapi': '' // remove base path
  },
	 logLevel: 'debug'
	//router: {
    // when request.headers.host == 'dev.localhost:3000',
    // override target 'http://www.example.org' to 'http://localhost:8000'
		//'dev.localhost:3000': 'http://localhost:8000'
		//}
};

//TODO only need one router
module.exports = function(app) {
	app.use('/twitter_api', proxy(twitterApiOptions));
};
