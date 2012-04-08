var CollectionView = require('./CollectionView').CollectionView;
var GameListingView = require('./GameListingView').GameListingView;

exports.GameListView = CollectionView.extend({
  createView: function(game) {
    return new GameListingView({
      model: game,
      clientState: this.options.clientState
    });
  }
});
