const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const taskSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  phone: { 
    type: String, 
    required: true, 
    match: [/^\+[1-9]\d{1,14}$/, "Please enter a valid phone number with country code"]
  },
  notes: { 
    type: String 
  },
  agent: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Agent",
    required: true,
  },
  filename: { 
    type: String, 
    required: true 
  },
  fileUrl: { 
    type: String, 
    required: true 
  },
  uploadedAt: { 
    type: Date, 
    default: Date.now 
  },
  totalTasksInFile: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);