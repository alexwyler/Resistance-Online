var socket = io.connect('http://localhost:8080');

var client = {
  id : undefined,
  accessToken : undefined,
  gameData : undefined,

  getAuthParams : function() {
    return {
      id : this.id,
      accessToken : this.accessToken
    };
  },

  init : function(authParams) {
    this.id = authParams.id;
    this.accessToken = authParams.accessToken;
    socket.emit('init', {
      'auth' : this.getAuthParams()
    });

    $('input[value="New Game"]').click(
      function() {
        socket.emit('new_game', {
          'auth' : this.getAuthParams(),
          'name' : $('#new_game_name').val()
        });
      }.bind(this)
    );

    socket.on('init', function(state) {
      for (game_id in state.games) {
        var game = state.games[game_id];
        this.insertNewGame(game.id, game.name);
      }
      if (state.gameData) {
        this.gameData = state.gameData;
        this.renderGameShell();
        this.renderPlayers();
        this.renderGameData();
      }
    }.bind(this));

    socket.on('error', function(data) {
      alert(data.msg);
    }.bind(this));

    socket.on('new_game', function(data) {
      this.insertNewGame(data.game.id, data.game.name);
    }.bind(this));

    socket.on('delete_game', function(data) {
      $('#game_' + data.game.id).remove();
    });

    socket.on('join_complete', function(gameData) {
      this.gameData = gameData;
      this.renderGameShell();
      this.updateGameStatus();
      this.renderPlayers();
    }.bind(this));

    socket.on('player_join', function(data) {
      this.gameData = data.gameData;
      this.addPlayerToGame(data.user);
    }.bind(this));

    socket.on('player_leave', function(data) {
      this.gameData = data.gameData;
      this.removePlayerFromGame(data.user);
    }.bind(this));

    socket.on('leave_game', function(data) {
      this.gameData = null;
      $('#game').empty();
    }.bind(this));

    socket.on(
      'start_game', function(gameData) {
        this.gameData = gameData;
        this.renderGameData();
      }.bind(this)
    );

    socket.on(
      'choose_player', function(gameData) {
        this.gameData = gameData;
        this.renderGameData();
      }
    );

    socket.on(
      'unchoose_player', function(gameData) {
        this.gameData = gameData;
        this.renderGameData();
      }
    );

    socket.on(
      'start_vote', function(gameData) {
        this.gameData = gameData;
        this.renderGameData();
      }
    );
  },

  // rendering
  renderGameData : function() {
    console.log(this.gameData);
    $('#spies').empty();
    $('#spies').append(
      'Spies: ' + JSON.stringify(this.gameData.roles)
    );
    this.renderMissions();
  },

  renderMissions : function() {
    $('#missions').empty();
    $('#missions').append(
      JSON.stringify(this.gameData.missions),
      $('<div id="cur_mission"/>')
    );

    var cur_mission = _.last(this.gameData.missions);
    $('#cur_mission').empty();
    if (this.gameData.state == 'choosing_mission') {
      $('#cur_mission').append(
        'Players:',
        $('<br/>')
      );
      _.each(
        this.gameData.players,
        function(player) {
          $('#cur_mission').append(
            JSON.stringify(player));
          var checkbox = $('<input type="checkbox"/>');
          checkbox.change(
            function(checkbox, player) {
              console.log(player);
              console.log(checkbox);
              if (checkbox.checked) {
                socket.emit(
                  'choose_player', {
                    auth : this.getAuthParams(),
                    player : player
                  });
              } else {
                socket.emit(
                  'unchoose_player', {
                    auth : this.getAuthParams(),
                    player : player
                  });
              }
            }.bind(this, checkbox, player));
          $('#cur_mission').append(checkbox);
        }.bind(this));
      $('#cur_mission').append(
        $('<input type="button" value="vote"/>').click(
          function() {
            socket.emit(
              'start_vote', {
                auth : this.getAuthParams()
              });
          }
        )
      );
    } else if (this.gameData.state == 'voting') {
      $('#cur_mission').append(
        $('<input type="button" value="YES"/>').click(
          function() {
            socket.emit(
              'vote_yes', {
                auth : this.getAutParams()
              });
          }
        ),
        $('<input type="button" value="NO"/>').click(
          function() {
            socket.emit(
              'vote_no', {
                auth : this.getAutParams()
              });
          }
        )
      );
    }
  },

  updateGameStatus : function() {
    // todo
  },

  renderGameShell : function() {
    $('#game').empty();
    $('#game').append(
      $('<b> Current Game: ' + this.gameData.name + '</b>'),
      $('<br/>'),
      'Status: ',
      $('<span id="game_status"/>'),
      $('<ol id="players"/>'),
      $('<input type="button" value="Leave Game"/>').click(
        function() {
          socket.emit('leave_game', {
            'auth' : this.getAuthParams()
          });
        }.bind(this)
      ),
      $('<div id="ready_container"/>'),
      $('<input type="button" value="Start Game"/>').click(
        function() {
          socket.emit('start_game', {
            'auth' : this.getAuthParams()
          });
        }.bind(this)
      ),
      $('<hr/>'),
      $('<div id="spies"/>'),
      $('<div id="missions"/>')
    );
  },

  renderPlayers : function() {
    for (uid in this.gameData.players) {
      this.addPlayerToGame(this.gameData.players[uid]);
    }
  },

  addPlayerToGame : function(user) {
    $('#players').append(
      $('<li id="player_' + user.id + '">'
        + user.name
        + ' -- '
        + user.state
        + '</li>')
    );
  },

  removePlayerFromGame : function(user) {
    $('#player_' + user.id).remove();
  },

  insertNewGame : function(id, name) {
    $('#games').append(
      $('<li id="game_' + id + '"/>').append(
        $('<a href="#"/>')
          .append(name)
          .click(
            function(game_id) {
              socket.emit('join_game', {
                auth : this.getAuthParams(),
                game_id : game_id
              });
            }.bind(this, id))
      ));
  }
}

function initClient() {
  var urlVars = getUrlVars();
  if (urlVars.uid) {
    client.init({
      id: ("" + urlVars.uid).replace('#', '')
    });
  } else {
    FB.getLoginStatus(function(response) {
      if (response.status === 'connected') {
        client.init({
          id : response.authResponse.userID,
          accessToken : response.authResponse.accessToken
        });
        $('#login_page').hide();
        $('#lobby_page').show();
      } else {
        // I HAVE NO IDEA HOW FACEBOOK PLATFORM WORKS
        alert("log the fuck in and refresh");
      }
    });
  }
}

function getUrlVars() {
  var vars = [], hash;
  var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
  for(var i = 0; i < hashes.length; i++)
  {
    hash = hashes[i].split('=');
    vars.push(hash[0]);
    vars[hash[0]] = hash[1];
  }
  return vars;
}