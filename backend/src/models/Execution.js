//This tracks each workflow execution instance.
const mongoose=require("mongoose");

const executionSchema=new mongoose.Schema({
    workflowId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Workflow"
    },

    status:{
        type:String,
        default:"pending"
    },

    startTime:{
        type:Date
    },
    endTime:{
        type:Date
    }
},
{
    timestamps:true
});

module.exports=mongoose.model("Execution", executionSchema);