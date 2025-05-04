import {ApiResponse} from "../utils/ApiResponse.util.js"
import {asyncHandler} from "../utils/asyncHandler.util.js"


const healthCheck = asyncHandler(async (req,res) =>{
  return res.status(200).json(new ApiResponse(200,"OK","Health Check PASSED"))
})

export {healthCheck}