'use strict';

// Required
var express    = require('express'),
    bodyParser = require('body-parser');

// Controller
var s3Controller           = require('./server/controllers/s3-controller'),
    s3UploadController     = require('./server/controllers/s3-upload-controller'),
    cloudConvertController = require('./server/controllers/cloud-convert-controller');


var app = express();
app.use(bodyParser.json());

app.engine('html', require('ejs').renderFile);
app.set('views', __dirname + '/public/views');
app.set('port', process.env.PORT || 5000);


//static helpers
app.use(       express.static(__dirname + '/public'));
app.use('js',  express.static(__dirname + '/public/js'));
app.use('css', express.static(__dirname + '/public/css'));


//Start the server to handle incoming requests.
app.listen(app.get('port'));


// Render html pages
app.get('/', function(req, res){
  res.render('input.html');
});

app.get('/output', function(req, res){
  res.render('output.html');
});


// Routing
app.post('/upload-s3', s3UploadController.upload);
app.get('/get-progress', s3UploadController.getProgress);

app.post('/start-process', cloudConvertController.startProcess);
app.post('/convert-s3', cloudConvertController.convertFromS3);

// Return JSON containing the temporarily signed S3 request and URL of item.
app.get('/sign_s3', s3Controller.sign_put);

// Return JSON containing list of items in the bucket.
app.get('/list_objects', s3Controller.list);