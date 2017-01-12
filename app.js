/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() { //編集
//app.listen(appEnv.port, function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});

// 以下を追加（松尾さんのサンプルをコピー）
var passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

var services = JSON.parse(process.env.VCAP_SERVICES);
var isSso = false;
var ssoConfig = null;
if (services['SingleSignOn'] != undefined){
  isSso = true;
  ssoConfig = services['SingleSignOn'][0];
}

if (isSso) {
  var OpenIDConnectStrategy = require('passport-idaas-openidconnect').IDaaSOIDCStrategy;
  passport.use(new OpenIDConnectStrategy({
    authorizationURL: ssoConfig.credentials.authorizationEndpointUrl,
    tokenURL: ssoConfig.credentials.tokenEndpointUrl,
    clientID: ssoConfig.credentials.clientId,
    scope: ssoConfig.credentials.serverSupportedScope[0],
    response_type: 'code',
    clientSecret: ssoConfig.credentials.secret,
    callbackURL: 'https://ssotest-mmrn.mybluemix.net',
    skipUserProfile: true,
    issuer: ssoConfig.credentials.issuerIdentifier
  }, function(accessToken, refreshToken, profile, done) {
    process.nextTick(function() {
      profile.accessToken = accessToken;
      profile.refreshToken = refreshToken;
      done(null, profile);
    });
  }));
}

// Single Sign On Login処理
app.get(‘/loginSSO’, passport.authenticate(‘openidconnect’, {}));
app.get(‘/auth/sso/callback’, passport.authenticate(‘openidconnect’, {
    failureRedirect: ‘/loginSSO’
  }), function(req, res) {
  //Successfully Authenticated
  //……
  });
});
