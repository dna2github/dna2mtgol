app.controller(
  'SettingsComponent', [
  '$scope',
  'common',
  function ($scope, common) {
    if(common.redirect_if_not_logged_in()) return;
  }
]);

