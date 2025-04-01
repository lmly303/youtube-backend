import {asyncHandler} from '../utils/asyncHandler.js'
import {apiError} from '../utils/apiError.js'
import {User} from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudnary_file_uploader.js'
import { apiResponse } from '../utils/apiResponse.js'

const generateRefreshAndAccessTockens = async(userId)=>{
    try { 
        const user = await User.findOne(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new apiError(500, "Something went wrong while generation access and refresh tocken")
    }
}

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

const loginUser = asyncHandler(async (req,res)=>{

    const {username, email, password} = req.body

    if(!username || !email){
        throw new apiError(400, "username or password is required!")
    }

    const user = User.findOne({
        $or: [{username},{email} ]
    })

    if(!user){
        throw new apiError(404, "User doesn't exist!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new apiError(401, "PASSWORD INCORRECT!")
    }

    const {accessToken, refreshToken} = await generateRefreshAndAccessTockens(user._id)

    const loggedInUser = User.findOne(user._id).
    select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .cookie("accesstoken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new apiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User Logged In Successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User Logged Out Successfully"))

})

export {registerUser, loginUser, logoutUser}