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
      }
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
  },

  // rendering

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
            'auth' : this.getAuthParams(),
          });
        }.bind(this)
      ),
      $('<div id="ready_container"/>'),
      $('<hr/>')
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
  },

}

function initClient() {
  urlVars = getUrlVars();
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