const cloudinary = require('cloudinary').v2
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFile = async(filePath) =>{
    try {
        if(!filePath) return null
       const responce = await cloudinary.uploader.upload(filePath,{
            resource_type : "auto",image_metadata:true
        })
         fs.unlinkSync(filePath);

        return responce
    } catch (error) {
         fs.unlinkSync(filePath)
        return null;
    }
}

const deleteFile = async(filePath) => {
    try {
        if(!filePath) return null
        const responce = await cloudinary.uploader.destroy(filePath,{
            resource_type : "image"
        })
        return responce
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {uploadFile, deleteFile};