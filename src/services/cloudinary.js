import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.error("Missing localFilePath");
      return null;
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteOldImageFromCloudinary = async (oldImageUrl) => {
  try {
    const response = await cloudinary.uploader
      .destroy(oldImageUrl)
      .then((result) => console.log(result));
    return response;
  } catch (error) {
    console.error("Error while deleting old image from cloudinary", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteOldImageFromCloudinary };
