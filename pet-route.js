const fastifyPlugin = require('fastify-plugin')

const petDef = {
    id: {type: 'integer', example: 2},
    name: {type: 'string', example: 'Luca'},
    category: {type: 'integer', example: 1},
    photoUrls: {type: 'array', items: {type: 'string', example: 'URL1'}},
    tags: {type: 'array', items: {
      type: 'object', 
      properties: {
        id: {type: 'integer', example: 10}, 
        name: {type: 'string', example: 'royalty'}
      }
    }},
    status: {type: 'string', example: 'available', enum: ['available', 'pending', 'sold']}
}


const updatePetOpts = {
  schema: {
    tags: ['pet'],
    summary: 'Update an existing pet by ID',
    body: {
      type: 'object',
      required: ['id','name', 'category', 'photoUrls', 'tags', 'status'],
      properties: petDef
    },
    response: {
      200: {
        description: 'Successful operation',
        type: 'object',
        properties: petDef
      }
    }
  }
}

const createPetOpts = {
  schema: {
    tags: ['pet'],
    summary: 'Add a new pet to the store.',
    body: {
      type: 'object',
      required: ['id','name', 'category', 'photoUrls', 'tags', 'status'],
      properties: petDef
    },
    response: {
      200: {
        description: 'Successful operation',
        type: 'object',
        properties: petDef
      }
    }
  }
}

const findByStatusOpts = {
  schema: {
    summary: 'Finds Pets by status',
    tags: ['pet'],
    query: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {type: 'string', enum: ['available', 'pending', 'sold']}
      }
    },
    response: {
      200: {
        description: 'Successful operation',
        type: 'array',
        items: {
          type: 'object',
          properties: petDef
        }
      }
    }
  }
}

const findByTagsOpts = {
  schema: {
    summary: 'Finds Pets by tags',
    tags: ['pet'],
    query: {
      type: 'object',
      required: ['tags'],
      properties: {
        tags: {type: 'array', example: ['royalty', 'hungry'], items: {type:'string'}, collectionFormat: 'multi'}
      }
    },
    response: {
      200: {
        description: 'Successful operation',
        type: 'array',
        items: {
          type: 'object',
          properties: petDef
        }
      }
    }
  }
}

const findByPetIDOpts = {
  schema: {
    summary: 'Finds Pets by id',
    tags: ['pet'],
    params: {
      type: 'object',
      required: ['petid'],
      properties: {
        petid:{type: 'integer', example: 1}
      }
    },
    response: {
      200: {
        description: 'Successful operation',
        type: 'object',
        properties: petDef
      }
    }
  }
}

const deleteByPetIDOpts = {
  schema: {
    summary: 'Delete Pets by id',
    tags: ['pet'],
    params: {
      type: 'object',
      required: ['petid'],
      properties: {
        petid:{type: 'integer', example: 1}
      }
    }
  }
}

const updateByPetIDOpts = {
  schema: {
    tags: ['pet'],
    summary: 'Updates a pet in the store with form data',
    params: {
      type: 'object',
      required: ['petid'],
      properties: {
        petid:{type: 'integer', example: 1}
      }
    },
    query: {
      type: 'object',
      required: ['name', 'status'],
      properties: {
        name:{type: 'string'},
        status:{type: 'string', enum:['available', 'pending', 'sold']}
      }
    },
    response: {
      200: {
        description: 'Successful operation',
        type: 'object',
        properties: petDef
      }
    }
  }
}

const updateImageByPetIDOpts = {
  schema: {
    tags: ['pet'],
    summary: 'Uploads an image',
    params: {
      type: 'object',
      required: ['petid'],
      properties: {
        petid:{type: 'integer', example: 1}
      }
    },
    query: {
      type: 'object',
      required: ['metadata'],
      properties: {
        metadata:{type: 'string', example: 'URL10'},
      }
    }
  }
}



