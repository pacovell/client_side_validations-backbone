(function() {
  var $,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $ = jQuery;

  $.fn.validate = function() {
    return this.filter('form[data-validate]').each(function() {
      var BackboneModel, BackboneView, backboneModel, backboneView, form, formId, settings;
      form = $(this);
      formId = form.attr('id');
      settings = window.ClientSideValidations.forms[formId];
      BackboneModel = ClientSideValidations.decorateModel(Backbone.Model.extend({
        url: '/users'
      }), formId, settings['model_name']);
      BackboneView = ClientSideValidations.decorateView(Backbone.View.extend({}));
      backboneModel = new BackboneModel();
      backboneView = new BackboneView({
        el: "#" + formId,
        model: backboneModel
      });
      window.ClientSideValidations.backboneModels[formId] = backboneModel;
      return window.ClientSideValidations.backboneViews[formId] = backboneView;
    });
  };

  window.ClientSideValidations = {
    models: {},
    forms: {},
    backboneModels: {},
    backboneViews: {},
    validators: {
      all: function() {
        return jQuery.extend({}, ClientSideValidations.validators.local, ClientSideValidations.validators.remote);
      },
      local: {
        presence: function(element, options) {
          if (/^\s*$/.test(element.val() || '')) return options.message;
        },
        acceptance: function(element, options) {
          var _ref;
          switch (element.attr('type')) {
            case 'checkbox':
              if (!element.attr('checked')) return options.message;
              break;
            case 'text':
              if (element.val() !== (((_ref = options.accept) != null ? _ref.toString() : void 0) || '1')) {
                return options.message;
              }
          }
        },
        format: function(element, options) {
          var message;
          message = this.presence(element, options);
          if (message) {
            if (options.allow_blank === true) return;
            return message;
          }
          if (options["with"] && !options["with"].test(element.val())) {
            return options.message;
          }
          if (options.without && options.without.test(element.val())) {
            return options.message;
          }
        },
        numericality: function(element, options) {
          var CHECKS, check, fn, operator;
          if (!/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d*)?$/.test(element.val())) {
            return options.messages.numericality;
          }
          if (options.only_integer && !/^[+-]?\d+$/.test(element.val())) {
            return options.messages.only_integer;
          }
          CHECKS = {
            greater_than: '>',
            greater_than_or_equal_to: '>=',
            equal_to: '==',
            less_than: '<',
            less_than_or_equal_to: '<='
          };
          for (check in CHECKS) {
            operator = CHECKS[check];
            if (!(options[check] != null)) continue;
            fn = new Function("return " + (element.val()) + " " + operator + " " + options[check]);
            if (!fn()) return options.messages[check];
          }
          if (options.odd && !(parseInt(element.val(), 10) % 2)) {
            return options.messages.odd;
          }
          if (options.even && (parseInt(element.val(), 10) % 2)) {
            return options.messages.even;
          }
        },
        length: function(element, options) {
          var CHECKS, blankOptions, check, fn, message, operator, tokenized_length, tokenizer;
          tokenizer = options.js_tokenizer || "split('')";
          tokenized_length = new Function('element', "return (element.val()." + tokenizer + " || '').length")(element);
          CHECKS = {
            is: '==',
            minimum: '>=',
            maximum: '<='
          };
          blankOptions = {};
          blankOptions.message = options.is ? options.messages.is : options.minimum ? options.messages.minimum : void 0;
          message = this.presence(element, blankOptions);
          if (message) {
            if (options.allow_blank === true) return;
            return message;
          }
          for (check in CHECKS) {
            operator = CHECKS[check];
            if (!options[check]) continue;
            fn = new Function("return " + tokenized_length + " " + operator + " " + options[check]);
            if (!fn()) return options.messages[check];
          }
        },
        exclusion: function(element, options) {
          var lower, message, o, upper, _ref;
          message = this.presence(element, options);
          if (message) {
            if (options.allow_blank === true) return;
            return message;
          }
          if (options["in"]) {
            if (_ref = element.val(), __indexOf.call((function() {
              var _i, _len, _ref2, _results;
              _ref2 = options["in"];
              _results = [];
              for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
                o = _ref2[_i];
                _results.push(o.toString());
              }
              return _results;
            })(), _ref) >= 0) {
              return options.message;
            }
          }
          if (options.range) {
            lower = options.range[0];
            upper = options.range[1];
            if (element.val() >= lower && element.val() <= upper) {
              return options.message;
            }
          }
        },
        inclusion: function(element, options) {
          var lower, message, o, upper, _ref;
          message = this.presence(element, options);
          if (message) {
            if (options.allow_blank === true) return;
            return message;
          }
          if (options["in"]) {
            if (_ref = element.val(), __indexOf.call((function() {
              var _i, _len, _ref2, _results;
              _ref2 = options["in"];
              _results = [];
              for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
                o = _ref2[_i];
                _results.push(o.toString());
              }
              return _results;
            })(), _ref) >= 0) {
              return;
            }
            return options.message;
          }
          if (options.range) {
            lower = options.range[0];
            upper = options.range[1];
            if (element.val() >= lower && element.val() <= upper) return;
            return options.message;
          }
        },
        confirmation: function(element, options) {
          if (element.val() !== jQuery("#" + (element.attr('id')) + "_confirmation").val()) {
            return options.message;
          }
        }
      },
      remote: {
        uniqueness: function(element, options) {
          var data, key, message, name, scope_value, scoped_element, scoped_name, _ref;
          message = ClientSideValidations.validators.local.presence(element, options);
          if (message) {
            if (options.allow_blank === true) return;
            return message;
          }
          data = {};
          data.case_sensitive = !!options.case_sensitive;
          if (options.id) data.id = options.id;
          if (options.scope) {
            data.scope = {};
            _ref = options.scope;
            for (key in _ref) {
              scope_value = _ref[key];
              scoped_name = element.attr('name').replace(/\[\w+\]$/, "[" + key + "]");
              scoped_element = jQuery("[name='" + scoped_name + "']");
              if (scoped_element[0] && scoped_element.val() !== scope_value) {
                data.scope[key] = scoped_element.val();
                scoped_element.unbind("change." + element.id).bind("change." + element.id, function() {
                  element.trigger('change');
                  return element.trigger('focusout');
                });
              } else {
                data.scope[key] = scope_value;
              }
            }
          }
          if (/_attributes\]/.test(element.attr('name'))) {
            name = element.attr('name').match(/\[\w+_attributes\]/g).pop().match(/\[(\w+)_attributes\]/).pop();
            name += /(\[\w+\])$/.exec(element.attr('name'))[1];
          } else {
            name = element.attr('name');
          }
          if (options['class']) name = options['class'] + '[' + name.split('[')[1];
          data[name] = element.val();
          if (jQuery.ajax({
            url: '/validators/uniqueness',
            data: data,
            async: false
          }).status === 200) {
            return options.message;
          }
        }
      }
    },
    formBuilders: {
      'ActionView::Helpers::FormBuilder': {
        add: function(element, settings, message) {
          var inputErrorField, label, labelErrorField;
          if (element.data('valid') !== false && !(jQuery("label.message[for='" + (element.attr('id')) + "']")[0] != null)) {
            inputErrorField = jQuery(settings.input_tag);
            labelErrorField = jQuery(settings.label_tag);
            label = jQuery("label[for='" + (element.attr('id')) + "']:not(.message)");
            if (element.attr('autofocus')) element.attr('autofocus', false);
            element.before(inputErrorField);
            inputErrorField.find('span#input_tag').replaceWith(element);
            inputErrorField.find('label.message').attr('for', element.attr('id'));
            labelErrorField.find('label.message').attr('for', element.attr('id'));
            label.replaceWith(labelErrorField);
            labelErrorField.find('label#label_tag').replaceWith(label);
          }
          return jQuery("label.message[for='" + (element.attr('id')) + "']").text(message);
        },
        remove: function(element, settings) {
          var errorFieldClass, inputErrorField, label, labelErrorField;
          errorFieldClass = jQuery(settings.input_tag).attr('class');
          inputErrorField = element.closest("." + errorFieldClass);
          label = jQuery("label[for='" + (element.attr('id')) + "']:not(.message)");
          labelErrorField = label.closest("." + errorFieldClass);
          if (inputErrorField[0]) {
            inputErrorField.find("#" + (element.attr('id'))).detach();
            inputErrorField.replaceWith(element);
            label.detach();
            return labelErrorField.replaceWith(label);
          }
        }
      }
    },
    decorateModel: function(TargetModel, formName, modelName) {
      var originalValidate;
      TargetModel.prototype._csvFormName = formName;
      TargetModel.prototype._csvModelName = modelName;
      originalValidate = TargetModel.prototype.validate;
      TargetModel.prototype.validate = function(attrs) {
        var attr, attribute_validators, context, element, errors, fn, kind, message, settings, valid, validators, value, _i, _len, _ref;
        if (originalValidate) {
          errors = originalValidate.call(this, attrs);
          if (errors) return errors;
        }
        settings = ClientSideValidations.forms[formName];
        validators = settings.validators;
        errors = {};
        valid = true;
        for (attr in attrs) {
          value = attrs[attr];
          attribute_validators = validators[attr];
          _ref = [ClientSideValidations.validators.local, ClientSideValidations.validators.remote];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            context = _ref[_i];
            if (!errors.length) {
              for (kind in context) {
                fn = context[kind];
                if (attribute_validators != null ? attribute_validators[kind] : void 0) {
                  element = {
                    attr: function(a) {
                      return {
                        name: attr
                      }[a];
                    },
                    val: function() {
                      return value;
                    }
                  };
                  message = fn.call(context, element, attribute_validators[kind]);
                  if (message) {
                    valid = false;
                    errors[attr] = message;
                  }
                }
              }
            }
          }
        }
        if (!valid) return errors;
      };
      return TargetModel;
    },
    decorateView: function(TargetView) {
      var attrNameToKey, events, key, keyToAttrName, originalInitialize, value, _ref;
      events = {
        'submit': '_csvUpdateAllInputsAndSubmit',
        'focusout input:enabled:not(:radio)': '_csvUpdateInput',
        'change input:enabled:not(:radio)': '_csvUpdateInput',
        'click :checkbox': '_csvUpdateCheckbox'
      };
      _ref = TargetView.prototype.events;
      for (key in _ref) {
        value = _ref[key];
        events[key] = value;
      }
      TargetView.prototype.events = events;
      originalInitialize = TargetView.prototype.initialize;
      TargetView.prototype.initialize = function() {
        var _ref2, _ref3,
          _this = this;
        if (originalInitialize) originalInitialize.apply(this, arguments);
        this.changed = {};
        if ((_ref2 = this.model) != null) {
          _ref2.bind('change', function(model) {
            return jQuery(_this.el).find('input:enabled').each(function(index, element) {
              return _this._csvRemoveError(jQuery(element));
            });
          }, this);
        }
        if ((_ref3 = this.model) != null) {
          _ref3.bind('error', function(model, errors) {
            var key, message, _results;
            _results = [];
            for (key in errors) {
              message = errors[key];
              if (_this.changed[key]) {
                _results.push(_this._csvAddError(jQuery(_this.el).find("[name='" + (keyToAttrName(key, _this.model._csvModelName)) + "']"), message));
              }
            }
            return _results;
          }, this);
        }
        if (!this.model) {
          return typeof console !== "undefined" && console !== null ? console.log("model must be provided for ClientSideValidation Backbone Views") : void 0;
        }
      };
      TargetView.prototype._csvUpdateInput = function(event) {
        var attr_name, key, update, value, _ref2;
        attr_name = attrNameToKey(event.target);
        if (event.type === 'focusout') this.changed[attr_name] = true;
        update = {};
        _ref2 = this.model.attributes;
        for (key in _ref2) {
          value = _ref2[key];
          update[key] = value;
        }
        update[attr_name] = jQuery(event.target).val();
        return this.model.set(update);
      };
      TargetView.prototype._csvUpdateCheckbox = function(event) {
        return typeof console !== "undefined" && console !== null ? console.log("CHECKBOX COMING SOON") : void 0;
      };
      TargetView.prototype._csvUpdateAllInputsAndSubmit = function(event) {
        var key, update, value, _ref2, _ref3,
          _this = this;
        update = {};
        _ref3 = (_ref2 = this.model) != null ? _ref2.attributes : void 0;
        for (key in _ref3) {
          value = _ref3[key];
          update[key] = value;
        }
        jQuery(this.el).find('input:enabled').each(function(index, input) {
          var attr_name;
          attr_name = attrNameToKey(input);
          _this.changed[attr_name] = true;
          return update[attr_name] = jQuery(input).val();
        });
        this.model.save(update, {
          success: function() {
            return _this.trigger('success');
          }
        });
        return false;
      };
      TargetView.prototype._csvAddError = function(element, message) {
        var settings;
        settings = window.ClientSideValidations.forms[this.model._csvFormName];
        return ClientSideValidations.formBuilders[settings.type].add(element, settings, message);
      };
      TargetView.prototype._csvRemoveError = function(element) {
        var settings;
        settings = window.ClientSideValidations.forms[this.model._csvFormName];
        return ClientSideValidations.formBuilders[settings.type].remove(element, settings);
      };
      attrNameToKey = function(element) {
        var _ref2, _ref3;
        return (_ref2 = jQuery(element).attr('name')) != null ? (_ref3 = _ref2.match(/\[([^\]]+)\]/)) != null ? _ref3[1] : void 0 : void 0;
      };
      keyToAttrName = function(attr_name, scope) {
        if (scope == null) scope = "";
        if (scope.length) {
          return "" + scope + "[" + attr_name + "]";
        } else {
          return "" + attr_name;
        }
      };
      return TargetView;
    }
  };

}).call(this);
