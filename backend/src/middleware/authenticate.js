import {UserError,HttpStatus} from '../utils/index.js';
import {authenticateKey} from '../services/authenticateService.js';
export const authenticate = async (req,res,next) =>{
  try {
   const key  = req.headers['x-api-key'];
   if(!key) throw new UserError('Invalid Invalid Key',HttpStatus.BAD_REQUEST);

   const response =  await authenticateKey(key);
   if(!response.is_active) throw new UserError("API Key is inactive", HttpStatus.FORBIDDEN);
  res.locals.data = {permissions : response.permissions, user_id : response.user_id}; 
    
   next();
  } catch (error) {
   next(error); 
  }
}
export const authUsername = async (req,res,next) => {
  try {
   const username = req.params.username; 
  } catch (error) {
    next(error);
  }
}
