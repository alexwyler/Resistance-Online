var MISSION_SIZE = exports.MISSION_SIZE = {
   1 : [1, 1, 1, 1, 1],
   2 : [2, 2, 2, 2, 2],
   5 : [2, 3, 2, 3, 3],
   6 : [2, 3, 4, 3, 4],
   7 : [2, 3, 3, 4, 4],
   8 : [3, 4, 4, 5, 5],
   9 : [3, 4, 4, 5, 5],
  10 : [3, 4, 4, 5, 5]
};

var G_STATE = exports.G_STATE = {
  FINDING_PLAYERS : 'finding_players',
  NOT_READY : 'not_ready',
  FINISHED : 'finished'
};

var M_STATE = exports.M_STATE = {
  CHOOSING_MISSION : 'choosing_mission',
  VOTING : 'voting',
  MISSIONING : 'missioning',
  FINISHED : 'finished'
};

var MV_STATE = exports.MV_STATE = {
  UNKNOWN: 'unknown',
  FUTURE: 'future',
  WAITING_FOR_PEOPLE: 'waiting-for-people',
  CHOOSING_PEOPLE: 'choosing-people',
  VOTING: 'voting',
  ON_MISSION: 'on-mission',
  WAITING_FOR_RESULTS: 'waiting-for-results',
  SKIPPED: 'skipped',
  PASSED: 'passed',
  FAILED: 'failed'
};

var ROLE = exports.ROLE = {
  SPY : 'spy',
  RESISTANCE : 'resistance'
};

var U_STATE = exports.U_STATE = {
  SEARCHING : 'searching',
  NOT_READY : 'not_ready',
  READY : 'ready',
  PLAYING : 'playing'
};

var VOTE = exports.VOTE = {
  YES : 'yes',
  NO : 'no'
}

var ACTION = exports.ACTION = {
  PASS : 'pass',
  FAIL : 'fail'
}

var GameInfo = exports.GameInfo = {
  getMissionSize: function(mission) {
    var game_size = mission.game.players.length;
    var mission_number = mission.get('turn');
    return MISSION_SIZE[game_size][mission_number - 1];
  }
};

