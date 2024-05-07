import mongoose, {Schema} from "mongoose"

const subscriptionSchema = new Schema({
    subscriber:{
        typeof:Schema.Types.ObjectId, //One who is subscribing
        ref:"Users",
    },
    channel:{
        typeof:Schema.Types.ObjectId, //One whom subscriber is subcribing
        ref:"Users",
    }
},{
    timestamps:true
})

export const Subscription = mongoose.model("Subscription",subscriptionSchema)