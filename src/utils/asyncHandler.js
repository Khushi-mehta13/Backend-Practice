const asyncHandler = (requesHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requesHandler(req,res,next))
        .catch((error)=> next(error))
    }
}

export {asyncHandler}

//Normal function
// const asyncHandler = ()=>{}
//If we want to use two or more function then use this
//const asyncHandler = (func) =>()=>{}

//If you want to use async then
//const asyncHandler = (func) =>async()=>{}

/*const asyncHandler = (func) =>async(req,res,next)=>{
    try{
        await  fn(req,res,next)
    }
    catch(error){
        res.status(err.code || 500).json({
            success:false,
            message:err.message
        })
    }
}*/