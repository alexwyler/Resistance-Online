describe('FacepileView', function() {
  var FacepileView = require('views/FacepileView').FacepileView;
  var PlayerList = require('models/Player').PlayerList;
  var PLAYER_DB = require('mock/database').PLAYER_DB;

  given('a FacePileView', function() {
    beforeEach(function() {
      this.collection = new PlayerList(PLAYER_DB);
      this.view = new FacepileView({ collection: this.collection });
      document.body.appendChild(this.view.render().el);
    });
    afterEach(function() {
      this.view.remove();
    });

    then('the pictures are displayed', function() {
      expect(this.view.$('.person').length).toBe(this.collection.length);
      expect(this.view.$('img')[0].getAttribute('src'))
        .toBe(this.collection.at(0).get('profile_pic'));
    });

    when('one of the pictures changes', function() {
      beforeEach(function() {
        this.collection.at(0).set('profile_pic', 'http://graph.facebook.com/ry/picture?type=square');
      });

      then('the picture is updated', function() {
        expect(this.view.$('img')[0].getAttribute('src'))
          .toBe(this.collection.at(0).get('profile_pic'));
      });

    });
  });
});
