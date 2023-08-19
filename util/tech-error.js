const techError=(err,next)=>{
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error);
}

module.exports = techError;
