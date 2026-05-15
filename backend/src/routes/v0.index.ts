import { Router } from "express";
import * as authController from "#src/controllers/authController.js";
import * as keyController from "#src/controllers/apiController.js";
import * as userController from "#src/controllers/userController.js";
import * as mockController from "#src/controllers/mockController.js";
import { authenticateJwt } from "#src/middleware/authenticateJwt.js";
import { notFoundHandler } from "../middleware";

const router = Router();


// Authentication
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/logout", authController.logout);

// this should be admin only
router.get("/users", userController.listUsers);

// Profile
router.get("/users/:id", userController.showProfile);
router.put("/users/:id", userController.updateProfile);
router.delete("/users/:id", userController.deactivateProfile);

router.get("/users/me/change-password", userController.changePassword);
router.get("/users/me/change-email", userController.changeEmail);

router.get("/user/me/keys", keyController.listKeys);
router.post("/user/key/create", keyController.createKey);
router.delete("/user/key", keyController.deleteKey);

router.get("/schema", authenticateJwt, mockController.getSchema);
router.get("/schema/:schemaName", authenticateJwt, mockController.getSchema);
router.post("/schema/create", authenticateJwt, mockController.createUserSchema);

router.post("/endpoint", authenticateJwt, mockController.createEndpoint);
// router.get("/endpoint", mockController.generateMockdata);


//router.use(notFoundHandler)
export default router;
