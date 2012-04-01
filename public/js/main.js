var ClientView = Backbone.View.extend(
  {
    initialize: function() {
      _(this).bindAll();
      this.currentView = new LoginView({el:this.$el});

      this.model.on('join_game', this.setGame);
      this.model.on('error', this.handleError);
    },

    render: function() {
      this.$el.html(this.currentView.render().el);
    },

    handleLogin: function(info) {
      if (this.model.login(info)) {
        this.currentView = new LobbyView({ model: this.model });
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

var LobbyView = Backbone.View.extend({
  events: {
    'click #new_game': 'newGame'
  },

  initialize: function() {
    _(this).bindAll('updateGameList');

    this.gamesList = new GameListView({ collection: this.model.allGames });
  },

  render: function() {
    this.$el.html([
      '<div id="lobby_view" class="viewport center">',
        '<div class="game_info center title layer">Games Lobby</div>',
        '<div id="new_game" class="button title layer accept full">New Game</div>',
      '</div>',
    ].join(''));

    this.$('#lobby_view').after(this.gamesList.render().el);
    return this;
  },

  newGame: function() {
    socket.emit('new_game');
  },

  updateGameList: function(games) {
    this.games.reset(games);
  }
});

var GameListView = CollectionView.extend({
  createView: function(game) {
    return new GameInfoView({ model: game });
  }
});

GameInfoView = Backbone.View.extend({
  className: 'info_view',

  events: {
    'click': 'joinGame'
  },

  initialize: function() {
    _(this).bindAll('joinGame');

    this._facepileView = new FacepileView({ collection: this.model.players });
  },

  render: function() {
    this.$el.html(
      'id:' + this.model.get('id')
    );
    this.$el.append(this._facepileView.render().el);
  },

  joinGame: function() {
    socket.emit('join_game', this.model.get('id'));
  }
});

var ErrorView = Backbone.View.extend(
  {
    render: function() {
      var template = [
        '<div id="error_view" class="viewport center">',
          '<div class="error_state center title layer">Error</div>',
          '<div class="title">{{error}}</div>',
        '</div>'
      ].join('');
      this.$el.html(Mustache.render(template, this.options));
      return this;
    }
  }
);

$(document).ready(
  function() {
    clientState = new ClientState();
    socket = createSocket(clientState);
    clientView = new ClientView( {
      model: clientState,
      el: $('#root')
    });
});
