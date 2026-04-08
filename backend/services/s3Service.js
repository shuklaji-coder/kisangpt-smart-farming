const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure Multer S3 Storage
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET_NAME || "kisangpttt",
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const folder = req.uploadFolder || "uploads";
      cb(null, `${folder}/${uniqueSuffix}${ext}`);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed!"), false);
    }
  },
});

module.exports = { s3Client, upload, saveUserDataToS3 };

/**
 * Saves user profile data as a JSON file to S3.
 * Stored at: users/{userId}/profile.json
 */
async function saveUserDataToS3(userId, userData) {
  try {
    const bucket = process.env.AWS_S3_BUCKET_NAME || "kisangpttt";
    const key = `users/${userId}/profile.json`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(userData, null, 2),
      ContentType: "application/json",
    });

    await s3Client.send(command);
    const url = `https://${bucket}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com/${key}`;
    console.log(`✅ User data saved to S3: ${url}`);
    return url;
  } catch (err) {
    console.error("❌ Failed to save user data to S3:", err.message);
    return null;
  }
}
