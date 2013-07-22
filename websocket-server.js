// adapted from:
// http://blog.gingertech.net/2012/06/04/video-conferencing-in-html5-webrtc-via-web-sockets/

var WebSocketServer = require('websocket').server;
var http = require('http');
var static = require('node-static');
var clients = [];

var staticServer = new static.Server('.');

// set up node-static to serve static files in this directory,
// i.e., http://localhost:1337/index.html
var server = http.createServer(function(request, response) {
    request.addListener('end', function() {
        staticServer.serve(request, response);
    }).resume();
});
server.listen(1337, function() {
  console.log((new Date()) + " Server is listening on port 1337");
});

// create the server
wsServer = new WebSocketServer({
    httpServer: server
});

function sendCallback(err) {
    if (err) console.error((new Date()) + "send() error: " + err);
}

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
    var connection = request.accept(null, request.origin);
    console.log((new Date()) + ' Connection remoteAddress ' + connection.remoteAddress);
    clients.push(connection);

    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            // process WebSocket message
            console.log((new Date()) + ' Received Message ' + message.utf8Data);
            // broadcast message to all connected clients
            clients.forEach(function (outputConnection) {
                if (outputConnection != connection) {
                  outputConnection.send(message.utf8Data, sendCallback);
                }
            });
        }
    });

    connection.on('close', function(connection) {
        // close user connection
        console.log((new Date()) + " Peer disconnected.");
        for (var i = 0; i < clients.length; i++) {
            if (!clients[i].connected)
                clients.remove(i);
        }
    });
});

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};
