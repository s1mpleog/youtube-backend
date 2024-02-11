import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateFullName,
  updateUserAvatar,
  updateUserCoverImage,
  updateUsername,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatarImage",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

// update routes
router.route("/update-name").post(verifyJwt, updateFullName);
router.route("/update-username").post(verifyJwt, updateUsername);
router
  .route("/update-avatar")
  .post(upload.single("avatarImage"), verifyJwt, updateUserAvatar);
router
  .route("/update-cover")
  .post(verifyJwt, upload.single("coverImage"), updateUserCoverImage);

export default router;
