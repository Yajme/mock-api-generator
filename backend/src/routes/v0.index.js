import {Router} from 'express';
import * as authController from '../controllers/authController.js';
import * as keyController from '../controllers/apiController.js';
import * as userController from '../controllers/userController.js';
import * as mockController from '../controllers/mockController.js';
const router = Router();
import {authenticateJwt} from '../middleware/authenticateJwt.js';


router.get('/',(req,res,next)=>{
  res.send('Success!');
});
// Authentication 
router.post('/auth/register',authController.register);
router.post('/auth/login',authController.login);
router.post('/auth/logout',authController.logout);

//this should be admin only
router.get('/users',userController.listUsers);

// Profile
router.get('/users/:id', userController.showProfile);
router.put('/users/:id', userController.updateProfile);
router.delete('/users/:id', userController.deactivateProfile);

router.get('/users/me/change-password',userController.changePassword);
router.get('/users/me/change-email', userController.changeEmail);

router.get('/user/me/keys',keyController.listKeys);
router.post('/user/key/create',keyController.createKey);
router.delete('/user/key',keyController.deleteKey);

router.get('/schema',mockController.getSchema);
router.get('/schema/create', mockController.createSchema);

router.post('/endpoint', authenticateJwt,mockController.createEndpoint);
router.get('/endpoint',mockController.generateMockdata);
export default router;
