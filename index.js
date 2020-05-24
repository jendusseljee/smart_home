'use strict';

const Bulb = require('./yeelight.js');
const http = require('http');

const desk = new Bulb('192.168.0.150');
const bed = new Bulb('192.168.0.151');
const ceiling = new Bulb('192.168.0.152');


const bulbs = [desk, ceiling, bed];


const flow = function(){
    let red = 255 * 65536;
    let green = 255 * 256;
    let blue = 255;

    desk.sendCmd({
      params: [ 0, 1, `3000, 1, ${red}, 50, 3000, 1, ${green}, 50, 3000, 1, ${blue}, 50`],
      method: 'start_cf'
    });

    ceiling.sendCmd({
        params: [ 0, 1, `3000, 1, ${green}, 50, 3000, 1, ${blue}, 50, 3000, 1, ${red}, 50`],
        method: 'start_cf'
    });

    bed.sendCmd({
        params: [ 0, 1, `3000, 1, ${blue}, 50, 3000, 1, ${red}, 50, 3000, 1, ${green}, 50`],
        method: 'start_cf'
    });
};

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
        case '/flow':
            flow();
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