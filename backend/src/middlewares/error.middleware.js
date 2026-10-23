import multer from "multer";

const errorHandler = ( err, req, res, next) => {

    if (err instanceof multer.MulterError) {
    let message = "File upload error.";
    if (err.code === "LIMIT_FILE_SIZE") message = "File exceeds maximum allowed size.";
    return res.status(400).json({ success: false, message, errors: [] });
  }

    return res.status( err.statusCode || 500 ).json({

        success: false,

        message: err.message || "Internal Server Error",

        errors: err.errors || []

    });

};

export default errorHandler;