var socket = io.connect('http://localhost:8080');

var ClientModel = Backbone.Model.extend(
  {
    defaults: {
      loggedIn: false,
      uid: null,
      currentGame: null,
    }
  }
);

var ClientView = Backbone.View.extend(
  {
    initialize: function() {
      this.currentView = new LoginView({el:$('body')});
    },

    render: function() {
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
        FB.Event.subscribe('auth.statusChange', initClient);
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
      this.$el.setContent(
        $('#login_page').addClass('viewport center').append(

        )
      );
    }
  }
);

var LobbyView = Backbone.View.extend(
  {    
  }
);

var PlayingView = Backbone.View.extend(
  {    
  }
);

$(document).ready(
  function() {
    var clientModel = new ClientModel();
    var clientView = new ClientView(
      {
        model: clientModel,
        el: $('body')
      });                    
});
