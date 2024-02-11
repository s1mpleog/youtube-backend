import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../services/cloudinary.js";
import { generateAccessAndRefreshToken } from "../utils/generateAccessAndRefreshTokens.js";

const registerUser = asyncHandler(async (req, res) => {
  //  get user details from frontend
  const { username, email, fullName, password } = req.body;

  //  validation
  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  if (!username || !email || !fullName || !password) {
    throw new ApiError(400, "Invalid Fields");
  }

  if (!email.includes("@")) {
    throw new ApiError(400, "Please enter valid email");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "Username or email already exists");
  }

  const avatarLocalPath = req.files?.avatarImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is compulsory");
  }

  //   upload images to cloudinary
  const avatarImage = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatarImage) {
    throw new ApiError(400, "Avatar image is required");
  }

  //   upload user to database
  const user = await User.create({
    fullName,
    avatarImage: avatarImage?.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  //   check if user created or not and remove password and refresh token
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering a user");
  }

  //   return created user
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // TODO: req body => data

  // first we got user info from req.body
  const { username, email, password } = req.body;

  // then we are validating id the info is correct or not
  if (!username || !email) {
    throw new ApiError(400, "Username or email is required");
  }

  // then we are checking in our db if user is present or not
  const user = await User.findOne({
    $or: [username, email],
  });

  // then if user is not present throw error
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // now we are validating password
  const isPasswordValid = await user.isPasswordCorrect(password);

  // if password does not match throw error
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  // we are generating access and refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // now we are finding logged in user
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // this is options for cookie
  const options = {
    httpOnly: true,
    secure: true,
  };

  // we are returning access and refresh token and logged in user
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200), {}, "User logged out successfully");
});

export { registerUser, loginUser, logoutUser };
