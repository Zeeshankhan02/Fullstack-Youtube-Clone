import { model, Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true,"Password is required"],
    },
    avatar: {
      url:{
        type:String,
        required:true
      },
      public_id:{
        type:String,
        required:true
      }
    },
    coverImage: {
      url:{
        type:String,
        required:true
      },
      public_id:{
        type:String,
        required:true
      }
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre('save',async function(next) {
  if(!this.isModified("password")) return next()
  this.password = await bcrypt.hash(this.password,10)
  next()
})

userSchema.methods.isPasswordCorrect=async function(password) {
  return await bcrypt.compare(password,this.password)  
}

userSchema.methods.genarateAccessToken=function(){
 return jwt.sign({
    _id:this._id,
    email:this.email
  },process.env.ACCESS_TOKEN_SECRECT,{expiresIn:process.env.ACCESS_TOKEN_EXPIRY}
)
}

userSchema.methods.genarateRefreshToken=function(){
  return jwt.sign({
     _id:this._id
   },process.env.REFRESH_TOKEN_SECRET,{expiresIn:process.env.REFRESH_TOKEN_EXPIRY}
 )
 }



export const User = model("User", userSchema);
