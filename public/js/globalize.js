var _ = require('underscore')._;

// TODO autogen this?

_.extend(
  window,
  { Backbone: require('./backbone-extensions') },
  { Mustache: require('mustache') },
  { _: _ },
  require('./constants'),

  // models

  require('./models/Mission'),
  require('./models/Player'),
  require('./models/Game'),
  require('./models/ClientState'),
  require('./models/ClientAwareModel'),

  // views

  require('./views/CollectionView'),
  require('./views/PlayerIconView'),
  require('./views/FacepileView'),
  require('./views/MissionView'),
  require('./views/GameView'),
  require('./views/ClientView'),
  require('./views/LobbyView'),
  require('./views/GameListView'),
  require('./views/GameListingView'),
  require('./views/ErrorView'),
  require('./views/LoginView')
);
