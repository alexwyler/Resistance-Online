window.Mock = Mock;
function Mock() {
  socket = {
    emit: function(event, data) {
      this[event] && this[event].call(this, data);
    }
  };

  _(socket).extend(Backbone.events);

  var clientstate = window.clientstate = new ClientState({
    my_id: 693594821
  });

  var game = new Game(), mission;

  clientstate.didJoinGame(game);
  game.players.add(Mock.PLAYER_DB, { parse: true });
  mission = new Mission({
    turn: 1,
    attempt: 1,
    leader: 1341660327
  }, { parse: true });
  game.missions.add(mission);
  game.set('state', G_STATE.CHOOSING_MISSION);

  var mock_steps = [
    function() {
      // Leader has chosen the mission
      mission.people.add(game.players.get(1341660327));
      mission.people.add(game.players.get(1599450468));
      game.set('state', G_STATE.VOTING);
    },
    function() {
      // The votes percolate in
      _(game.players.models).each(function(player, i) {
        var vote = new Vote({
          user_id: player.get('id'),
          in_favor: true
        });
        mission.votes.add(vote);
      });
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
}

Mock.PLAYER_DB = require('mock/database').PLAYER_DB;
