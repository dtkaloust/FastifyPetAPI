// CommonJs
const fastifyPlugin = require('fastify-plugin')

const uri = 'mongodb+srv://Dan:test123@cluster0.pnoaa.mongodb.net/pets?retryWrites=true&w=majority';

async function dbConnector (fastify, options) {
  fastify.register(require('fastify-mongodb'), {
    url: uri
  })
}

// Wrapping a plugin function with fastify-plugin exposes the decorators    
// and hooks, declared inside the plugin to the parent scope.
module.exports = fastifyPlugin(dbConnector)