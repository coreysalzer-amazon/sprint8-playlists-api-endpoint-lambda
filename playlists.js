'use strict'
const uuid = require('node-uuid');

const PLAYLISTS_TABLE = ( process.env.PLAYLISTS_TABLE ? process.env.PLAYLISTS_TABLE : "playlists" );

function getOrQueryPlaylistCallback(err, data, callback) {
    if (err) {
        console.log(err);
        callback(500, {
            message: "Could not load playlist"
        });
    } else {
        if (data['Item']) {
            callback(200, data['Item']);
        } else {
            callback(404, {
                message: "The playlist does not exist"
            });
        }
    }
}

module.exports = {
    // performs a DynamoDB Scan operation to extract all of the records in the table
    getPlaylists: function(auth, ddbClient, callback) {
        var params = {
            TableName: PLAYLISTS_TABLE
        }

        if (auth) {
            params["ExpressionAttributeNames"] = {
                "#u": "user"
            };
            params["ExpressionAttributeValues"] = {
                ":val": auth
            };
            params["FilterExpression"] = "#u = :val";

        }
        
        ddbClient.scan(params, function(err, data) {
            if (err) {
                console.log(err);
                callback(500, {
                    message: "Could not load playlists"
                }).end();
            } else {
                callback(200, {"playlists": data['Items']});
            }
        })
    },

    // Extracts a specific playlist from the database. If an invalid playlistId is sent
    // we will return a 400 status code. If the parameter value is valid but we cannot find 
    // that playlist in our database we return a 404
    getPlaylist: function(auth, playlistId, ddbClient, callback) {
        if (!playlistId) {
            callback(400, {
                message: "Invalid playlist ID"
            });
            return;
        }

        var params = {
            TableName: PLAYLISTS_TABLE
        }

        if (auth) {
            params["Key"] = {
                "ID": playlistId, 
                "user": auth
            };

            ddbClient.get(params, function(err, data) {
                getOrQueryPlaylistCallback(err, data, callback);
            });
        }
        else {
            params["KeyConditionExpression"] = "ID = :val";
            params["ExpressionAttributeValues"] = {
                ":val": playlistId
            }
            console.log(params)

            ddbClient.query(params, function(err, data) {
                getOrQueryPlaylistCallback(err, data, callback);
            });

        }
    }
}