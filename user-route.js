const fastifyPlugin = require('fastify-plugin')

const userDef = {
    id: {type: 'integer', example: 12},
    username: {type: 'string', example: 'theUser3'},
    firstName: {type: 'string', example: 'John'},
    lastName: {type: 'string', example: 'James'},
    email: {type: 'string', example: 'john@email.com'},
    password: {type: 'string', example: '12345'},
    phone: {type: 'string', example: '12345'},
    userStatus: {type: 'integer', example: 1}
}

const userOpts = {
    schema: {
        summary: 'Create User',
        tags: ['user'],
        body: {
            type: 'object',
            required: ['id','username', 'firstName', 'lastName', 'email', 'password', 'phone', 'userStatus'],
            properties: userDef
        },
        response: {
            200: {
                description: 'Successful operation',
                type: 'object',
                properties: userDef
            }
        }
    }
}

const multiUserOpts = {
    schema: {
        summary: 'Creates a list of users with a given input array',
        tags: ['user'],
        body: {
            type: 'array',
            items: {
                type: 'object',
                required: ['id','username', 'firstName', 'lastName', 'email', 'password', 'phone', 'userStatus'],
                properties: userDef
            }
        },
        response: {
            200:{
                type: 'array',
                items: {
                    type: 'object',
                    required: ['id','username', 'firstName', 'lastName', 'email', 'password', 'phone', 'userStatus'],
                    properties: userDef
                }
            }
        }
    }
}

const userLoginOpts = {
    schema: {
        summary: 'Logs user into the system',
        tags: ['user'],
        query: {
            type: 'object',
            required: ['username', 'password'],
            properties: {
                username: {type: 'string', example: 'theUser30'},
                password: {type: 'string', example: '12345'}
            }
        }
    }
}

const userRetrieveOpts = {
    schema: {
        summary: 'Get user by user name',
        tags: ['user'],
        params: {
            type: 'object',
            required: ['username'],
            properties: {
                username: {type: 'string', example: 'dtk'}
            }
        },
        response: {
            200:{
                type: 'object',
                properties: userDef
            }
        }
    }
}

const userDeleteOpts = {
    schema: {
        summary: 'Delete user by user name',
        tags: ['user'],
        params: {
            type: 'object',
            required: ['username'],
            properties: {
                username: {type: 'string', example: 'dtk'}
            }
        }
    }
}

const userDefaultOpts = {
    schema: {
        summary: 'Logs user out of the system',
        tags: ['user'],
    }
}

const userUpdateOpts = {
    schema: {
        summary: 'Update user',
        tags: ['user'],
        params: {
            type: 'object',
            required: ['username'],
            properties: {
                username: {type: 'string', example: 'dtk'}
            }
        },
        body: {
            type: 'object',
            required: ['id','username', 'firstName', 'lastName', 'email', 'password', 'phone', 'userStatus'],
            properties: userDef
        },
        response:{
            200:{
                type: 'object',
                properties: userDef
            }
        }
    }
}

async function userRoutes (fastify, options) {
    const petDB = fastify.mongo.db.collection('PET')
    const tagDB = fastify.mongo.db.collection('TAG')
    const orderDB = fastify.mongo.db.collection('ORDER')
    const userDB = fastify.mongo.db.collection('USER')

    //create a new user. Validates the user id and username don't already exist
    fastify.post('/user', userOpts, async (request, reply) => {
        const findQuery = {'id': parseInt(request.body.id)}
        const userIDExistForInsertResult = await userDB.findOne(findQuery)
        const usernameExistForInsertResult = await userDB.findOne({'username':request.body.username})
        if (userIDExistForInsertResult) {
            throw new Error('User id: '+request.body.id+' already exists!')
        }
        if (usernameExistForInsertResult) {
            throw new Error('Username: '+request.body.username+' already exists!')
        }
        try{
          await userDB.insertOne(request.body)
        } catch (err) {
          throw new Error(err)
        }
        return request.body;
      })

    //create a list of new users. Validates no user id or username already exists.
    fastify.post('/user/createWithList', multiUserOpts, async (request, reply) => {
        const allIDs = request.body.map(function (user) { return user.id })
        const allUsernames = request.body.map(function (user) { return user.username })
        const IDResults = await userDB.find({'id':{$in: allIDs}}).toArray()
        const userResults = await userDB.find({'username':{$in: allUsernames}}).toArray()
        const existingIDs = IDResults.map(function (user) { return user.id })
        const existingUsernames = userResults.map(function (user) {return user.username })
        if (existingIDs.length != 0) {
            throw new Error('User id(s): '+existingIDs.join()+' already exist(s)!')
        }

        if (existingUsernames.length != 0) {
            throw new Error('Username(s): '+existingUsernames.join()+' already exist(s)!')
        }
        try{
            await userDB.insert(request.body)
        } catch (err) {
            throw new Error(err)
        }
            return request.body;
      })

    //logs user in
    fastify.get('/user/login', userLoginOpts, async (request, reply) => {
        const userResult = await userDB.findOne({'username':request.query.username})
        if (!userResult) {
            throw new Error('Username: '+request.query.username+' does not exist!')
        } else if (userResult.password === request.query.password) {
            return 'User logged in!'
        } else {
            throw new Error('Password is incorrect!')
        }
    })

    //logs user out
    fastify.get('/user/logout', userDefaultOpts, async (request, reply) => {
        return "user logged out!"
    })

    //retrieves the user
    fastify.get('/user/:username', userRetrieveOpts, async (request, reply) => {
        const userResult = await userDB.findOne({'username':request.params.username})
        if(!userResult) {
            throw new Error('Username: '+request.params.username+' does not exist!')
        }

        return userResult
    })

    //udpates the user
    fastify.put('/user/:username', userUpdateOpts, async (request, reply) => {
        userFindQuery = {'username': request.params.username}
        userUpdateQuery = {'$set': request.body}
        const userResult = await userDB.findOne(userFindQuery)
        if(!userResult) {
            throw new Error('Username: '+request.params.username+' does not exist!')
        }
        try{
            await userDB.updateOne(userFindQuery, userUpdateQuery)
        } catch(err) {
            throw new Error (err)
        }
        return request.body
    })

    //deletes the user
    fastify.delete('/user/:username', userDeleteOpts, async (request, reply) => {
        userFindQuery = {'username': request.params.username}
        const userResult = await userDB.findOne(userFindQuery)
        if(!userResult) {
            throw new Error('Username: '+request.params.username+' does not exist!')
        }
        try{
            await userDB.deleteOne(userFindQuery)
        } catch(err) {
            throw new Error (err)
        }
        return request.params.username+' user was deleted!'
    })
}
module.exports = fastifyPlugin(userRoutes)