async function petRoutes (fastify, options) {
    const petDB = fastify.mongo.db.collection('PET')
    const tagDB = fastify.mongo.db.collection('TAG')

    //update a pet given a pet id. Check if id exists in database, if not respond saying pet does not exist. Otherwise, update pet.
    fastify.put('/pet', updatePetOpts, async (request, reply) => {
      const findQuery = {'id': parseInt(request.body.id)}
      const setQuery = {'$set': request.body}
      const petExistForUpdateResult = await petDB.findOne(findQuery)
      if (!petExistForUpdateResult) {
        throw new Error('Pet id: '+request.body.id+' does not exist')
      }
      try{
        await petDB.updateOne(findQuery, setQuery)
      } catch (err) {
        throw new Error(err)
      }
      return request.body;
    })

    //create a new pet with given validated json. Returns error if the pet id is already in use
    fastify.post('/pet', createPetOpts, async (request, reply) => {
      const findQuery = {'id': parseInt(request.body.id)}
      const setQuery = request.body
      const petExistForInsertResult = await petDB.findOne(findQuery)
      if (petExistForInsertResult) {
        throw new Error('Pet id: '+request.body.id+' already exists!')
      }
      try{
        await petDB.insertOne(setQuery)
      } catch (err) {
        throw new Error(err)
      }
      return request.body;
    })
    
    //retrieves list of pets with a given status
    fastify.get('/pet/findByStatus',findByStatusOpts, async (request, reply) => {
      const petByStatusResult = await petDB.find({'status':request.query.status}).toArray()
      if (!petByStatusResult) {
        throw new Error('Invalid value')
      }
      return petByStatusResult
    })

    //retrieves list of pets with a given tag. All tags must be defined in the tag database table
    fastify.get('/pet/findByTags', findByTagsOpts, async (request, reply) => {
      const tagsToQuery = [].concat(request.query.tags)
      
      //if you want to verify the tags are in the database
      // const tagResults = await tagDB.find({'name':{$in: tagsToQuery}}).toArray()
      // if(tagResults.length != tagsToQuery.length){
      //   throw new Error('All tags are not defined in database')
      // }
      const petByTagsResult = await petDB.find({'tags': {$elemMatch: {'name':{$in: tagsToQuery}}}}).toArray()
      return petByTagsResult
    })

    //retrieves pet from a given pet id. Returns an error if pet is not found
    fastify.get('/pet/:petid', findByPetIDOpts, async (request, reply) => {
      const petByIDResult = await petDB.findOne({id: parseInt(request.params.petid)})
      if(!petByIDResult) {
        throw new Error('Pet with id: '+request.params.petid+' does not Exist!')
      } else {
        return petByIDResult
      } 
    })

    //updates pet of the given pet id with the new name and status
    fastify.post('/pet/:petid', updateByPetIDOpts, async (request, reply) => {
      const findQueryByID = {id: parseInt(request.params.petid)}
      const updateQueryByID = {'$set': request.query}
      const petByIDResult = await petDB.findOne(findQueryByID)
      if(!petByIDResult) {
        throw new Error('Pet with id: '+request.params.petid+' does not Exist!')
      } else {
        try {
          await petDB.updateOne(findQueryByID, updateQueryByID)
          return await petDB.findOne(findQueryByID)
        } catch (err) {
        throw new Error(err)
        }
      }
    })

    //delete pet of the given pet id
    fastify.delete('/pet/:petid', deleteByPetIDOpts, async (request, reply) => {
      const findQueryByID = {id: parseInt(request.params.petid)}
      const petByIDResult = await petDB.findOne(findQueryByID)
      if(!petByIDResult) {
        throw new Error('Pet with id: '+request.params.petid+' does not Exist!')
      } else {
        try {
          return await petDB.deleteOne(findQueryByID)
        } catch (err) {
        throw new Error(err)
        }
      }
    })

    //adds an additional photo of pet
    fastify.post('/pet/:petid/uploadImage', updateImageByPetIDOpts, async (request, reply) => {
      const findQueryByID = {id: parseInt(request.params.petid)}
      const petByIDResult = await petDB.findOne(findQueryByID)
      if(!petByIDResult) {
        throw new Error('Pet with id: '+request.params.petid+' does not Exist!')
      } else {
        try {
          if(petByIDResult.photoUrls.includes(request.query.metadata) ){
            throw new Error('petid: '+request.params.petid+' already has metadata: '+request.query.metadata)
          }
          const updateQueryByID = {'$set': {photoUrls: petByIDResult.photoUrls.concat(request.query.metadata)}}
          return await petDB.updateOne(findQueryByID, updateQueryByID )
        } catch (err) {
        throw new Error(err)
        }
      }
    })

  }
  
  module.exports = petRoutes