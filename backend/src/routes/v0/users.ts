import {Router} from "express";
import * as userController from "#src/controllers/userController";
import * as keyController from "#src/controllers/apiController.js";

const router = Router();
// this should be admin only
router.get("/", userController.listUsers);

// Profile
router.get("/:id", userController.showProfile);
router.put("/:id", userController.updateProfile);
router.delete("/:id", userController.deactivateProfile);

router.get("/me/change-password", userController.changePassword);
router.get("/me/change-email", userController.changeEmail);

// API Keys
router.get("/me/keys", keyController.listKeys);
router.post("/key/create", keyController.createKey);
router.delete("/key", keyController.deleteKey);

export default router;