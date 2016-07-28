app.controller(
  'LoginComponent', [
  '$scope',
  '$http',
  '$location',
  '$stateParams',
  'toastr',
  'common',
  function ($scope, $http, $location, $stateParams, toastr, common) {
    $scope.login = {
      processing: false,
      redirect: $stateParams.next || '/',
      username: '',
      password: '',
      apply: function () {
        if (!$scope.login.username || !$scope.login.password) {
          toastr.error('Empty username or password.');
          return;
        }
        if ($scope.login.processing) {
          return;
        }

        $scope.login.processing = true;
        $http.post('/api/v1/user/login/', {
          username: $scope.login.username,
          password: $scope.login.password
        }).then(function (raw) {
          $scope.login.processing = false;
          common.logged_in(raw.data.username, raw.data.apikey);
          $location.url($scope.login.redirect);
        }, function () {
          toastr.error('Unauthenticated.');
        });
      }
    };

    if (!common.redirect_if_not_logged_in(false)) {
      $location.url($scope.login.redirect);
    }
  }
]);
