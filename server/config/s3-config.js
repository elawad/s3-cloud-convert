'use strict';

// Load the S3 information from the environment variables.
var Config = {
  AWS_ACCESS_KEY : process.env.AWS_ACCESS_KEY,
  AWS_SECRET_KEY : process.env.AWS_SECRET_KEY,
  S3_BUCKET      : process.env.S3_BUCKET,  
  S3_PATH        : process.env.S3_PATH,  
  S3_REGION      : process.env.S3_REGION,
  
  // For S3 Multi-File Uploading
  AWS_MULTI_PARTS : 5, // how many parts to send at a time
  AWS_MULTI_SIZE  : 1024 * 1024 * 5 // size of each part. 5MB minimum
};

exports.Config = Config;