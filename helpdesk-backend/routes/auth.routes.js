import { Router } from "express"
import * as authController from "../controllers/auth.controller.js"
import { authenticateJWT } from "../middleware/auth.middleware.js"

const authRouter = Router()

authRouter.post("/register", authController.register)
authRouter.post("/login", authController.login)
authRouter.get("/logout", authController.logout)
authRouter.post("/refresh-token", authController.refreshToken)

authRouter.post("/forgot-password", authController.forgotPassword)
authRouter.patch("/reset-password/:token", authController.resetPassword)

authRouter.patch("/update-password", authenticateJWT, authController.updatePassword)

export default authRouter
