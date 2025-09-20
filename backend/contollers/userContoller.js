const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/usermodel");
const Agent = require("../models/agentmodel");
const Task = require("../models/tasksmodel");

const signup = async(req,res) => {
    const {email  , password} = req.body;
    const isUser = await User.findOne({email:email});
    if(isUser){
        return res.json({
            message : "User Already Exists"
        })
    }
    const user = new User({
        
        email : email,
        password : password,
    })
    await user.save();
    const accesstoken = jwt.sign({user} , process.env.JWT_SECRET, {
        expiresIn : "36000m",
    })
    return res.json({
        error : false,
        user,
        accesstoken,
        message: 'Registration Successful'
    });
}

const login = async(req,res) =>{
     const {email , password} = req.body;
    try{
        const userInfo = await User.findOne({email : email});
        if(!userInfo){
           return res.json({
              message : "User Does not exists"
           })
        }
        const isMatch = await bcrypt.compare(password,userInfo.password);
        if(!isMatch){
            return res.status(400).json({
                error : true,
                message : "Incorrect Password"
            })
        }
        const user = { user: userInfo };
        const accesstoken = jwt.sign(user, process.env.JWT_SECRET, {
            expiresIn: "36000m",
        });

        return res.json({
            error: false,
            message: "Login Successful",
            email,
            accesstoken
        });

    }catch(error){
        return res.status(400).json({
            error : true,
            message : "Inavalid ERROR"
        })
    }
}

const getUser = async(req,res) =>{
    console.log(req.user.user)
    try{
        const userInfo = await User.findOne({_id : req.user.user._id});
        if(!userInfo){
           return res.json({
              message : "User Does not exists"
           })
        }
        return res.json({
            userInfo,
            message : "Success"
        })

    }catch(error){
        return res.json({
            error : true,
            message : "Failed"
        })
    }
}

const countAgents = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const totalAgents = await Agent.countDocuments(); 

    return res.json({
      error: false,
      totalAgents,
      message: `There are ${totalAgents} agents in the system`,
    });
  } catch (error) {
    console.error("Error counting agents:", error);
    return res.status(500).json({
      error: true,
      message: "Server error",
      errorDetails: error.message,
    });
  }
};

const countTasks = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const totalTasks = await Task.countDocuments();

    return res.json({
      error: false,
      totalTasks,
      message: `There are ${totalTasks} tasks in the system`,
    });
  } catch (error) {
    console.error("Error counting tasks:", error);
    return res.status(500).json({
      error: true,
      message: "Server error",
      errorDetails: error.message,
    });
  }
};

module.exports = {signup , login , getUser , countAgents , countTasks}