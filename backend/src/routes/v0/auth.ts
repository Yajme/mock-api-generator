import {Router} from "express";

import * as authController from "#src/controllers/authController.js";
const router = Router();

// Authentication

router.post("/login", authController.login);

router.post("/logout", authController.logout);

// soon to be deprecrated
router.post("/signup", authController.signup);


export default router;