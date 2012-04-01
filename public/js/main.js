var socket = io.connect('http://localhost:8080');

var ClientView = Backbone.View.extend(
  {
    initialize: function() {
      _(this).bindAll('handleLogin', 'handleError');
      this.currentView = new LoginView({el:this.$el});

      socket.on('error', function(err){
        clientView.handleError(err);
      });
    },

    render: function() {
      this.currentView.render();
    },

    handleLogin: function(info) {
      this.model.login(info);
      this.currentView = new LobbyView({el:this.$el});
      this.currentView.render();
    },

    setGame: function(game) {
      debugger;
      this.currentView = new PlayingView({el:this.$el, model:new Game(game)});
      this.currentView.render();
    },

    handleError: function(error) {
      this.currentView = new ErrorView({el:this.$el, error:error.msg});
      this.currentView.render();
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
    }

  }
);

var LobbyView = Backbone.View.extend(
  {    
    initialize: function() {
      this.games = new Array();
      socket.on('new_game', function(state) {
        debugger;
      });
      socket.on('delete_game', function(state) {
        debugger;
      });
    },

    render: function() {
      this.$el.html(
        $('<div id="lobby_view" class="viewport center"></div>').append(
          $('<div class="game_info center title layer">Game Lobby</div>')
        ).append(
          $('<div id="lobby_games"></div>')
        ).append(
          $('<div id="new_game" class="button title layer accept full">New Game</div>').click(
            function(){
              socket.emit('new_game');
              socket.on('join_game', function(game) {
                debugger;
                clientView.setGame(game);
              });
            })
        ));
    }
  }
);

var ErrorView = Backbone.View.extend(
  {    
    initialize: function() {
      _(this).bindAll('render');
    },
    
    render: function() {
      this.$el.html(
        $('<div id="error_view" class="viewport center"></div>').append(
          $('<div class="error_state center title layer">Error</div>')
        ).append(
          $('<div class="title"></div>').html(this.options.error)
        ));
    }
  }
);

var PlayingView = Backbone.View.extend(
  {    
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
    clientView.render();
});
