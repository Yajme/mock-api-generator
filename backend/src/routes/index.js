import {Router} from 'express';
import v0 from './v0.index.js';
const router = Router();


// v0
router.use('/v0', v0);




export default router;
