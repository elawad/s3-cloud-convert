'use strict';

(function() {

  var app = angular.module('mediaInputApp', []);

  app.directive('fileModel', ['$parse', function ($parse) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var model = $parse(attrs.fileModel);
        var modelSetter = model.assign;
        
        element.bind('change', function() {
          scope.$apply(function(){
            modelSetter(scope, element[0].files[0]);
          });
        });
      }
    };
  }]);


  app.controller('MediaInputController', ['$scope', '$timeout', 'FileUploadService', 
    function($scope, $timeout, FileUploadService) {
    
    $scope.outputFormats = [    
      { id: 'mp4',  name: 'MP4' },
      { id: 'webm', name: 'WebM' },
      { id: 'jpg',  name: 'JPG' },
      { id: 'gif',  name: 'GIF' }
    ];
    $scope.videoResolutions = [
      { id: '',          name: 'Default' },
      { id: '1920x1080', name: '1080p' },
      { id: '1280x720',  name: '720p' },
      { id: '720x480',   name: '480p' },
      { id: '640x360',   name: '360p' }
    ];

    $scope.selectedFormat = $scope.outputFormats[0];
    $scope.selectedResolution = $scope.videoResolutions[0];
    $scope.inputFile = '';
    $scope.progress = 0;
    $scope.progressClass = '';
    $scope.progressStatus = 'Ready';

    var s3FileLocation = '';
    var processUrl = '';
    var pollSpeed = 1000;
    var pullProgress = false;

    $scope.convertClick = function() {      
      if (!$scope.inputFile) { return; }
      
      pullProgress = true;

      var inputFormat = getExt($scope.inputFile.name);
      var outputFormat = $scope.selectedFormat.id;

      FileUploadService.startCloudProcess(inputFormat, outputFormat).then(function (data) {
        console.log('start process ', data);

        processUrl = data.url; //data.host, id

        uploadToS3();
      });
    };

    function uploadToS3() {
      resetProgress('Uploading to S3', 'success');

      FileUploadService.uploadS3($scope.inputFile).then(function (data) {
        console.log('upload ', data);

        s3FileLocation = data.Location; //data.Key
        $scope.progress = 100;

        convertFromS3();
      });

      getS3Progress();
    }
    
    function getS3Progress() {
      if (pullProgress && $scope.progress < 100) {

        FileUploadService.getS3Progress().then(function (data) {
          console.log('s3 progress ', data);

          if (data.part === 0) {            
            incrementProgress(data.progress);
          } else {
            $scope.progress = data.progress;
          }

          if ($scope.progress < 100) {            
            // Recursive call
            $timeout(getS3Progress, pollSpeed);
          }         
        });
      }
    }

    function convertFromS3() {
      pullProgress = false;
      resetProgress('Sending to CloudConvert', '');
      
      var s3FileName = $scope.inputFile.name;
      var outputFormat = $scope.selectedFormat.id;
      var resolution = $scope.videoResolutions.id;

      FileUploadService.convertFromS3(processUrl, s3FileName, outputFormat, resolution).then(function (data) {
        console.log('convert ', data);

        getCloudProgress(processUrl);
      });
    }

    function getCloudProgress(url) {
      FileUploadService.getCloudProgress(url).then(function (data) {
        console.log('cloud progress ', data);

        var percent = data.percent;
        var step = data.step;

        if (step == 'input') {  
          $scope.progressStatus = 'Sending to Cloud Convert';
          incrementProgress();
        }
        else if (step == 'convert') {
          $scope.progressStatus = 'Converting';
          $scope.progressClass = 'warning';
          $scope.progress = percent;
          //resetProgress('Converting', 'warning', percent);
        }
        else if (step == 'output') {
          $scope.progressStatus = 'Saving to S3';
          //$scope.progressClass = 'warning';
          incrementProgress();          
        }
        else if (step == 'finished' || percent == 100) {
          console.log('complete');

          resetProgress('Finished');
          return;
        }

        // Recursive call
        $timeout(function() {   
          getCloudProgress(url);
        }, pollSpeed);        
      });
    }

    function incrementProgress(incrementTo) {
      incrementTo = incrementTo || 100;     
      var newProgress = $scope.progress + 2;
      
      if (newProgress >= 100) {
        $scope.progress = 100;
      }
      else if(newProgress < incrementTo) {
        $scope.progress = newProgress;
      }
    }

    function resetProgress(status, type) {
      $scope.progress = 0;
      $scope.progressStatus = status || 'Ready';
      $scope.progressClass = type || '';
    }

    function getExt (name) {
      return name.substr((~-name.lastIndexOf('.') >>> 0) + 2);
    }   

    //TEMP - testing progress
    var testProgress = [1, 2, 3, 4, 10, 50, 99, 100];
    var clickCount = 0;
    $scope.testProgressBar = function() {
      if (clickCount > testProgress.length) {
        clickCount = 0;
      }
      
      $scope.progress = testProgress[clickCount];
      clickCount++;
    };
  }]);

  
  app.service('FileUploadService', ['$http', '$q', function ($http, $q) {
    return {
      uploadS3: uploadS3,
      uploadS3Test: uploadS3Test,
      getS3Progress: getS3Progress,
      
      //Cloud Convert APIs
      startCloudProcess: startCloudProcess,
      getCloudProgress: getCloudProgress,
      convertFromS3: convertFromS3
    };

    function uploadS3 (file) {
      var fData = new FormData();
      fData.append('inputFile', file);
      
      var headers = {
        transformRequest: angular.identity,
        headers: { 'Content-Type': undefined }
      };

      return $http.post('/upload-s3', fData, headers)
        .then(handleSuccess, handleError);
    }

    function uploadS3Test() {
      var headers = {
        transformRequest: angular.identity,
        headers: { 'Content-Type': undefined }
      };

      return $http.post('/upload-s3-test', headers)
        .then(handleSuccess, handleError);
    }

    function getS3Progress() {
      return $http.get('/get-progress')
        .then(handleSuccess, handleError);
    }


    //Cloud Convert APIs
    function startCloudProcess(inputFormat, outputFormat) {
      var data = {            
        'inputFormat': inputFormat,
        'outputFormat': outputFormat
      };

      return $http.post('/start-process', data)
        .then(handleSuccess, handleError);
    }

    function convertFromS3(processUrl, s3FileName, outputFormat, resolution) {
      var data = {            
        'processUrl': processUrl,
        's3FileName': s3FileName,
        'outputFormat': outputFormat,
        'resolution': resolution
      };

      return $http.post('/convert-s3', data)
        .then(handleSuccess, handleError);
    }

    function getCloudProgress (url) {
      return $http.get(url)
        .then(handleSuccess, handleError);
    }


    //Handle Responses
    function handleSuccess (response) {
      if (typeof response.data === 'object') {            
        return response.data;           
      } else {
        return $q.reject(response.data);
      }
    }
    function handleError (response) {
      return $q.reject(response.data);
    }
  }]);

})();