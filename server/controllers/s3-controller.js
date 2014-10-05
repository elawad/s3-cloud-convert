'use strict';

var AWS      = require('aws-sdk'),
    S3Config = require('../config/s3-config').Config;

AWS.config.update({
  accessKeyId: S3Config.AWS_ACCESS_KEY,
  secretAccessKey: S3Config.AWS_SECRET_KEY
});

// Get a sigend url to upload an object
module.exports.sign_put = function (req, res) { 
  var s3 = new AWS.S3(); 
  var s3_params = { 
    Bucket: S3Config.S3_BUCKET, 
    Key: req.query.s3_object_name, 
    Expires: 60,
    ContentType: req.query.s3_object_type, 
    ACL: 'public-read'
  }; 
  s3.getSignedUrl('putObject', s3_params, function (err, data) { 
    if (err) { 
      console.log(err, err.stack); 
    }
    else { 
      var return_data = {
        signed_request: data,
        url: S3Config.S3_PATH +'/'+ S3Config.S3_BUCKET +'/'+ req.query.s3_object_name
      };

      res.json(return_data);
    } 
  });
};

// List all valid media objects in bucket
module.exports.list = function (req, res) {
  var s3 = new AWS.S3();
  var s3_params = {
    Bucket: S3Config.S3_BUCKET
  };

  s3.listObjects(s3_params, function (err, data) {
    if (err) { 
      console.log(err, err.stack); 
    }
    else {
      var i, value, ext;
      var cleanedData = [];
      var itemList = data.Contents;

      for (i = 0; i < itemList.length; ++i) {
        value = itemList[i];

        var name = getName(value.Key);        
        if (name) {
          ext  = getExt(value.Key);

          var item = {
            Name: name,
            Size: value.Size,
            Url: S3Config.S3_PATH + '/' + S3Config.S3_BUCKET + '/' + value.Key,
            Extension: ext,
            Type: getType(ext),
            LastModified: value.LastModified,                   
          };

          if (!!(item.Type)) {
            cleanedData.push(item);
          }
        }
      }

      res.json(cleanedData);
    }
  });
};

// Valid media types
var videoExt = ['mp4', 'webm'];
var imageExt = ['png', 'jpg', 'gif'];

function getType (ext) {
  if (videoExt.indexOf(ext) > -1)
    return 'video';
  else if (imageExt.indexOf(ext) > -1)
    return 'image';
  return;
}
function getExt (name) {
  return name.substr((~-name.lastIndexOf('.') >>> 0) + 2);
}

function getName (name) {
  var folder = 'video-output/';
  var inFolder = (name.indexOf(folder) > -1);

  if (inFolder) { 
    return name.substr(folder.length);
  } else {
    return false;
  }
}