import mongoose, {Schema} from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
const userSchema = new Schema({
    username:{
        type: String, // type of column 
        required:true, // must needed null will not accepted
        unique:true, //make every field unique
        lowercase:true, //use to lower all the characters
        trim:true,  //use to remove space between them
        index:true //use for optimised searching
    },
    email:{
        type: String, // type of column 
        required:true, // must needed null will not accepted
        unique:true, //make every field unique
        lowercase:true, //use to lower all the characters
        trim:true,  //use to remove space between them
    },
    fullname:{
        type: String, // type of column 
        required:true, // must needed null will not accepted
        trim:true,  //use to remove space between them
        index:true //use for optimised searching
    },
    avatar:{
        type:String, //type of column and we are using cloudinary url
        required:true, // must needed null will not accepted
    },
    coverImage:{
        type:String, //type of column and we are using cloudinary url
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String, //type of column
        required:[true,'Password is required'] // must needed null will not accepted
    },
    refreshToken:{
        type:String,//type of column
    }
},{timestamps:true})

userSchema.pre("save", async function(next) {
    if(!this.isModified("password")){
        return next();
    }
    this.password = bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id: this._id,
        email:this.email,
        username:this.username,
        fullname:this.fullname,
    },process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    })
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id: this._id
    },process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    })
}
export const User = mongoose.model('User' , userSchema)