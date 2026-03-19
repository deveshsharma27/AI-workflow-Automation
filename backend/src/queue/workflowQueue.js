//Create Workflow Queue (BullMQ)

const {Queue}=require("bullmq");
const redisConnection=require("../config/redis");
  
//This queue will store workflow execution jobs.
const workflowQueue=new Queue("workflow-queue", {
    connection:redisConnection,
    defaultJobOptions:{
        attempts:1, // later on we add 3 retry
        backoff:{
            type:"exponential",
            delay : 3000
        }
    }
});

module.exports=workflowQueue;

