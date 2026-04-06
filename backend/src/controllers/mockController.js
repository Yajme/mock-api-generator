import { getAllSchemas} from '../services/schemaService.js';
import {HttpStatus,NotFoundError,generateMockData} from '../utils/index.js';
import * as endpointService from '../services/endpointService.js';


export const getSchema = async (req,res,next) =>{
  try {
    const userId = req.params.user_id || req.query.user_id;
    const schemas = await getAllSchemas(userId);

    res.locals.data = {schemas};
    next();
  } catch (error) {
   next(error); 
  }
}

export const createSchema = async (req,res,next) =>{
  try {
   const {fields: schema} = req.body; 

  } catch (error) {
   next(error); 
  }
}

//Testing purposes
export const generateMockdata = async (req,res,next)=>{
  try {
    const schemas = await getAllSchemas();
     const cachedData = generateMockData(schemas[0].fields,10);
    res.locals.data = cachedData;
    next();
  } catch (error) {
    console.log(error);
   next(error); 
  }
}
export const createEndpoint = async (req,res,next) => {
  try {
   const {endpoint, schemaId, version,count} = req.body;
  const userId = req.user.id;

   if(!endpoint) throw new NotFoundError('Endpoint field must be filled');
  const endPointParam = {
      ownerId : userId,
      schemaId,
      name : endpoint,
      version,
      ttlSecond,
      count
    }
    next();
  } catch (error) {
    next(error);
  }
}
