'use strict';

var AWS      = require('aws-sdk'),
    s3Stream = require('s3-upload-stream'), 
    Busboy   = require('busboy'),
    fs       = require('fs'),
    S3Config = require('../config/s3-config').Config;

//zlib   = require('zlib'); //doesnt play nice with videos  

AWS.config.update({
  accessKeyId: S3Config.AWS_ACCESS_KEY,
  secretAccessKey: S3Config.AWS_SECRET_KEY
});

var StartTime = 0;
var TotalSize = 0;
var Progress = 0;
var Part = 0;

module.exports.upload = function (req, res) {

  //Reset value
  StartTime = 0;
  TotalSize = 0;
  Progress = 0;
  Part = 0;

  //Prepare S3 Upload Stream
  s3Stream.client(new AWS.S3());

  TotalSize = req.headers['content-length'];

  var busboy = new Busboy({ headers: req.headers });

  busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
    
    var chunks = (TotalSize / S3Config.AWS_MULTI_SIZE);
    chunks = chunks < 1 ? 1 : chunks;

    //console.log('size ', TotalSize, S3Config.AWS_MULTI_SIZE);
    //console.log(TotalSize / S3Config.AWS_MULTI_SIZE);
    
    Progress = (100 / chunks / 2).toFixed(2);

    //console.log('init prog ' + Progress);

    // Only accept the inputFile form field
    // if (fieldname !== 'inputFile') { 
    //  console.log('invalid field');
    //  return;
    // }

    //console.log('onFile', fieldname, filename, encoding, mimetype);
    
    //var fileName = 'test.mov';
    //var filePath = '../_media/' + fileName;
    //var contentType = mime.lookup(filePath);

    // Create the streams
    //var read = fs.createReadStream('../_media/' + filename);    
    //var compress = zlib.createGzip();
    
    var upload = new s3Stream.upload({
      'Bucket': S3Config.S3_BUCKET,
      'Key': 'video-input/' + filename,
      'ContentType': mimetype,
      'ACL': 'public-read'
    });

    // Optional configuration
    upload.maxPartSize(S3Config.AWS_MULTI_SIZE);
    upload.concurrentParts(S3Config.AWS_MULTI_PARTS);
    
    // Handle errors.
    upload.on('error', function (error) {
      console.log('error', error);
    });

    /* Handle progress. Example details object:
       { ETag: '"f9ef956c83756a80ad62f54ae5e7d34b"', PartNumber: 5, 
         receivedSize: 29671068, uploadedSize: 29671068 }
    */
    upload.on('part', function (details) {
      console.log('\n', details);

      var delta = ((new Date() - StartTime) / 1000).toFixed(1);

      Part = details.PartNumber;
      Progress = ((details.uploadedSize / TotalSize) * 100).toFixed(2);
      
      //console.log('Time: ', delta, 'seconds');
      //console.log('Percent: ', Progress);
    });

    /* Handle upload completion. Example details object:
       { Location: 'https://bucketName.s3.amazonaws.com/filename.ext',
       Bucket: 'bucketName', Key: 'filename.ext',
       ETag: '"bf2acbedf84207d696c8da7dbb205b9f-5"' }
    */
    upload.on('uploaded', function (details) {
      console.log('\n', details);

      var delta = ((new Date() - StartTime) / 1000).toFixed(1);
      //console.log('Completed upload in', delta, 'seconds');

      Progress = 100;
      res.json(details);
    });
    
    StartTime = new Date();

    // Stream file straight to S3 as a MultiPartUpload
    file.pipe(upload);
  });

  //busboy.on('finish', function() {
  //  console.log('success ', ((new Date() - startTime) / 1000).toFixed(1)); //res.render("success");
    //res.send('OK');
  //});
  
  req.pipe(busboy);

  // var form = new formidable.IncomingForm();
  // //form.uploadDir = __dirname + '/tmp';
  // //form.encoding = 'binary';
  // console.log(form); //this prints
  // //Get access to the other fields of the request. 
  // // form.parse(req, function (err, fields, files) {
  // //     console.log('parsing..'); //this does not print
  // //     console.log(fields);
  // //     console.log(files);
  // // });

  // // form.onPart = function (part) {
  // //   console.log('onpart');

  // //   part.pipe(upload);
  // // };
  
 //   res.send('OK');



  // fs.stat('../_media/' + fileName, function(error, stat) {
  //  if (error) {
  //    throw error;
  //  }

  //   totalSize = stat.size;
  //   console.log('Total Size ', totalSize);
    
  //   startTime = new Date();

  //   // Pipe the incoming filestream through compression, and up to S3. 
  //   console.log('stop read pipe');
  //   //read.pipe(upload);
  // });
};

module.exports.getProgress = function (req, res) {
  res.json({ 
    progress: Progress,
    part: Part
  });
};

module.exports.uploadTest = function (req, res) {

  var filename = 'test.mov';
  var mimetype = 'video/quicktime';

  //Prepare S3 Upload Stream
  s3Stream.client(new AWS.S3());

  // Create the streams
  var read = fs.createReadStream('../_media/' + filename);    
  
  //var compress = zlib.createGzip();

  var upload = new s3Stream.upload({
    'Bucket': S3Config.S3_BUCKET,
    'Key': filename,
    'ContentType': mimetype,
    'ACL': 'public-read'
  });

  // Optional configuration
  upload.maxPartSize(S3Config.AWS_MULTI_SIZE);
  upload.concurrentParts(S3Config.AWS_MULTI_PARTS);
  console.log('max part size ', upload.getMaxPartSize());

  // Handle errors.
  upload.on('error', function (error) {
    console.log('error', error);
  });

  /* Handle progress. Example details object:
     { ETag: '"f9ef956c83756a80ad62f54ae5e7d34b"', PartNumber: 5, 
     receivedSize: 29671068, uploadedSize: 29671068 }
  */
  upload.on('part', function (details) {
    console.log('\n', details);

    var delta = ((new Date() - StartTime) / 1000).toFixed(1);
    console.log('Time: ', delta, 'seconds');

    Progress = ((details.uploadedSize / TotalSize) * 100).toFixed(2);
    console.log('Percent: ', Progress);
  });

  /* Handle upload completion. Example details object:
     { Location: 'https://bucketName.s3.amazonaws.com/filename.ext',
     Bucket: 'bucketName', Key: 'filename.ext',
     ETag: '"bf2acbedf84207d696c8da7dbb205b9f-5"' }
  */
  upload.on('uploaded', function (details) {
    console.log('\n', details);

    var delta = ((new Date() - StartTime) / 1000).toFixed(1);
    console.log('Completed upload in', delta, 'seconds');

    Progress = 100;

    res.send('OK');
  });

  fs.stat('../_media/' + filename, function(error, stat) {
    if (error) {
      throw error;
    }

    TotalSize = stat.size;

    StartTime = new Date();

    // Pipe the incoming filestream through compression, and up to S3.
    read.pipe(upload);
  });
};

//disabled compression due to video playback issues
//read.pipe(compress).pipe(upload);