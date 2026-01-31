import express from "express";
import { itemsController } from "../controllers/items";

const router = express.Router();

// GET /api/items
router.get("/", itemsController.getItems.bind(itemsController));

export default router;
