describe('CollectionView', function() {

  var DummyModel = Backbone.Model.extend({
  });

  var DummyCollection = Backbone.Collection.extend({
    model: DummyModel
  });

  var DummyView = Backbone.View.extend({
    render: function() {
      this.$el.html(this.model.cid);
    }
  });

  const PLACEHOLDER_TEXT = 'placeholder';
  var DummyPlaceholder = Backbone.View.extend({
    render: function() {
      this.$el.html(PLACEHOLDER_TEXT);
    }
  });

  var DummyCollectionView = CollectionView.extend({
    createView: function(model) {
      return new DummyView({
        model: model
      });
    },
    createPlaceholder: function() {
      return new DummyPlaceholder();
    }
  });

  given('an empty CollectionView', function() {
    beforeEach(function() {
      this.collection = new DummyCollection();
      this.view = new DummyCollectionView({
        collection: this.collection
      });
      $('body').append(this.view.render().el);
    });
    afterEach(function() {
      this.view.remove();
    });

    then('no items should be displayed', function() {
      expect(this.view.$('*').length).toBe(0);
    });

    when('1 item is added', function() {
      beforeEach(function() {
        this.collection.add({});
      });

      then('1 item should be displayed', function() {
        expect(this.view.$('*').length).toBe(1);
      });
    });

    when('2 items are added', function() {
      beforeEach(function() {
        this.collection.add([ {}, {} ]);
      });

      then('2 items should be displayed', function() {
        expect(this.view.$('*').length).toBe(2);
      });

      and('1 item is removed from the start', function() {
        beforeEach(function() {
          this.collection.remove(this.collection.at(0));
        });

        then('the 2nd item should be displayed', function() {
          expect(this.view.$('*').length).toBe(1);
          expect(this.view.$('*')[0].innerText)
          .toBe(this.collection.at(0).cid);
        });
      });

      and('1 item is removed from the end', function() {
        beforeEach(function() {
          this.collection.remove(this.collection.at(1));
        });

        then('the 1st item should be displayed', function() {
          expect(this.view.$('*').length).toBe(1);
          expect(this.view.$('*')[0].innerText)
          .toBe(this.collection.at(0).cid);
        });
      });

      and('the collection is reset to 3 new items', function() {
        beforeEach(function() {
          this.newModels = [ new DummyModel(), new DummyModel(), new DummyModel() ];
          this.collection.reset(this.newModels);
        });

        then('the new items should be displayed', function() {
          var elements = this.view.$('*');
          expect(elements.length).toBe(3);
          for (var i = 0; i < elements.length; i++) {
            expect(elements[i].innerText)
            .toBe(this.newModels[i].cid);
          }
        });
      });
    });
  });

  given('a CollectionView with 2 items', function() {
    beforeEach(function() {
      this.collection = new DummyCollection([ {}, {} ]);
      this.view = new DummyCollectionView({
        collection: this.collection
      });
      $('body').append(this.view.render().el);
    });
    afterEach(function() {
      this.view.remove();
    });

    then('2 items should be displayed', function() {
      expect(this.view.$('*').length).toBe(2);
    });
  });

  given('an empty CollectionView with 2 placeholders', function() {
    beforeEach(function() {
      this.collection = new DummyCollection();
      this.view = new DummyCollectionView({
        collection: this.collection,
        minimumSize: 2
      });
      $('body').append(this.view.render().el);
    });
    afterEach(function() {
      this.view.remove();
    });

    then('2 placeholders should be displayed', function() {
      var elements = this.view.$('*');
      expect(elements.length).toBe(2);
      for (var i = 0; i < elements.length; i++) {
        expect(elements[i].innerText)
        .toBe(PLACEHOLDER_TEXT);
      }
    });

    when('1 item is added', function() {
      beforeEach(function() {
        this.collection.add({});
      });

      then('1 item and 1 placeholder should be displayed', function() {
        var elements = this.view.$('*');
        expect(elements.length).toBe(2);
        expect(elements[0].innerText)
          .toBe(this.collection.at(0).cid);
        expect(elements[1].innerText)
          .toBe(PLACEHOLDER_TEXT);
      });
    });

    when('2 items are added', function() {
      beforeEach(function() {
        this.collection.add([ {}, {} ]);
      });

      then('the added items should be displayed', function() {
        var elements = this.view.$('*');
        expect(elements.length).toBe(2);
        for (var i = 0; i < elements.length; i++) {
          expect(elements[i].innerText)
            .toBe(this.collection.at(i).cid);
        }
      });

      and('1 item is removed from the end', function() {
        beforeEach(function() {
          this.collection.remove(this.collection.at(1));
        });

        then('1 item and 1 placeholder should be displayed', function() {
          var elements = this.view.$('*');
          expect(elements.length).toBe(2);
          expect(elements[0].innerText)
            .toBe(this.collection.at(0).cid);
          expect(elements[1].innerText)
            .toBe(PLACEHOLDER_TEXT);
        });
      });
    });

    when('the collection is reset', function() {
      beforeEach(function() {
        this.collection.reset();
      });

      then('2 placeholders should be displayed', function() {
        expect(this.view.$('*').length).toBe(2);
        var elements = this.view.$('*');
        for (var i = 0; i < elements.length; i++) {
          expect(elements[i].innerText)
          .toBe(PLACEHOLDER_TEXT);
        }
      });
    });

    when('the collection is reset to 1 new item', function() {
      beforeEach(function() {
        this.newModels = [ new DummyModel() ];
        this.collection.reset(this.newModels);
      });

      then('1 item and 1 placeholder should be displayed', function() {
        var elements = this.view.$('*');
        expect(elements.length).toBe(2);
        expect(elements[0].innerText)
          .toBe(this.collection.at(0).cid);
        expect(elements[1].innerText)
          .toBe(PLACEHOLDER_TEXT);
      });
    });

    when('the collection is reset to 3 new items', function() {
      beforeEach(function() {
        this.newModels = [ new DummyModel(), new DummyModel(), new DummyModel() ];
        this.collection.reset(this.newModels);
      });

      then('the added items should be displayed', function() {
        var elements = this.view.$('*');
        expect(elements.length).toBe(3);
        for (var i = 0; i < 3; i++) {
          expect(elements[i].innerText)
            .toBe(this.newModels[i].cid);
        }
      });
    });
  });
});
