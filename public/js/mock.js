(function() {
  const PLAYER_DB = [
    {
      name: 'Ryan Patterson',
      fbid: 693594821,
      profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/273581_693594821_24739666_q.jpg'
    }, {
      name: 'Zizhuang Yang',
      fbid: 1341660327,
      profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/275664_1341660327_177798061_q.jpg'
    }, {
      name: 'Alex Wyler',
      fbid: 1599450468,
      profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/174184_1599450468_1761600976_q.jpg',
    }, {
      name: 'Mary Pimenova',
      fbid: 571997087,
      profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-ash2/565181_571997087_2000265899_q.jpg'
    }, {
      name: 'Derek Brandao',
      fbid: 6203644,
      profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/174156_6203644_1590218817_q.jpg'
    }, {
      name: 'Ben Zax',
      fbid: 1653295587,
      profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/41760_1653295587_4599_q.jpg'
    }
  ];

  var game = window.game = new Game();

  function add_players() {
    game.players.add(PLAYER_DB);
  }

  window.mock_next = add_players;
})();
