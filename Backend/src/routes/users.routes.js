import { Router } from "express";
import { addToHistory, getUserHistory, login, register, logout, checkAuth } from "../controllers/user.controller.js";


const router = Router();

// Use POST method directly
router.post("/login", login);
router.post("/register", register);
router.post("/logout", logout);
router.get("/check-auth", checkAuth);

// ✅ Correct usage of route chaining
router.route("/add_to_activity").post(addToHistory);
router.route("/get_all_activity").get(getUserHistory);

export default router;