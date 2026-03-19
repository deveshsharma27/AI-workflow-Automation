//Trigger → AI Analysis → Condition → Action

const mongoose=require("mongoose");

const workflowSchema=new mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    triggerType:{
        type:String,
        require:true
    },
    steps:[
        {
            type:{
                type:String
            },
            config:{
                type:Object
            }
        }
    ],
    status:{
        type:String,
        default:"active"
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"

    }
},{
    timestamps:true
}
);

module.exports=mongoose.model("Workflow",workflowSchema);