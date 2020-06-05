const yeelight = require('./yeelight.js');


const desk = new yeelight.Bulb('192.168.0.150');
const ceiling = new yeelight.Bulb('192.168.0.151');
const bed = new yeelight.Bulb('192.168.0.152');

const bulbs = {'desk': desk, 'ceiling': ceiling, 'bed': bed};

for (let key in bulbs) {
    bulbs[key].on('error', (light, error) => console.log(error));
    bulbs[key].on('disconnected', () => bulbs[key].connect());
    bulbs[key].connect();
}

async function routes(fastify, options, done) {
    fastify.get('/', async (request, reply) => {
        return {hello: 'lights'}
    });
    fastify.get('/:light/:function', async (request, reply) => {
        let f;
        switch (request.params['function']) {
            case 'toggle':
                f = yeelight.toggle;
                break;
            case 'on':
                f = yeelight.on;
                break;
            case 'off':
                f = yeelight.off;
                break;
            case 'temperature':
                f = (bulb) => yeelight.temperature(bulb, parseInt(request.query['value']));
                break;
            case 'brightness':
                if (request.query['value'])
                    f = (bulb) => yeelight.brightness(bulb, parseInt(request.query['value']));
                else {
                    f = (bulb) => yeelight.addBrightness(bulb, parseInt(request.query['delta']));
                }
                break;
            case 'color':
                f = (bulb) => yeelight.color(bulb, parseInt(request.query['r']), parseInt(request.query['g']), parseInt(request.query['b']));
                break;
            case 'status':
                if (request.params['light'] === 'all'){
                    for (let key in bulbs)
                        if (bulbs[key].status()['power'] === 'on')
                            return bulbs[key].status();
                    return ceiling.status();
                }
                return bulbs[request.params['light']].status();
        }
        if (request.params['light'] === 'all'){
            for (let key in bulbs)
                f(bulbs[key]);
        } else
            f(bulbs[request.params['light']]);

        return {function: request.params['function'], status: 'success'};
    });
    fastify.get('/flow', async (request, reply) => {
        const rg = 255 * 65536 + 255 * 256;
        const gb = 255 * 256 + 255;
        const br = 255 + 255 * 65536;

        let delay = 0;
        for (let key in bulbs){
            setTimeout(() => {
                bulbs[key].onn();
                bulbs[key].sendCmd({
                    params: [0, 1, `3000, 1, ${rg}, 100, 3000, 1, ${gb}, 100, 3000, 1, ${br}, 100`], method: 'start_cf'
                })
            }, delay);
            delay += 1500;
        }
        return {function: 'flow', status: 'success'};
    });
    done();
}

module.exports = routes;