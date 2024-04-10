import mongoose, {Schema} from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const videoSchema = new Schema({
    videoFile:{
        type:String ,//type of a column and url is taken from cloundinary url
        required:true // must needed null will not accepted
    },
    thumbnail:{
        type:String ,//type of a column and url is taken from cloundinary url
        required:true // must needed null will not accepted
    },
    title:{
        type:String ,//type of a column 
        required:true // must needed null will not accepted
    },
    description:{
        type:String ,//type of a column 
        required:true// must needed null will not accepted
    },
    duration:{
        type:String,//type of a column 
        required:true // must needed null will not accepted
    },
    views:{
        type: Number,
        default:0
    },
    isPublised:{ // videos are publicly available or not
        type:Boolean,
        default:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
    
},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate)
export const  Video = mongoose.model('Video',videoSchema)