const { Sonos } = require('sonos');

const device = new Sonos('192.168.0.155');

async function routes(fastify, options, done) {
    fastify.get('/play', async (request, reply) => {
        device.play();
        return {status: 'success'}
    });
    fastify.get('/pause', async (request, reply) => {
        device.pause();
        return {status: 'success'}
    });
    fastify.get('/current', async (request, reply) => {
        return device.currentTrack();
    });
    fastify.get('/state', async (request, reply) => {
        return device.getCurrentState();
    });
    fastify.get('/volume', async (request, reply) => {
        return device.getVolume();
    });
    done()
}

module.exports = routes;