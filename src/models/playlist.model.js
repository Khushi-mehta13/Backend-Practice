import mongoose, {Schema} from 'mongoose'

const PlaylistSchema = new Schema({
    video:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    Owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{
    timestamps:true
})


export const Playlist= mongoose.model("Playlist",PlaylistSchema)