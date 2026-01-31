import express from "express";
import { selectedController } from "../controllers/selected";

const router = express.Router();

// GET /api/selected
router.get("/", selectedController.getSelected.bind(selectedController));

// POST /api/selected
router.post("/", selectedController.addSelected.bind(selectedController));

// PUT /api/selected/order
router.put("/order", selectedController.updateOrder.bind(selectedController));

// DELETE /api/selected
router.delete("/", selectedController.removeSelected.bind(selectedController));

export default router;
