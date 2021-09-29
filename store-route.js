const fastifyPlugin = require('fastify-plugin')

const orderDef = {
    id: {type: 'integer', example: 22},
    petId: {type: 'integer', example: 10},
    quantity: {type: 'integer', example: 1},
    shipDate: {type: 'string', format: 'date-time' },
    status: {type: 'string', enum: ['placed', 'approved', 'delivered']},
    complete: {type: 'boolean'}
}

const insertOrderOpts = {
    schema: {
        summary: 'Place an order for a pet',
        tags: ['store'],
        body: {
            type: 'object',
            required: ['id','petId', 'quantity', 'shipDate', 'status', 'complete'],
            properties: orderDef
        },
        response: {
            200: {
                type: 'object',
                properties: orderDef
            }
        }
    }
}

const storeDefaultOpts = {
    schema: {
        summary: 'Returns pet inventories by status',
        tags: ['store'],
        response: {
            200: {
                description: 'Successful operation',
                type: 'object',
                properties: {
                    available: {type: 'integer', example: 2},
                    sold: {type: 'integer', example: 5},
                    pending: {type: 'integer', example: 1}
                }
            }
        }
    }
}

const findByOrderIDOpts = {
    schema: {
        summary: 'Find purchase order by ID',
        tags: ['store'],
        params: {
            type: 'object',
            required: ['orderid'],
            properties: {
                orderid:{type: 'integer', example: '11'}
            }
        },
        response: {
            200:{
                description: 'Succesful operation',
                type: 'object',
                properties: orderDef
            }
        }
    }
}

const deleteByOrderIDOpts = {
    schema: {
        summary: 'Delete purchase order by ID',
        tags: ['store'],
        params: {
            type: 'object',
            required: ['orderid'],
            properties: {
                orderid:{type: 'integer', example: '11'}
            }
        }
    }
}

async function storeRoutes (fastify, options) {
    const petDB = fastify.mongo.db.collection('PET')
    const tagDB = fastify.mongo.db.collection('TAG')
    const orderDB = fastify.mongo.db.collection('ORDER')

    //retrieve a map of all statuses from current pet inventory
    fastify.get('/store/inventory', storeDefaultOpts, async (request, reply) => {
        const validStatuses = ['available', 'sold', 'pending']
        let returnAggregate = {}
        const allPets = await petDB.aggregate([{$group: {_id: '$status', count: {$sum: 1}}}]).toArray()
        allPets.forEach(element => returnAggregate[element._id] = element.count)
        validStatuses.forEach(element => Object.keys(returnAggregate).includes(element) ? true : returnAggregate[element] = 0)
        return returnAggregate
    })

    //insert an order
    fastify.post('/store/order', insertOrderOpts, async (request, reply) => {
        const findQuery = {'id': parseInt(request.body.id)}
        let setQuery = request.body
        const convertedShipDate = new Date(setQuery.shipDate)
        if(isNaN(convertedShipDate)){
            throw new Error('invalid shipdate format. ex: 2021-09-27T20:21:20.690')
        } else {
            setQuery.shipDate = convertedShipDate
        }
        const orderExistForInsertResult = await orderDB.findOne(findQuery)
        if (orderExistForInsertResult) {
          throw new Error('Order id: '+request.body.id+' already exists!')
        }
        try{
          await orderDB.insertOne(setQuery)
        } catch (err) {
          throw new Error(err)
        }
        return request.body;
    })

    //retrieve order by using order id
    fastify.get('/store/order/:orderid', findByOrderIDOpts, async (request, reply) => {
        const findQuery = {'id': parseInt(request.params.orderid)}
        const orderResult = await orderDB.findOne(findQuery)
        if (!orderResult) {
          throw new Error('Order id: '+request.params.orderid+' does not exist!')
        }
        return orderResult
    })

    //delete order by using order id
    fastify.delete('/store/order/:orderid', deleteByOrderIDOpts, async (request, reply) => {
        const findQuery = {'id': parseInt(request.params.orderid)}
        const orderResult = await orderDB.findOne(findQuery)
        if (!orderResult) {
          throw new Error('Order id: '+request.params.orderid+' does not exist!')
        }

        try {
            return await orderDB.deleteOne(findQuery)
        } catch (err) {
            throw new Error(err)
        }
    })
}

module.exports = storeRoutes