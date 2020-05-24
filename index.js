'use strict';

const Bulb = require('./yeelight.js');
const http = require('http');

const bulbs = [new Bulb('192.168.0.150'), new Bulb('192.168.0.151'), new Bulb('192.168.0.152')];

const reconnect = function () {
   let bulb;
   for (bulb of bulbs) {
      if (!bulb.connected)
         bulb.connect();
   }
};

const moody = function () {
   let bulb;
   for (bulb of bulbs) {
      bulb.onn();
      bulb.temperature(2000);
      bulb.brightness(20);
   }
};

const toggle = function () {
   let bulb;
   for (bulb of bulbs) {
      bulb.toggle();
   }
};


const requestListener = function (req, res) {
   switch (req.url) {
      case '/moody':
         moody();
         break;
      case '/toggle':
         toggle();
         break;
      case '/reconnect':
         reconnect();
         break;
   }

   res.writeHead(200);
   res.end('Jen\'s smart home API');
};

const server = http.createServer(requestListener);

let bulb;
for (bulb of bulbs) {
   bulb.on('error', (light, error) => console.log(error));
   bulb.on('disconnected', () => console.log('disconnected'));
   bulb.connect();
}

setInterval(reconnect, 5000);

server.listen(3000);