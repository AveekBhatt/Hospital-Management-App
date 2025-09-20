const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const {signup , login , getUser ,  countAgents , countTasks} = require("../contollers/userContoller")

router.post("/signup" , signup);
router.post("/login" ,  login);
router.get("/Me" , authenticateToken, getUser);
router.get("/cntagents" , authenticateToken , countAgents);
router.get("/cntasks" , authenticateToken , countTasks);

module.exports = router;