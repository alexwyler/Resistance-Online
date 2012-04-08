_.extend(window,
  { Backbone: require('./backbone-extensions') },
  { Mustache: require('mustache') },
  require('./config'),
  require('./models/Mission'),
  require('./models/Player'),
  require('./models/Game'),
  require('./models/ClientState'),
  require('./views/CollectionView'),
  require('./views/PlayerIconView'),
  require('./views/FacepileView'),
  require('./views/MissionView')
);
