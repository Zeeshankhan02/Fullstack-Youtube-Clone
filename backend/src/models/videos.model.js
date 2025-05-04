import { model, Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const videoSchema = new Schema({
  videoFile:{
    type:String,
    required:true,
  },
  thumbnail:{
    type:String,
    required:true,
    trim:true,
  },
  title:{
    type:String,
    required:true,
    trim:true,
  },
  description:{
    type:String,

  },
  duration:{
    type:Number,
    required:true,
  },
  views:{
    type:Number,
    default:0,
  },
  owner:{
    type:Schema.Types.ObjectId,
    ref:'User'
  },
  isPublushed:{
    type:Boolean,
    default:true
  }

},{timestamps:true}
);

videoSchema.plugin(mongooseAggregatePaginate)
export const Video = model("Video",videoSchema);
