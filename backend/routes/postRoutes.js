import express from "express";
import { createPost, getPosts, toggleLike } from "../controllers/postController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/", authMiddleware, createPost);
router.get("/", getPosts);
router.put("/:id/like", authMiddleware, toggleLike);

export default router;