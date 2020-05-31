'use strict';

const Bulb = require('./yeelight.js');
const http = require('http');
const url = require('url');
const querystring = require('querystring');

const desk = new Bulb('192.168.0.150');
const ceiling = new Bulb('192.168.0.151');
const bed = new Bulb('192.168.0.152');

const bulbs = [desk, ceiling, bed];


let alarm;
let wentOff = false;

const repeater = function () {
    for (let bulb of bulbs) {
        if (!bulb.connected)
            bulb.connect();
    }

    let now = new Date();

    if (alarm !== undefined && now.getHours() >= alarm.hour && now.getMinutes() >= alarm.minute && !wentOff) {
        simultaneous(onBulb);
        simultaneous((bulb) => brightnessBulb(bulb, 100));
        simultaneous((bulb) => ctBulb(bulb, 6500));
        wentOff = true;
    } else if (now.getHours() === 0 && wentOff)
        wentOff = false;
};


const inSequence = async function (f, t) {
    f(desk);
    setTimeout(() => f(ceiling), t);
    setTimeout(() => f(bed), t * 2);
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

const toggleBulb = function (bulb) {
    bulb.toggle();
};

const flowBulb = function (bulb) {
    let rg = 255 * 65536 + 255 * 256;
    let gb = 255 * 256 + 255;
    let br = 255 + 255 * 65536;

    bulb.sendCmd({
        params: [0, 1, `3000, 1, ${rg}, 100, 3000, 1, ${gb}, 100, 3000, 1, ${br}, 100`],
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

const defaultResponse = function (res) {
    res.writeHead(200);
    res.end('Jen\'s smart home API');
};

const requestListener = function (req, res) {
    let request = url.parse(req.url);
    let params = querystring.parse(request.query);

    switch (request.pathname) {
        case '/moody':
            simultaneous(moodyBulb);
            defaultResponse(res);
            break;
        case '/toggle':
            inSequence(toggleBulb, 500);
            defaultResponse(res);
            break;
        case '/on':
            inSequence(onBulb, 500);
            defaultResponse(res);
            break;
        case '/off':
            inSequence(offBulb, 500);
            defaultResponse(res);
            break;
        case '/flow':
            inSequence(flowBulb, 1500);
            defaultResponse(res);
            break;
        case '/rgb':
            simultaneous((bulb) => rgbBulb(bulb, params.r, params.g, params.b));
            defaultResponse(res);
            break;
        case '/temperature':
            simultaneous((bulb) => ctBulb(bulb, params.value));
            defaultResponse(res);
            break;
        case '/brightness':
            simultaneous((bulb) => brightnessBulb(bulb, params.value));
            defaultResponse(res);
            break;
        case '/props':
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify([desk.status(), ceiling.status(), bed.status()]));
            break;
        case '/set-alarm':
            if (params.hour === null)
                alarm = undefined;
            else if (params.minute === null)
                alarm = {hour: params.hour, minute: 0};
            else
                alarm = {hour: params.hour, minute: params.minute};
            defaultResponse(res);
            break
    }

};

const server = http.createServer(requestListener);

let bulb;
for (bulb of bulbs) {
    bulb.on('error', (light, error) => console.log(error));
    bulb.on('disconnected', () => console.log('disconnected'));
    bulb.connect();
}

setInterval(repeater, 5000);

server.listen(3000);