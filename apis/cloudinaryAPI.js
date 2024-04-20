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
  const formattedPublicID = `Profile Pictures/${rawPublicID}`;
  return formattedPublicID;
}

exports.cloudinaryProfileImgDestroy = (currentImgUrl) => {
  return new Promise((resolve, reject) => {
    const publicID = extractPublicID(currentImgUrl);

    cloudinary.uploader.destroy(publicID, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

exports.cloudinaryProfileImgUpload = (buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "image",
          folder: "Profile Pictures",
          transformation: [
            { gravity: "face", height: 200, width: 200, crop: "thumb" },
            { radius: "max" },
            { fetch_format: "auto" },
          ],
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
