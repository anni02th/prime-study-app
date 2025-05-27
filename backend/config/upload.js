const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const path = require("path");
const fs = require("fs");

// Check for required environment variables
const requiredEnvVars = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION", "S3_BUCKET_NAME"];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept common document types
  const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Error: File upload only supports the following filetypes - " + filetypes));
  }
};

// Configure file upload
let upload;

if (missingVars.length === 0) {
  console.log(`Configuring S3 client with region: ${process.env.AWS_REGION}, bucket: ${process.env.S3_BUCKET_NAME}`);

  // Configure AWS S3 client
  const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  // Set up S3 storage without ACL if not needed
  const s3Storage = multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const fileExtension = path.extname(file.originalname);
      // Store in uploads folder with unique name
      cb(null, `uploads/${uniqueSuffix}${fileExtension}`);
    },
  });

  // Configure multer with S3 storage
  upload = multer({
    storage: s3Storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter,
  });
} else {
  console.error(`ERROR: Missing required environment variables for S3: ${missingVars.join(", ")}`);
  console.error("Falling back to local storage (for development only)");

  // Fall back to local storage if S3 config is missing (for development only)
  const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = process.env.UPLOAD_PATH || "uploads";
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });

  // Configure multer with local storage
  upload = multer({
    storage: localStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter,
  });
}

module.exports = upload;
