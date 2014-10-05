'use strict';

var request = require('request'),
    Config    = require('../config/cloud-convert-config').Config,
    S3Config  = require('../config/s3-config').Config;

var apiKey = Config.CLOUD_CONVERT_KEY;

module.exports.startProcess = function (req, res) {

  //console.log('params ' , req.params);
  //console.log('body1 ' , req.body);
  //console.log('query ' , req.query);

  var processUrl = Config.CLOUD_PROCESS_URL;
  var inputFormat = req.body.inputFormat;
  var outputFormat = req.body.outputFormat; 

  //console.log('url' , processUrl, apiKey);

  var data = {
        'apikey': apiKey,
        'inputformat': inputFormat,
        'outputformat': outputFormat
    };

  if (inputFormat && outputFormat) {      
    request.post(processUrl, { json: data }, 
      function (error, response, body) {              
        //console.log('fromCloud1 ' , error, body);

        if (!error && response.statusCode == 200) {
            res.json(body);
          }
          else {
          res.send(response.statusCode, error);
        }
      }
    );
  }
  else {
    res.send(400, 'Missing CloudConvert process info.');
  }
};

module.exports.convertFromS3 = function (req, res) {
  //console.log('params ' , req.params);
  //console.log('body2 ' , req.body);
  //console.log('query ' , req.query);

  var runProcessUrl = 'https:' + req.body.processUrl;
  var s3FileName = req.body.s3FileName;
  var outputFormat = req.body.outputFormat;
  var resolution = req.body.resolution;

  var data = {
    input: {
      s3 : {
        accesskeyid: S3Config.AWS_ACCESS_KEY,
        secretaccesskey: S3Config.AWS_SECRET_KEY,
        bucket: S3Config.S3_BUCKET + '/video-input',
        region: S3Config.S3_REGION,
      }
    },
    file:  s3FileName,
    outputformat: outputFormat,
    output: {
      s3 : {
        accesskeyid: S3Config.AWS_ACCESS_KEY,
        secretaccesskey: S3Config.AWS_SECRET_KEY,
        bucket: S3Config.S3_BUCKET + '/video-output',
        region: S3Config.S3_REGION,
        //path: 'video-output/',
        acl: 'public-read'
      }
    },
    options: {
      // Videos
      video_resolution: resolution,
      faststart: true
      // //Generate video thumbnails
      // thumbnail_format: 'png',
      // thumbnail_size: '400x'

      // //Images
      // resize: '180x'
    }
  };

  if (runProcessUrl && s3FileName && outputFormat) {      
    request.post(runProcessUrl, { json: data }, 
      function (error, response, body) {        
        
        //console.log('fromCloud2 ', body);

        if (!error && response.statusCode == 200) {
            res.json(body);
          }
          else {
          res.send(response.statusCode, error);
        }
      }
    );
  }
  else {
    res.send(400, 'Missing S3 Convert info.');
  }
};

