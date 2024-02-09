const mongoose = require("mongoose")
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    confirmPassword: {
        type: String,
    },

    gender:{
        type: String,
        required: true
    },
    isVerified :{
        type : Boolean,
        default : false
    },
    token:{
        type: String
    },
    profilePicture: {

        public_id: {
            type: String,
         
        },
        url:{
            type: String,
        },
        
    },
    blacklist:{
        type: Array,
        default:[]
      },
}, {timestamps: true})

const patientModel = mongoose.model("Patient", userSchema)
module.exports = patientModel