const { Sonos } = require('sonos');
const fs = require('fs');
const http = require('http');

const device = new Sonos('192.168.0.155', 1400);

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
    fastify.get('/current/image.png', async (request, reply) => {
        let file = fs.createWriteStream("image.png");
        let currentTrack = await device.currentTrack();
        http.get(currentTrack['albumArtURL'], function(response) {
            response.pipe(file).on('close', () => fs.readFile('image.png', (err, fileBuffer) => {
                reply.send(err || fileBuffer);
            }));
        });
    });
    done()
}

module.exports = routes;