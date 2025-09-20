const User = require("../models/usermodel");
const Agent = require("../models/agentmodel");
const Task = require("../models/tasksmodel");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const xlsx = require("xlsx");

const PostAgent = async (req, res) => {
  try {
    if(!req.user){
        return res.status(401).json({
           message : "Unauthorized"
        })
    }
    const { name, email, mobile, password } = req.body;
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    const existingAgent = await Agent.findOne({ email : email });
    if (existingAgent) {
      return res.status(400).json({ message: "Agent with this email already exists" });
    }

    const hashedPassword = password;

    const agent = new Agent({
      name,
      email,
      mobile,
      password: hashedPassword
    });
   
    await agent.save();

    res.status(201).json({
      message: "Agent created successfully",
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        mobile: agent.mobile
      }
    });
  } catch (error) {
    console.error("Error creating agent:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  } 
}

const UpdateAgent = async (req, res) => {
    try {
    if(!req.user){
        return res.status(401).json({
           message : "Unauthorized"
        })
    }
    const { name, email, mobile, password } = req.body;
    const { id } = req.params;

    if (!name || !email || !mobile) {
      return res.status(400).json({ message: "Name, email, and mobile are required" });
    }

    const agent = await Agent.findById(id);
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    const existingAgent = await Agent.findOne({ email, _id: { $ne: id } });
    if (existingAgent) {
      return res.status(400).json({ message: "Another agent with this email already exists" });
    }

    if(name) agent.name = name;
    if(email) agent.email = email;
    if(mobile) agent.mobile = mobile;

    if (password) {
      agent.password = password
    }

    await agent.save();

    res.status(200).json({
      message: "Agent updated successfully",
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        mobile: agent.mobile
      }
    });
  } catch (error) {
    console.error("Error updating agent:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

const uploadTasks = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filename = req.file.filename;
    const fileUrl = `/uploads/${filename}`;
    const originalName = req.file.originalname;
    
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    if (![".csv", ".xlsx", ".xls"].includes(fileExt)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Invalid file format. Only csv, xlsx, xls allowed." });
    }

    let tasks = [];

    if (fileExt === ".csv") {
      const results = [];
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (data) => {
          const normalizedData = {};
          for (const key in data) {
            normalizedData[key.toLowerCase()] = data[key];
          }
          results.push(normalizedData);
        })
        .on("end", async () => {
          tasks = results.map(row => ({
            firstName: row.firstname,
            phone: row.phone,
            notes: row.notes || ""
          })).filter(task => task.firstName && task.phone);
          
          if (tasks.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: "No valid tasks found in the file" });
          }
          
          await distributeAndSave(tasks, filename, fileUrl, originalName, req, res);
        })
        .on("error", (error) => {
          fs.unlinkSync(req.file.path);
          console.error("CSV parsing error:", error);
          res.status(500).json({ message: "Error parsing CSV file", error: error.message });
        });
    } else {
      try {
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        
        tasks = data.map(row => {
          const normalizedRow = {};
          for (const key in row) {
            normalizedRow[key.toLowerCase()] = row[key];
          }
          return {
            firstName: normalizedRow.firstname,
            phone: normalizedRow.phone,
            notes: normalizedRow.notes || ""
          };
        }).filter(task => task.firstName && task.phone);
        
        if (tasks.length === 0) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ message: "No valid tasks found in the file" });
        }
        
        await distributeAndSave(tasks, filename, fileUrl, originalName, req, res);
      } catch (error) {
        fs.unlinkSync(req.file.path);
        console.error("Excel parsing error:", error);
        res.status(500).json({ message: "Error parsing Excel file", error: error.message });
      }
    }
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Error uploading tasks:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const distributeAndSave = async (tasks, filename, fileUrl, originalName, req, res) => {
  try {
    const agents = await Agent.find();
    
    // Calculate how many agents to use for distribution
    const totalTasks = tasks.length;
    let agentsToUse = 5; // Default to 5 agents
    if (totalTasks < 5) {
      agentsToUse = totalTasks; // Use number of tasks if less than 5
    }
    
    // Check if we have enough agents
    if (agents.length < agentsToUse) {
      if (fs.existsSync(path.join(__dirname, "../uploads", filename))) {
        fs.unlinkSync(path.join(__dirname, "../uploads", filename));
      }
      return res.status(400).json({
        message: `Need at least ${agentsToUse} agents for distribution, but only ${agents.length} available`
      });
    }
    
    let agentIndex = 0;
    const savedTasks = [];
    const agentTaskCount = {}; // To track how many tasks each agent received
    
    for (let i = 0; i < tasks.length; i++) {
      try {
        const agentId = agents[agentIndex]._id;
        const task = new Task({
          firstName: tasks[i].firstName,
          phone: tasks[i].phone,
          notes: tasks[i].notes,
          agent: agentId,
          filename: filename,
          fileUrl: fileUrl,
          totalTasksInFile: totalTasks // Store total tasks in file
        });
        
        const savedTask = await task.save();
        savedTasks.push(savedTask);
        
        // Update task count for this agent
        agentTaskCount[agentId] = (agentTaskCount[agentId] || 0) + 1;
      } catch (err) {
        console.error("Task save failed:", err.message);
      }
      
      // Move to next agent, but only cycle through the number of agents we're using
      agentIndex = (agentIndex + 1) % agentsToUse;
    }
    
    if (savedTasks.length === 0) {
      // Clean up file if no tasks were saved
      if (fs.existsSync(path.join(__dirname, "../uploads", filename))) {
        fs.unlinkSync(path.join(__dirname, "../uploads", filename));
      }
      return res.status(500).json({ message: "Failed to save any tasks" });
    }
    
    const distributed = await Task.find({ _id: { $in: savedTasks.map(t => t._id) } })
      .populate("agent", "name email mobile");
    
    // Prepare agent distribution details for response
    const distributionDetails = Object.entries(agentTaskCount).map(([agentId, count]) => {
      const agent = agents.find(a => a._id.toString() === agentId);
      return {
        agentId: agentId,
        agentName: agent ? agent.name : 'Unknown',
        tasksAssigned: count
      };
    });
    
    res.status(201).json({
      message: `Tasks uploaded and distributed successfully. ${savedTasks.length} out of ${tasks.length} tasks saved.`,
      distribution: {
        totalTasks: totalTasks,
        agentsUsed: agentsToUse,
        details: distributionDetails
      },
      distributed: distributed,
      fileInfo: {
        filename: filename,
        originalName: originalName,
        fileUrl: fileUrl,
        downloadUrl: `${req.protocol}://${req.get('host')}${fileUrl}`
      },
      stats: {
        total: tasks.length,
        saved: savedTasks.length,
        failed: tasks.length - savedTasks.length
      }
    });
  } catch (error) {
    // Clean up file on error
    if (fs.existsSync(path.join(__dirname, "../uploads", filename))) {
      fs.unlinkSync(path.join(__dirname, "../uploads", filename));
    }
    console.error("Error in distributeAndSave:", error);
    res.status(500).json({ message: "Error distributing tasks", error: error.message });
  }
};


