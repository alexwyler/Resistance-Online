var Backbone = require('backbone');
var constants = require('../constants');
var _ = require('underscore')._;

var CollectionView = require('./CollectionView').CollectionView;

var ScoreHeaderView = exports.ScoreHeaderView = Backbone.View.extend({
  className: 'navigation',

  initialize: function() {
    _(this).bindAll();
    this.model.game.missions.on('change', this.render);
  },

  render: function() {
    this.$el.empty();

    var turns = { 0 : "stuff"};

    this.model.game.missions.each(
      function(mission) {
        if (mission.votePassed() && mission.isFinished()) {
           turns[mission.get('turn')] = {
            result : mission.isPassing() ? 'pass' : 'fail',
            attempt : mission.get('attempt')
          };
        }
      }
    );

    for (var i = 1; i <= 5; i++) {
      var turn = turns[i];

      if (!turn) {
        turn = {
          result : null,
        }
      }
      var token =
        $('<div data-id="' + i + '" class="token ' + turn.result + '"></div>');

      if (turn.result) {
        token.click(function(turn, attempt) {
          var id = turn + "_" + attempt;
          $('#' + id)[0].scrollIntoView();
        }.bind(this, i, turn.attempt));
      }
      this.$el.append(token);
    }

    return this;
  },
});

