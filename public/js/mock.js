(function() {
  const PLAYER_DB = [
    {
      id: 693594821,
      name: 'Ryan Patterson',
      profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/273581_693594821_24739666_q.jpg'
    }, {
      id: 1341660327,
      name: 'Zizhuang Yang',
      profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/275664_1341660327_177798061_q.jpg'
    }, {
      id: 1599450468,
      name: 'Alex Wyler',
      profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/174184_1599450468_1761600976_q.jpg',
    }, {
      id: 571997087,
      name: 'Mary Pimenova',
      profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-ash2/565181_571997087_2000265899_q.jpg'
    }, {
      id: 6203644,
      name: 'Derek Brandao',
      profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/174156_6203644_1590218817_q.jpg'
    }, {
      id: 1653295587,
      name: 'Ben Zax',
      profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/41760_1653295587_4599_q.jpg'
    }
  ];

  FB.init({
    appId      : '326683484060385'
  });

  var clientstate = window.clientstate = new ClientState({
    my_id: 693594821
  });

  var game = clientstate.game, mission;

  var mock_steps = [
    function() {
      // Set up the players and first mission
      game.players.add(PLAYER_DB);

      mission = new Mission({
        turn: 1,
        attempt: 1,
        leader_id: 1341660327
      });
      game.missions.add(mission);
    },
    function() {
      // Leader has chosen one of the mission players
      mission.people.add(game.players.get(1341660327));
    },
    function() {
      // Leader has chosen the mission
      mission.people.add(game.players.get(1599450468));
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
})();
