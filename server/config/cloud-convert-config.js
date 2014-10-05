'use strict';

// Load the CloudConvert information from the environment variables.
var Config = {
  CLOUD_CONVERT_KEY : process.env.CLOUD_CONVERT_KEY,
  CLOUD_PROCESS_URL : process.env.CLOUD_PROCESS_URL
};

exports.Config = Config;