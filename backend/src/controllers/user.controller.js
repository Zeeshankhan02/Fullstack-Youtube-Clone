import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ApiError } from "../utils/ApiError.util.js";
import { User } from "../models/users.model.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import {
  deleteOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.util.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefershTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accesssToken = await user.genarateAccessToken();
    const refreshToken = await user.genarateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accesssToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while genrating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from the frontend
  // validation - not empty
  // check if user already exist : userName,email
  // check for images *avatar*
  // upload them to cloudinary,avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  //return response

  const { userName, email, fullName, password } = req.body;

  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (existedUser) {
    throw new ApiError(409, "User Already Exits");
  }

  const avatarLocalPath = req.files?.avatar[0].path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar Image required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar Image required");
  }

  try {
    const user = await User.create({
      userName: userName.toLowerCase(),
      email,
      fullName,
      password,
      avatar: { url: avatar.url, public_id: avatar.public_id },
      coverImage:
        { url: coverImage.url, public_id: coverImage.public_id } || {},
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user"
      );
    }

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered Successfully"));
  } catch (error) {
    if (avatar) {
      await deleteOnCloudinary(avatar.public_id);
    }
    if (coverImage) {
      await deleteOnCloudinary(coverImage.public_id);
    }
    throw new ApiError(
      500,
      "Something went wrong while registering the user and images were deleted"
    );
  }
});

const loginUser = asyncHandler(async (req, res) => {
  // get the data from the user
  // userName or email
  // find the user
  // password check
  // access and refresh token
  // send them in cookies

  const { userName, email, password } = req.body;

  if (!(userName || email)) {
    throw new ApiError(400, "userName or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (!user) {
    throw new ApiError(404, "User Does Not Exists");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accesssToken, refreshToken } = await generateAccessAndRefershTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accesssToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accesssToken,
          refreshToken,
        },
        "User Logged In Successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken:1,
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
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token Is Expired");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accesssToken, newRefreshToken } =
      await generateAccessAndRefershTokens(user._id);

    return res
      .status(200)
      .cookie("accesssToken", accesssToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accesssToken, newRefreshToken },
          "Access Token Refreshed Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Invalid Refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confPassword } = req.body;
  const user = await User.findById(req.user._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Incorrect Old Password");
  }

  if (newPassword === confPassword) {
    throw new ApiError(400, "Password Does Not match");
  }
  user.password = newPassword;

  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(200, req.user, "Current Fetched Successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!(fullName || email)) {
    throw new ApiError(400, "Fullname or Email is required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select(" -password  ");

  return res
    .status(200)
    .json(
      new ApiResponse(201, { user }, "Account Details Updated Successfully")
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(400, "User Not Found");
  }

  if (user?.avatar?.public_id) {
    await deleteOnCloudinary(user.avatar.public_id);
    return res.status(200)
    .json(new ApiResponse(200,{},"Old image deleted Successfully"))
  }

  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File Is Missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!(avatar.url || avatar.public_id)) {
    throw new ApiError(500, "Error File uploading");
  }

  user.avatar = { url: avatar.url, public_id: avatar.public_id };
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(201, { user }, "Updated User Avatar Image"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(400, "User Not Found");
  }

  if (user?.coverImage?.public_id) {
    await deleteOnCloudinary(user.coverImage.public_id);
    return res.status(200)
    .json(new ApiResponse(200,{},"Old image deleted Successfully"))
  
  }

  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image Is Missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!(coverImage.url || coverImage.public_id)) {
    throw new ApiError(500, "Error image uploading");
  }

  user.coverImage = { url: coverImage.url, public_id: coverImage.public_id };
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(201, { user }, "Updated User Cover Image"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;

  if (!userName) {
    throw new ApiError(400, "Username Is Required");
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        subscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel Not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel Fetched Successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user =  await User.aggregate([
    { 
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      } 
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
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
                    userName:1,
                    avatar:1
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(200,user[0].watchHistory,"Watch History Fetched Successfully")
  )
});

export {
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
};
