const fastifyPlugin = require('fastify-plugin')

module.exports = fastifyPlugin(function(fastify, opts, next){
    fastify.register(require('fastify-swagger'), {
        routePrefix: '/documentation',
        swagger: {
          info: {
            title: 'Pet store api',
            description: 'documentation and testing for pet store api',
            version: '0.1.0'
          },
          host: 'localhost:3000',
          schemes: ['http'],
          consumes: ['application/json'],
          produces: ['application/json']
          },
        staticCSP: true,
        transformStaticCSP: (header) => header,
        exposeRoute: true
      })

next()
})