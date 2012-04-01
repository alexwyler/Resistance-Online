var socket = io.connect('http://localhost:8080');

var ClientView = Backbone.View.extend(
  {
    initialize: function() {
      _(this).bindAll('handleLogin', 'handleError', 'render');
      this.currentView = new LoginView({el:this.$el});

      socket.on('error', function(err){
        clientView.handleError(err);
      });

      socket.on('player_join', _(function(game) {
        this.model.game.players.reset(game.players);
      }).bind(this));

      socket.on('player_leave', _(function(game) {
        this.model.game.players.reset(game.players);
      }).bind(this));
    },

    render: function() {
      this.$el.html(this.currentView.render().el);
    },

    handleLogin: function(info) {
      if (this.model.login(info)) {
        this.currentView = new LobbyView();
        this.render();
      }
    },

    setGame: function(game) {
      this.currentView = new GameView({model:clientState});
      this.render();
    },

    handleError: function(error) {
      this.currentView = new ErrorView({error:error.msg});
      this.render();
    }
  }
);

var LoginView = Backbone.View.extend(
  {
    initialize: function() {
      window.fbAsyncInit = function() {
        FB.init({
                  appId      : '326683484060385',
                  status     : true, // check login status
                  cookie     : true, // enable cookies to allow the server to access the session
                  xfbml      : true  // parse XFBML
                });
        FB.Event.subscribe('auth.statusChange', clientView.handleLogin);
      };
      (function(d){
         var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
         if (d.getElementById(id)) {return;}
         js = d.createElement('script'); js.id = id; js.async = true;
         js.src = "//connect.facebook.net/en_US/all.js";
         ref.parentNode.insertBefore(js, ref);
       }(document));
    },

    render: function() {
      this.$el.html(
        $('<div id="login_page" class="viewport center">' +
            '<br/>  <br/>  <br/>' +
            '<h1 class="center">The Resistance</h1>' +
            '<br/>  <br/>  <br/>' +
            '<div class="fb-login-button center"></div>' +
          '</div>')
      );
      return this;
    }

  }
);

var LobbyView = Backbone.View.extend(
  {
    initialize: function() {
      _(this).bindAll('updateGameList');
      this.games = new GamesList();
      this.gamesList = new GamesListView({collection:this.games});
      var me = this;
      socket.on('init', function(obj) {
        if (obj.user == null) {
          clientView.handleError({msg:"Init Failed"});
        }
        if (obj.game) {
          clientState.setGame(obj.game);
        } else {
          me.updateGameList(obj.game_list);
        }
      });
      socket.on('new_game', function(games) {
        me.updateGameList(games);
      });
      socket.on('delete_game', function(games) {
        me.updateGameList(games);
      });
      socket.on('join_game', function(game) {
        clientState.setGame(game);
      });
    },

    render: function() {
      this.$el.html(
        $('<div id="lobby_view" class="viewport center"></div>').append(
          $('<div class="game_info center title layer">Games Lobby</div>')
        ).append(
          this.gamesList.render().el
        ).append(
          $('<div id="new_game" class="button title layer accept full">New Game</div>').click(
            function(){
              socket.emit('new_game');
            })
        ));
      return this;
    },

    updateGameList: function(games) {
      this.games.reset(games);
    }
  }
);

var GamesList = Backbone.Collection.extend({
  model: Game
});

var GamesListView = CollectionView.extend({
  createView: function(game) {
    return new GameInfoView({model:game});
  }
});

GameInfoView = Backbone.View.extend({
  initialize: function() {
    _(this).bindAll('joinGame');
  },

  render: function() {
    this.$el.html('<div class="info_view"></div>').append(
      'players:' + this.model.get('players') +
      'id:' + this.model.get('id')
    ).click(this.joinGame);
  },

  joinGame: function() {
    socket.emit('join_game', this.model.get('id'));
  }
});

var ErrorView = Backbone.View.extend(
  {
    initialize: function() {
    },

    render: function() {
      this.$el.html(
        $('<div id="error_view" class="viewport center"></div>').append(
          $('<div class="error_state center title layer">Error</div>')
        ).append(
          $('<div class="title"></div>').html(this.options.error)
        ));
      return this;
    }
  }
);

$(document).ready(
  function() {
    clientState = new ClientState();
    clientView = new ClientView(
      {
        model: clientState,
        el: $('#root')
      });
});
