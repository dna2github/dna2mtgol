var app = angular.module(
  'app', [
  'ngAnimate',
  'ui.router',
  'ipCookie',
  'toastr',
  'ngSanitize',
  'ui.select',
  'templates.app'
]);

app.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/');
  $stateProvider
  .state('stage_list', {
    url: '/repos',
    templateUrl: 'views/stage_list.html',
    controller: 'StageListComponent'
  })
  .state('file_list', {
    url: '/files',
    templateUrl: 'views/file_list.html',
    controller: 'FileListComponent'
  })
  .state('settings', {
    url: '/settings',
    templateUrl: 'views/settings.html',
    controller: 'SettingsComponent'
  })
  .state('home', {
    url: '/',
    templateUrl: 'views/home.html'
  })
  .state('help', {
    url: '/help',
    templateUrl: 'views/help.html'
  })
  .state('login', {
    url: '/login?next',
    templateUrl: 'views/login.html',
    controller: 'LoginComponent'
  });
}]);

app.run([
  '$rootScope',
  '$location',
  '$state',
  'common',
  function ($rootScope, $location, $state, common) {
    $rootScope.logout = function () {
      if ($state.is('login')) {
        return;
      }
      common.logged_out();
      $location.url('/login?next=' + encodeURI($location.$$url));
    }
  }
]);
