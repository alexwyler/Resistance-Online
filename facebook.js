var crypto = require('crypto');

module.exports = {
  parse_fbsr : function(fbsr, app_secret) {
    fbsr = fbsr.split('.');
    var sig = fbsr[0];
    var data = JSON.parse(new Buffer(fbsr[1], 'base64').toString('ascii'));

    if (data.algorithm != 'HMAC-SHA256') {
      console.error('Unsupported algorithm ' + data.algorithm);
      return false;
    }

    var hmac = crypto.createHmac('sha256', app_secret);
    hmac.update(fbsr[1]);
    var digest = hmac.digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    if (sig != digest) {
      console.error('Signature mismatch!');
      console.error('found', sig);
      console.error('expec', digest);
      return false;
    }

    return data;
  }
};
