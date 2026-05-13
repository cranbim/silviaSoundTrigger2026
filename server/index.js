#!/usr/bin/env node
const express=require('express')
const app=express()
const path=require('path')
const PORT=3000

app.listen(PORT, ()=>{
  console.log('listening for HTTP on port '+PORT)
})

app.use(express.static('public'))

var WebSocketServer = require('websocket').server;
var http = require('http');
var nextConnectionID=0;
var connections = [];
var arduinos = [];
var browsers = [];
var currentBrowser=null;
const accSensitivity="2.00";

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8011, function() {
    console.log((new Date()) + ' Server is listening on port 8011');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {

    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('arduino', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    var connectionID=nextConnectionID++;
    connections.push(connection);


	  connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            // console.log("IAMABROWSER"+'>'+message.utf8Data+'<'+'>'+decode_utf8(message.utf8Data)+'<');

            if(message.utf8Data=="IAMABROWSER"){
              currentBrowser=connection;
              console.log('Browser set to connection #'+connectionID);
            } else {
              if(currentBrowser!==null){
                // currentBrowser.sendUTF("SCDV"+("000"+connectionID).slice(-3)+message.utf8Data);
                currentBrowser.sendUTF(message.utf8Data);
              }
            }
            let instr=message.utf8Data.substring(4,8)
            let mac4=message.utf8Data.substring(0,4)
            console.log(instr,mac4)
            // if()
            connections.forEach(con=>{
              if(currentBrowser!=con){
                con.sendUTF(message.utf8Data);
              }
            })
            
            // connection.sendUTF("Received your message");
        }
        // else if (message.type === 'binary') {
        //     console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
        //    //connection.sendBytes(message.binaryData);
        // }
    });

	  connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });

    var ids=("00"+connectionID).slice(-2);
    console.log("connection id: "+ids);
    connection.sendUTF("Hello Client!"+"WID");
    connection.sendUTF("WID"+ids);
    connection.sendUTF("ATH"+accSensitivity);//acc threshold
});

function decode_utf8( s )
{
  return decodeURIComponent( escape( s ) );
}
