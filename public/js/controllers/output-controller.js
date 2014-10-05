'use strict';

(function() {

  var app = angular.module('mediaOutputApp', ['ngAnimate', 'angular-loading-bar'])
    .config(function(cfpLoadingBarProvider) {
    cfpLoadingBarProvider.includeSpinner = false;
  });

  app.filter('formatBytes', function() {
    return function(bytes, precision) {
      if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) {
        return '-';
      }

      if (typeof precision === 'undefined') {       
        precision = 1;
      }

      var units = ['bytes', 'KB', 'MB', 'GB'];
      var number = Math.floor(Math.log(bytes) / Math.log(1024));

      return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
    };
  });

  app.service('MediaService', function ($http, $q) {
    return {
      getMediaData: getMediaData
    };

    function getMediaData () {
      return $http.get('/list_objects').then(
        function (response) {
          if (typeof response.data === 'object') {
            return response.data;
          } else {
            return $q.reject(response.data);
          }
        },
        function (response) {
          return $q.reject(response.data);
        }
      );
    }
  });

  app.directive('mediaItems', function ($sce, MediaService) {
    return {
      restrict: 'E',
      templateUrl: 'views/media-items.html',
      controller: function($scope, $filter, $sce, $timeout) {

        $scope.lCol = 3;
        $scope.mCol = 2;
        $scope.allItems = [];
        $scope.filteredItems = [];

        $scope.trustUrl = function (url) {
          return $sce.trustAsResourceUrl(url);
        };

        MediaService.getMediaData().then(function (data) {
          $scope.allItems = $scope.filteredItems = data;
        });
        
        var tempQuery = '';
        var filterTimeout;

        $scope.$watch('searchFilter', function (query) {
          if (filterTimeout) {
            $timeout.cancel(filterTimeout);
          }
          
          tempQuery = query;

          filterTimeout = $timeout(function() {
            $scope.filteredItems = $filter('filter')($scope.allItems, { Name: tempQuery });
            var length = $scope.filteredItems.length;
            $scope.mCol = length < 2 ? length : 2;
            $scope.lCol = length < 3 ? length : 3;
          }, 200);
        });
      }
      //,controllerAs: 'media'
    };
  });

  app.directive('mediaInfo', function () {
    return {
      restrict: 'E',
      templateUrl: 'views/media-info.html'
    };
  });
})();