import { Router } from "express";
import * as mockController from "#src/controllers/mockController.js";

const router = Router();
//GET RESOURCE
router.get("/", mockController.getSchema);

router.get("/:schemaName", mockController.getSchema);
// POST RESOURCE
router.post("/", mockController.createUserSchema);

// PUT RESOURCE
router.put("/:id", mockController.updateUserSchema);

// DELETE RESOURCE
router.delete("/:id", mockController.deleteUserSchema);


export default router;
