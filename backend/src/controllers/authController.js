// src/controllers/authController.js
import {registerUser,loginUser} from '../services/userService.js';
import {HttpStatus} from '../utils/index.js';
export const register = async (req,res,next) => {
  try {
    const {username,email,password} = req.body;
    const user = {username,email,password};
    
    await registerUser(user);
  
    res.locals.message = "User Registered";
    res.locals.status = HttpStatus.CREATED;
    next();
  } catch (error) {
    next(error);
  }
}
export const login = async (req,res,next) =>{
  try {
    const { email, password } = req.body;
    
    const token = await loginUser(email, password)  // wait for it

    res.locals.data = { token }
    res.locals.message = "User logged in"
    res.locals.status = HttpStatus.OK
    next()
  } catch (error) {
   next(error); 
  }
}

export const logout = async (req, res, next) => {
  try {
    // nothing to do server-side
    res.locals.data = null
    res.locals.message = "Logged out successfully"
    res.locals.status = HttpStatus.OK
    next()
  } catch (error) {
    next(error)
  }
}
 
