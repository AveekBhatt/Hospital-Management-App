const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");

const {PostAgent , UpdateAgent , uploadTasks , getAllTasks , viewFile , downloadFile} = require("../contollers/agentController")
router.post("/addagent" , authenticateToken , PostAgent);
router.put("/updateagent" , authenticateToken , UpdateAgent);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

router.use("/uploads", express.static(path.join(__dirname, "../uploads")));

router.post("/upload" , authenticateToken , upload.single("file"), uploadTasks);

router.get("/getAlltasks" , authenticateToken , getAllTasks)
router.get("/view/:filename", authenticateToken, viewFile);
router.get('/download/:filename', authenticateToken,downloadFile);

module.exports = router