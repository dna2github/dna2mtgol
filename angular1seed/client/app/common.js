app.service(
  'common',[
  '$http',
  '$location',
  '$state',
  'ipCookie',
  'toastr',
  function ($http, $location, $state, ipCookie, api, toastr) {
    var cookie_name = {
      username: 'app_xusername',
      apikey: 'app_xapikey'
    };
    var service = {
      user: {
        username: null,
        apikey: null
      },
      redirect_if_not_logged_in: function (redirect) {
        var username = ipCookie(cookie_name.username),
            apikey = ipCookie(cookie_name.apikey);
        if (username && apikey) {
          service.logged_in(username, apikey);
          return false;
        }
        service.logged_out();
        if (redirect === false) return true;
        $state.go('login', {
          next: $location.$$url
        });
        return true;
      },
      logged_in: function (username, apikey) {
        ipCookie(cookie_name.username, username);
        ipCookie(cookie_name.apikey, apikey);
        service.user.username = username;
        service.user.apikey = apikey;
        $http.defaults.headers.common['Authorization'] = 'ApiKey ' + username + ':' + apikey;
      },
      logged_out: function () {
        ipCookie.remove(cookie_name.username);
        ipCookie.remove(cookie_name.apikey);
        service.user.username = null;
        service.user.apikey = null;
        delete $http.defaults.headers.common.Authorization;
      },
      user_profile: function () {
      }
    };
    return service;
  }
]);