const getAllTasks = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    // Extract query parameters
    const {
      agentId,
      filename,
      minTotalTasks,
      maxTotalTasks,
      search,
      startDate,
      endDate
    } = req.query;

    // Build filter object
    const filter = {};

    // Filter by agent
    if (agentId) {
      filter.agent = agentId;
    }

    // Filter by filename
    if (filename) {
      filter.filename = { $regex: filename, $options: "i" };
    }

    // Filter by total tasks in file
    if (minTotalTasks || maxTotalTasks) {
      filter.totalTasksInFile = {};
      if (minTotalTasks) filter.totalTasksInFile.$gte = parseInt(minTotalTasks);
      if (maxTotalTasks) filter.totalTasksInFile.$lte = parseInt(maxTotalTasks);
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Search across multiple fields
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
        { filename: { $regex: search, $options: "i" } }
      ];
    }

    // Get unique file names with their statistics
    const files = await Task.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$filename",
          originalName: { $first: "$filename" },
          fileUrl: { $first: "$fileUrl" },
          totalTasksInFile: { $first: "$totalTasksInFile" },
          uploadedAt: { $first: "$createdAt" },
          tasksCount: { $sum: 1 },
          agentsCount: { $addToSet: "$agent" },
          // Get sample task data
          sampleTask: { $first: {
            firstName: "$firstName",
            phone: "$phone",
            notes: "$notes"
          }}
        }
      },
      {
        $project: {
          _id: 0,
          filename: "$originalName",
          fileUrl: 1,
          totalTasksInFile: 1,
          uploadedAt: 1,
          tasksCount: 1,
          agentsCount: { $size: "$agentsCount" },
          sampleTask: 1
        }
      },
      { $sort: { uploadedAt: -1 } } // Sort by upload date (newest first)
    ]);

    // Get overall statistics
    const stats = await Task.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          uniqueFiles: { $addToSet: "$filename" },
          uniqueAgents: { $addToSet: "$agent" },
          avgTasksPerFile: { $avg: "$totalTasksInFile" },
          minTasksInFile: { $min: "$totalTasksInFile" },
          maxTasksInFile: { $max: "$totalTasksInFile" }
        }
      }
    ]);

    res.status(200).json({
      message: "Files fetched successfully",
      data: {
        files
      }
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const downloadFile = async (req, res) => {
  try {
    if(!req.user){
        return res.status(401).json({
           message : "Unauthorized"
        })
    }
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Get file extension for proper MIME type
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.csv': 'text/csv',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
    };
    
    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Error downloading file' });
  }
};
const viewFile = async (req, res) => {

  try {
    if(!req.user){
        return res.status(401).json({
           message : "Unauthorized"
        })
    }
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Get file extension
    const ext = path.extname(filename).toLowerCase();
    
    // Set Content-Type based on file extension
    const mimeTypes = {
      '.csv': 'text/csv',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    // Set to inline instead of attachment to view in browser
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    // Send the file for viewing
    res.sendFile(filePath);
    
  } catch (error) {
    console.error('View error:', error);
    res.status(500).json({ message: 'Error viewing file' });
  }
};
module.exports = { PostAgent, UpdateAgent, uploadTasks , getAllTasks ,  viewFile , downloadFile };