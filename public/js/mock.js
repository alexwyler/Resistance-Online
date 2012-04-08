var Backbone = require('backbone');
var _ = require('underscore')._;
var G_STATE = require('constants').G_STATE;
var M_STATE = require('constants').M_STATE;
var PLAYER_DB = require('mock/database').PLAYER_DB;

var ClientState = require('models/ClientState').ClientState;
var Game = require('models/Game').Game;
var Mission = require('models/Mission').Mission;
var Vote = require('models/Mission').Vote;
var GameView = require('views/GameView').GameView;

$(document).ready(function() {
  socket = {
    emit: function(event, data) {
      this[event] && this[event].call(this, data);
    },

    vote: function(raw_vote) {
      var vote = new Vote({
        user_id: game.self.id,
        in_favor: raw_vote == 'yes'
      });
      mission.votes.add(vote);
    }
  };

  _(socket).extend(Backbone.events);

  var clientstate = window.clientstate = new ClientState({
    my_id: PLAYER_DB[0].id
  });

  var game = new Game(), mission;

  clientstate.didJoinGame(game);
  game.players.add(PLAYER_DB, { parse: true });

  var app = new GameView({
    model: clientstate,
    el: $('<div class="viewport"></div>')
  });
  $('body').append(app.render().el);

  var mock_steps = [
    function() {
      mission = new Mission({
        turn: 1,
        attempt: 1,
        leader_id: PLAYER_DB[1].id,
        state: M_STATE.CHOOSING_MISSION
      }, { parse: true });
      game.missions.add(mission);
      game.set('state', G_STATE.CHOOSING_MISSION);
    },
    function() {
      // Leader has chosen the mission
      mission.party.add(game.players.get(1341660327));
      mission.party.add(game.players.get(1599450468));
      mission.set('state', M_STATE.VOTING);
      game.set('state', G_STATE.VOTING);
    },
    function() {
      // The votes percolate in
      _(game.players.models).each(function(player, i) {
        if (player == game.self) {
          return;
        }
        var vote = new Vote({
          user_id: player.get('id'),
          in_favor: true
        });
        mission.votes.add(vote);
      });
      mission.set('state', M_STATE.MISSIONING);
    },
    function() {
      // Mission actions
      _(mission.people).each(function(player, i) {
        var action = new MissionAction({
          user_id: player.get('id'),
          mission_action: true
        });
        mission.actions.add(action);
      });
    }
  ];

  window.mock_next = function() {
    var func = mock_steps.shift();
    func();
  };
});
