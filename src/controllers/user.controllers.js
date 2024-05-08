import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudniary} from "../utils/fileupload.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
//method for generating access and refresh token
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Save refreshToken in the database
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        // Return accessToken and refreshToken as an object
        return { accessToken, refreshToken };
    } catch (err) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
}
const registerUser = asyncHandler( async (req,res)=>{
    //step:1 get user detail from frontend
    //step:2 validation - not empty
    //step:3 check if user already exists: username, email
    //step:4 check for images, check for avatar
    //step:5 upload them to cloudniary , avatar 
    //step 6:create user object - create entry in db
    //step 7:remove password and refresh token firld from response
    //step 8:check for user creation
    //step 9:return response

    //step:1
    const {fullname,email,username,password}=req.body
    //step:2
    /*if(fullname === ""){
        throw new ApiError(400,"fullname is required");
    }
    if(email === ""){
        throw new ApiError(400,"email is required");
    }
    if(password === ""){
        throw new ApiError(400,"password is required");
    }
    if(username === ""){
        throw new ApiError(400,"username is required");
    }
    */
    //step :2 but in advance formate
    if(
        [fullname,email,username,password].some((filed)=>filed?.trim()==="")
    ){
        throw new ApiError(400, "All fields are required")
    }
    //In step 2: you can also check email formate [example@gmail.com] and password is strong or not like check 8 characters are there or not 
    //step :3 
    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }
    //step 4:
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    
    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar is required")
    }
  

    //step 5 :
    const avatar = await uploadOnCloudniary(avatarLocalPath)
    const coverImage = await uploadOnCloudniary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar is not uploaded on cloudniary")
    }

    //Step 6:
    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    //step 7:
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    //Step 8:
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    //step 9:
    return res.status(201).json(
        new ApiResponse(200 , createdUser, "User registered succeddfully")
    )

})


//  Login user
const LoginUser = asyncHandler(async (req,res)=>{
    //Step 1: Bring data from request body
    //Step 2: username or email 
    //Step 3:Find the user
    //Step 4:check password
    //Step 5:access and refresh token 
    //Step 6:send token in cookies formate

    //step 1:Bring data from request body
    const {email , username, password} =req.body

    //Step 2: username or email 
    if(!(email || username)){
        throw new ApiError(400 , "username or email is required!!")
    }

    //Step 3:Find the user
    const user = await User.findOne({$or: [{username} , {email}]}); //This will find email or username from the database

    if(!user){
        throw new ApiError(404,"user dosen't exist")
    }

    //Step 4:check password
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }

    //Step 5:access and refresh token
    const {accessToken, refreshToken}=await generateAccessAndRefreshTokens(user._id)
    //Step 6:send token in cookies formate
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

// Check if loggedInUser exists
if (!loggedInUser) {
    throw new ApiError(404, "User not found");
}

// Convert loggedInUser to a plain JavaScript object
const plainUser = loggedInUser.toObject({ getters: true, virtuals: true });

const options = {
    httpOnly: true, // Cookies will not be modified by the client 
    secure: true // For security purposes
};

return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {
        user: plainUser,
        accessToken,
        refreshToken
    }, "User logged in successfully"));

})
    //Logout 
    const logoutUser = asyncHandler(async (req, res) => {
        const options = {
            httpOnly: true, // Cookies will not be modified by the client 
            secure: true // For security purposes
        };
        await User.findByIdAndUpdate(req.user._id, {
            $unset: {
                refreshToken: 1
            }
        }, {
            new: true
        });
        return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200,{}, "User Logout Successfully"))
    });

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(404,"unauthorized request")
    }

    try{const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(404,"Invalid refresh Token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }

        const options = {
            httpOnly:true,
            secure:true
        }

        const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newrefreshToken,options).json(
            new ApiResponse(
                200,
                {accessToken, refreshToken:newrefreshToken},
                "Access token refreshed"
            )
        )
    }catch(error){
        throw new ApiError(401,error?.message|| "Invalid refresh token")
    }
})

//Password Change
const changeCurrentPaasword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword,confirmPassword} = req.body

    if(!(newPassword === confirmPassword)){
        throw new ApiError(400,"Confirm Password and New Password is not same")
    }

    const user= await User.findById(res.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old Paswword")
    }
    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json(200,req.user,"currect user fetch successfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const{fullname ,email} = req.body

    if (!fullname || !email) {
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            fullname:fullname,
            email:email
        }
    },{new:true}.select("-password"))

    return res.status(200).json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar= asyncHandler(async(req,res)=>{
    const avatarLocalPath= req.file?.path
    if(!avatarLocalPath) {
        throw new ApiError(400,"Avatar is empty")
    }
    const avatar= await uploadOnCloudniary(avatarLocalPath)
    if(!avatar.url) {
        throw new ApiError(400,"Avatar is not uplodaed in cloudniary")
    }
    const user =  await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            avatar:avatar.url
        }
    },{new:true}.select("-password"))

    return res.status(200).json(new ApiResponse(200,user,"Avatar is updated successfully"))
})

const updateUserCoverImage= asyncHandler(async(req,res)=>{
    const coverImageLocalPath= req.file?.path
    if(!coverImageLocalPath) {
        throw new ApiError(400,"cover Image is empty")
    }
    const coverImage= await uploadOnCloudniary(coverImageLocalPath)
    if(!coverImage.url) {
        throw new ApiError(400,"Cover Image is not uplodaed in cloudniary")
    }
    const user =  await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            coverImage:coverImage.url
        }
    },{new:true}.select("-password"))

    return res.status(200).json(new ApiResponse(200,user,"Cover Image is updated successfully"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing");
    }

    const channel = await User.aggregate([
            {
                $match: { username: username.toLowerCase() }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },
            {
                $addFields: {
                    subscribersCount: {
                        $size: "$subscribers"
                    },
                    channelsSubscribedToCount: {
                        $size: "$subscribedTo"
                    },
                    isSubscribed: {
                        $cond: {
                            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    fullname: 1,
                    username: 1,
                    subscribersCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubscribed: 1,
                    avatar: 1,
                    email: 1,
                    coverImage: 1
                }
            }
        ]);

    if(!channel?.length){
        throw new ApiError(404,"channel does not exists")
    }

    return res.status(200).json(new ApiResponse(200,channel[0]),"user channel fetch successfully")
});

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([{
        $match:{
            _id:new monggose.Type.ObjectId(req.user._id)
        }
    },{
        $lookup:{
            from: "videos",
            localField: "watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline:[
                {
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[
                            {
                                $project:{

                                    fullname:1,
                                    username:1,
                                    avatar:1
                                }
                            }
                        ]
                    }
                },{
                    $addFields:{
                        owner:{
                            $first:"$owner"
                        }
                    }
                }
            ]
        }
    },
])

    return res.status(200).json(new ApiResponse(200,user[0].watchHistory,"Watch History fetched successfully"))
})




export {registerUser,LoginUser,logoutUser, refreshAccessToken,changeCurrentPaasword,getCurrentUser,updateAccountDetails ,updateUserAvatar,updateUserCoverImage , getUserChannelProfile,getWatchHistory}