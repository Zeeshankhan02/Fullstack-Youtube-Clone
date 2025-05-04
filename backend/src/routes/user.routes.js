import { Router } from "express";
import {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// secured routes
router.post(
  "/register",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.post("/login", loginUser);


// secured routes
router.use(verifyJWT)
router.get("/get-user",getCurrentUser)
router.post("/refresh", refreshAccessToken);
router.post("/logout", logOutUser);
router.patch("/change-password",changeCurrentPassword)
router.patch("/update-details",updateAccountDetails)
router.patch("/update/avatar",upload.single("avatar"), updateUserAvatar
);
router.patch("/update/cover-image",upload.single("coverImage"),updateUserCoverImage
);
router.get("/user-profile/:userName",getUserChannelProfile)
router.get("/watch-history",getWatchHistory)


export default router;
