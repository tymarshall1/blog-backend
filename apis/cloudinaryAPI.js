const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function extractPublicID(url) {
  const splitUrl = url.split("/");
  const publicIdWithExtension = splitUrl[splitUrl.length - 1];
  const rawPublicID = publicIdWithExtension.split(".")[0];
  return rawPublicID;
}

exports.cloudinaryImgDestroy = (currentImgUrl, folder) => {
  return new Promise((resolve, reject) => {
    const publicID = `${folder}/${extractPublicID(currentImgUrl)}`;
    if (publicID === `${folder}/default`) {
      resolve();
      return;
    }
    cloudinary.uploader.destroy(publicID, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

exports.cloudinaryImgUpload = (
  buffer,
  folder,
  transformation = [
    { gravity: "face", height: 200, width: 200, crop: "thumb" },
    { radius: "max" },
    { fetch_format: "auto" },
  ]
) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "image",
          folder: folder,
          transformation: transformation,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      )
      .end(buffer);
  });
};
