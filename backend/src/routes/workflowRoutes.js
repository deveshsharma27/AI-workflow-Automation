const express =require("express");
const router =express.Router();

const authMiddleware=require("../middleware/authMiddleware");


const {
  createWorkflow,
getWorkflows,
getWorkflow,
updateWorkflow,
deleteWorkflow
}=require("../controllers/workflowControllers");


router.post("/",authMiddleware,createWorkflow);
router.get("/",authMiddleware,getWorkflows);
router.get("/:id",authMiddleware,getWorkflow);
router.put("/:id",authMiddleware,updateWorkflow);
router.delete("/:id",authMiddleware,deleteWorkflow);

module.exports=router;