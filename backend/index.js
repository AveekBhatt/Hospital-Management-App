require("dotenv").config();


const express = require("express");
const path = require('path');
const cors = require("cors");
const config = require("./config.json");
const useroutes = require("./routes/useroutes");
const agentroutes = require("./routes/agentroutes");
const mongoose = require("mongoose");
const app = express();
mongoose.connect(config.connectionstring)
app.use(express.json());
app.use(cors({ origin: "*" }));
app.use("/users" , useroutes);
app.use("/agent" , agentroutes);


app.listen(4444, () => {
    console.log("CONNECTED TO PORT : 4444")
})

module.exports = app;