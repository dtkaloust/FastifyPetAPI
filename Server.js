// CommonJs
const fastify = require('fastify')({
  logger: true
})
const fastifyPlugin = require('fastify-plugin')



// fastify.register(require('fastify-swagger'), {
//   routePrefix: '/documentation',
//   swagger: {
//     info: {
//       title: 'Test swagger',
//       description: 'Testing the Fastify swagger API',
//       version: '0.1.0'
//     },
//     externalDocs: {
//       url: 'https://swagger.io',
//       description: 'Find more info here'
//     },
//     host: 'localhost',
//     schemes: ['http'],
//     consumes: ['application/json'],
//     produces: ['application/json'],
//     tags: [
//       { name: 'user', description: 'User related end-points' },
//       { name: 'code', description: 'Code related end-points' }
//     ],
//     definitions: {
//       User: {
//         type: 'object',
//         required: ['id', 'email'],
//         properties: {
//           id: { type: 'string', format: 'uuid' },
//           firstName: { type: 'string' },
//           lastName: { type: 'string' },
//           email: {type: 'string', format: 'email' }
//         }
//       }
//     },
//     securityDefinitions: {
//       apiKey: {
//         type: 'apiKey',
//         name: 'apiKey',
//         in: 'header'
//       }
//     }
//   },
//   uiConfig: {
//     docExpansion: 'full',
//     deepLinking: false
//   },
//   uiHooks: {
//     onRequest: function (request, reply, next) { next() },
//     preHandler: function (request, reply, next) { next() }
//   },
//   staticCSP: true,
//   transformStaticCSP: (header) => header,
//   exposeRoute: true
// })
fastify.register(require('./swagger'))
fastify.register(require('./our-db-connector'))
fastify.register(require('./pet-route'))
fastify.register(require('./store-route'))
fastify.register(require('./user-route'))





const start = async () => {
  try {
    await fastify.listen(3000)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()