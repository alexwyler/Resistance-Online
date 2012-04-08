var RosterView = CollectionView.extend({
  tagName: 'ul',
  className: 'roster_view',

  createView: function(player) {
    return new PlayerIconView({
      model: player,
      tagName: 'li'
    });
  },

  createPlaceholder: function() {
    return new PlayerIconView({
      model: new Player(),
      tagName: 'li'
    });
  }
});
