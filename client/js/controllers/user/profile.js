angular
  .module('app')
  .controller('ProfileController', ['$scope', '$state', 'AuthService', 'Affiliation', 'User', 'uiGmapGoogleMapApi', 'uiGmapIsReady', function ($scope, $state, AuthService, Affiliation, User, uiGmapGoogleMapApi, IsReady) {

    var refreshMap = function(address) {
      IsReady.promise().then(function() {
        if ($scope.geocoder) {
          $scope.geocoder.geocode({'address': address}, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
              $scope.changeUserProfile.lat = results[0].geometry.location.lat();
              $scope.changeUserProfile.lng = results[0].geometry.location.lng();
              $scope.map.markers = [{
                id: 'home',
                coords: {
                  latitude: results[0].geometry.location.lat(),
                  longitude: results[0].geometry.location.lng()
                }
              }];
              var ll = new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng());
              $scope.map.control.getGMap().panTo(ll);
            } else {
              console.log('Geocode was not successful for the following reason: ' + status);
            }
          });
        }
      });
    },
    attributes = ['title', 'email', 'lng', 'lat', 'username', 'firstname', 'lastname', 'profession', 'affiliationId', 'street', 'zip', 'city', 'state', 'country'];

    $scope.lastTrigger = 0;
    $scope.triggerRefresh = function() {
      $scope.lastTrigger = Date.now();
      setTimeout((function() {
        var myTrigger = $scope.lastTrigger;
        return function() {
          if (myTrigger == $scope.lastTrigger) {
            var address = ($scope.changeUserProfile.street || '')
              + ' ' + ($scope.changeUserProfile.zipcode || '')
              + ' ' + ($scope.changeUserProfile.city || '')
              + ' ' + ($scope.changeUserProfile.state || '')
              + ' ' + ($scope.changeUserProfile.country || '');

            refreshMap(address);
          }
        };
      })(), 1500);
    };

    $scope.user = {};
    $scope.affiliations = [];
    $scope.changeUserProfile = {};
    $scope.changeUserPassword = {};
    $scope.deleteUserProfile = {};
    $scope.changeCaret = false;
    $scope.selected = {};
    $scope.map = { control: {}, center: { latitude: 49.877613, longitude: 8.654847 }, zoom: 14 };

    Affiliation.find().$promise.then(function (affiliations) {
      $scope.affiliations = affiliations;

      AuthService.getUser().then(function (userData) {
        $scope.user = userData;
        if ($scope.user.lat) {
          $scope.map.markers = [{
            id: 'home',
            coords: {
              latitude: $scope.user.lat,
              longitude: $scope.user.lng
            }
          }];
          if ($scope.userMap) {
            var ll = new google.maps.LatLng($scope.user.lat, $scope.user.lng);
            $scope.map.control.getGMap().panTo(ll);
          } else {
            $scope.map.center.latitude = $scope.user.lat;
            $scope.map.center.longitude = $scope.user.lng;
          }
        }
        attributes.map(function(p) {
          $scope.changeUserProfile[p] = userData[p] || '';

          if (p === 'affiliationId' && userData[p]) {
            $scope.selected.selectedAffiliation = _(affiliations).findWhere({ id: userData[p] });
          }
        });
      });
    });

    $scope.changeProfile = function () {
      var updates = {};
      $scope.changeUserProfile.affiliationId = $scope.selected.selectedAffiliation.id;
      attributes.map(function(p) {
        if ($scope.changeUserProfile[p] !== $scope.user[p]) {
          updates[p] = $scope.changeUserProfile[p];
        }
      });

      User.prototype$updateAttributes({id: $scope.user.id}, updates).$promise.then(function() {
        $scope.showSuccess = true;
      });
    };

    $scope.deleteProfile = function () {
      console.log(JSON.stringify($scope.changeUserPassword));
    };

    $scope.changePassword = function () {
      if ($scope.changeUserPassword.newPassword == $scope.changeUserPassword.confirmNewPassword) {
        $scope.user.password = $scope.changeUserPassword.newPassword;
        var updates = {
          password: $scope.changeUserPassword.newPassword
        };
        User.prototype$updateAttributes({id: $scope.user.id}, updates).$promise.then(function() {
          console.log("Success");
        });
      }
    };

    uiGmapGoogleMapApi.then(function(maps) {
      $scope.geocoder = new google.maps.Geocoder();
    });
  }]);

