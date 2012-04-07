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

Mock.PLAYER_DB = [
  {
    id: 693594821,
    name: 'Ryan',
    full_name: 'Ryan Patterson',
    profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/273581_693594821_24739666_q.jpg'
  }, {
    id: 1341660327,
    name: 'Zizhuang',
    full_name: 'Zizhuang Yang',
    profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/275664_1341660327_177798061_q.jpg'
  }, {
    id: 1599450468,
    name: 'Alex',
    full_name: 'Alex Wyler',
    profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/174184_1599450468_1761600976_q.jpg',
  }, {
    id: 571997087,
    name: 'Mary',
    full_name: 'Mary Pimenova',
    profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-ash2/565181_571997087_2000265899_q.jpg'
  }, {
    id: 6203644,
    name: 'Derek',
    full_name: 'Derek Brandao',
    profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/174156_6203644_1590218817_q.jpg'
  }, {
    id: 1653295587,
    name: 'Ben',
    full_name: 'Ben Zax',
    profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/41760_1653295587_4599_q.jpg'
  }
];
