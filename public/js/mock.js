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

  var clientstate = window.clientstate = new ClientState({
    my_id: 693594821
  });

  var mission;

  function add_players() {
    clientstate.game.players.add(PLAYER_DB);
    setup_mission();
  }

  function setup_mission() {
    mission = new Mission({
      turn: 1,
      leader_id: 1341660327
    });
    clientstate.game.missions.add(mission);
  }

  window.mock_next = add_players;
})();
