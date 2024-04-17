import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudniary} from "../utils/fileupload.js"
import { ApiResponse } from "../utils/ApiResponse.js"
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
        throw new ApiError(400, "Al fields are required")
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


export {registerUser}