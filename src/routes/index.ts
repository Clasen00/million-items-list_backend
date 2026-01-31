import express from "express";

import itemsRoutes from "./items";
import selectedRoutes from "./selected";

const router = express.Router();

router.use("/items", itemsRoutes);
router.use("/selected", selectedRoutes);

export default router;
