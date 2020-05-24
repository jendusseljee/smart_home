'use strict';

const { Bulb } = require('./yeelight.js');
const http = require('http');

const yeelights = [new Bulb('192.168.0.150'), new Bulb('192.168.0.151'), new Bulb('192.168.0.152')];

const moody = function () {
  var bulb;
  for (bulb of yeelights){
     bulb.onn();
     bulb.color(255, 255, 255);
     bulb.temperature(2000);
     bulb.brightness(1);
  }
};

const toggle = function () {
   var bulb;
   for (bulb of yeelights){
      bulb.toggle();
   }
};


const requestListener = function(req, res) {
   switch (req.url) {
      case '/moody':
         moody();
         break;
      case '/toggle':
         toggle();
         break
   }

   res.writeHead(200);
   res.end('Jen\'s smart home API');
};

const server = http.createServer(requestListener);

var bulb;
for (bulb of yeelights) {
   bulb.on('error', (error) => console.log(error));
   bulb.on('disconnected', () => bulb.connect());
   bulb.connect();
}

server.listen(3000);