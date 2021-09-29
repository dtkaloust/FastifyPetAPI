// CommonJs
const fastify = require('fastify')({
  logger: true
})
const fastifyPlugin = require('fastify-plugin')


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