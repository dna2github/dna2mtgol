app.directive('ladda', ['$interval', function ($interval) {
  return {
    restrict: 'A',
    link: function ($scope, $elem, $attr) {
      var monitor = $attr.ladda;
      if (!monitor) return;
      var index = 0,
          states = ['', '.', '..', '...'],
          timer = null,
          span = angular.element('<span>');
      span.addClass('hide');
      $elem.append(span);
      val_changed($scope.$eval(monitor));
      $scope.$watch(monitor, val_changed);
      function val_changed (val, old_val) {
        if (val && (!!val) !== (!!old_val)) {
          if (timer) $interval.cancel(timer);
          $elem.addClass('disabled');
          span.text(states[index]);
          span.removeClass('hide');
          timer = $interval(function () {
            index ++;
            if (index >= states.length) index = 0;
            span.text(states[index]);
          }, 500);
        } else if (!val && (!!val) !== (!!old_val)) {
          if (timer) $interval.cancel(timer);
          index = 0;
          $elem.removeClass('disabled');
          span.addClass('hide');
        }
      }
    }
  };
}]);
