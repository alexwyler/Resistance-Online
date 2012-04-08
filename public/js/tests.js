require('jasmine-extensions');

// Include specs
require('spec/index');

var jasmineEnv = jasmine.getEnv();
jasmineEnv.updateInterval = 1000;

var htmlReporter = new jasmine.HtmlReporter();

jasmineEnv.addReporter(htmlReporter);

jasmineEnv.specFilter = function(spec) {
  return htmlReporter.specFilter(spec);
};

$(document).ready(function() {
  jasmineEnv.execute();
});
