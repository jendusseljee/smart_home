'use strict';

const fastify = require('fastify')({logger: false});

fastify.register(require('./lights/index'), {prefix: 'lights'});
fastify.register(require('./music/index'), {prefix: 'music'});

fastify.get('/', function (request, reply) {
    reply.send({hello: 'world'})
});

fastify.listen(3000, '0.0.0.0', function(err, address) {
    if (err) {
        fastify.log.error(err);
    }
    fastify.log.info(`server listening on ${address}`);
});