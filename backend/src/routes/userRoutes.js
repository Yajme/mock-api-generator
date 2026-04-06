import {Router} from 'express';

const router = Router();

router.get('/',(req,res,next)=>{
 res.locals.message = "HELLO WOLRD";
  next();
})
// router.get("/:username",);
export default router;
