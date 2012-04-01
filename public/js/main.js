var socket = io.connect('http://localhost:8080');

var ClientView = Backbone.View.extend(
  {
    initialize: function() {
      _(this).bindAll('handleLogin');
      this.currentView = new LoginView({el:this.$el});
    },

    render: function() {
      this.currentView.render();
    },

    handleLogin: function(info) {
      this.model.login(info);
      this.currentView = new LobbyView({el:this.$el});
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
    render: function() {
      this.$el.html(
        $('<div id="lobby_view" class="viewport center"></div>').append(
          $('<div class="game_info center title layer">Game Lobby</div>'),
          $('<div id="lobby_games"></div>')
        )
      );
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
