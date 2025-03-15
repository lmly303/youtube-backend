const asyncHandler = (requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next))
        .catch((err)=>next(err))
    }
}

export {asyncHandler}


// the below is the same function written above with try and catch

// const asyncHandler = (fn)=> async (req,res,next) =>{
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         console.log("error", error)
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.messgae
//         })
//     }
// }