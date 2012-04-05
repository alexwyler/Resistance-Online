function makeExtension(name, prepend, extend) {
  jasmine.Env.prototype[name] = jasmine.Env.prototype[extend];
  jasmine.Env.prototype['x' + name] = jasmine.Env.prototype['x' + extend];

  return {
    enabled: function(description, specDefinitions) {
      var env = jasmine.getEnv();
      description = prepend ? prepend + description : description;

      return env[name](description, specDefinitions);
    },
    disabled: function(description, specDefinitions) {
      var env = jasmine.getEnv();
      description = prepend ? prepend + description : description;

      return env['x' + name](description, specDefinitions);
    }
  };
}

var Scenario = makeExtension('Scenario', '', 'describe');
var Given = makeExtension('Given', 'Given ', 'describe');
var When = makeExtension('When', 'When ', 'describe');
var And = makeExtension('And', ' and ', 'describe');
var Then = makeExtension('Then', 'then ', 'it');

// Make the extensions globally available

window.Scenario = window.scenario = Scenario.enabled;
window.Given = window.given = Given.enabled;
window.When = window.when = When.enabled;
window.And = window.and = And.enabled;
window.Then = window.then = Then.enabled;

window.xScenario = window.xscenario = Scenario.disabled;
window.xGiven = window.xgiven = Given.disabled;
window.xWhen = window.xwhen = When.disabled;
window.xAnd = window.xand = And.disabled;
window.xThen = window.xthen = Then.disabled;

// Add some new matchers
beforeEach(function() {
  this.addMatchers({
    toMatchSelector: function(selector) {
      var element = this.actual.el || this.actual;

      if (!(element instanceof HTMLElement)) {
        throw new Error("toMatchSelector was called without an element");
      }

      this.message = function() {
        return [
          'expected the following to be an element with ' +
            'selector "' + selector + '": ' + element.outerHTML,
          'expected the following not to be an element with ' +
            'selector "' + selector + '": ' + element.outerHTML
        ];
      };

      var set = element.querySelectorAll(selector);
      return set.length > 0 && set[0] == element;
    },
  });
});
