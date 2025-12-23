import express from "express";
import { getUsers, updateUser } from "../controllers/userController";

const router = express.Router();

router.get("/", getUsers);
router.patch("/:id", updateUser);

export default router;

