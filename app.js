'use strict'
const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')

// Import resources
const playlists = require('./playlists');

// TODO: Set the correct AWS region for your app
AWS.config.update({ region: 'us-east-1' });

// declare a new express app
const app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// The DocumentClient class allows us to interact with DynamoDB using normal objects. 
// Documentation for the class is available here: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html
const dynamoDb = new AWS.DynamoDB.DocumentClient();

/**********************
 * Restaurant methods *
 **********************/

app.get('/playlists', function(req, res) {
    //Auth required
    console.log(Object.keys(req.apiGateway.event.requestContext))
    
    if (req.apiGateway.event.requestContext.stage == "prod" || "prodWithSDK") {
        console.log("sub: " + req.apiGateway.event.requestContext.authorizer.claims.sub)
        playlists.getPlaylists(req.apiGateway.event.requestContext.authorizer.claims.sub, dynamoDb, function(status, data) {
            res.status(status).json(data);
        });
    }
    else if (req.apiGateway.event.requestContext.stage == "dev" || "prodWithSDK") {
        playlists.getPlaylists(null, dynamoDb, function(status, data) {
            res.status(status).json(data);
        });
    }

});

app.get('/playlists/:playlistId', function(req, res) {
    //Auth required
    if (req.apiGateway.event.requestContext.stage == "prod" || "prodWithSDK") {
        playlists.getPlaylist(req.apiGateway.event.requestContext.authorizer.claims.sub, req.params.playlistId, dynamoDb, function(status, data) {
            res.status(status).json(data);
        });
    }
    else if (req.apiGateway.event.requestContext.stage == "dev") {
        playlists.getPlaylist(null, req.params.playlistId, dynamoDb, function(status, data) {
            res.status(status).json(data);
        });
    }
});

if (!process.env.PLAYLISTS_TABLE) {
    let server = app.listen(function() {
        let host = server.address().address;
        if (host == "::") {
            host = "localhost";
        }
        let port = server.address().port;
        console.log("Example app listening at http://%s:%s/playlists", host, port);
    })
}

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from 
// this file
module.exports = app;