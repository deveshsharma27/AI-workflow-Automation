const express=require("express");
const router=express.Router();

const authMiddleware=require("../middleware/authMiddleware");
const {startExecution}=require("../controllers/executionController");
const { route } = require("./authRoutes");

router.post("/start", authMiddleware,startExecution);
const {
    getExecutions,
    getExecution,
    getExecutionLogs

}=require("../controllers/executionController");
router.get("/",getExecutions);
router.get("/:id",getExecution);
router.get("/:id/logs",getExecutionLogs);

module.exports=router;