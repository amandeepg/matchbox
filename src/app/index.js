'use strict';

angular.module('mcd', ['ngAnimate', 'ngCookies', 'ngSanitize', 'restangular', 'ui.router',
  'ngMaterial', 'angularFileUpload', 'ngFitText', 'LocalForageModule', 'chart.js', 'picardy.fontawesome'])
  .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
      });

    $urlRouterProvider.otherwise('/');
  });

Number.prototype.mod = function (n) {
  return ((this % n) + n) % n;
};

Date.prototype.addMonth = function () {
  var date = new Date(this.valueOf());
  date.setMonth(date.getMonth() + 1);
  return date;
};

Date.prototype.getMonthName = function (lang) {
  lang = lang && (lang in Date.locale) ? lang : 'en';
  return Date.locale[lang].monthNames[this.getMonth()];
};

Date.prototype.getMonthNameShort = function (lang) {
  lang = lang && (lang in Date.locale) ? lang : 'en';
  return Date.locale[lang].monthNamesShort[this.getMonth()];
};

Date.locale = {
  en: {
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  }
};

String.prototype.hash = function () {
  var hash = 5381;
  for (var i = 0; i < this.length; i++) {
    var char = this.charCodeAt(i);
    hash = ((hash << 5) + hash) + char;
    /* hash * 33 + c */
  }
  return hash;
};

Array.prototype.getWrapped = function (i) {
  i = i.mod(this.length);
  return this[i];
};

_.mixin({'sum': function (arr) {
  return _.reduce(arr, function (a, b) {
    return a + b;
  }, 0);
}});

_.mixin({'avg': function (arr) {
  return _.sum(arr) / arr.length;
}});

_.mixin({'stdDev': function (arr) {
  var avg = _.avg(arr);

  var squareDiffs = _.chain(arr)
    .map(function (val) {
      var diff = val - avg;
      return diff * diff;
    })
    .value();

  return Math.sqrt(_.avg(squareDiffs));
}});

_.mixin({'stdDevPct': function (arr) {
  return _.stdDev(arr) / _.avg(arr);
}});
