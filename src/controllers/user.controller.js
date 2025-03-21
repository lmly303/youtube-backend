import {asyncHandler} from '../utils/asyncHandler.js'
import {apiError} from '../utils/apiError.js'
import {User} from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudnary_file_uploader.js'
import { apiResponse } from '../utils/apiResponse.js'

const registerUser = asyncHandler(async (req,res)=>{

    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {username, email, password, fullName} = req.body
    
    // from and json data body se milta h url wala body se nahi milta hai

    if(
        [fullName, email, username, password].some((field)=> field?.trim()==="")
    ){
        throw new apiError(400, "all fields are required")
    }

    const exitedUser = await User.findOne({
        $or: [{username},{email}]
    })

    if(exitedUser){
        throw new apiError(409,"User already exit!")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverIamgeLocalpath = req.files?.coverImage[0]?.path;

    let coverIamgeLocalpath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverIamgeLocalpath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new apiError(400, "avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverIamge = await uploadOnCloudinary(coverIamgeLocalpath)
    
    if(!avatar){
        throw new apiError(400, "avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverIamge?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if(!createdUser){
        throw new apiError(500, "Something went wrong while registering the User")
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, "User registered successfully")
    )

})

export {registerUser}