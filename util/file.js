const fs = require('fs');

const deleteFile = (path)=>{
    fs.unlink(path,err=>{
        if(err){
            throw new Error('an Error occured While Deleting the file');
        }
    })
}

module.exports = deleteFile;


