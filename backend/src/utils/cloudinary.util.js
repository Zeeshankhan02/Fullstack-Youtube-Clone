import {v2 as cloudinary } from "cloudinary"
import fs from "fs"
import { ApiError } from "./ApiError.util";

 // Configuration
 cloudinary.config({ 
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
  api_key:process.env.CLOUDINARY_API_KEY, 
  api_secret:process.env.CLOUDINARY_SECRET_KEY  
});


const uploadOnCloudinary=async (localFilePath) => {
  try {
    if (!localFilePath) return null

    // upload the file on cloudinary

    const response = await cloudinary.uploader.upload(localFilePath,{
      resource_type:"auto"
    })

    // file has been uploaded successfully
    console.log("File is uploaded on cloudinary",response.url);

     fs.unlinkSync(localFilePath) //deleting the images from the local server after successfull upload
    return response
  } catch (error) {
    fs.unlinkSync(localFilePath) // removes the locally saved temp file if the upload operatoin failed
    return null
  }
}

const deleteOnCloudinary=async(publicId)=>{
  const response = await cloudinary.uploader.destroy(publicId)

  if (!response) {
    throw new ApiError(500,"Error while deleting image")
  }
  return response
}

export {uploadOnCloudinary,deleteOnCloudinary}