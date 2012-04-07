_.extend(window,
  { Backbone: require('./backbone-extensions') },
  require('./config'),
  require('./models/Mission'),
  require('./models/Player'),
  require('./models/Game'),
  require('./models/ClientState'),
  require('./views/CollectionView'),
  require('./views/PlayerIconView')
);
