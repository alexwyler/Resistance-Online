describe('PlayerIconView', function() {
  var Player = require('models/Player').Player;
  var PlayerIconView = require('views/PlayerIconView').PlayerIconView;

  given('it is rendered', function() {
    beforeEach(function() {
      this.player = new Player({
        id: 693594821,
        name: 'Ryan',
        full_name: 'Ryan Patterson',
        profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/273581_693594821_24739666_q.jpg'
      });
      this.view = new PlayerIconView({ model: this.player });
      document.body.appendChild(this.view.render().el);
    });
    afterEach(function() {
      this.view.remove();
    });

    then('the picture is displayed', function() {
      expect(this.view.$('img')[0].getAttribute('src'))
        .toBe(this.player.get('profile_pic'));
    });

    then('the name is displayed', function() {
      expect(this.view.el.innerText)
        .toBe(' ' + this.player.get('name'));
    });

    when('the name changes', function() {
      beforeEach(function() {
        this.player.set('name', 'Boss');
      });

      then('the name is updated', function() {
        expect(this.view.el.innerText)
          .toBe(' ' + this.player.get('name'));
      });

    });
  });
});

