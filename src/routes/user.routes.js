import { Router } from "express";
import { LoginUser, changeCurrentPaasword, getCurrentUser, getUserChannelProfile, getWatchHistory, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verfiyJWT } from "../middlewares/auth.middleware.js";
const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser)

router.route("/login").post(LoginUser)

//secured routes
router.route("/logout").post(verfiyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verfiyJWT,changeCurrentPaasword)
router.route("/current-user").get(verfiyJWT,getCurrentUser)
router.route("/update-account-Details").patch(verfiyJWT,updateAccountDetails)
router.route("/avatar").patch(verfiyJWT,upload.single("/avatar"),updateUserAvatar)
router.route("/coverImage").patch(verfiyJWT,upload.single("/coverImage"),updateUserCoverImage)
router.route("/channel/:username").get(verfiyJWT,getUserChannelProfile)
router.route("/history").get(verfiyJWT,getWatchHistory)

export default router