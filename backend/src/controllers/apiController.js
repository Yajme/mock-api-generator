import {generateApiKey, registerApiKey } from '../services/authenticateService.js';
import {UserError, HttpStatus} from '../utils/index.js';
export const createKey = async (req,res,next) =>{
 try {
    //can be both from body or from next;
    const user_id = req.body.user_id || res.locals.user_id;
    const permissions = req.body.permissions || res.locals.permissions || "";
    const key = generateApiKey();

    if(!user_id || !permissions) throw new UserError('Fields should not be empty', HttpStatus.BAD_REQUEST);

    const registerKey = registerApiKey({key,user_id,permissions});
    res.locals.message = "API Key created";
    res.locals.status = HttpStatus.CREATED;
    res.locals.data = {api_key: key};
    next();
  } catch (error) {
    next(error);
  } 
}

export const createEndpoint = async (req,res,next) => {
  try {
    const {endpoint,fields} = req.body;
    
  } catch (error) {
   next(error); 
  }
}

export const listKeys = async (req,res,next)=>{
  try {
    
  } catch (error) {
    next(error);
  }
}
export const deleteKey = async (req,res,next)=>{
  try {
    
  } catch (error) {
    next(error);
  }
}
