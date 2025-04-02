import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriper: {
        types: mongoose.Schema.Types.ObjectId, // one who is subscribing
        ref: "User"
    },
    channel: {
        types: mongoose.Schema.Types.ObjectId, // one who is subscribed
        ref: "User"
    }
},{timestamps: true})

export const Subscription = mongoose.model("Subscription", subscriptionSchema)