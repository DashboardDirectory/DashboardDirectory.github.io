$(function($) {
  function guessUnit(tagName) {
    switch(tagName) {
      case 'TBODY':
      case 'TABLE':
        return 'tr';
      case 'OL':
      case 'UL':
        return 'li';
      case 'DIV':
        return 'div';
    }
    return undefined;
  }

  function search(query, searchIn, options) {
  	//$(searchIn).find(options.unit)
    $($.grep(searchIn, function(row) {
      var text;
      switch(options.criteria.constructor) {
        case Array:
          text = $.map(
            options.criteria,
            function(crit) { return $(row).find(crit).text(); }
          ).join(' ');
          break;
        case String:
          text = $(row).find(options.criteria).text();
          break;
        default:
          text = $(row).text();
          break;
      }
      $(row).show().data('domsearch.score', LiquidMetal.score(text, query));
      return $(row).data('domsearch.score') < options.minimumScore;
    })
    .sort(function(a, b) { return $(a).data('domsearch.score') < $(b).data('domsearch.score'); }))
      //.appendTo(searchIn)
      .hide();
  }
//re initialize on each filter
  function init(element, searchIn, options) {
    var target = $(searchIn),
      defaults = { unit: undefined, criteria: false, minimumScore: 0.5 },
      opts = $.extend(defaults, options);
    opts.unit = opts.unit || guessUnit(target[0].tagName);

    this.originalOrder = target.find(opts.unit);

    $(element).keydown(function(event) {
      if (event.keyCode == 9) return true; // TAB
      var field = $(this);
      setTimeout(
        function() {
          if (field.val() == '') {
            this.originalOrder.show();//.appendTo(target);
          } else {
          	//if originalOrder set then search in these ones          	
            search(field.val(), this.originalOrder, opts);//target[0]
          }
          if (typeof opts.onkeydown == 'function') opts.onkeydown(field);
        },
      100);
      return true;
    });
  }

  $.fn.sort       = function() { return this.pushStack([].sort.apply(this, arguments), []); };
  $.domsearch     = function(element, searchIn, options) { init(element, searchIn, options); };
  $.fn.domsearchClear = function() {if(originalOrder){originalOrder.show();} return this};
  $.fn.domsearch  = function(query, options) {
   // if (!$(this).data('domsearch.enabled')) {
   //   $(this).data('domsearch.enabled', true);
      return this.each(function() { new $.domsearch(this, query, options); });
   // }
  };
});