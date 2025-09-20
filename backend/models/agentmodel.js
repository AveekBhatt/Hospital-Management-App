const bcrypt = require("bcrypt")
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const agentSchema = new Schema({
    name :{
        type : String,
        required : true,
    },
     email :{
        type : String,
        required: true,
        unique: true, 
        lowercase: true, 
        trim: true, 
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6, 
   },
    mobile: {
    type: String,
    required: true,
    match: [/^\+[1-9]\d{1,14}$/, "Please enter a valid mobile number with country code"]
   }
})

agentSchema.pre("save" , async function(next){
     if(!this.isModified("password")){
        return next();
     }
     try{
         const salt = await bcrypt.genSalt(10);
         this.password = await bcrypt.hash(this.password,salt);
         next();
     }catch(error){
        next(error)
     }
}) 

module.exports = mongoose.model("Agent" , agentSchema)