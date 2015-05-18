'use strict';
angular.module('mcd')
  .controller('MainCtrl', function ($scope, $localForage) {
    var normalize = function (t) {
      t.date = new Date(t.Date);
      t.amount = (t['Transaction Type'] === 'credit' ? 1 : -1) * t.Amount;
      delete t.Date;
      delete t.Amount;
      return t;
    };

    var firstDayOfMonth = function (date, offset) {
      offset = offset || 0;
      date = new Date(date);
      return new Date(date.getFullYear(), date.getMonth() + offset, 1);
    };

    var getMonths = function () {
      var months = {};
      var currentDate = firstDayOfMonth($scope.month.start);
      while (currentDate <= firstDayOfMonth($scope.month.end)) {
        months[new Date(currentDate)] = null;
        currentDate = currentDate.addMonth();
      }
      return months;
    };

    var backCandidates = ['Red', 'Pink', 'Purple', 'Deep Purple', 'Indigo', 'Blue', 'Light Blue', 'Teal',
      'Green', 'Light Green', 'Lime', 'Yellow', 'Amber', 'Orange', 'Deep Orange'];
    var backCandidatesAccent = ['500', '700', '900'];

    $localForage.getItem('month').then(function (data) {
      $scope.month = {};
      if (!data || !data.start || !data.end) {
        $scope.month.start = new Date();
        $scope.month.end = new Date();
      } else {
        $scope.month.start = new Date(data.start);
        $scope.month.end = new Date(data.end);
      }
    });

    $localForage.getItem('transactions').then(function (data) {
      if (!data) {
        $scope.transactions = [];
      } else {
        $scope.transactions = data;
      }
    });

    $localForage.getItem('excludes').then(function (data) {
      if (!data) {
        $scope.excludes = [];
      } else {
        $scope.excludes = data;
      }
    });

    var recalc = function () {
      if (!$scope.month || !$scope.transactions) {
        return;
      }

      $localForage.setItem('month', $scope.month);
      $localForage.setItem('transactions', $scope.transactions);

      var firstDay = firstDayOfMonth($scope.month.start);
      var lastDay = firstDayOfMonth($scope.month.end, 1);
      var cats = _.chain($scope.transactions)
        .filter(function (t) {
          return new Date(t.date) >= firstDay && t.date < lastDay;
        })
        .sortBy('Date')
        .groupBy('Category')
        .map(function (categoryTransactions, categoryName) {
          var nameHash = categoryName.hash();
          return {
            category: categoryName,
            color: palette.get(
              backCandidates.getWrapped(nameHash),
              backCandidatesAccent.getWrapped(nameHash)
            ),
            monthly: _.chain(_.assign(
              getMonths(),
              _.chain(categoryTransactions).groupBy(function (transaction) {
                return firstDayOfMonth(transaction.date);
              }).value()))
              .map(function (monthTransactions, month) {
                return {
                  month: month,
                  transactions: monthTransactions,
                  total: _.chain(monthTransactions)
                    .pluck('amount')
                    .sum()
                    .value()
                };
              }).value()
          };
        })
        .map(function (o) {
          var monthlyTotalPlucked = _.chain(o.monthly).pluck('total');
          o.avg = monthlyTotalPlucked.avg().value();
          o.stdDevPct = monthlyTotalPlucked.stdDevPct().value();
          o.chart = {
            labels: _.chain(o.monthly)
              .pluck('month')
              .map(function (d) {
                return new Date(d).getMonthName();
              }).value(),
            data: [
              monthlyTotalPlucked.map(function (t) {
                return (o.avg > 0 ? 1 : -1) * t;
              }).value()
            ],
            options: {
              show: false,
              scaleBeginAtZero: true,
              animation: false,
              bezierCurveTension: 0.3,
              tooltipTemplate: '' +
                '<%if (label) {%>' +
                '  <%=label%>: ' +
                '<%}%>' +
                '<%= numeral(value).format("$0,0[.]00") %>'
            }
          };
          return o;
        })
        .value();
      $scope.content = cats;
    };

    $scope.$watch('transactions', recalc);
    $scope.$watch('month.start', recalc);
    $scope.$watch('month.end', recalc);

    $scope.onFileSelect = function ($files) {
      var reader = new FileReader();
      reader.onload = function (onLoadEvent) {
        Papa.parse(onLoadEvent.target.result, {
          worker: false,
          header: true,
          dynamicTyping: true,
          complete: function (results) {
            $scope.$apply(function () {
              $scope.transactions = _.chain(results.data).map(normalize).value();
            });
          }
        });
      };
      reader.readAsText($files[0]);
    };

    $scope.sortByAbsAvg = function (i) {
      return Math.abs(i.avg);
    };

    $scope.greaterThan = function (prop, val) {
      return function (item) {
        if (item[prop] > val) {
          return true;
        }
      };
    };

    $scope.lessThan = function (prop, val) {
      return function (item) {
        if (item[prop] < val) {
          return true;
        }
      };
    };

    $scope.notExcluded = function () {
      return function (item) {
        return $.inArray(item.category, $scope.excludes) === -1;
      };
    };

    $scope.onChartIconClick = function (ev, item) {
      var flipper = $(ev.target).closest('.flipper');
      flipper.addClass('flip');
      flipper.mouseleave(function () {
        flipper.removeClass('flip');
      });
      item.chart.options.show = true;
    };

    $scope.onTableIconClick = function (ev, item) {
      window.open('https://wwws.mint.com/transaction.event#location:' + encodeURIComponent('{"query":"category:' + item.category + '"}'));
    };

    $scope.onCloseItemEvent = function (ev, item) {
      $scope.excludes.push(item.category);
      $localForage.setItem('excludes', $scope.excludes);
    };
  })
  .filter('abs', function () {
    return function (val) {
      return Math.abs(val);
    };
  }).filter('percentage', ['$filter', function ($filter) {
    return function (input, decimals) {
      return $filter('number')(input * 100, decimals) + '%';
    };
  }]);
