import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../services/cloudinary.js";

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

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "Username or email already exists");
  }

  const avatarImageLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.cover[0]?.path;

  if (!avatarImageLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  //   upload images to cloudinary
  const avatarImage = await uploadOnCloudinary(avatarImageLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatarImage) {
    throw new ApiError(400, "Avatar image is required");
  }

  //   upload user to db
  const user = await User.create({
    username: username.loLowerCase(),
    email,
    password,
    avatar: avatarImage.url,
    coverImage: coverImage?.url || "",
  });

  //   check if user created or not and remove password and refresh token
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering a user");
  }
  console.log(req.files);
  console.log(createdUser);

  //   return created user
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

export { registerUser };
