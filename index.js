'use strict';

const Bulb = require('./yeelight.js');
const http = require('http');
const url = require('url');
const querystring = require('querystring');

const desk = new Bulb('192.168.0.150');
const ceiling = new Bulb('192.168.0.151');
const bed = new Bulb('192.168.0.152');


const bulbs = [desk, ceiling, bed];

const reconnect = function () {
    for (let bulb of bulbs) {
        if (!bulb.connected)
            bulb.connect();
    }
};


const inSequence = async function(f, t) {
    f(desk);
    setTimeout(() => f(ceiling), t);
    setTimeout(() => f(bed), t*2);
};

const simultaneous = function (f) {
  for (let bulb of bulbs)
      f(bulb);
};


const moodyBulb = function (bulb) {
    bulb.onn();
    bulb.temperature(2000);
    bulb.brightness(20);
};

const onBulb = function (bulb) {
    bulb.onn();
};

const offBulb = function (bulb) {
  bulb.off();
};

const toggleBulb = function(bulb) {
    bulb.toggle();
};

const flowBulb = function (bulb) {
    let rg = 255 * 65536 + 255 * 256;
    let gb = 255 * 256 + 255;
    let br = 255 + 255 * 65536;

    bulb.sendCmd({
        params: [ 0, 1, `3000, 1, ${rg}, 100, 3000, 1, ${gb}, 100, 3000, 1, ${br}, 100`],
        method: 'start_cf'
    });
};

const rgbBulb = function (bulb, r, g, b) {
    bulb.color(parseInt(r), parseInt(g), parseInt(b));
};

const ctBulb = function (bulb, value) {
    bulb.temperature(parseInt(value));
};

const brightnessBulb = function (bulb, value) {
    bulb.brightness(parseInt(value));
};


const requestListener = function (req, res) {
    let request = url.parse(req.url);
    let params = querystring.parse(request.query);

    switch (request.pathname) {
        case '/moody':
            simultaneous(moodyBulb);
            break;
        case '/toggle':
            inSequence(toggleBulb, 500);
            break;
        case '/on':
            inSequence(onBulb, 500);
            break;
        case '/off':
            inSequence(offBulb, 500);
            break;
        case '/reconnect':
          reconnect();
          break;
        case '/flow':
            inSequence(flowBulb, 1500);
            break;
        case '/rgb':
            simultaneous((bulb) => rgbBulb(bulb, params.r, params.g, params.b));
            break;
        case '/temperature':
            simultaneous((bulb) => ctBulb(bulb, params.value));
            break;
        case '/brightness':
            simultaneous((bulb) => brightnessBulb(bulb, params.value));
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