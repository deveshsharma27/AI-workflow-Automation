// JWT Middleware (Protect APIs)
//we must secure the APIs so only logged-in users can access them.
/*{Read token
       ↓
   Verify token(JWT-token)
       ↓
   Extract userId
       ↓
   Attach to request}*/



/*..........code................*/

const jwt=require("jsonwebtoken");
const authMiddleware=(req,res,next) =>{
    try{
        const authHeader=req.headers.authorization;

        if(!authHeader){
            return res.status(401).json({message:"No token provided"});

        }
        const token =authHeader.split(" ")[1];
        const decoded=jwt.verify(token,process.env.JWT_SECRET);

        req.user=decoded;
        next();
      //verify token
    }
    catch(error){
        return res.status(401).json({message:"Invalid Token"});
    }
};
module.exports=authMiddleware;