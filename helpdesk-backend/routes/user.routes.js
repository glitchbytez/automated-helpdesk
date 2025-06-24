import { Router } from "express"
import * as userController from "../controllers/user.controller.js"
import { authenticateJWT, restrictTo, checkPermission } from "../middleware/auth.middleware.js"

const userRouter = Router()

// Protect all routes after this middleware
userRouter.use(authenticateJWT)

// Current user routes
userRouter.get("/me", userController.getMe, userController.getUser)
userRouter.patch("/update-me", userController.updateMe)
userRouter.patch("/update-password", userController.updatePassword)

// Admin routes
userRouter.use(restrictTo("admin"))

userRouter.route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser)

userRouter.route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser)

userRouter.patch("/:id/reset-password", userController.adminResetPassword)
userRouter.patch("/:id/status", userController.updateUserStatus)

export default userRouter
