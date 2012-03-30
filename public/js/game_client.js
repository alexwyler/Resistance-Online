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
        this.redrawGame();
      }
    }.bind(this));

    socket.on('new_game', function(data) {
      this.insertNewGame(data.game.id, data.game.name);
    }.bind(this));

    socket.on('delete_game', function(data) {
      $('#game_' + data.game_id).remove();
    });

    socket.on('update_lobby', function(gameData) {
      this.gameData = gameData;
      this.redrawGame();
    }.bind(this));

    socket.on('leave_game', function(data) {
      this.gameData = null;
      $('#game').empty();
    });
  },

  redrawGame : function() {
    $('#game').empty();
    $('#game').append(
      $('<b> Current Game: ' + this.gameData.name + '</b>'),
      $('<br/>'),
      'Status: ' + this.gameData.state,
      $('<ol id="lobby_players"/>'),
      $('<input type="button" value="Leave Game"/>').click(
        function() {
          socket.emit('leave_game', {
            'auth' : this.getAuthParams(),
          });
        }.bind(this)
      ),
      $('<hr/>')
    );

    $(this.gameData.players).each(function(idx, uid) {
      $('#lobby_players').append(
        $('<li>' + uid + '</li>')
      );
    });
  }
}

function initClient() {
  urlVars = getUrlVars();
  if (urlVars.uid) {
    client.init({
      id: urlVars.uid
    });
  } else {
    FB.getLoginStatus(function(response) {
      if (response.status === 'connected') {
        client.init({
          id : response.authResponse.userID,
          accessToken : response.authResponse.accessToken
        });
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