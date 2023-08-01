(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global wpforms_gutenberg_form_selector, Choices */
/* jshint es3: false, esversion: 6 */

'use strict';

/**
 * Gutenberg editor block.
 *
 * @since 1.8.1
 */
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i.return && (_r = _i.return(), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
var WPForms = window.WPForms || {};
WPForms.FormSelector = WPForms.FormSelector || function (document, window, $) {
  var _wp = wp,
    _wp$serverSideRender = _wp.serverSideRender,
    ServerSideRender = _wp$serverSideRender === void 0 ? wp.components.ServerSideRender : _wp$serverSideRender;
  var _wp$element = wp.element,
    createElement = _wp$element.createElement,
    Fragment = _wp$element.Fragment,
    useState = _wp$element.useState;
  var registerBlockType = wp.blocks.registerBlockType;
  var _ref = wp.blockEditor || wp.editor,
    InspectorControls = _ref.InspectorControls,
    InspectorAdvancedControls = _ref.InspectorAdvancedControls,
    PanelColorSettings = _ref.PanelColorSettings;
  var _wp$components = wp.components,
    SelectControl = _wp$components.SelectControl,
    ToggleControl = _wp$components.ToggleControl,
    PanelBody = _wp$components.PanelBody,
    Placeholder = _wp$components.Placeholder,
    Flex = _wp$components.Flex,
    FlexBlock = _wp$components.FlexBlock,
    __experimentalUnitControl = _wp$components.__experimentalUnitControl,
    TextareaControl = _wp$components.TextareaControl,
    Button = _wp$components.Button,
    Modal = _wp$components.Modal;
  var _wpforms_gutenberg_fo = wpforms_gutenberg_form_selector,
    strings = _wpforms_gutenberg_fo.strings,
    defaults = _wpforms_gutenberg_fo.defaults,
    sizes = _wpforms_gutenberg_fo.sizes;
  var defaultStyleSettings = defaults;

  /**
   * Blocks runtime data.
   *
   * @since 1.8.1
   *
   * @type {object}
   */
  var blocks = {};

  /**
   * Whether it is needed to trigger server rendering.
   *
   * @since 1.8.1
   *
   * @type {boolean}
   */
  var triggerServerRender = true;

  /**
   * Public functions and properties.
   *
   * @since 1.8.1
   *
   * @type {object}
   */
  var app = {
    /**
     * Start the engine.
     *
     * @since 1.8.1
     */
    init: function init() {
      app.initDefaults();
      app.registerBlock();
      $(app.ready);
    },
    /**
     * Document ready.
     *
     * @since 1.8.1
     */
    ready: function ready() {
      app.events();
    },
    /**
     * Events.
     *
     * @since 1.8.1
     */
    events: function events() {
      $(window).on('wpformsFormSelectorEdit', _.debounce(app.blockEdit, 250)).on('wpformsFormSelectorFormLoaded', _.debounce(app.formLoaded, 250));
    },
    /**
     * Register block.
     *
     * @since 1.8.1
     */
    registerBlock: function registerBlock() {
      registerBlockType('wpforms/form-selector', {
        title: strings.title,
        description: strings.description,
        icon: app.getIcon(),
        keywords: strings.form_keywords,
        category: 'widgets',
        attributes: app.getBlockAttributes(),
        example: {
          attributes: {
            preview: true
          }
        },
        edit: function edit(props) {
          var attributes = props.attributes;
          var formOptions = app.getFormOptions();
          var sizeOptions = app.getSizeOptions();
          var handlers = app.getSettingsFieldsHandlers(props);

          // Store block clientId in attributes.
          if (!attributes.clientId) {
            // We just want client ID to update once.
            // The block editor doesn't have a fixed block ID, so we need to get it on the initial load, but only once.
            props.setAttributes({
              clientId: props.clientId
            });
          }

          // Main block settings.
          var jsx = [app.jsxParts.getMainSettings(attributes, handlers, formOptions)];

          // Form style settings & block content.
          if (attributes.formId) {
            jsx.push(app.jsxParts.getStyleSettings(attributes, handlers, sizeOptions), app.jsxParts.getAdvancedSettings(attributes, handlers), app.jsxParts.getBlockFormContent(props));
            handlers.updateCopyPasteContent();
            $(window).trigger('wpformsFormSelectorEdit', [props]);
            return jsx;
          }

          // Block preview picture.
          if (attributes.preview) {
            jsx.push(app.jsxParts.getBlockPreview());
            return jsx;
          }

          // Block placeholder (form selector).
          jsx.push(app.jsxParts.getBlockPlaceholder(props.attributes, handlers, formOptions));
          return jsx;
        },
        save: function save() {
          return null;
        }
      });
    },
    /**
     * Init default style settings.
     *
     * @since 1.8.1
     */
    initDefaults: function initDefaults() {
      ['formId', 'copyPasteJsonValue'].forEach(function (key) {
        return delete defaultStyleSettings[key];
      });
    },
    /**
     * Block JSX parts.
     *
     * @since 1.8.1
     *
     * @type {object}
     */
    jsxParts: {
      /**
       * Get main settings JSX code.
       *
       * @since 1.8.1
       *
       * @param {object} attributes  Block attributes.
       * @param {object} handlers    Block event handlers.
       * @param {object} formOptions Form selector options.
       *
       * @returns {JSX.Element} Main setting JSX code.
       */
      getMainSettings: function getMainSettings(attributes, handlers, formOptions) {
        return /*#__PURE__*/React.createElement(InspectorControls, {
          key: "wpforms-gutenberg-form-selector-inspector-main-settings"
        }, /*#__PURE__*/React.createElement(PanelBody, {
          className: "wpforms-gutenberg-panel",
          title: strings.form_settings
        }, /*#__PURE__*/React.createElement(SelectControl, {
          label: strings.form_selected,
          value: attributes.formId,
          options: formOptions,
          onChange: function onChange(value) {
            return handlers.attrChange('formId', value);
          }
        }), /*#__PURE__*/React.createElement(ToggleControl, {
          label: strings.show_title,
          checked: attributes.displayTitle,
          onChange: function onChange(value) {
            return handlers.attrChange('displayTitle', value);
          }
        }), /*#__PURE__*/React.createElement(ToggleControl, {
          label: strings.show_description,
          checked: attributes.displayDesc,
          onChange: function onChange(value) {
            return handlers.attrChange('displayDesc', value);
          }
        }), /*#__PURE__*/React.createElement("p", {
          className: "wpforms-gutenberg-panel-notice"
        }, /*#__PURE__*/React.createElement("strong", null, strings.panel_notice_head), strings.panel_notice_text, /*#__PURE__*/React.createElement("a", {
          href: strings.panel_notice_link,
          rel: "noreferrer",
          target: "_blank"
        }, strings.panel_notice_link_text))));
      },
      /**
       * Get Field styles JSX code.
       *
       * @since 1.8.1
       *
       * @param {object} attributes  Block attributes.
       * @param {object} handlers    Block event handlers.
       * @param {object} sizeOptions Size selector options.
       *
       * @returns {JSX.Element} Field styles JSX code.
       */
      getFieldStyles: function getFieldStyles(attributes, handlers, sizeOptions) {
        // eslint-disable-line max-lines-per-function

        return /*#__PURE__*/React.createElement(PanelBody, {
          className: app.getPanelClass(attributes),
          title: strings.field_styles
        }, /*#__PURE__*/React.createElement("p", {
          className: "wpforms-gutenberg-panel-notice wpforms-use-modern-notice"
        }, /*#__PURE__*/React.createElement("strong", null, strings.use_modern_notice_head), strings.use_modern_notice_text, " ", /*#__PURE__*/React.createElement("a", {
          href: strings.use_modern_notice_link,
          rel: "noreferrer",
          target: "_blank"
        }, strings.learn_more)), /*#__PURE__*/React.createElement("p", {
          className: "wpforms-gutenberg-panel-notice wpforms-warning wpforms-lead-form-notice",
          style: {
            display: 'none'
          }
        }, /*#__PURE__*/React.createElement("strong", null, strings.lead_forms_panel_notice_head), strings.lead_forms_panel_notice_text), /*#__PURE__*/React.createElement(Flex, {
          gap: 4,
          align: "flex-start",
          className: 'wpforms-gutenberg-form-selector-flex',
          justify: "space-between"
        }, /*#__PURE__*/React.createElement(FlexBlock, null, /*#__PURE__*/React.createElement(SelectControl, {
          label: strings.size,
          value: attributes.fieldSize,
          options: sizeOptions,
          onChange: function onChange(value) {
            return handlers.styleAttrChange('fieldSize', value);
          }
        })), /*#__PURE__*/React.createElement(FlexBlock, null, /*#__PURE__*/React.createElement(__experimentalUnitControl, {
          label: strings.border_radius,
          value: attributes.fieldBorderRadius,
          isUnitSelectTabbable: true,
          onChange: function onChange(value) {
            return handlers.styleAttrChange('fieldBorderRadius', value);
          }
        }))), /*#__PURE__*/React.createElement("div", {
          className: "wpforms-gutenberg-form-selector-color-picker"
        }, /*#__PURE__*/React.createElement("div", {
          className: "wpforms-gutenberg-form-selector-control-label"
        }, strings.colors), /*#__PURE__*/React.createElement(PanelColorSettings, {
          __experimentalIsRenderedInSidebar: true,
          enableAlpha: true,
          showTitle: false,
          className: "wpforms-gutenberg-form-selector-color-panel",
          colorSettings: [{
            value: attributes.fieldBackgroundColor,
            onChange: function onChange(value) {
              return handlers.styleAttrChange('fieldBackgroundColor', value);
            },
            label: strings.background
          }, {
            value: attributes.fieldBorderColor,
            onChange: function onChange(value) {
              return handlers.styleAttrChange('fieldBorderColor', value);
            },
            label: strings.border
          }, {
            value: attributes.fieldTextColor,
            onChange: function onChange(value) {
              return handlers.styleAttrChange('fieldTextColor', value);
            },
            label: strings.text
          }]
        })));
      },
      /**
       * Get Label styles JSX code.
       *
       * @since 1.8.1
       *
       * @param {object} attributes  Block attributes.
       * @param {object} handlers    Block event handlers.
       * @param {object} sizeOptions Size selector options.
       *
       * @returns {JSX.Element} Label styles JSX code.
       */
      getLabelStyles: function getLabelStyles(attributes, handlers, sizeOptions) {
        return /*#__PURE__*/React.createElement(PanelBody, {
          className: app.getPanelClass(attributes),
          title: strings.label_styles
        }, /*#__PURE__*/React.createElement(SelectControl, {
          label: strings.size,
          value: attributes.labelSize,
          className: "wpforms-gutenberg-form-selector-fix-bottom-margin",
          options: sizeOptions,
          onChange: function onChange(value) {
            return handlers.styleAttrChange('labelSize', value);
          }
        }), /*#__PURE__*/React.createElement("div", {
          className: "wpforms-gutenberg-form-selector-color-picker"
        }, /*#__PURE__*/React.createElement("div", {
          className: "wpforms-gutenberg-form-selector-control-label"
        }, strings.colors), /*#__PURE__*/React.createElement(PanelColorSettings, {
          __experimentalIsRenderedInSidebar: true,
          enableAlpha: true,
          showTitle: false,
          className: "wpforms-gutenberg-form-selector-color-panel",
          colorSettings: [{
            value: attributes.labelColor,
            onChange: function onChange(value) {
              return handlers.styleAttrChange('labelColor', value);
            },
            label: strings.label
          }, {
            value: attributes.labelSublabelColor,
            onChange: function onChange(value) {
              return handlers.styleAttrChange('labelSublabelColor', value);
            },
            label: strings.sublabel_hints.replace('&amp;', '&')
          }, {
            value: attributes.labelErrorColor,
            onChange: function onChange(value) {
              return handlers.styleAttrChange('labelErrorColor', value);
            },
            label: strings.error_message
          }]
        })));
      },
      /**
       * Get Button styles JSX code.
       *
       * @since 1.8.1
       *
       * @param {object} attributes  Block attributes.
       * @param {object} handlers    Block event handlers.
       * @param {object} sizeOptions Size selector options.
       *
       * @returns {JSX.Element}  Button styles JSX code.
       */
      getButtonStyles: function getButtonStyles(attributes, handlers, sizeOptions) {
        return /*#__PURE__*/React.createElement(PanelBody, {
          className: app.getPanelClass(attributes),
          title: strings.button_styles
        }, /*#__PURE__*/React.createElement(Flex, {
          gap: 4,
          align: "flex-start",
          className: 'wpforms-gutenberg-form-selector-flex',
          justify: "space-between"
        }, /*#__PURE__*/React.createElement(FlexBlock, null, /*#__PURE__*/React.createElement(SelectControl, {
          label: strings.size,
          value: attributes.buttonSize,
          options: sizeOptions,
          onChange: function onChange(value) {
            return handlers.styleAttrChange('buttonSize', value);
          }
        })), /*#__PURE__*/React.createElement(FlexBlock, null, /*#__PURE__*/React.createElement(__experimentalUnitControl, {
          onChange: function onChange(value) {
            return handlers.styleAttrChange('buttonBorderRadius', value);
          },
          label: strings.border_radius,
          isUnitSelectTabbable: true,
          value: attributes.buttonBorderRadius
        }))), /*#__PURE__*/React.createElement("div", {
          className: "wpforms-gutenberg-form-selector-color-picker"
        }, /*#__PURE__*/React.createElement("div", {
          className: "wpforms-gutenberg-form-selector-control-label"
        }, strings.colors), /*#__PURE__*/React.createElement(PanelColorSettings, {
          __experimentalIsRenderedInSidebar: true,
          enableAlpha: true,
          showTitle: false,
          className: "wpforms-gutenberg-form-selector-color-panel",
          colorSettings: [{
            value: attributes.buttonBackgroundColor,
            onChange: function onChange(value) {
              return handlers.styleAttrChange('buttonBackgroundColor', value);
            },
            label: strings.background
          }, {
            value: attributes.buttonTextColor,
            onChange: function onChange(value) {
              return handlers.styleAttrChange('buttonTextColor', value);
            },
            label: strings.text
          }]
        }), /*#__PURE__*/React.createElement("div", {
          className: "wpforms-gutenberg-form-selector-legend wpforms-button-color-notice"
        }, strings.button_color_notice)));
      },
      /**
       * Get style settings JSX code.
       *
       * @since 1.8.1
       *
       * @param {object} attributes  Block attributes.
       * @param {object} handlers    Block event handlers.
       * @param {object} sizeOptions Size selector options.
       *
       * @returns {JSX.Element} Inspector controls JSX code.
       */
      getStyleSettings: function getStyleSettings(attributes, handlers, sizeOptions) {
        return /*#__PURE__*/React.createElement(InspectorControls, {
          key: "wpforms-gutenberg-form-selector-style-settings"
        }, app.jsxParts.getFieldStyles(attributes, handlers, sizeOptions), app.jsxParts.getLabelStyles(attributes, handlers, sizeOptions), app.jsxParts.getButtonStyles(attributes, handlers, sizeOptions));
      },
      /**
       * Get advanced settings JSX code.
       *
       * @since 1.8.1
       *
       * @param {object} attributes Block attributes.
       * @param {object} handlers   Block event handlers.
       *
       * @returns {JSX.Element} Inspector advanced controls JSX code.
       */
      getAdvancedSettings: function getAdvancedSettings(attributes, handlers) {
        var _useState = useState(false),
          _useState2 = _slicedToArray(_useState, 2),
          isOpen = _useState2[0],
          setOpen = _useState2[1];
        var openModal = function openModal() {
          return setOpen(true);
        };
        var closeModal = function closeModal() {
          return setOpen(false);
        };
        return /*#__PURE__*/React.createElement(InspectorAdvancedControls, null, /*#__PURE__*/React.createElement("div", {
          className: app.getPanelClass(attributes)
        }, /*#__PURE__*/React.createElement(TextareaControl, {
          label: strings.copy_paste_settings,
          rows: "4",
          spellCheck: "false",
          value: attributes.copyPasteJsonValue,
          onChange: function onChange(value) {
            return handlers.pasteSettings(value);
          }
        }), /*#__PURE__*/React.createElement("div", {
          className: "wpforms-gutenberg-form-selector-legend",
          dangerouslySetInnerHTML: {
            __html: strings.copy_paste_notice
          }
        }), /*#__PURE__*/React.createElement(Button, {
          className: "wpforms-gutenberg-form-selector-reset-button",
          onClick: openModal
        }, strings.reset_style_settings)), isOpen && /*#__PURE__*/React.createElement(Modal, {
          className: "wpforms-gutenberg-modal",
          title: strings.reset_style_settings,
          onRequestClose: closeModal
        }, /*#__PURE__*/React.createElement("p", null, strings.reset_settings_confirm_text), /*#__PURE__*/React.createElement(Flex, {
          gap: 3,
          align: "center",
          justify: "flex-end"
        }, /*#__PURE__*/React.createElement(Button, {
          isSecondary: true,
          onClick: closeModal
        }, strings.btn_no), /*#__PURE__*/React.createElement(Button, {
          isPrimary: true,
          onClick: function onClick() {
            closeModal();
            handlers.resetSettings();
          }
        }, strings.btn_yes_reset))));
      },
      /**
       * Get block content JSX code.
       *
       * @since 1.8.1
       *
       * @param {object} props Block properties.
       *
       * @returns {JSX.Element} Block content JSX code.
       */
      getBlockFormContent: function getBlockFormContent(props) {
        if (triggerServerRender) {
          return /*#__PURE__*/React.createElement(ServerSideRender, {
            key: "wpforms-gutenberg-form-selector-server-side-renderer",
            block: "wpforms/form-selector",
            attributes: props.attributes
          });
        }
        var clientId = props.clientId;
        var block = app.getBlockContainer(props);

        // In the case of empty content, use server side renderer.
        // This happens when the block is duplicated or converted to a reusable block.
        if (!block || !block.innerHTML) {
          triggerServerRender = true;
          return app.jsxParts.getBlockFormContent(props);
        }
        blocks[clientId] = blocks[clientId] || {};
        blocks[clientId].blockHTML = block.innerHTML;
        blocks[clientId].loadedFormId = props.attributes.formId;
        return /*#__PURE__*/React.createElement(Fragment, {
          key: "wpforms-gutenberg-form-selector-fragment-form-html"
        }, /*#__PURE__*/React.createElement("div", {
          dangerouslySetInnerHTML: {
            __html: blocks[clientId].blockHTML
          }
        }));
      },
      /**
       * Get block preview JSX code.
       *
       * @since 1.8.1
       *
       * @returns {JSX.Element} Block preview JSX code.
       */
      getBlockPreview: function getBlockPreview() {
        return /*#__PURE__*/React.createElement(Fragment, {
          key: "wpforms-gutenberg-form-selector-fragment-block-preview"
        }, /*#__PURE__*/React.createElement("img", {
          src: wpforms_gutenberg_form_selector.block_preview_url,
          style: {
            width: '100%'
          }
        }));
      },
      /**
       * Get block placeholder (form selector) JSX code.
       *
       * @since 1.8.1
       *
       * @param {object} attributes  Block attributes.
       * @param {object} handlers    Block event handlers.
       * @param {object} formOptions Form selector options.
       *
       * @returns {JSX.Element} Block placeholder JSX code.
       */
      getBlockPlaceholder: function getBlockPlaceholder(attributes, handlers, formOptions) {
        return /*#__PURE__*/React.createElement(Placeholder, {
          key: "wpforms-gutenberg-form-selector-wrap",
          className: "wpforms-gutenberg-form-selector-wrap"
        }, /*#__PURE__*/React.createElement("img", {
          src: wpforms_gutenberg_form_selector.logo_url
        }), /*#__PURE__*/React.createElement("h3", null, strings.title), /*#__PURE__*/React.createElement(SelectControl, {
          key: "wpforms-gutenberg-form-selector-select-control",
          value: attributes.formId,
          options: formOptions,
          onChange: function onChange(value) {
            return handlers.attrChange('formId', value);
          }
        }));
      }
    },
    /**
     * Get Style Settings panel class.
     *
     * @since 1.8.1
     *
     * @param {object} attributes Block attributes.
     *
     * @returns {string} Style Settings panel class.
     */
    getPanelClass: function getPanelClass(attributes) {
      var cssClass = 'wpforms-gutenberg-panel wpforms-block-settings-' + attributes.clientId;
      if (!app.isFullStylingEnabled()) {
        cssClass += ' disabled_panel';
      }
      return cssClass;
    },
    /**
     * Determine whether the full styling is enabled.
     *
     * @since 1.8.1
     *
     * @returns {boolean} Whether the full styling is enabled.
     */
    isFullStylingEnabled: function isFullStylingEnabled() {
      return wpforms_gutenberg_form_selector.is_modern_markup && wpforms_gutenberg_form_selector.is_full_styling;
    },
    /**
     * Get block container DOM element.
     *
     * @since 1.8.1
     *
     * @param {object} props Block properties.
     *
     * @returns {Element} Block container.
     */
    getBlockContainer: function getBlockContainer(props) {
      var blockSelector = "#block-".concat(props.clientId, " > div");
      var block = document.querySelector(blockSelector);

      // For FSE / Gutenberg plugin we need to take a look inside the iframe.
      if (!block) {
        var editorCanvas = document.querySelector('iframe[name="editor-canvas"]');
        block = editorCanvas && editorCanvas.contentWindow.document.querySelector(blockSelector);
      }
      return block;
    },
    /**
     * Get settings fields event handlers.
     *
     * @since 1.8.1
     *
     * @param {object} props Block properties.
     *
     * @returns {object} Object that contains event handlers for the settings fields.
     */
    getSettingsFieldsHandlers: function getSettingsFieldsHandlers(props) {
      // eslint-disable-line max-lines-per-function

      return {
        /**
         * Field style attribute change event handler.
         *
         * @since 1.8.1
         *
         * @param {string} attribute Attribute name.
         * @param {string} value     New attribute value.
         */
        styleAttrChange: function styleAttrChange(attribute, value) {
          var block = app.getBlockContainer(props),
            container = block.querySelector("#wpforms-".concat(props.attributes.formId)),
            property = attribute.replace(/[A-Z]/g, function (letter) {
              return "-".concat(letter.toLowerCase());
            }),
            setAttr = {};
          if (container) {
            switch (property) {
              case 'field-size':
              case 'label-size':
              case 'button-size':
                for (var key in sizes[property][value]) {
                  container.style.setProperty("--wpforms-".concat(property, "-").concat(key), sizes[property][value][key]);
                }
                break;
              default:
                container.style.setProperty("--wpforms-".concat(property), value);
            }
          }
          setAttr[attribute] = value;
          props.setAttributes(setAttr);
          triggerServerRender = false;
          this.updateCopyPasteContent();
          $(window).trigger('wpformsFormSelectorStyleAttrChange', [block, props, attribute, value]);
        },
        /**
         * Field regular attribute change event handler.
         *
         * @since 1.8.1
         *
         * @param {string} attribute Attribute name.
         * @param {string} value     New attribute value.
         */
        attrChange: function attrChange(attribute, value) {
          var setAttr = {};
          setAttr[attribute] = value;
          props.setAttributes(setAttr);
          triggerServerRender = true;
          this.updateCopyPasteContent();
        },
        /**
         * Reset Form Styles settings to defaults.
         *
         * @since 1.8.1
         */
        resetSettings: function resetSettings() {
          for (var key in defaultStyleSettings) {
            this.styleAttrChange(key, defaultStyleSettings[key]);
          }
        },
        /**
         * Update content of the "Copy/Paste" fields.
         *
         * @since 1.8.1
         */
        updateCopyPasteContent: function updateCopyPasteContent() {
          var content = {};
          var atts = wp.data.select('core/block-editor').getBlockAttributes(props.clientId);
          for (var key in defaultStyleSettings) {
            content[key] = atts[key];
          }
          props.setAttributes({
            'copyPasteJsonValue': JSON.stringify(content)
          });
        },
        /**
         * Paste settings handler.
         *
         * @since 1.8.1
         *
         * @param {string} value New attribute value.
         */
        pasteSettings: function pasteSettings(value) {
          var pasteAttributes = app.parseValidateJson(value);
          if (!pasteAttributes) {
            wp.data.dispatch('core/notices').createErrorNotice(strings.copy_paste_error, {
              id: 'wpforms-json-parse-error'
            });
            this.updateCopyPasteContent();
            return;
          }
          pasteAttributes.copyPasteJsonValue = value;
          props.setAttributes(pasteAttributes);
          triggerServerRender = true;
        }
      };
    },
    /**
     * Parse and validate JSON string.
     *
     * @since 1.8.1
     *
     * @param {string} value JSON string.
     *
     * @returns {boolean|object} Parsed JSON object OR false on error.
     */
    parseValidateJson: function parseValidateJson(value) {
      if (typeof value !== 'string') {
        return false;
      }
      var atts;
      try {
        atts = JSON.parse(value);
      } catch (error) {
        atts = false;
      }
      return atts;
    },
    /**
     * Get WPForms icon DOM element.
     *
     * @since 1.8.1
     *
     * @returns {DOM.element} WPForms icon DOM element.
     */
    getIcon: function getIcon() {
      return createElement('svg', {
        width: 20,
        height: 20,
        viewBox: '0 0 612 612',
        className: 'dashicon'
      }, createElement('path', {
        fill: 'currentColor',
        d: 'M544,0H68C30.445,0,0,30.445,0,68v476c0,37.556,30.445,68,68,68h476c37.556,0,68-30.444,68-68V68 C612,30.445,581.556,0,544,0z M464.44,68L387.6,120.02L323.34,68H464.44z M288.66,68l-64.26,52.02L147.56,68H288.66z M544,544H68 V68h22.1l136,92.14l79.9-64.6l79.56,64.6l136-92.14H544V544z M114.24,263.16h95.88v-48.28h-95.88V263.16z M114.24,360.4h95.88 v-48.62h-95.88V360.4z M242.76,360.4h255v-48.62h-255V360.4L242.76,360.4z M242.76,263.16h255v-48.28h-255V263.16L242.76,263.16z M368.22,457.3h129.54V408H368.22V457.3z'
      }));
    },
    /**
     * Get block attributes.
     *
     * @since 1.8.1
     *
     * @returns {object} Block attributes.
     */
    getBlockAttributes: function getBlockAttributes() {
      // eslint-disable-line max-lines-per-function

      return {
        clientId: {
          type: 'string',
          default: ''
        },
        formId: {
          type: 'string',
          default: defaults.formId
        },
        displayTitle: {
          type: 'boolean',
          default: defaults.displayTitle
        },
        displayDesc: {
          type: 'boolean',
          default: defaults.displayDesc
        },
        preview: {
          type: 'boolean'
        },
        fieldSize: {
          type: 'string',
          default: defaults.fieldSize
        },
        fieldBorderRadius: {
          type: 'string',
          default: defaults.fieldBorderRadius
        },
        fieldBackgroundColor: {
          type: 'string',
          default: defaults.fieldBackgroundColor
        },
        fieldBorderColor: {
          type: 'string',
          default: defaults.fieldBorderColor
        },
        fieldTextColor: {
          type: 'string',
          default: defaults.fieldTextColor
        },
        labelSize: {
          type: 'string',
          default: defaults.labelSize
        },
        labelColor: {
          type: 'string',
          default: defaults.labelColor
        },
        labelSublabelColor: {
          type: 'string',
          default: defaults.labelSublabelColor
        },
        labelErrorColor: {
          type: 'string',
          default: defaults.labelErrorColor
        },
        buttonSize: {
          type: 'string',
          default: defaults.buttonSize
        },
        buttonBorderRadius: {
          type: 'string',
          default: defaults.buttonBorderRadius
        },
        buttonBackgroundColor: {
          type: 'string',
          default: defaults.buttonBackgroundColor
        },
        buttonTextColor: {
          type: 'string',
          default: defaults.buttonTextColor
        },
        copyPasteJsonValue: {
          type: 'string',
          default: defaults.copyPasteJsonValue
        }
      };
    },
    /**
     * Get form selector options.
     *
     * @since 1.8.1
     *
     * @returns {Array} Form options.
     */
    getFormOptions: function getFormOptions() {
      var formOptions = wpforms_gutenberg_form_selector.forms.map(function (value) {
        return {
          value: value.ID,
          label: value.post_title
        };
      });
      formOptions.unshift({
        value: '',
        label: strings.form_select
      });
      return formOptions;
    },
    /**
     * Get size selector options.
     *
     * @since 1.8.1
     *
     * @returns {Array} Size options.
     */
    getSizeOptions: function getSizeOptions() {
      return [{
        label: strings.small,
        value: 'small'
      }, {
        label: strings.medium,
        value: 'medium'
      }, {
        label: strings.large,
        value: 'large'
      }];
    },
    /**
     * Event `wpformsFormSelectorEdit` handler.
     *
     * @since 1.8.1
     *
     * @param {object} e     Event object.
     * @param {object} props Block properties.
     */
    blockEdit: function blockEdit(e, props) {
      var block = app.getBlockContainer(props);
      if (!block || !block.dataset) {
        return;
      }
      app.initLeadFormSettings(block.parentElement);
    },
    /**
     * Init Lead Form Settings panels.
     *
     * @since 1.8.1
     *
     * @param {Element} block Block element.
     */
    initLeadFormSettings: function initLeadFormSettings(block) {
      if (!block || !block.dataset) {
        return;
      }
      if (!app.isFullStylingEnabled()) {
        return;
      }
      var clientId = block.dataset.block;
      var $form = $(block.querySelector('.wpforms-container'));
      var $panel = $(".wpforms-block-settings-".concat(clientId));
      if ($form.hasClass('wpforms-lead-forms-container')) {
        $panel.addClass('disabled_panel').find('.wpforms-gutenberg-panel-notice.wpforms-lead-form-notice').css('display', 'block');
        $panel.find('.wpforms-gutenberg-panel-notice.wpforms-use-modern-notice').css('display', 'none');
        return;
      }
      $panel.removeClass('disabled_panel').find('.wpforms-gutenberg-panel-notice.wpforms-lead-form-notice').css('display', 'none');
      $panel.find('.wpforms-gutenberg-panel-notice.wpforms-use-modern-notice').css('display', null);
    },
    /**
     * Event `wpformsFormSelectorFormLoaded` handler.
     *
     * @since 1.8.1
     *
     * @param {object} e Event object.
     */
    formLoaded: function formLoaded(e) {
      app.initLeadFormSettings(e.detail.block);
      app.updateAccentColors(e.detail);
      app.loadChoicesJS(e.detail);
      app.initRichTextField(e.detail.formId);
      $(e.detail.block).off('click').on('click', app.blockClick);
    },
    /**
     * Click on the block event handler.
     *
     * @since 1.8.1
     *
     * @param {object} e Event object.
     */
    blockClick: function blockClick(e) {
      app.initLeadFormSettings(e.currentTarget);
    },
    /**
     * Update accent colors of some fields in GB block in Modern Markup mode.
     *
     * @since 1.8.1
     *
     * @param {object} detail Event details object.
     */
    updateAccentColors: function updateAccentColors(detail) {
      if (!wpforms_gutenberg_form_selector.is_modern_markup || !window.WPForms || !window.WPForms.FrontendModern || !detail.block) {
        return;
      }
      var $form = $(detail.block.querySelector("#wpforms-".concat(detail.formId))),
        FrontendModern = window.WPForms.FrontendModern;
      FrontendModern.updateGBBlockPageIndicatorColor($form);
      FrontendModern.updateGBBlockIconChoicesColor($form);
      FrontendModern.updateGBBlockRatingColor($form);
    },
    /**
     * Init Modern style Dropdown fields (<select>).
     *
     * @since 1.8.1
     *
     * @param {object} detail Event details object.
     */
    loadChoicesJS: function loadChoicesJS(detail) {
      if (typeof window.Choices !== 'function') {
        return;
      }
      var $form = $(detail.block.querySelector("#wpforms-".concat(detail.formId)));
      $form.find('.choicesjs-select').each(function (idx, el) {
        var $el = $(el);
        if ($el.data('choice') === 'active') {
          return;
        }
        var args = window.wpforms_choicesjs_config || {},
          searchEnabled = $el.data('search-enabled'),
          $field = $el.closest('.wpforms-field');
        args.searchEnabled = 'undefined' !== typeof searchEnabled ? searchEnabled : true;
        args.callbackOnInit = function () {
          var self = this,
            $element = $(self.passedElement.element),
            $input = $(self.input.element),
            sizeClass = $element.data('size-class');

          // Add CSS-class for size.
          if (sizeClass) {
            $(self.containerOuter.element).addClass(sizeClass);
          }

          /**
           * If a multiple select has selected choices - hide a placeholder text.
           * In case if select is empty - we return placeholder text back.
           */
          if ($element.prop('multiple')) {
            // On init event.
            $input.data('placeholder', $input.attr('placeholder'));
            if (self.getValue(true).length) {
              $input.removeAttr('placeholder');
            }
          }
          this.disable();
          $field.find('.is-disabled').removeClass('is-disabled');
        };
        try {
          var choicesInstance = new Choices(el, args);

          // Save Choices.js instance for future access.
          $el.data('choicesjs', choicesInstance);
        } catch (e) {} // eslint-disable-line no-empty
      });
    },

    /**
     * Initialize RichText field.
     *
     * @since 1.8.1
     *
     * @param {int} formId Form ID.
     */
    initRichTextField: function initRichTextField(formId) {
      // Set default tab to `Visual`.
      $("#wpforms-".concat(formId, " .wp-editor-wrap")).removeClass('html-active').addClass('tmce-active');
    }
  };

  // Provide access to public functions/properties.
  return app;
}(document, window, jQuery);

// Initialize.
WPForms.FormSelector.init();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfc2xpY2VkVG9BcnJheSIsImFyciIsImkiLCJfYXJyYXlXaXRoSG9sZXMiLCJfaXRlcmFibGVUb0FycmF5TGltaXQiLCJfdW5zdXBwb3J0ZWRJdGVyYWJsZVRvQXJyYXkiLCJfbm9uSXRlcmFibGVSZXN0IiwiVHlwZUVycm9yIiwibyIsIm1pbkxlbiIsIl9hcnJheUxpa2VUb0FycmF5IiwibiIsIk9iamVjdCIsInByb3RvdHlwZSIsInRvU3RyaW5nIiwiY2FsbCIsInNsaWNlIiwiY29uc3RydWN0b3IiLCJuYW1lIiwiQXJyYXkiLCJmcm9tIiwidGVzdCIsImxlbiIsImxlbmd0aCIsImFycjIiLCJfaSIsIlN5bWJvbCIsIml0ZXJhdG9yIiwiX3MiLCJfZSIsIl94IiwiX3IiLCJfYXJyIiwiX24iLCJfZCIsIm5leHQiLCJkb25lIiwicHVzaCIsInZhbHVlIiwiZXJyIiwicmV0dXJuIiwiaXNBcnJheSIsIldQRm9ybXMiLCJ3aW5kb3ciLCJGb3JtU2VsZWN0b3IiLCJkb2N1bWVudCIsIiQiLCJfd3AiLCJ3cCIsIl93cCRzZXJ2ZXJTaWRlUmVuZGVyIiwic2VydmVyU2lkZVJlbmRlciIsIlNlcnZlclNpZGVSZW5kZXIiLCJjb21wb25lbnRzIiwiX3dwJGVsZW1lbnQiLCJlbGVtZW50IiwiY3JlYXRlRWxlbWVudCIsIkZyYWdtZW50IiwidXNlU3RhdGUiLCJyZWdpc3RlckJsb2NrVHlwZSIsImJsb2NrcyIsIl9yZWYiLCJibG9ja0VkaXRvciIsImVkaXRvciIsIkluc3BlY3RvckNvbnRyb2xzIiwiSW5zcGVjdG9yQWR2YW5jZWRDb250cm9scyIsIlBhbmVsQ29sb3JTZXR0aW5ncyIsIl93cCRjb21wb25lbnRzIiwiU2VsZWN0Q29udHJvbCIsIlRvZ2dsZUNvbnRyb2wiLCJQYW5lbEJvZHkiLCJQbGFjZWhvbGRlciIsIkZsZXgiLCJGbGV4QmxvY2siLCJfX2V4cGVyaW1lbnRhbFVuaXRDb250cm9sIiwiVGV4dGFyZWFDb250cm9sIiwiQnV0dG9uIiwiTW9kYWwiLCJfd3Bmb3Jtc19ndXRlbmJlcmdfZm8iLCJ3cGZvcm1zX2d1dGVuYmVyZ19mb3JtX3NlbGVjdG9yIiwic3RyaW5ncyIsImRlZmF1bHRzIiwic2l6ZXMiLCJkZWZhdWx0U3R5bGVTZXR0aW5ncyIsInRyaWdnZXJTZXJ2ZXJSZW5kZXIiLCJhcHAiLCJpbml0IiwiaW5pdERlZmF1bHRzIiwicmVnaXN0ZXJCbG9jayIsInJlYWR5IiwiZXZlbnRzIiwib24iLCJfIiwiZGVib3VuY2UiLCJibG9ja0VkaXQiLCJmb3JtTG9hZGVkIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImljb24iLCJnZXRJY29uIiwia2V5d29yZHMiLCJmb3JtX2tleXdvcmRzIiwiY2F0ZWdvcnkiLCJhdHRyaWJ1dGVzIiwiZ2V0QmxvY2tBdHRyaWJ1dGVzIiwiZXhhbXBsZSIsInByZXZpZXciLCJlZGl0IiwicHJvcHMiLCJmb3JtT3B0aW9ucyIsImdldEZvcm1PcHRpb25zIiwic2l6ZU9wdGlvbnMiLCJnZXRTaXplT3B0aW9ucyIsImhhbmRsZXJzIiwiZ2V0U2V0dGluZ3NGaWVsZHNIYW5kbGVycyIsImNsaWVudElkIiwic2V0QXR0cmlidXRlcyIsImpzeCIsImpzeFBhcnRzIiwiZ2V0TWFpblNldHRpbmdzIiwiZm9ybUlkIiwiZ2V0U3R5bGVTZXR0aW5ncyIsImdldEFkdmFuY2VkU2V0dGluZ3MiLCJnZXRCbG9ja0Zvcm1Db250ZW50IiwidXBkYXRlQ29weVBhc3RlQ29udGVudCIsInRyaWdnZXIiLCJnZXRCbG9ja1ByZXZpZXciLCJnZXRCbG9ja1BsYWNlaG9sZGVyIiwic2F2ZSIsImZvckVhY2giLCJrZXkiLCJSZWFjdCIsImNsYXNzTmFtZSIsImZvcm1fc2V0dGluZ3MiLCJsYWJlbCIsImZvcm1fc2VsZWN0ZWQiLCJvcHRpb25zIiwib25DaGFuZ2UiLCJhdHRyQ2hhbmdlIiwic2hvd190aXRsZSIsImNoZWNrZWQiLCJkaXNwbGF5VGl0bGUiLCJzaG93X2Rlc2NyaXB0aW9uIiwiZGlzcGxheURlc2MiLCJwYW5lbF9ub3RpY2VfaGVhZCIsInBhbmVsX25vdGljZV90ZXh0IiwiaHJlZiIsInBhbmVsX25vdGljZV9saW5rIiwicmVsIiwidGFyZ2V0IiwicGFuZWxfbm90aWNlX2xpbmtfdGV4dCIsImdldEZpZWxkU3R5bGVzIiwiZ2V0UGFuZWxDbGFzcyIsImZpZWxkX3N0eWxlcyIsInVzZV9tb2Rlcm5fbm90aWNlX2hlYWQiLCJ1c2VfbW9kZXJuX25vdGljZV90ZXh0IiwidXNlX21vZGVybl9ub3RpY2VfbGluayIsImxlYXJuX21vcmUiLCJzdHlsZSIsImRpc3BsYXkiLCJsZWFkX2Zvcm1zX3BhbmVsX25vdGljZV9oZWFkIiwibGVhZF9mb3Jtc19wYW5lbF9ub3RpY2VfdGV4dCIsImdhcCIsImFsaWduIiwianVzdGlmeSIsInNpemUiLCJmaWVsZFNpemUiLCJzdHlsZUF0dHJDaGFuZ2UiLCJib3JkZXJfcmFkaXVzIiwiZmllbGRCb3JkZXJSYWRpdXMiLCJpc1VuaXRTZWxlY3RUYWJiYWJsZSIsImNvbG9ycyIsIl9fZXhwZXJpbWVudGFsSXNSZW5kZXJlZEluU2lkZWJhciIsImVuYWJsZUFscGhhIiwic2hvd1RpdGxlIiwiY29sb3JTZXR0aW5ncyIsImZpZWxkQmFja2dyb3VuZENvbG9yIiwiYmFja2dyb3VuZCIsImZpZWxkQm9yZGVyQ29sb3IiLCJib3JkZXIiLCJmaWVsZFRleHRDb2xvciIsInRleHQiLCJnZXRMYWJlbFN0eWxlcyIsImxhYmVsX3N0eWxlcyIsImxhYmVsU2l6ZSIsImxhYmVsQ29sb3IiLCJsYWJlbFN1YmxhYmVsQ29sb3IiLCJzdWJsYWJlbF9oaW50cyIsInJlcGxhY2UiLCJsYWJlbEVycm9yQ29sb3IiLCJlcnJvcl9tZXNzYWdlIiwiZ2V0QnV0dG9uU3R5bGVzIiwiYnV0dG9uX3N0eWxlcyIsImJ1dHRvblNpemUiLCJidXR0b25Cb3JkZXJSYWRpdXMiLCJidXR0b25CYWNrZ3JvdW5kQ29sb3IiLCJidXR0b25UZXh0Q29sb3IiLCJidXR0b25fY29sb3Jfbm90aWNlIiwiX3VzZVN0YXRlIiwiX3VzZVN0YXRlMiIsImlzT3BlbiIsInNldE9wZW4iLCJvcGVuTW9kYWwiLCJjbG9zZU1vZGFsIiwiY29weV9wYXN0ZV9zZXR0aW5ncyIsInJvd3MiLCJzcGVsbENoZWNrIiwiY29weVBhc3RlSnNvblZhbHVlIiwicGFzdGVTZXR0aW5ncyIsImRhbmdlcm91c2x5U2V0SW5uZXJIVE1MIiwiX19odG1sIiwiY29weV9wYXN0ZV9ub3RpY2UiLCJvbkNsaWNrIiwicmVzZXRfc3R5bGVfc2V0dGluZ3MiLCJvblJlcXVlc3RDbG9zZSIsInJlc2V0X3NldHRpbmdzX2NvbmZpcm1fdGV4dCIsImlzU2Vjb25kYXJ5IiwiYnRuX25vIiwiaXNQcmltYXJ5IiwicmVzZXRTZXR0aW5ncyIsImJ0bl95ZXNfcmVzZXQiLCJibG9jayIsImdldEJsb2NrQ29udGFpbmVyIiwiaW5uZXJIVE1MIiwiYmxvY2tIVE1MIiwibG9hZGVkRm9ybUlkIiwic3JjIiwiYmxvY2tfcHJldmlld191cmwiLCJ3aWR0aCIsImxvZ29fdXJsIiwiY3NzQ2xhc3MiLCJpc0Z1bGxTdHlsaW5nRW5hYmxlZCIsImlzX21vZGVybl9tYXJrdXAiLCJpc19mdWxsX3N0eWxpbmciLCJibG9ja1NlbGVjdG9yIiwiY29uY2F0IiwicXVlcnlTZWxlY3RvciIsImVkaXRvckNhbnZhcyIsImNvbnRlbnRXaW5kb3ciLCJhdHRyaWJ1dGUiLCJjb250YWluZXIiLCJwcm9wZXJ0eSIsImxldHRlciIsInRvTG93ZXJDYXNlIiwic2V0QXR0ciIsInNldFByb3BlcnR5IiwiY29udGVudCIsImF0dHMiLCJkYXRhIiwic2VsZWN0IiwiSlNPTiIsInN0cmluZ2lmeSIsInBhc3RlQXR0cmlidXRlcyIsInBhcnNlVmFsaWRhdGVKc29uIiwiZGlzcGF0Y2giLCJjcmVhdGVFcnJvck5vdGljZSIsImNvcHlfcGFzdGVfZXJyb3IiLCJpZCIsInBhcnNlIiwiZXJyb3IiLCJoZWlnaHQiLCJ2aWV3Qm94IiwiZmlsbCIsImQiLCJ0eXBlIiwiZGVmYXVsdCIsImZvcm1zIiwibWFwIiwiSUQiLCJwb3N0X3RpdGxlIiwidW5zaGlmdCIsImZvcm1fc2VsZWN0Iiwic21hbGwiLCJtZWRpdW0iLCJsYXJnZSIsImUiLCJkYXRhc2V0IiwiaW5pdExlYWRGb3JtU2V0dGluZ3MiLCJwYXJlbnRFbGVtZW50IiwiJGZvcm0iLCIkcGFuZWwiLCJoYXNDbGFzcyIsImFkZENsYXNzIiwiZmluZCIsImNzcyIsInJlbW92ZUNsYXNzIiwiZGV0YWlsIiwidXBkYXRlQWNjZW50Q29sb3JzIiwibG9hZENob2ljZXNKUyIsImluaXRSaWNoVGV4dEZpZWxkIiwib2ZmIiwiYmxvY2tDbGljayIsImN1cnJlbnRUYXJnZXQiLCJGcm9udGVuZE1vZGVybiIsInVwZGF0ZUdCQmxvY2tQYWdlSW5kaWNhdG9yQ29sb3IiLCJ1cGRhdGVHQkJsb2NrSWNvbkNob2ljZXNDb2xvciIsInVwZGF0ZUdCQmxvY2tSYXRpbmdDb2xvciIsIkNob2ljZXMiLCJlYWNoIiwiaWR4IiwiZWwiLCIkZWwiLCJhcmdzIiwid3Bmb3Jtc19jaG9pY2VzanNfY29uZmlnIiwic2VhcmNoRW5hYmxlZCIsIiRmaWVsZCIsImNsb3Nlc3QiLCJjYWxsYmFja09uSW5pdCIsInNlbGYiLCIkZWxlbWVudCIsInBhc3NlZEVsZW1lbnQiLCIkaW5wdXQiLCJpbnB1dCIsInNpemVDbGFzcyIsImNvbnRhaW5lck91dGVyIiwicHJvcCIsImF0dHIiLCJnZXRWYWx1ZSIsInJlbW92ZUF0dHIiLCJkaXNhYmxlIiwiY2hvaWNlc0luc3RhbmNlIiwialF1ZXJ5Il0sInNvdXJjZXMiOlsiZmFrZV8zOTc5NDNmMi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgd3Bmb3Jtc19ndXRlbmJlcmdfZm9ybV9zZWxlY3RvciwgQ2hvaWNlcyAqL1xuLyoganNoaW50IGVzMzogZmFsc2UsIGVzdmVyc2lvbjogNiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogR3V0ZW5iZXJnIGVkaXRvciBibG9jay5cbiAqXG4gKiBAc2luY2UgMS44LjFcbiAqL1xudmFyIFdQRm9ybXMgPSB3aW5kb3cuV1BGb3JtcyB8fCB7fTtcblxuV1BGb3Jtcy5Gb3JtU2VsZWN0b3IgPSBXUEZvcm1zLkZvcm1TZWxlY3RvciB8fCAoIGZ1bmN0aW9uKCBkb2N1bWVudCwgd2luZG93LCAkICkge1xuXG5cdGNvbnN0IHsgc2VydmVyU2lkZVJlbmRlcjogU2VydmVyU2lkZVJlbmRlciA9IHdwLmNvbXBvbmVudHMuU2VydmVyU2lkZVJlbmRlciB9ID0gd3A7XG5cdGNvbnN0IHsgY3JlYXRlRWxlbWVudCwgRnJhZ21lbnQsIHVzZVN0YXRlIH0gPSB3cC5lbGVtZW50O1xuXHRjb25zdCB7IHJlZ2lzdGVyQmxvY2tUeXBlIH0gPSB3cC5ibG9ja3M7XG5cdGNvbnN0IHsgSW5zcGVjdG9yQ29udHJvbHMsIEluc3BlY3RvckFkdmFuY2VkQ29udHJvbHMsIFBhbmVsQ29sb3JTZXR0aW5ncyB9ID0gd3AuYmxvY2tFZGl0b3IgfHwgd3AuZWRpdG9yO1xuXHRjb25zdCB7IFNlbGVjdENvbnRyb2wsIFRvZ2dsZUNvbnRyb2wsIFBhbmVsQm9keSwgUGxhY2Vob2xkZXIsIEZsZXgsIEZsZXhCbG9jaywgX19leHBlcmltZW50YWxVbml0Q29udHJvbCwgVGV4dGFyZWFDb250cm9sLCBCdXR0b24sIE1vZGFsIH0gPSB3cC5jb21wb25lbnRzO1xuXHRjb25zdCB7IHN0cmluZ3MsIGRlZmF1bHRzLCBzaXplcyB9ID0gd3Bmb3Jtc19ndXRlbmJlcmdfZm9ybV9zZWxlY3Rvcjtcblx0Y29uc3QgZGVmYXVsdFN0eWxlU2V0dGluZ3MgPSBkZWZhdWx0cztcblxuXHQvKipcblx0ICogQmxvY2tzIHJ1bnRpbWUgZGF0YS5cblx0ICpcblx0ICogQHNpbmNlIDEuOC4xXG5cdCAqXG5cdCAqIEB0eXBlIHtvYmplY3R9XG5cdCAqL1xuXHRsZXQgYmxvY2tzID0ge307XG5cblx0LyoqXG5cdCAqIFdoZXRoZXIgaXQgaXMgbmVlZGVkIHRvIHRyaWdnZXIgc2VydmVyIHJlbmRlcmluZy5cblx0ICpcblx0ICogQHNpbmNlIDEuOC4xXG5cdCAqXG5cdCAqIEB0eXBlIHtib29sZWFufVxuXHQgKi9cblx0bGV0IHRyaWdnZXJTZXJ2ZXJSZW5kZXIgPSB0cnVlO1xuXG5cdC8qKlxuXHQgKiBQdWJsaWMgZnVuY3Rpb25zIGFuZCBwcm9wZXJ0aWVzLlxuXHQgKlxuXHQgKiBAc2luY2UgMS44LjFcblx0ICpcblx0ICogQHR5cGUge29iamVjdH1cblx0ICovXG5cdGNvbnN0IGFwcCA9IHtcblxuXHRcdC8qKlxuXHRcdCAqIFN0YXJ0IHRoZSBlbmdpbmUuXG5cdFx0ICpcblx0XHQgKiBAc2luY2UgMS44LjFcblx0XHQgKi9cblx0XHRpbml0OiBmdW5jdGlvbigpIHtcblxuXHRcdFx0YXBwLmluaXREZWZhdWx0cygpO1xuXHRcdFx0YXBwLnJlZ2lzdGVyQmxvY2soKTtcblxuXHRcdFx0JCggYXBwLnJlYWR5ICk7XG5cdFx0fSxcblxuXHRcdC8qKlxuXHRcdCAqIERvY3VtZW50IHJlYWR5LlxuXHRcdCAqXG5cdFx0ICogQHNpbmNlIDEuOC4xXG5cdFx0ICovXG5cdFx0cmVhZHk6IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRhcHAuZXZlbnRzKCk7XG5cdFx0fSxcblxuXHRcdC8qKlxuXHRcdCAqIEV2ZW50cy5cblx0XHQgKlxuXHRcdCAqIEBzaW5jZSAxLjguMVxuXHRcdCAqL1xuXHRcdGV2ZW50czogZnVuY3Rpb24oKSB7XG5cblx0XHRcdCQoIHdpbmRvdyApXG5cdFx0XHRcdC5vbiggJ3dwZm9ybXNGb3JtU2VsZWN0b3JFZGl0JywgXy5kZWJvdW5jZSggYXBwLmJsb2NrRWRpdCwgMjUwICkgKVxuXHRcdFx0XHQub24oICd3cGZvcm1zRm9ybVNlbGVjdG9yRm9ybUxvYWRlZCcsIF8uZGVib3VuY2UoIGFwcC5mb3JtTG9hZGVkLCAyNTAgKSApO1xuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBSZWdpc3RlciBibG9jay5cblx0XHQgKlxuXHRcdCAqIEBzaW5jZSAxLjguMVxuXHRcdCAqL1xuXHRcdHJlZ2lzdGVyQmxvY2s6IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRyZWdpc3RlckJsb2NrVHlwZSggJ3dwZm9ybXMvZm9ybS1zZWxlY3RvcicsIHtcblx0XHRcdFx0dGl0bGU6IHN0cmluZ3MudGl0bGUsXG5cdFx0XHRcdGRlc2NyaXB0aW9uOiBzdHJpbmdzLmRlc2NyaXB0aW9uLFxuXHRcdFx0XHRpY29uOiBhcHAuZ2V0SWNvbigpLFxuXHRcdFx0XHRrZXl3b3Jkczogc3RyaW5ncy5mb3JtX2tleXdvcmRzLFxuXHRcdFx0XHRjYXRlZ29yeTogJ3dpZGdldHMnLFxuXHRcdFx0XHRhdHRyaWJ1dGVzOiBhcHAuZ2V0QmxvY2tBdHRyaWJ1dGVzKCksXG5cdFx0XHRcdGV4YW1wbGU6IHtcblx0XHRcdFx0XHRhdHRyaWJ1dGVzOiB7XG5cdFx0XHRcdFx0XHRwcmV2aWV3OiB0cnVlLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGVkaXQ6IGZ1bmN0aW9uKCBwcm9wcyApIHtcblxuXHRcdFx0XHRcdGNvbnN0IHsgYXR0cmlidXRlcyB9ID0gcHJvcHM7XG5cdFx0XHRcdFx0Y29uc3QgZm9ybU9wdGlvbnMgPSBhcHAuZ2V0Rm9ybU9wdGlvbnMoKTtcblx0XHRcdFx0XHRjb25zdCBzaXplT3B0aW9ucyA9IGFwcC5nZXRTaXplT3B0aW9ucygpO1xuXHRcdFx0XHRcdGNvbnN0IGhhbmRsZXJzID0gYXBwLmdldFNldHRpbmdzRmllbGRzSGFuZGxlcnMoIHByb3BzICk7XG5cblx0XHRcdFx0XHQvLyBTdG9yZSBibG9jayBjbGllbnRJZCBpbiBhdHRyaWJ1dGVzLlxuXHRcdFx0XHRcdGlmICggISBhdHRyaWJ1dGVzLmNsaWVudElkICkge1xuXG5cdFx0XHRcdFx0XHQvLyBXZSBqdXN0IHdhbnQgY2xpZW50IElEIHRvIHVwZGF0ZSBvbmNlLlxuXHRcdFx0XHRcdFx0Ly8gVGhlIGJsb2NrIGVkaXRvciBkb2Vzbid0IGhhdmUgYSBmaXhlZCBibG9jayBJRCwgc28gd2UgbmVlZCB0byBnZXQgaXQgb24gdGhlIGluaXRpYWwgbG9hZCwgYnV0IG9ubHkgb25jZS5cblx0XHRcdFx0XHRcdHByb3BzLnNldEF0dHJpYnV0ZXMoIHsgY2xpZW50SWQ6IHByb3BzLmNsaWVudElkIH0gKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyBNYWluIGJsb2NrIHNldHRpbmdzLlxuXHRcdFx0XHRcdGxldCBqc3ggPSBbXG5cdFx0XHRcdFx0XHRhcHAuanN4UGFydHMuZ2V0TWFpblNldHRpbmdzKCBhdHRyaWJ1dGVzLCBoYW5kbGVycywgZm9ybU9wdGlvbnMgKSxcblx0XHRcdFx0XHRdO1xuXG5cdFx0XHRcdFx0Ly8gRm9ybSBzdHlsZSBzZXR0aW5ncyAmIGJsb2NrIGNvbnRlbnQuXG5cdFx0XHRcdFx0aWYgKCBhdHRyaWJ1dGVzLmZvcm1JZCApIHtcblx0XHRcdFx0XHRcdGpzeC5wdXNoKFxuXHRcdFx0XHRcdFx0XHRhcHAuanN4UGFydHMuZ2V0U3R5bGVTZXR0aW5ncyggYXR0cmlidXRlcywgaGFuZGxlcnMsIHNpemVPcHRpb25zICksXG5cdFx0XHRcdFx0XHRcdGFwcC5qc3hQYXJ0cy5nZXRBZHZhbmNlZFNldHRpbmdzKCBhdHRyaWJ1dGVzLCBoYW5kbGVycyApLFxuXHRcdFx0XHRcdFx0XHRhcHAuanN4UGFydHMuZ2V0QmxvY2tGb3JtQ29udGVudCggcHJvcHMgKSxcblx0XHRcdFx0XHRcdCk7XG5cblx0XHRcdFx0XHRcdGhhbmRsZXJzLnVwZGF0ZUNvcHlQYXN0ZUNvbnRlbnQoKTtcblxuXHRcdFx0XHRcdFx0JCggd2luZG93ICkudHJpZ2dlciggJ3dwZm9ybXNGb3JtU2VsZWN0b3JFZGl0JywgWyBwcm9wcyBdICk7XG5cblx0XHRcdFx0XHRcdHJldHVybiBqc3g7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gQmxvY2sgcHJldmlldyBwaWN0dXJlLlxuXHRcdFx0XHRcdGlmICggYXR0cmlidXRlcy5wcmV2aWV3ICkge1xuXHRcdFx0XHRcdFx0anN4LnB1c2goXG5cdFx0XHRcdFx0XHRcdGFwcC5qc3hQYXJ0cy5nZXRCbG9ja1ByZXZpZXcoKSxcblx0XHRcdFx0XHRcdCk7XG5cblx0XHRcdFx0XHRcdHJldHVybiBqc3g7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gQmxvY2sgcGxhY2Vob2xkZXIgKGZvcm0gc2VsZWN0b3IpLlxuXHRcdFx0XHRcdGpzeC5wdXNoKFxuXHRcdFx0XHRcdFx0YXBwLmpzeFBhcnRzLmdldEJsb2NrUGxhY2Vob2xkZXIoIHByb3BzLmF0dHJpYnV0ZXMsIGhhbmRsZXJzLCBmb3JtT3B0aW9ucyApLFxuXHRcdFx0XHRcdCk7XG5cblx0XHRcdFx0XHRyZXR1cm4ganN4O1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRzYXZlOiAoKSA9PiBudWxsLFxuXHRcdFx0fSApO1xuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBJbml0IGRlZmF1bHQgc3R5bGUgc2V0dGluZ3MuXG5cdFx0ICpcblx0XHQgKiBAc2luY2UgMS44LjFcblx0XHQgKi9cblx0XHRpbml0RGVmYXVsdHM6IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRbICdmb3JtSWQnLCAnY29weVBhc3RlSnNvblZhbHVlJyBdLmZvckVhY2goIGtleSA9PiBkZWxldGUgZGVmYXVsdFN0eWxlU2V0dGluZ3NbIGtleSBdICk7XG5cdFx0fSxcblxuXHRcdC8qKlxuXHRcdCAqIEJsb2NrIEpTWCBwYXJ0cy5cblx0XHQgKlxuXHRcdCAqIEBzaW5jZSAxLjguMVxuXHRcdCAqXG5cdFx0ICogQHR5cGUge29iamVjdH1cblx0XHQgKi9cblx0XHRqc3hQYXJ0czoge1xuXG5cdFx0XHQvKipcblx0XHRcdCAqIEdldCBtYWluIHNldHRpbmdzIEpTWCBjb2RlLlxuXHRcdFx0ICpcblx0XHRcdCAqIEBzaW5jZSAxLjguMVxuXHRcdFx0ICpcblx0XHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBhdHRyaWJ1dGVzICBCbG9jayBhdHRyaWJ1dGVzLlxuXHRcdFx0ICogQHBhcmFtIHtvYmplY3R9IGhhbmRsZXJzICAgIEJsb2NrIGV2ZW50IGhhbmRsZXJzLlxuXHRcdFx0ICogQHBhcmFtIHtvYmplY3R9IGZvcm1PcHRpb25zIEZvcm0gc2VsZWN0b3Igb3B0aW9ucy5cblx0XHRcdCAqXG5cdFx0XHQgKiBAcmV0dXJucyB7SlNYLkVsZW1lbnR9IE1haW4gc2V0dGluZyBKU1ggY29kZS5cblx0XHRcdCAqL1xuXHRcdFx0Z2V0TWFpblNldHRpbmdzOiBmdW5jdGlvbiggYXR0cmlidXRlcywgaGFuZGxlcnMsIGZvcm1PcHRpb25zICkge1xuXG5cdFx0XHRcdHJldHVybiAoXG5cdFx0XHRcdFx0PEluc3BlY3RvckNvbnRyb2xzIGtleT1cIndwZm9ybXMtZ3V0ZW5iZXJnLWZvcm0tc2VsZWN0b3ItaW5zcGVjdG9yLW1haW4tc2V0dGluZ3NcIj5cblx0XHRcdFx0XHRcdDxQYW5lbEJvZHkgY2xhc3NOYW1lPVwid3Bmb3Jtcy1ndXRlbmJlcmctcGFuZWxcIiB0aXRsZT17IHN0cmluZ3MuZm9ybV9zZXR0aW5ncyB9PlxuXHRcdFx0XHRcdFx0XHQ8U2VsZWN0Q29udHJvbFxuXHRcdFx0XHRcdFx0XHRcdGxhYmVsPXsgc3RyaW5ncy5mb3JtX3NlbGVjdGVkIH1cblx0XHRcdFx0XHRcdFx0XHR2YWx1ZT17IGF0dHJpYnV0ZXMuZm9ybUlkIH1cblx0XHRcdFx0XHRcdFx0XHRvcHRpb25zPXsgZm9ybU9wdGlvbnMgfVxuXHRcdFx0XHRcdFx0XHRcdG9uQ2hhbmdlPXsgdmFsdWUgPT4gaGFuZGxlcnMuYXR0ckNoYW5nZSggJ2Zvcm1JZCcsIHZhbHVlICkgfVxuXHRcdFx0XHRcdFx0XHQvPlxuXHRcdFx0XHRcdFx0XHQ8VG9nZ2xlQ29udHJvbFxuXHRcdFx0XHRcdFx0XHRcdGxhYmVsPXsgc3RyaW5ncy5zaG93X3RpdGxlIH1cblx0XHRcdFx0XHRcdFx0XHRjaGVja2VkPXsgYXR0cmlidXRlcy5kaXNwbGF5VGl0bGUgfVxuXHRcdFx0XHRcdFx0XHRcdG9uQ2hhbmdlPXsgdmFsdWUgPT4gaGFuZGxlcnMuYXR0ckNoYW5nZSggJ2Rpc3BsYXlUaXRsZScsIHZhbHVlICkgfVxuXHRcdFx0XHRcdFx0XHQvPlxuXHRcdFx0XHRcdFx0XHQ8VG9nZ2xlQ29udHJvbFxuXHRcdFx0XHRcdFx0XHRcdGxhYmVsPXsgc3RyaW5ncy5zaG93X2Rlc2NyaXB0aW9uIH1cblx0XHRcdFx0XHRcdFx0XHRjaGVja2VkPXsgYXR0cmlidXRlcy5kaXNwbGF5RGVzYyB9XG5cdFx0XHRcdFx0XHRcdFx0b25DaGFuZ2U9eyB2YWx1ZSA9PiBoYW5kbGVycy5hdHRyQ2hhbmdlKCAnZGlzcGxheURlc2MnLCB2YWx1ZSApIH1cblx0XHRcdFx0XHRcdFx0Lz5cblx0XHRcdFx0XHRcdFx0PHAgY2xhc3NOYW1lPVwid3Bmb3Jtcy1ndXRlbmJlcmctcGFuZWwtbm90aWNlXCI+XG5cdFx0XHRcdFx0XHRcdFx0PHN0cm9uZz57IHN0cmluZ3MucGFuZWxfbm90aWNlX2hlYWQgfTwvc3Ryb25nPlxuXHRcdFx0XHRcdFx0XHRcdHsgc3RyaW5ncy5wYW5lbF9ub3RpY2VfdGV4dCB9XG5cdFx0XHRcdFx0XHRcdFx0PGEgaHJlZj17c3RyaW5ncy5wYW5lbF9ub3RpY2VfbGlua30gcmVsPVwibm9yZWZlcnJlclwiIHRhcmdldD1cIl9ibGFua1wiPnsgc3RyaW5ncy5wYW5lbF9ub3RpY2VfbGlua190ZXh0IH08L2E+XG5cdFx0XHRcdFx0XHRcdDwvcD5cblx0XHRcdFx0XHRcdDwvUGFuZWxCb2R5PlxuXHRcdFx0XHRcdDwvSW5zcGVjdG9yQ29udHJvbHM+XG5cdFx0XHRcdCk7XG5cdFx0XHR9LFxuXG5cdFx0XHQvKipcblx0XHRcdCAqIEdldCBGaWVsZCBzdHlsZXMgSlNYIGNvZGUuXG5cdFx0XHQgKlxuXHRcdFx0ICogQHNpbmNlIDEuOC4xXG5cdFx0XHQgKlxuXHRcdFx0ICogQHBhcmFtIHtvYmplY3R9IGF0dHJpYnV0ZXMgIEJsb2NrIGF0dHJpYnV0ZXMuXG5cdFx0XHQgKiBAcGFyYW0ge29iamVjdH0gaGFuZGxlcnMgICAgQmxvY2sgZXZlbnQgaGFuZGxlcnMuXG5cdFx0XHQgKiBAcGFyYW0ge29iamVjdH0gc2l6ZU9wdGlvbnMgU2l6ZSBzZWxlY3RvciBvcHRpb25zLlxuXHRcdFx0ICpcblx0XHRcdCAqIEByZXR1cm5zIHtKU1guRWxlbWVudH0gRmllbGQgc3R5bGVzIEpTWCBjb2RlLlxuXHRcdFx0ICovXG5cdFx0XHRnZXRGaWVsZFN0eWxlczogZnVuY3Rpb24oIGF0dHJpYnV0ZXMsIGhhbmRsZXJzLCBzaXplT3B0aW9ucyApIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGluZXMtcGVyLWZ1bmN0aW9uXG5cblx0XHRcdFx0cmV0dXJuIChcblx0XHRcdFx0XHQ8UGFuZWxCb2R5IGNsYXNzTmFtZT17IGFwcC5nZXRQYW5lbENsYXNzKCBhdHRyaWJ1dGVzICkgfSB0aXRsZT17IHN0cmluZ3MuZmllbGRfc3R5bGVzIH0+XG5cdFx0XHRcdFx0XHQ8cCBjbGFzc05hbWU9XCJ3cGZvcm1zLWd1dGVuYmVyZy1wYW5lbC1ub3RpY2Ugd3Bmb3Jtcy11c2UtbW9kZXJuLW5vdGljZVwiPlxuXHRcdFx0XHRcdFx0XHQ8c3Ryb25nPnsgc3RyaW5ncy51c2VfbW9kZXJuX25vdGljZV9oZWFkIH08L3N0cm9uZz5cblx0XHRcdFx0XHRcdFx0eyBzdHJpbmdzLnVzZV9tb2Rlcm5fbm90aWNlX3RleHQgfSA8YSBocmVmPXtzdHJpbmdzLnVzZV9tb2Rlcm5fbm90aWNlX2xpbmt9IHJlbD1cIm5vcmVmZXJyZXJcIiB0YXJnZXQ9XCJfYmxhbmtcIj57IHN0cmluZ3MubGVhcm5fbW9yZSB9PC9hPlxuXHRcdFx0XHRcdFx0PC9wPlxuXG5cdFx0XHRcdFx0XHQ8cCBjbGFzc05hbWU9XCJ3cGZvcm1zLWd1dGVuYmVyZy1wYW5lbC1ub3RpY2Ugd3Bmb3Jtcy13YXJuaW5nIHdwZm9ybXMtbGVhZC1mb3JtLW5vdGljZVwiIHN0eWxlPXt7IGRpc3BsYXk6ICdub25lJyB9fT5cblx0XHRcdFx0XHRcdFx0PHN0cm9uZz57IHN0cmluZ3MubGVhZF9mb3Jtc19wYW5lbF9ub3RpY2VfaGVhZCB9PC9zdHJvbmc+XG5cdFx0XHRcdFx0XHRcdHsgc3RyaW5ncy5sZWFkX2Zvcm1zX3BhbmVsX25vdGljZV90ZXh0IH1cblx0XHRcdFx0XHRcdDwvcD5cblxuXHRcdFx0XHRcdFx0PEZsZXggZ2FwPXs0fSBhbGlnbj1cImZsZXgtc3RhcnRcIiBjbGFzc05hbWU9eyd3cGZvcm1zLWd1dGVuYmVyZy1mb3JtLXNlbGVjdG9yLWZsZXgnfSBqdXN0aWZ5PVwic3BhY2UtYmV0d2VlblwiPlxuXHRcdFx0XHRcdFx0XHQ8RmxleEJsb2NrPlxuXHRcdFx0XHRcdFx0XHRcdDxTZWxlY3RDb250cm9sXG5cdFx0XHRcdFx0XHRcdFx0XHRsYWJlbD17IHN0cmluZ3Muc2l6ZSB9XG5cdFx0XHRcdFx0XHRcdFx0XHR2YWx1ZT17IGF0dHJpYnV0ZXMuZmllbGRTaXplIH1cblx0XHRcdFx0XHRcdFx0XHRcdG9wdGlvbnM9eyBzaXplT3B0aW9ucyB9XG5cdFx0XHRcdFx0XHRcdFx0XHRvbkNoYW5nZT17IHZhbHVlID0+IGhhbmRsZXJzLnN0eWxlQXR0ckNoYW5nZSggJ2ZpZWxkU2l6ZScsIHZhbHVlICkgfVxuXHRcdFx0XHRcdFx0XHRcdC8+XG5cdFx0XHRcdFx0XHRcdDwvRmxleEJsb2NrPlxuXHRcdFx0XHRcdFx0XHQ8RmxleEJsb2NrPlxuXHRcdFx0XHRcdFx0XHRcdDxfX2V4cGVyaW1lbnRhbFVuaXRDb250cm9sXG5cdFx0XHRcdFx0XHRcdFx0XHRsYWJlbD17IHN0cmluZ3MuYm9yZGVyX3JhZGl1cyB9XG5cdFx0XHRcdFx0XHRcdFx0XHR2YWx1ZT17IGF0dHJpYnV0ZXMuZmllbGRCb3JkZXJSYWRpdXMgfVxuXHRcdFx0XHRcdFx0XHRcdFx0aXNVbml0U2VsZWN0VGFiYmFibGVcblx0XHRcdFx0XHRcdFx0XHRcdG9uQ2hhbmdlPXsgdmFsdWUgPT4gaGFuZGxlcnMuc3R5bGVBdHRyQ2hhbmdlKCAnZmllbGRCb3JkZXJSYWRpdXMnLCB2YWx1ZSApIH1cblx0XHRcdFx0XHRcdFx0XHQvPlxuXHRcdFx0XHRcdFx0XHQ8L0ZsZXhCbG9jaz5cblx0XHRcdFx0XHRcdDwvRmxleD5cblxuXHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJ3cGZvcm1zLWd1dGVuYmVyZy1mb3JtLXNlbGVjdG9yLWNvbG9yLXBpY2tlclwiPlxuXHRcdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIndwZm9ybXMtZ3V0ZW5iZXJnLWZvcm0tc2VsZWN0b3ItY29udHJvbC1sYWJlbFwiPnsgc3RyaW5ncy5jb2xvcnMgfTwvZGl2PlxuXHRcdFx0XHRcdFx0XHQ8UGFuZWxDb2xvclNldHRpbmdzXG5cdFx0XHRcdFx0XHRcdFx0X19leHBlcmltZW50YWxJc1JlbmRlcmVkSW5TaWRlYmFyXG5cdFx0XHRcdFx0XHRcdFx0ZW5hYmxlQWxwaGFcblx0XHRcdFx0XHRcdFx0XHRzaG93VGl0bGU9eyBmYWxzZSB9XG5cdFx0XHRcdFx0XHRcdFx0Y2xhc3NOYW1lPVwid3Bmb3Jtcy1ndXRlbmJlcmctZm9ybS1zZWxlY3Rvci1jb2xvci1wYW5lbFwiXG5cdFx0XHRcdFx0XHRcdFx0Y29sb3JTZXR0aW5ncz17W1xuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR2YWx1ZTogYXR0cmlidXRlcy5maWVsZEJhY2tncm91bmRDb2xvcixcblx0XHRcdFx0XHRcdFx0XHRcdFx0b25DaGFuZ2U6IHZhbHVlID0+IGhhbmRsZXJzLnN0eWxlQXR0ckNoYW5nZSggJ2ZpZWxkQmFja2dyb3VuZENvbG9yJywgdmFsdWUgKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0bGFiZWw6IHN0cmluZ3MuYmFja2dyb3VuZCxcblx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHZhbHVlOiBhdHRyaWJ1dGVzLmZpZWxkQm9yZGVyQ29sb3IsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG9uQ2hhbmdlOiB2YWx1ZSA9PiBoYW5kbGVycy5zdHlsZUF0dHJDaGFuZ2UoICdmaWVsZEJvcmRlckNvbG9yJywgdmFsdWUgKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0bGFiZWw6IHN0cmluZ3MuYm9yZGVyLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dmFsdWU6IGF0dHJpYnV0ZXMuZmllbGRUZXh0Q29sb3IsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG9uQ2hhbmdlOiB2YWx1ZSA9PiBoYW5kbGVycy5zdHlsZUF0dHJDaGFuZ2UoICdmaWVsZFRleHRDb2xvcicsIHZhbHVlICksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBzdHJpbmdzLnRleHQsXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdF19XG5cdFx0XHRcdFx0XHRcdC8+XG5cdFx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8L1BhbmVsQm9keT5cblx0XHRcdFx0KTtcblx0XHRcdH0sXG5cblx0XHRcdC8qKlxuXHRcdFx0ICogR2V0IExhYmVsIHN0eWxlcyBKU1ggY29kZS5cblx0XHRcdCAqXG5cdFx0XHQgKiBAc2luY2UgMS44LjFcblx0XHRcdCAqXG5cdFx0XHQgKiBAcGFyYW0ge29iamVjdH0gYXR0cmlidXRlcyAgQmxvY2sgYXR0cmlidXRlcy5cblx0XHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBoYW5kbGVycyAgICBCbG9jayBldmVudCBoYW5kbGVycy5cblx0XHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBzaXplT3B0aW9ucyBTaXplIHNlbGVjdG9yIG9wdGlvbnMuXG5cdFx0XHQgKlxuXHRcdFx0ICogQHJldHVybnMge0pTWC5FbGVtZW50fSBMYWJlbCBzdHlsZXMgSlNYIGNvZGUuXG5cdFx0XHQgKi9cblx0XHRcdGdldExhYmVsU3R5bGVzOiBmdW5jdGlvbiggYXR0cmlidXRlcywgaGFuZGxlcnMsIHNpemVPcHRpb25zICkge1xuXG5cdFx0XHRcdHJldHVybiAoXG5cdFx0XHRcdFx0PFBhbmVsQm9keSBjbGFzc05hbWU9eyBhcHAuZ2V0UGFuZWxDbGFzcyggYXR0cmlidXRlcyApIH0gdGl0bGU9eyBzdHJpbmdzLmxhYmVsX3N0eWxlcyB9PlxuXHRcdFx0XHRcdFx0PFNlbGVjdENvbnRyb2xcblx0XHRcdFx0XHRcdFx0bGFiZWw9eyBzdHJpbmdzLnNpemUgfVxuXHRcdFx0XHRcdFx0XHR2YWx1ZT17IGF0dHJpYnV0ZXMubGFiZWxTaXplIH1cblx0XHRcdFx0XHRcdFx0Y2xhc3NOYW1lPVwid3Bmb3Jtcy1ndXRlbmJlcmctZm9ybS1zZWxlY3Rvci1maXgtYm90dG9tLW1hcmdpblwiXG5cdFx0XHRcdFx0XHRcdG9wdGlvbnM9eyBzaXplT3B0aW9uc31cblx0XHRcdFx0XHRcdFx0b25DaGFuZ2U9eyB2YWx1ZSA9PiBoYW5kbGVycy5zdHlsZUF0dHJDaGFuZ2UoICdsYWJlbFNpemUnLCB2YWx1ZSApIH1cblx0XHRcdFx0XHRcdC8+XG5cblx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwid3Bmb3Jtcy1ndXRlbmJlcmctZm9ybS1zZWxlY3Rvci1jb2xvci1waWNrZXJcIj5cblx0XHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJ3cGZvcm1zLWd1dGVuYmVyZy1mb3JtLXNlbGVjdG9yLWNvbnRyb2wtbGFiZWxcIj57IHN0cmluZ3MuY29sb3JzIH08L2Rpdj5cblx0XHRcdFx0XHRcdFx0PFBhbmVsQ29sb3JTZXR0aW5nc1xuXHRcdFx0XHRcdFx0XHRcdF9fZXhwZXJpbWVudGFsSXNSZW5kZXJlZEluU2lkZWJhclxuXHRcdFx0XHRcdFx0XHRcdGVuYWJsZUFscGhhXG5cdFx0XHRcdFx0XHRcdFx0c2hvd1RpdGxlPXsgZmFsc2UgfVxuXHRcdFx0XHRcdFx0XHRcdGNsYXNzTmFtZT1cIndwZm9ybXMtZ3V0ZW5iZXJnLWZvcm0tc2VsZWN0b3ItY29sb3ItcGFuZWxcIlxuXHRcdFx0XHRcdFx0XHRcdGNvbG9yU2V0dGluZ3M9e1tcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dmFsdWU6IGF0dHJpYnV0ZXMubGFiZWxDb2xvcixcblx0XHRcdFx0XHRcdFx0XHRcdFx0b25DaGFuZ2U6IHZhbHVlID0+IGhhbmRsZXJzLnN0eWxlQXR0ckNoYW5nZSggJ2xhYmVsQ29sb3InLCB2YWx1ZSApLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRsYWJlbDogc3RyaW5ncy5sYWJlbCxcblx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHZhbHVlOiBhdHRyaWJ1dGVzLmxhYmVsU3VibGFiZWxDb2xvcixcblx0XHRcdFx0XHRcdFx0XHRcdFx0b25DaGFuZ2U6IHZhbHVlID0+IGhhbmRsZXJzLnN0eWxlQXR0ckNoYW5nZSggJ2xhYmVsU3VibGFiZWxDb2xvcicsIHZhbHVlICksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBzdHJpbmdzLnN1YmxhYmVsX2hpbnRzLnJlcGxhY2UoICcmYW1wOycsICcmJyApLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dmFsdWU6IGF0dHJpYnV0ZXMubGFiZWxFcnJvckNvbG9yLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRvbkNoYW5nZTogdmFsdWUgPT4gaGFuZGxlcnMuc3R5bGVBdHRyQ2hhbmdlKCAnbGFiZWxFcnJvckNvbG9yJywgdmFsdWUgKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0bGFiZWw6IHN0cmluZ3MuZXJyb3JfbWVzc2FnZSxcblx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XX1cblx0XHRcdFx0XHRcdFx0Lz5cblx0XHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHRcdDwvUGFuZWxCb2R5PlxuXHRcdFx0XHQpO1xuXHRcdFx0fSxcblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBHZXQgQnV0dG9uIHN0eWxlcyBKU1ggY29kZS5cblx0XHRcdCAqXG5cdFx0XHQgKiBAc2luY2UgMS44LjFcblx0XHRcdCAqXG5cdFx0XHQgKiBAcGFyYW0ge29iamVjdH0gYXR0cmlidXRlcyAgQmxvY2sgYXR0cmlidXRlcy5cblx0XHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBoYW5kbGVycyAgICBCbG9jayBldmVudCBoYW5kbGVycy5cblx0XHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBzaXplT3B0aW9ucyBTaXplIHNlbGVjdG9yIG9wdGlvbnMuXG5cdFx0XHQgKlxuXHRcdFx0ICogQHJldHVybnMge0pTWC5FbGVtZW50fSAgQnV0dG9uIHN0eWxlcyBKU1ggY29kZS5cblx0XHRcdCAqL1xuXHRcdFx0Z2V0QnV0dG9uU3R5bGVzOiBmdW5jdGlvbiggYXR0cmlidXRlcywgaGFuZGxlcnMsIHNpemVPcHRpb25zICkge1xuXG5cdFx0XHRcdHJldHVybiAoXG5cdFx0XHRcdFx0PFBhbmVsQm9keSBjbGFzc05hbWU9eyBhcHAuZ2V0UGFuZWxDbGFzcyggYXR0cmlidXRlcyApIH0gdGl0bGU9eyBzdHJpbmdzLmJ1dHRvbl9zdHlsZXMgfT5cblx0XHRcdFx0XHRcdDxGbGV4IGdhcD17NH0gYWxpZ249XCJmbGV4LXN0YXJ0XCIgY2xhc3NOYW1lPXsnd3Bmb3Jtcy1ndXRlbmJlcmctZm9ybS1zZWxlY3Rvci1mbGV4J30ganVzdGlmeT1cInNwYWNlLWJldHdlZW5cIj5cblx0XHRcdFx0XHRcdFx0PEZsZXhCbG9jaz5cblx0XHRcdFx0XHRcdFx0XHQ8U2VsZWN0Q29udHJvbFxuXHRcdFx0XHRcdFx0XHRcdFx0bGFiZWw9eyBzdHJpbmdzLnNpemUgfVxuXHRcdFx0XHRcdFx0XHRcdFx0dmFsdWU9eyBhdHRyaWJ1dGVzLmJ1dHRvblNpemUgfVxuXHRcdFx0XHRcdFx0XHRcdFx0b3B0aW9ucz17IHNpemVPcHRpb25zIH1cblx0XHRcdFx0XHRcdFx0XHRcdG9uQ2hhbmdlPXsgdmFsdWUgPT4gaGFuZGxlcnMuc3R5bGVBdHRyQ2hhbmdlKCAnYnV0dG9uU2l6ZScsIHZhbHVlICkgfVxuXHRcdFx0XHRcdFx0XHRcdC8+XG5cdFx0XHRcdFx0XHRcdDwvRmxleEJsb2NrPlxuXHRcdFx0XHRcdFx0XHQ8RmxleEJsb2NrPlxuXHRcdFx0XHRcdFx0XHRcdDxfX2V4cGVyaW1lbnRhbFVuaXRDb250cm9sXG5cdFx0XHRcdFx0XHRcdFx0XHRvbkNoYW5nZT17IHZhbHVlID0+IGhhbmRsZXJzLnN0eWxlQXR0ckNoYW5nZSggJ2J1dHRvbkJvcmRlclJhZGl1cycsIHZhbHVlICkgfVxuXHRcdFx0XHRcdFx0XHRcdFx0bGFiZWw9eyBzdHJpbmdzLmJvcmRlcl9yYWRpdXMgfVxuXHRcdFx0XHRcdFx0XHRcdFx0aXNVbml0U2VsZWN0VGFiYmFibGVcblx0XHRcdFx0XHRcdFx0XHRcdHZhbHVlPXsgYXR0cmlidXRlcy5idXR0b25Cb3JkZXJSYWRpdXMgfSAvPlxuXHRcdFx0XHRcdFx0XHQ8L0ZsZXhCbG9jaz5cblx0XHRcdFx0XHRcdDwvRmxleD5cblxuXHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJ3cGZvcm1zLWd1dGVuYmVyZy1mb3JtLXNlbGVjdG9yLWNvbG9yLXBpY2tlclwiPlxuXHRcdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIndwZm9ybXMtZ3V0ZW5iZXJnLWZvcm0tc2VsZWN0b3ItY29udHJvbC1sYWJlbFwiPnsgc3RyaW5ncy5jb2xvcnMgfTwvZGl2PlxuXHRcdFx0XHRcdFx0XHQ8UGFuZWxDb2xvclNldHRpbmdzXG5cdFx0XHRcdFx0XHRcdFx0X19leHBlcmltZW50YWxJc1JlbmRlcmVkSW5TaWRlYmFyXG5cdFx0XHRcdFx0XHRcdFx0ZW5hYmxlQWxwaGFcblx0XHRcdFx0XHRcdFx0XHRzaG93VGl0bGU9eyBmYWxzZSB9XG5cdFx0XHRcdFx0XHRcdFx0Y2xhc3NOYW1lPVwid3Bmb3Jtcy1ndXRlbmJlcmctZm9ybS1zZWxlY3Rvci1jb2xvci1wYW5lbFwiXG5cdFx0XHRcdFx0XHRcdFx0Y29sb3JTZXR0aW5ncz17W1xuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR2YWx1ZTogYXR0cmlidXRlcy5idXR0b25CYWNrZ3JvdW5kQ29sb3IsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG9uQ2hhbmdlOiB2YWx1ZSA9PiBoYW5kbGVycy5zdHlsZUF0dHJDaGFuZ2UoICdidXR0b25CYWNrZ3JvdW5kQ29sb3InLCB2YWx1ZSApLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRsYWJlbDogc3RyaW5ncy5iYWNrZ3JvdW5kLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dmFsdWU6IGF0dHJpYnV0ZXMuYnV0dG9uVGV4dENvbG9yLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRvbkNoYW5nZTogdmFsdWUgPT4gaGFuZGxlcnMuc3R5bGVBdHRyQ2hhbmdlKCAnYnV0dG9uVGV4dENvbG9yJywgdmFsdWUgKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0bGFiZWw6IHN0cmluZ3MudGV4dCxcblx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XX0gLz5cblx0XHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJ3cGZvcm1zLWd1dGVuYmVyZy1mb3JtLXNlbGVjdG9yLWxlZ2VuZCB3cGZvcm1zLWJ1dHRvbi1jb2xvci1ub3RpY2VcIj5cblx0XHRcdFx0XHRcdFx0XHR7IHN0cmluZ3MuYnV0dG9uX2NvbG9yX25vdGljZSB9XG5cdFx0XHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PC9QYW5lbEJvZHk+XG5cdFx0XHRcdCk7XG5cdFx0XHR9LFxuXG5cdFx0XHQvKipcblx0XHRcdCAqIEdldCBzdHlsZSBzZXR0aW5ncyBKU1ggY29kZS5cblx0XHRcdCAqXG5cdFx0XHQgKiBAc2luY2UgMS44LjFcblx0XHRcdCAqXG5cdFx0XHQgKiBAcGFyYW0ge29iamVjdH0gYXR0cmlidXRlcyAgQmxvY2sgYXR0cmlidXRlcy5cblx0XHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBoYW5kbGVycyAgICBCbG9jayBldmVudCBoYW5kbGVycy5cblx0XHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBzaXplT3B0aW9ucyBTaXplIHNlbGVjdG9yIG9wdGlvbnMuXG5cdFx0XHQgKlxuXHRcdFx0ICogQHJldHVybnMge0pTWC5FbGVtZW50fSBJbnNwZWN0b3IgY29udHJvbHMgSlNYIGNvZGUuXG5cdFx0XHQgKi9cblx0XHRcdGdldFN0eWxlU2V0dGluZ3M6IGZ1bmN0aW9uKCBhdHRyaWJ1dGVzLCBoYW5kbGVycywgc2l6ZU9wdGlvbnMgKSB7XG5cblx0XHRcdFx0cmV0dXJuIChcblx0XHRcdFx0XHQ8SW5zcGVjdG9yQ29udHJvbHMga2V5PVwid3Bmb3Jtcy1ndXRlbmJlcmctZm9ybS1zZWxlY3Rvci1zdHlsZS1zZXR0aW5nc1wiPlxuXHRcdFx0XHRcdFx0eyBhcHAuanN4UGFydHMuZ2V0RmllbGRTdHlsZXMoIGF0dHJpYnV0ZXMsIGhhbmRsZXJzLCBzaXplT3B0aW9ucyApIH1cblx0XHRcdFx0XHRcdHsgYXBwLmpzeFBhcnRzLmdldExhYmVsU3R5bGVzKCBhdHRyaWJ1dGVzLCBoYW5kbGVycywgc2l6ZU9wdGlvbnMgKSB9XG5cdFx0XHRcdFx0XHR7IGFwcC5qc3hQYXJ0cy5nZXRCdXR0b25TdHlsZXMoIGF0dHJpYnV0ZXMsIGhhbmRsZXJzLCBzaXplT3B0aW9ucyApIH1cblx0XHRcdFx0XHQ8L0luc3BlY3RvckNvbnRyb2xzPlxuXHRcdFx0XHQpO1xuXHRcdFx0fSxcblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBHZXQgYWR2YW5jZWQgc2V0dGluZ3MgSlNYIGNvZGUuXG5cdFx0XHQgKlxuXHRcdFx0ICogQHNpbmNlIDEuOC4xXG5cdFx0XHQgKlxuXHRcdFx0ICogQHBhcmFtIHtvYmplY3R9IGF0dHJpYnV0ZXMgQmxvY2sgYXR0cmlidXRlcy5cblx0XHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBoYW5kbGVycyAgIEJsb2NrIGV2ZW50IGhhbmRsZXJzLlxuXHRcdFx0ICpcblx0XHRcdCAqIEByZXR1cm5zIHtKU1guRWxlbWVudH0gSW5zcGVjdG9yIGFkdmFuY2VkIGNvbnRyb2xzIEpTWCBjb2RlLlxuXHRcdFx0ICovXG5cdFx0XHRnZXRBZHZhbmNlZFNldHRpbmdzOiBmdW5jdGlvbiggYXR0cmlidXRlcywgaGFuZGxlcnMgKSB7XG5cblx0XHRcdFx0Y29uc3QgWyBpc09wZW4sIHNldE9wZW4gXSA9IHVzZVN0YXRlKCBmYWxzZSApO1xuXHRcdFx0XHRjb25zdCBvcGVuTW9kYWwgPSAoKSA9PiBzZXRPcGVuKCB0cnVlICk7XG5cdFx0XHRcdGNvbnN0IGNsb3NlTW9kYWwgPSAoKSA9PiBzZXRPcGVuKCBmYWxzZSApO1xuXG5cdFx0XHRcdHJldHVybiAoXG5cdFx0XHRcdFx0PEluc3BlY3RvckFkdmFuY2VkQ29udHJvbHM+XG5cdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT17IGFwcC5nZXRQYW5lbENsYXNzKCBhdHRyaWJ1dGVzICkgfT5cblx0XHRcdFx0XHRcdFx0PFRleHRhcmVhQ29udHJvbFxuXHRcdFx0XHRcdFx0XHRcdGxhYmVsPXsgc3RyaW5ncy5jb3B5X3Bhc3RlX3NldHRpbmdzIH1cblx0XHRcdFx0XHRcdFx0XHRyb3dzPVwiNFwiXG5cdFx0XHRcdFx0XHRcdFx0c3BlbGxDaGVjaz1cImZhbHNlXCJcblx0XHRcdFx0XHRcdFx0XHR2YWx1ZT17IGF0dHJpYnV0ZXMuY29weVBhc3RlSnNvblZhbHVlIH1cblx0XHRcdFx0XHRcdFx0XHRvbkNoYW5nZT17IHZhbHVlID0+IGhhbmRsZXJzLnBhc3RlU2V0dGluZ3MoIHZhbHVlICkgfVxuXHRcdFx0XHRcdFx0XHQvPlxuXHRcdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIndwZm9ybXMtZ3V0ZW5iZXJnLWZvcm0tc2VsZWN0b3ItbGVnZW5kXCIgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3sgX19odG1sOiBzdHJpbmdzLmNvcHlfcGFzdGVfbm90aWNlIH19PjwvZGl2PlxuXG5cdFx0XHRcdFx0XHRcdDxCdXR0b24gY2xhc3NOYW1lPSd3cGZvcm1zLWd1dGVuYmVyZy1mb3JtLXNlbGVjdG9yLXJlc2V0LWJ1dHRvbicgb25DbGljaz17IG9wZW5Nb2RhbCB9Pnsgc3RyaW5ncy5yZXNldF9zdHlsZV9zZXR0aW5ncyB9PC9CdXR0b24+XG5cdFx0XHRcdFx0XHQ8L2Rpdj5cblxuXHRcdFx0XHRcdFx0eyBpc09wZW4gJiYgKFxuXHRcdFx0XHRcdFx0XHQ8TW9kYWwgIGNsYXNzTmFtZT1cIndwZm9ybXMtZ3V0ZW5iZXJnLW1vZGFsXCJcblx0XHRcdFx0XHRcdFx0XHR0aXRsZT17IHN0cmluZ3MucmVzZXRfc3R5bGVfc2V0dGluZ3N9XG5cdFx0XHRcdFx0XHRcdFx0b25SZXF1ZXN0Q2xvc2U9eyBjbG9zZU1vZGFsIH0+XG5cblx0XHRcdFx0XHRcdFx0XHQ8cD57IHN0cmluZ3MucmVzZXRfc2V0dGluZ3NfY29uZmlybV90ZXh0IH08L3A+XG5cblx0XHRcdFx0XHRcdFx0XHQ8RmxleCBnYXA9ezN9IGFsaWduPVwiY2VudGVyXCIganVzdGlmeT1cImZsZXgtZW5kXCI+XG5cdFx0XHRcdFx0XHRcdFx0XHQ8QnV0dG9uIGlzU2Vjb25kYXJ5IG9uQ2xpY2s9eyBjbG9zZU1vZGFsIH0+XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHtzdHJpbmdzLmJ0bl9ub31cblx0XHRcdFx0XHRcdFx0XHRcdDwvQnV0dG9uPlxuXG5cdFx0XHRcdFx0XHRcdFx0XHQ8QnV0dG9uIGlzUHJpbWFyeSBvbkNsaWNrPXsgKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRjbG9zZU1vZGFsKCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGhhbmRsZXJzLnJlc2V0U2V0dGluZ3MoKTtcblx0XHRcdFx0XHRcdFx0XHRcdH0gfT5cblx0XHRcdFx0XHRcdFx0XHRcdFx0eyBzdHJpbmdzLmJ0bl95ZXNfcmVzZXQgfVxuXHRcdFx0XHRcdFx0XHRcdFx0PC9CdXR0b24+XG5cdFx0XHRcdFx0XHRcdFx0PC9GbGV4PlxuXHRcdFx0XHRcdFx0XHQ8L01vZGFsPlxuXHRcdFx0XHRcdFx0KSB9XG5cdFx0XHRcdFx0PC9JbnNwZWN0b3JBZHZhbmNlZENvbnRyb2xzPlxuXHRcdFx0XHQpO1xuXHRcdFx0fSxcblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBHZXQgYmxvY2sgY29udGVudCBKU1ggY29kZS5cblx0XHRcdCAqXG5cdFx0XHQgKiBAc2luY2UgMS44LjFcblx0XHRcdCAqXG5cdFx0XHQgKiBAcGFyYW0ge29iamVjdH0gcHJvcHMgQmxvY2sgcHJvcGVydGllcy5cblx0XHRcdCAqXG5cdFx0XHQgKiBAcmV0dXJucyB7SlNYLkVsZW1lbnR9IEJsb2NrIGNvbnRlbnQgSlNYIGNvZGUuXG5cdFx0XHQgKi9cblx0XHRcdGdldEJsb2NrRm9ybUNvbnRlbnQ6IGZ1bmN0aW9uKCBwcm9wcyApIHtcblxuXHRcdFx0XHRpZiAoIHRyaWdnZXJTZXJ2ZXJSZW5kZXIgKSB7XG5cblx0XHRcdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHRcdFx0PFNlcnZlclNpZGVSZW5kZXJcblx0XHRcdFx0XHRcdFx0a2V5PVwid3Bmb3Jtcy1ndXRlbmJlcmctZm9ybS1zZWxlY3Rvci1zZXJ2ZXItc2lkZS1yZW5kZXJlclwiXG5cdFx0XHRcdFx0XHRcdGJsb2NrPVwid3Bmb3Jtcy9mb3JtLXNlbGVjdG9yXCJcblx0XHRcdFx0XHRcdFx0YXR0cmlidXRlcz17IHByb3BzLmF0dHJpYnV0ZXMgfVxuXHRcdFx0XHRcdFx0Lz5cblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgY2xpZW50SWQgPSBwcm9wcy5jbGllbnRJZDtcblx0XHRcdFx0Y29uc3QgYmxvY2sgPSBhcHAuZ2V0QmxvY2tDb250YWluZXIoIHByb3BzICk7XG5cblx0XHRcdFx0Ly8gSW4gdGhlIGNhc2Ugb2YgZW1wdHkgY29udGVudCwgdXNlIHNlcnZlciBzaWRlIHJlbmRlcmVyLlxuXHRcdFx0XHQvLyBUaGlzIGhhcHBlbnMgd2hlbiB0aGUgYmxvY2sgaXMgZHVwbGljYXRlZCBvciBjb252ZXJ0ZWQgdG8gYSByZXVzYWJsZSBibG9jay5cblx0XHRcdFx0aWYgKCAhIGJsb2NrIHx8ICEgYmxvY2suaW5uZXJIVE1MICkge1xuXHRcdFx0XHRcdHRyaWdnZXJTZXJ2ZXJSZW5kZXIgPSB0cnVlO1xuXG5cdFx0XHRcdFx0cmV0dXJuIGFwcC5qc3hQYXJ0cy5nZXRCbG9ja0Zvcm1Db250ZW50KCBwcm9wcyApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YmxvY2tzWyBjbGllbnRJZCBdID0gYmxvY2tzWyBjbGllbnRJZCBdIHx8IHt9O1xuXHRcdFx0XHRibG9ja3NbIGNsaWVudElkIF0uYmxvY2tIVE1MID0gYmxvY2suaW5uZXJIVE1MO1xuXHRcdFx0XHRibG9ja3NbIGNsaWVudElkIF0ubG9hZGVkRm9ybUlkID0gcHJvcHMuYXR0cmlidXRlcy5mb3JtSWQ7XG5cblx0XHRcdFx0cmV0dXJuIChcblx0XHRcdFx0XHQ8RnJhZ21lbnQga2V5PVwid3Bmb3Jtcy1ndXRlbmJlcmctZm9ybS1zZWxlY3Rvci1mcmFnbWVudC1mb3JtLWh0bWxcIj5cblx0XHRcdFx0XHRcdDxkaXYgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3sgX19odG1sOiBibG9ja3NbIGNsaWVudElkIF0uYmxvY2tIVE1MIH19IC8+XG5cdFx0XHRcdFx0PC9GcmFnbWVudD5cblx0XHRcdFx0KTtcblx0XHRcdH0sXG5cblx0XHRcdC8qKlxuXHRcdFx0ICogR2V0IGJsb2NrIHByZXZpZXcgSlNYIGNvZGUuXG5cdFx0XHQgKlxuXHRcdFx0ICogQHNpbmNlIDEuOC4xXG5cdFx0XHQgKlxuXHRcdFx0ICogQHJldHVybnMge0pTWC5FbGVtZW50fSBCbG9jayBwcmV2aWV3IEpTWCBjb2RlLlxuXHRcdFx0ICovXG5cdFx0XHRnZXRCbG9ja1ByZXZpZXc6IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRcdHJldHVybiAoXG5cdFx0XHRcdFx0PEZyYWdtZW50XG5cdFx0XHRcdFx0XHRrZXk9XCJ3cGZvcm1zLWd1dGVuYmVyZy1mb3JtLXNlbGVjdG9yLWZyYWdtZW50LWJsb2NrLXByZXZpZXdcIj5cblx0XHRcdFx0XHRcdDxpbWcgc3JjPXsgd3Bmb3Jtc19ndXRlbmJlcmdfZm9ybV9zZWxlY3Rvci5ibG9ja19wcmV2aWV3X3VybCB9IHN0eWxlPXt7IHdpZHRoOiAnMTAwJScgfX0gLz5cblx0XHRcdFx0XHQ8L0ZyYWdtZW50PlxuXHRcdFx0XHQpO1xuXHRcdFx0fSxcblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBHZXQgYmxvY2sgcGxhY2Vob2xkZXIgKGZvcm0gc2VsZWN0b3IpIEpTWCBjb2RlLlxuXHRcdFx0ICpcblx0XHRcdCAqIEBzaW5jZSAxLjguMVxuXHRcdFx0ICpcblx0XHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBhdHRyaWJ1dGVzICBCbG9jayBhdHRyaWJ1dGVzLlxuXHRcdFx0ICogQHBhcmFtIHtvYmplY3R9IGhhbmRsZXJzICAgIEJsb2NrIGV2ZW50IGhhbmRsZXJzLlxuXHRcdFx0ICogQHBhcmFtIHtvYmplY3R9IGZvcm1PcHRpb25zIEZvcm0gc2VsZWN0b3Igb3B0aW9ucy5cblx0XHRcdCAqXG5cdFx0XHQgKiBAcmV0dXJucyB7SlNYLkVsZW1lbnR9IEJsb2NrIHBsYWNlaG9sZGVyIEpTWCBjb2RlLlxuXHRcdFx0ICovXG5cdFx0XHRnZXRCbG9ja1BsYWNlaG9sZGVyOiBmdW5jdGlvbiggYXR0cmlidXRlcywgaGFuZGxlcnMsIGZvcm1PcHRpb25zICkge1xuXG5cdFx0XHRcdHJldHVybiAoXG5cdFx0XHRcdFx0PFBsYWNlaG9sZGVyXG5cdFx0XHRcdFx0XHRrZXk9XCJ3cGZvcm1zLWd1dGVuYmVyZy1mb3JtLXNlbGVjdG9yLXdyYXBcIlxuXHRcdFx0XHRcdFx0Y2xhc3NOYW1lPVwid3Bmb3Jtcy1ndXRlbmJlcmctZm9ybS1zZWxlY3Rvci13cmFwXCI+XG5cdFx0XHRcdFx0XHQ8aW1nIHNyYz17d3Bmb3Jtc19ndXRlbmJlcmdfZm9ybV9zZWxlY3Rvci5sb2dvX3VybH0gLz5cblx0XHRcdFx0XHRcdDxoMz57IHN0cmluZ3MudGl0bGUgfTwvaDM+XG5cdFx0XHRcdFx0XHQ8U2VsZWN0Q29udHJvbFxuXHRcdFx0XHRcdFx0XHRrZXk9XCJ3cGZvcm1zLWd1dGVuYmVyZy1mb3JtLXNlbGVjdG9yLXNlbGVjdC1jb250cm9sXCJcblx0XHRcdFx0XHRcdFx0dmFsdWU9eyBhdHRyaWJ1dGVzLmZvcm1JZCB9XG5cdFx0XHRcdFx0XHRcdG9wdGlvbnM9eyBmb3JtT3B0aW9ucyB9XG5cdFx0XHRcdFx0XHRcdG9uQ2hhbmdlPXsgdmFsdWUgPT4gaGFuZGxlcnMuYXR0ckNoYW5nZSggJ2Zvcm1JZCcsIHZhbHVlICkgfVxuXHRcdFx0XHRcdFx0Lz5cblx0XHRcdFx0XHQ8L1BsYWNlaG9sZGVyPlxuXHRcdFx0XHQpO1xuXHRcdFx0fSxcblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICogR2V0IFN0eWxlIFNldHRpbmdzIHBhbmVsIGNsYXNzLlxuXHRcdCAqXG5cdFx0ICogQHNpbmNlIDEuOC4xXG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge29iamVjdH0gYXR0cmlidXRlcyBCbG9jayBhdHRyaWJ1dGVzLlxuXHRcdCAqXG5cdFx0ICogQHJldHVybnMge3N0cmluZ30gU3R5bGUgU2V0dGluZ3MgcGFuZWwgY2xhc3MuXG5cdFx0ICovXG5cdFx0Z2V0UGFuZWxDbGFzczogZnVuY3Rpb24oIGF0dHJpYnV0ZXMgKSB7XG5cblx0XHRcdGxldCBjc3NDbGFzcyA9ICd3cGZvcm1zLWd1dGVuYmVyZy1wYW5lbCB3cGZvcm1zLWJsb2NrLXNldHRpbmdzLScgKyBhdHRyaWJ1dGVzLmNsaWVudElkO1xuXG5cdFx0XHRpZiAoICEgYXBwLmlzRnVsbFN0eWxpbmdFbmFibGVkKCkgKSB7XG5cdFx0XHRcdGNzc0NsYXNzICs9ICcgZGlzYWJsZWRfcGFuZWwnO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gY3NzQ2xhc3M7XG5cdFx0fSxcblxuXHRcdC8qKlxuXHRcdCAqIERldGVybWluZSB3aGV0aGVyIHRoZSBmdWxsIHN0eWxpbmcgaXMgZW5hYmxlZC5cblx0XHQgKlxuXHRcdCAqIEBzaW5jZSAxLjguMVxuXHRcdCAqXG5cdFx0ICogQHJldHVybnMge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGZ1bGwgc3R5bGluZyBpcyBlbmFibGVkLlxuXHRcdCAqL1xuXHRcdGlzRnVsbFN0eWxpbmdFbmFibGVkOiBmdW5jdGlvbigpIHtcblxuXHRcdFx0cmV0dXJuIHdwZm9ybXNfZ3V0ZW5iZXJnX2Zvcm1fc2VsZWN0b3IuaXNfbW9kZXJuX21hcmt1cCAmJiB3cGZvcm1zX2d1dGVuYmVyZ19mb3JtX3NlbGVjdG9yLmlzX2Z1bGxfc3R5bGluZztcblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICogR2V0IGJsb2NrIGNvbnRhaW5lciBET00gZWxlbWVudC5cblx0XHQgKlxuXHRcdCAqIEBzaW5jZSAxLjguMVxuXHRcdCAqXG5cdFx0ICogQHBhcmFtIHtvYmplY3R9IHByb3BzIEJsb2NrIHByb3BlcnRpZXMuXG5cdFx0ICpcblx0XHQgKiBAcmV0dXJucyB7RWxlbWVudH0gQmxvY2sgY29udGFpbmVyLlxuXHRcdCAqL1xuXHRcdGdldEJsb2NrQ29udGFpbmVyOiBmdW5jdGlvbiggcHJvcHMgKSB7XG5cblx0XHRcdGNvbnN0IGJsb2NrU2VsZWN0b3IgPSBgI2Jsb2NrLSR7cHJvcHMuY2xpZW50SWR9ID4gZGl2YDtcblx0XHRcdGxldCBibG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoIGJsb2NrU2VsZWN0b3IgKTtcblxuXHRcdFx0Ly8gRm9yIEZTRSAvIEd1dGVuYmVyZyBwbHVnaW4gd2UgbmVlZCB0byB0YWtlIGEgbG9vayBpbnNpZGUgdGhlIGlmcmFtZS5cblx0XHRcdGlmICggISBibG9jayApIHtcblx0XHRcdFx0Y29uc3QgZWRpdG9yQ2FudmFzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvciggJ2lmcmFtZVtuYW1lPVwiZWRpdG9yLWNhbnZhc1wiXScgKTtcblxuXHRcdFx0XHRibG9jayA9IGVkaXRvckNhbnZhcyAmJiBlZGl0b3JDYW52YXMuY29udGVudFdpbmRvdy5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCBibG9ja1NlbGVjdG9yICk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBibG9jaztcblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICogR2V0IHNldHRpbmdzIGZpZWxkcyBldmVudCBoYW5kbGVycy5cblx0XHQgKlxuXHRcdCAqIEBzaW5jZSAxLjguMVxuXHRcdCAqXG5cdFx0ICogQHBhcmFtIHtvYmplY3R9IHByb3BzIEJsb2NrIHByb3BlcnRpZXMuXG5cdFx0ICpcblx0XHQgKiBAcmV0dXJucyB7b2JqZWN0fSBPYmplY3QgdGhhdCBjb250YWlucyBldmVudCBoYW5kbGVycyBmb3IgdGhlIHNldHRpbmdzIGZpZWxkcy5cblx0XHQgKi9cblx0XHRnZXRTZXR0aW5nc0ZpZWxkc0hhbmRsZXJzOiBmdW5jdGlvbiggcHJvcHMgKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxpbmVzLXBlci1mdW5jdGlvblxuXG5cdFx0XHRyZXR1cm4ge1xuXG5cdFx0XHRcdC8qKlxuXHRcdFx0XHQgKiBGaWVsZCBzdHlsZSBhdHRyaWJ1dGUgY2hhbmdlIGV2ZW50IGhhbmRsZXIuXG5cdFx0XHRcdCAqXG5cdFx0XHRcdCAqIEBzaW5jZSAxLjguMVxuXHRcdFx0XHQgKlxuXHRcdFx0XHQgKiBAcGFyYW0ge3N0cmluZ30gYXR0cmlidXRlIEF0dHJpYnV0ZSBuYW1lLlxuXHRcdFx0XHQgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgICAgIE5ldyBhdHRyaWJ1dGUgdmFsdWUuXG5cdFx0XHRcdCAqL1xuXHRcdFx0XHRzdHlsZUF0dHJDaGFuZ2U6IGZ1bmN0aW9uKCBhdHRyaWJ1dGUsIHZhbHVlICkge1xuXG5cdFx0XHRcdFx0Y29uc3QgYmxvY2sgPSBhcHAuZ2V0QmxvY2tDb250YWluZXIoIHByb3BzICksXG5cdFx0XHRcdFx0XHRjb250YWluZXIgPSBibG9jay5xdWVyeVNlbGVjdG9yKCBgI3dwZm9ybXMtJHtwcm9wcy5hdHRyaWJ1dGVzLmZvcm1JZH1gICksXG5cdFx0XHRcdFx0XHRwcm9wZXJ0eSA9IGF0dHJpYnV0ZS5yZXBsYWNlKCAvW0EtWl0vZywgbGV0dGVyID0+IGAtJHtsZXR0ZXIudG9Mb3dlckNhc2UoKX1gICksXG5cdFx0XHRcdFx0XHRzZXRBdHRyID0ge307XG5cblx0XHRcdFx0XHRpZiAoIGNvbnRhaW5lciApIHtcblx0XHRcdFx0XHRcdHN3aXRjaCAoIHByb3BlcnR5ICkge1xuXHRcdFx0XHRcdFx0XHRjYXNlICdmaWVsZC1zaXplJzpcblx0XHRcdFx0XHRcdFx0Y2FzZSAnbGFiZWwtc2l6ZSc6XG5cdFx0XHRcdFx0XHRcdGNhc2UgJ2J1dHRvbi1zaXplJzpcblx0XHRcdFx0XHRcdFx0XHRmb3IgKCBjb25zdCBrZXkgaW4gc2l6ZXNbIHByb3BlcnR5IF1bIHZhbHVlIF0gKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRjb250YWluZXIuc3R5bGUuc2V0UHJvcGVydHkoXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGAtLXdwZm9ybXMtJHtwcm9wZXJ0eX0tJHtrZXl9YCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0c2l6ZXNbIHByb3BlcnR5IF1bIHZhbHVlIF1bIGtleSBdLFxuXHRcdFx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdFx0XHRcdGNvbnRhaW5lci5zdHlsZS5zZXRQcm9wZXJ0eSggYC0td3Bmb3Jtcy0ke3Byb3BlcnR5fWAsIHZhbHVlICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0c2V0QXR0clsgYXR0cmlidXRlIF0gPSB2YWx1ZTtcblxuXHRcdFx0XHRcdHByb3BzLnNldEF0dHJpYnV0ZXMoIHNldEF0dHIgKTtcblxuXHRcdFx0XHRcdHRyaWdnZXJTZXJ2ZXJSZW5kZXIgPSBmYWxzZTtcblxuXHRcdFx0XHRcdHRoaXMudXBkYXRlQ29weVBhc3RlQ29udGVudCgpO1xuXG5cdFx0XHRcdFx0JCggd2luZG93ICkudHJpZ2dlciggJ3dwZm9ybXNGb3JtU2VsZWN0b3JTdHlsZUF0dHJDaGFuZ2UnLCBbIGJsb2NrLCBwcm9wcywgYXR0cmlidXRlLCB2YWx1ZSBdICk7XG5cdFx0XHRcdH0sXG5cblx0XHRcdFx0LyoqXG5cdFx0XHRcdCAqIEZpZWxkIHJlZ3VsYXIgYXR0cmlidXRlIGNoYW5nZSBldmVudCBoYW5kbGVyLlxuXHRcdFx0XHQgKlxuXHRcdFx0XHQgKiBAc2luY2UgMS44LjFcblx0XHRcdFx0ICpcblx0XHRcdFx0ICogQHBhcmFtIHtzdHJpbmd9IGF0dHJpYnV0ZSBBdHRyaWJ1dGUgbmFtZS5cblx0XHRcdFx0ICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlICAgICBOZXcgYXR0cmlidXRlIHZhbHVlLlxuXHRcdFx0XHQgKi9cblx0XHRcdFx0YXR0ckNoYW5nZTogZnVuY3Rpb24oIGF0dHJpYnV0ZSwgdmFsdWUgKSB7XG5cblx0XHRcdFx0XHRjb25zdCBzZXRBdHRyID0ge307XG5cblx0XHRcdFx0XHRzZXRBdHRyWyBhdHRyaWJ1dGUgXSA9IHZhbHVlO1xuXG5cdFx0XHRcdFx0cHJvcHMuc2V0QXR0cmlidXRlcyggc2V0QXR0ciApO1xuXG5cdFx0XHRcdFx0dHJpZ2dlclNlcnZlclJlbmRlciA9IHRydWU7XG5cblx0XHRcdFx0XHR0aGlzLnVwZGF0ZUNvcHlQYXN0ZUNvbnRlbnQoKTtcblx0XHRcdFx0fSxcblxuXHRcdFx0XHQvKipcblx0XHRcdFx0ICogUmVzZXQgRm9ybSBTdHlsZXMgc2V0dGluZ3MgdG8gZGVmYXVsdHMuXG5cdFx0XHRcdCAqXG5cdFx0XHRcdCAqIEBzaW5jZSAxLjguMVxuXHRcdFx0XHQgKi9cblx0XHRcdFx0cmVzZXRTZXR0aW5nczogZnVuY3Rpb24oKSB7XG5cblx0XHRcdFx0XHRmb3IgKCBsZXQga2V5IGluIGRlZmF1bHRTdHlsZVNldHRpbmdzICkge1xuXHRcdFx0XHRcdFx0dGhpcy5zdHlsZUF0dHJDaGFuZ2UoIGtleSwgZGVmYXVsdFN0eWxlU2V0dGluZ3NbIGtleSBdICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXG5cdFx0XHRcdC8qKlxuXHRcdFx0XHQgKiBVcGRhdGUgY29udGVudCBvZiB0aGUgXCJDb3B5L1Bhc3RlXCIgZmllbGRzLlxuXHRcdFx0XHQgKlxuXHRcdFx0XHQgKiBAc2luY2UgMS44LjFcblx0XHRcdFx0ICovXG5cdFx0XHRcdHVwZGF0ZUNvcHlQYXN0ZUNvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRcdFx0bGV0IGNvbnRlbnQgPSB7fTtcblx0XHRcdFx0XHRsZXQgYXR0cyA9IHdwLmRhdGEuc2VsZWN0KCAnY29yZS9ibG9jay1lZGl0b3InICkuZ2V0QmxvY2tBdHRyaWJ1dGVzKCBwcm9wcy5jbGllbnRJZCApO1xuXG5cdFx0XHRcdFx0Zm9yICggbGV0IGtleSBpbiBkZWZhdWx0U3R5bGVTZXR0aW5ncyApIHtcblx0XHRcdFx0XHRcdGNvbnRlbnRba2V5XSA9IGF0dHNbIGtleSBdO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHByb3BzLnNldEF0dHJpYnV0ZXMoIHsgJ2NvcHlQYXN0ZUpzb25WYWx1ZSc6IEpTT04uc3RyaW5naWZ5KCBjb250ZW50ICkgfSApO1xuXHRcdFx0XHR9LFxuXG5cdFx0XHRcdC8qKlxuXHRcdFx0XHQgKiBQYXN0ZSBzZXR0aW5ncyBoYW5kbGVyLlxuXHRcdFx0XHQgKlxuXHRcdFx0XHQgKiBAc2luY2UgMS44LjFcblx0XHRcdFx0ICpcblx0XHRcdFx0ICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIE5ldyBhdHRyaWJ1dGUgdmFsdWUuXG5cdFx0XHRcdCAqL1xuXHRcdFx0XHRwYXN0ZVNldHRpbmdzOiBmdW5jdGlvbiggdmFsdWUgKSB7XG5cblx0XHRcdFx0XHRsZXQgcGFzdGVBdHRyaWJ1dGVzID0gYXBwLnBhcnNlVmFsaWRhdGVKc29uKCB2YWx1ZSApO1xuXG5cdFx0XHRcdFx0aWYgKCAhIHBhc3RlQXR0cmlidXRlcyApIHtcblxuXHRcdFx0XHRcdFx0d3AuZGF0YS5kaXNwYXRjaCggJ2NvcmUvbm90aWNlcycgKS5jcmVhdGVFcnJvck5vdGljZShcblx0XHRcdFx0XHRcdFx0c3RyaW5ncy5jb3B5X3Bhc3RlX2Vycm9yLFxuXHRcdFx0XHRcdFx0XHR7IGlkOiAnd3Bmb3Jtcy1qc29uLXBhcnNlLWVycm9yJyB9XG5cdFx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0XHR0aGlzLnVwZGF0ZUNvcHlQYXN0ZUNvbnRlbnQoKTtcblxuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHBhc3RlQXR0cmlidXRlcy5jb3B5UGFzdGVKc29uVmFsdWUgPSB2YWx1ZTtcblxuXHRcdFx0XHRcdHByb3BzLnNldEF0dHJpYnV0ZXMoIHBhc3RlQXR0cmlidXRlcyApO1xuXG5cdFx0XHRcdFx0dHJpZ2dlclNlcnZlclJlbmRlciA9IHRydWU7XG5cdFx0XHRcdH0sXG5cdFx0XHR9O1xuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBQYXJzZSBhbmQgdmFsaWRhdGUgSlNPTiBzdHJpbmcuXG5cdFx0ICpcblx0XHQgKiBAc2luY2UgMS44LjFcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBKU09OIHN0cmluZy5cblx0XHQgKlxuXHRcdCAqIEByZXR1cm5zIHtib29sZWFufG9iamVjdH0gUGFyc2VkIEpTT04gb2JqZWN0IE9SIGZhbHNlIG9uIGVycm9yLlxuXHRcdCAqL1xuXHRcdHBhcnNlVmFsaWRhdGVKc29uOiBmdW5jdGlvbiggdmFsdWUgKSB7XG5cblx0XHRcdGlmICggdHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyApIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgYXR0cztcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0YXR0cyA9IEpTT04ucGFyc2UoIHZhbHVlICk7XG5cdFx0XHR9IGNhdGNoICggZXJyb3IgKSB7XG5cdFx0XHRcdGF0dHMgPSBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGF0dHM7XG5cdFx0fSxcblxuXHRcdC8qKlxuXHRcdCAqIEdldCBXUEZvcm1zIGljb24gRE9NIGVsZW1lbnQuXG5cdFx0ICpcblx0XHQgKiBAc2luY2UgMS44LjFcblx0XHQgKlxuXHRcdCAqIEByZXR1cm5zIHtET00uZWxlbWVudH0gV1BGb3JtcyBpY29uIERPTSBlbGVtZW50LlxuXHRcdCAqL1xuXHRcdGdldEljb246IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRyZXR1cm4gY3JlYXRlRWxlbWVudChcblx0XHRcdFx0J3N2ZycsXG5cdFx0XHRcdHsgd2lkdGg6IDIwLCBoZWlnaHQ6IDIwLCB2aWV3Qm94OiAnMCAwIDYxMiA2MTInLCBjbGFzc05hbWU6ICdkYXNoaWNvbicgfSxcblx0XHRcdFx0Y3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHQncGF0aCcsXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZmlsbDogJ2N1cnJlbnRDb2xvcicsXG5cdFx0XHRcdFx0XHRkOiAnTTU0NCwwSDY4QzMwLjQ0NSwwLDAsMzAuNDQ1LDAsNjh2NDc2YzAsMzcuNTU2LDMwLjQ0NSw2OCw2OCw2OGg0NzZjMzcuNTU2LDAsNjgtMzAuNDQ0LDY4LTY4VjY4IEM2MTIsMzAuNDQ1LDU4MS41NTYsMCw1NDQsMHogTTQ2NC40NCw2OEwzODcuNiwxMjAuMDJMMzIzLjM0LDY4SDQ2NC40NHogTTI4OC42Niw2OGwtNjQuMjYsNTIuMDJMMTQ3LjU2LDY4SDI4OC42NnogTTU0NCw1NDRINjggVjY4aDIyLjFsMTM2LDkyLjE0bDc5LjktNjQuNmw3OS41Niw2NC42bDEzNi05Mi4xNEg1NDRWNTQ0eiBNMTE0LjI0LDI2My4xNmg5NS44OHYtNDguMjhoLTk1Ljg4VjI2My4xNnogTTExNC4yNCwzNjAuNGg5NS44OCB2LTQ4LjYyaC05NS44OFYzNjAuNHogTTI0Mi43NiwzNjAuNGgyNTV2LTQ4LjYyaC0yNTVWMzYwLjRMMjQyLjc2LDM2MC40eiBNMjQyLjc2LDI2My4xNmgyNTV2LTQ4LjI4aC0yNTVWMjYzLjE2TDI0Mi43NiwyNjMuMTZ6IE0zNjguMjIsNDU3LjNoMTI5LjU0VjQwOEgzNjguMjJWNDU3LjN6Jyxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHQpLFxuXHRcdFx0KTtcblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICogR2V0IGJsb2NrIGF0dHJpYnV0ZXMuXG5cdFx0ICpcblx0XHQgKiBAc2luY2UgMS44LjFcblx0XHQgKlxuXHRcdCAqIEByZXR1cm5zIHtvYmplY3R9IEJsb2NrIGF0dHJpYnV0ZXMuXG5cdFx0ICovXG5cdFx0Z2V0QmxvY2tBdHRyaWJ1dGVzOiBmdW5jdGlvbigpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGluZXMtcGVyLWZ1bmN0aW9uXG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGNsaWVudElkOiB7XG5cdFx0XHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRcdFx0ZGVmYXVsdDogJycsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGZvcm1JZDoge1xuXHRcdFx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0XHRcdGRlZmF1bHQ6IGRlZmF1bHRzLmZvcm1JZCxcblx0XHRcdFx0fSxcblx0XHRcdFx0ZGlzcGxheVRpdGxlOiB7XG5cdFx0XHRcdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdFx0XHRcdGRlZmF1bHQ6IGRlZmF1bHRzLmRpc3BsYXlUaXRsZSxcblx0XHRcdFx0fSxcblx0XHRcdFx0ZGlzcGxheURlc2M6IHtcblx0XHRcdFx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0XHRcdFx0ZGVmYXVsdDogZGVmYXVsdHMuZGlzcGxheURlc2MsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHByZXZpZXc6IHtcblx0XHRcdFx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGZpZWxkU2l6ZToge1xuXHRcdFx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0XHRcdGRlZmF1bHQ6IGRlZmF1bHRzLmZpZWxkU2l6ZSxcblx0XHRcdFx0fSxcblx0XHRcdFx0ZmllbGRCb3JkZXJSYWRpdXM6IHtcblx0XHRcdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdFx0XHRkZWZhdWx0OiBkZWZhdWx0cy5maWVsZEJvcmRlclJhZGl1cyxcblx0XHRcdFx0fSxcblx0XHRcdFx0ZmllbGRCYWNrZ3JvdW5kQ29sb3I6IHtcblx0XHRcdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdFx0XHRkZWZhdWx0OiBkZWZhdWx0cy5maWVsZEJhY2tncm91bmRDb2xvcixcblx0XHRcdFx0fSxcblx0XHRcdFx0ZmllbGRCb3JkZXJDb2xvcjoge1xuXHRcdFx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0XHRcdGRlZmF1bHQ6IGRlZmF1bHRzLmZpZWxkQm9yZGVyQ29sb3IsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGZpZWxkVGV4dENvbG9yOiB7XG5cdFx0XHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRcdFx0ZGVmYXVsdDogZGVmYXVsdHMuZmllbGRUZXh0Q29sb3IsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGxhYmVsU2l6ZToge1xuXHRcdFx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0XHRcdGRlZmF1bHQ6IGRlZmF1bHRzLmxhYmVsU2l6ZSxcblx0XHRcdFx0fSxcblx0XHRcdFx0bGFiZWxDb2xvcjoge1xuXHRcdFx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0XHRcdGRlZmF1bHQ6IGRlZmF1bHRzLmxhYmVsQ29sb3IsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGxhYmVsU3VibGFiZWxDb2xvcjoge1xuXHRcdFx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0XHRcdGRlZmF1bHQ6IGRlZmF1bHRzLmxhYmVsU3VibGFiZWxDb2xvcixcblx0XHRcdFx0fSxcblx0XHRcdFx0bGFiZWxFcnJvckNvbG9yOiB7XG5cdFx0XHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRcdFx0ZGVmYXVsdDogZGVmYXVsdHMubGFiZWxFcnJvckNvbG9yLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRidXR0b25TaXplOiB7XG5cdFx0XHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRcdFx0ZGVmYXVsdDogZGVmYXVsdHMuYnV0dG9uU2l6ZSxcblx0XHRcdFx0fSxcblx0XHRcdFx0YnV0dG9uQm9yZGVyUmFkaXVzOiB7XG5cdFx0XHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRcdFx0ZGVmYXVsdDogZGVmYXVsdHMuYnV0dG9uQm9yZGVyUmFkaXVzLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRidXR0b25CYWNrZ3JvdW5kQ29sb3I6IHtcblx0XHRcdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdFx0XHRkZWZhdWx0OiBkZWZhdWx0cy5idXR0b25CYWNrZ3JvdW5kQ29sb3IsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGJ1dHRvblRleHRDb2xvcjoge1xuXHRcdFx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0XHRcdGRlZmF1bHQ6IGRlZmF1bHRzLmJ1dHRvblRleHRDb2xvcixcblx0XHRcdFx0fSxcblx0XHRcdFx0Y29weVBhc3RlSnNvblZhbHVlOiB7XG5cdFx0XHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRcdFx0ZGVmYXVsdDogZGVmYXVsdHMuY29weVBhc3RlSnNvblZhbHVlLFxuXHRcdFx0XHR9LFxuXHRcdFx0fTtcblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICogR2V0IGZvcm0gc2VsZWN0b3Igb3B0aW9ucy5cblx0XHQgKlxuXHRcdCAqIEBzaW5jZSAxLjguMVxuXHRcdCAqXG5cdFx0ICogQHJldHVybnMge0FycmF5fSBGb3JtIG9wdGlvbnMuXG5cdFx0ICovXG5cdFx0Z2V0Rm9ybU9wdGlvbnM6IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRjb25zdCBmb3JtT3B0aW9ucyA9IHdwZm9ybXNfZ3V0ZW5iZXJnX2Zvcm1fc2VsZWN0b3IuZm9ybXMubWFwKCB2YWx1ZSA9PiAoXG5cdFx0XHRcdHsgdmFsdWU6IHZhbHVlLklELCBsYWJlbDogdmFsdWUucG9zdF90aXRsZSB9XG5cdFx0XHQpICk7XG5cblx0XHRcdGZvcm1PcHRpb25zLnVuc2hpZnQoIHsgdmFsdWU6ICcnLCBsYWJlbDogc3RyaW5ncy5mb3JtX3NlbGVjdCB9ICk7XG5cblx0XHRcdHJldHVybiBmb3JtT3B0aW9ucztcblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICogR2V0IHNpemUgc2VsZWN0b3Igb3B0aW9ucy5cblx0XHQgKlxuXHRcdCAqIEBzaW5jZSAxLjguMVxuXHRcdCAqXG5cdFx0ICogQHJldHVybnMge0FycmF5fSBTaXplIG9wdGlvbnMuXG5cdFx0ICovXG5cdFx0Z2V0U2l6ZU9wdGlvbnM6IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRyZXR1cm4gW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGFiZWw6IHN0cmluZ3Muc21hbGwsXG5cdFx0XHRcdFx0dmFsdWU6ICdzbWFsbCcsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsYWJlbDogc3RyaW5ncy5tZWRpdW0sXG5cdFx0XHRcdFx0dmFsdWU6ICdtZWRpdW0nLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGFiZWw6IHN0cmluZ3MubGFyZ2UsXG5cdFx0XHRcdFx0dmFsdWU6ICdsYXJnZScsXG5cdFx0XHRcdH0sXG5cdFx0XHRdO1xuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBFdmVudCBgd3Bmb3Jtc0Zvcm1TZWxlY3RvckVkaXRgIGhhbmRsZXIuXG5cdFx0ICpcblx0XHQgKiBAc2luY2UgMS44LjFcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBlICAgICBFdmVudCBvYmplY3QuXG5cdFx0ICogQHBhcmFtIHtvYmplY3R9IHByb3BzIEJsb2NrIHByb3BlcnRpZXMuXG5cdFx0ICovXG5cdFx0YmxvY2tFZGl0OiBmdW5jdGlvbiggZSwgcHJvcHMgKSB7XG5cblx0XHRcdGNvbnN0IGJsb2NrID0gYXBwLmdldEJsb2NrQ29udGFpbmVyKCBwcm9wcyApO1xuXG5cdFx0XHRpZiAoICEgYmxvY2sgfHwgISBibG9jay5kYXRhc2V0ICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGFwcC5pbml0TGVhZEZvcm1TZXR0aW5ncyggYmxvY2sucGFyZW50RWxlbWVudCApO1xuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBJbml0IExlYWQgRm9ybSBTZXR0aW5ncyBwYW5lbHMuXG5cdFx0ICpcblx0XHQgKiBAc2luY2UgMS44LjFcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7RWxlbWVudH0gYmxvY2sgQmxvY2sgZWxlbWVudC5cblx0XHQgKi9cblx0XHRpbml0TGVhZEZvcm1TZXR0aW5nczogZnVuY3Rpb24oIGJsb2NrICkge1xuXG5cdFx0XHRpZiAoICEgYmxvY2sgfHwgISBibG9jay5kYXRhc2V0ICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGlmICggISBhcHAuaXNGdWxsU3R5bGluZ0VuYWJsZWQoKSApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBjbGllbnRJZCA9IGJsb2NrLmRhdGFzZXQuYmxvY2s7XG5cdFx0XHRjb25zdCAkZm9ybSA9ICQoIGJsb2NrLnF1ZXJ5U2VsZWN0b3IoICcud3Bmb3Jtcy1jb250YWluZXInICkgKTtcblx0XHRcdGNvbnN0ICRwYW5lbCA9ICQoIGAud3Bmb3Jtcy1ibG9jay1zZXR0aW5ncy0ke2NsaWVudElkfWAgKTtcblxuXHRcdFx0aWYgKCAkZm9ybS5oYXNDbGFzcyggJ3dwZm9ybXMtbGVhZC1mb3Jtcy1jb250YWluZXInICkgKSB7XG5cblx0XHRcdFx0JHBhbmVsXG5cdFx0XHRcdFx0LmFkZENsYXNzKCAnZGlzYWJsZWRfcGFuZWwnIClcblx0XHRcdFx0XHQuZmluZCggJy53cGZvcm1zLWd1dGVuYmVyZy1wYW5lbC1ub3RpY2Uud3Bmb3Jtcy1sZWFkLWZvcm0tbm90aWNlJyApXG5cdFx0XHRcdFx0LmNzcyggJ2Rpc3BsYXknLCAnYmxvY2snICk7XG5cblx0XHRcdFx0JHBhbmVsXG5cdFx0XHRcdFx0LmZpbmQoICcud3Bmb3Jtcy1ndXRlbmJlcmctcGFuZWwtbm90aWNlLndwZm9ybXMtdXNlLW1vZGVybi1ub3RpY2UnIClcblx0XHRcdFx0XHQuY3NzKCAnZGlzcGxheScsICdub25lJyApO1xuXG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0JHBhbmVsXG5cdFx0XHRcdC5yZW1vdmVDbGFzcyggJ2Rpc2FibGVkX3BhbmVsJyApXG5cdFx0XHRcdC5maW5kKCAnLndwZm9ybXMtZ3V0ZW5iZXJnLXBhbmVsLW5vdGljZS53cGZvcm1zLWxlYWQtZm9ybS1ub3RpY2UnIClcblx0XHRcdFx0LmNzcyggJ2Rpc3BsYXknLCAnbm9uZScgKTtcblxuXHRcdFx0JHBhbmVsXG5cdFx0XHRcdC5maW5kKCAnLndwZm9ybXMtZ3V0ZW5iZXJnLXBhbmVsLW5vdGljZS53cGZvcm1zLXVzZS1tb2Rlcm4tbm90aWNlJyApXG5cdFx0XHRcdC5jc3MoICdkaXNwbGF5JywgbnVsbCApO1xuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBFdmVudCBgd3Bmb3Jtc0Zvcm1TZWxlY3RvckZvcm1Mb2FkZWRgIGhhbmRsZXIuXG5cdFx0ICpcblx0XHQgKiBAc2luY2UgMS44LjFcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBlIEV2ZW50IG9iamVjdC5cblx0XHQgKi9cblx0XHRmb3JtTG9hZGVkOiBmdW5jdGlvbiggZSApIHtcblxuXHRcdFx0YXBwLmluaXRMZWFkRm9ybVNldHRpbmdzKCBlLmRldGFpbC5ibG9jayApO1xuXHRcdFx0YXBwLnVwZGF0ZUFjY2VudENvbG9ycyggZS5kZXRhaWwgKTtcblx0XHRcdGFwcC5sb2FkQ2hvaWNlc0pTKCBlLmRldGFpbCApO1xuXHRcdFx0YXBwLmluaXRSaWNoVGV4dEZpZWxkKCBlLmRldGFpbC5mb3JtSWQgKTtcblxuXHRcdFx0JCggZS5kZXRhaWwuYmxvY2sgKVxuXHRcdFx0XHQub2ZmKCAnY2xpY2snIClcblx0XHRcdFx0Lm9uKCAnY2xpY2snLCBhcHAuYmxvY2tDbGljayApO1xuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBDbGljayBvbiB0aGUgYmxvY2sgZXZlbnQgaGFuZGxlci5cblx0XHQgKlxuXHRcdCAqIEBzaW5jZSAxLjguMVxuXHRcdCAqXG5cdFx0ICogQHBhcmFtIHtvYmplY3R9IGUgRXZlbnQgb2JqZWN0LlxuXHRcdCAqL1xuXHRcdGJsb2NrQ2xpY2s6IGZ1bmN0aW9uKCBlICkge1xuXG5cdFx0XHRhcHAuaW5pdExlYWRGb3JtU2V0dGluZ3MoIGUuY3VycmVudFRhcmdldCApO1xuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBVcGRhdGUgYWNjZW50IGNvbG9ycyBvZiBzb21lIGZpZWxkcyBpbiBHQiBibG9jayBpbiBNb2Rlcm4gTWFya3VwIG1vZGUuXG5cdFx0ICpcblx0XHQgKiBAc2luY2UgMS44LjFcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBkZXRhaWwgRXZlbnQgZGV0YWlscyBvYmplY3QuXG5cdFx0ICovXG5cdFx0dXBkYXRlQWNjZW50Q29sb3JzOiBmdW5jdGlvbiggZGV0YWlsICkge1xuXG5cdFx0XHRpZiAoXG5cdFx0XHRcdCEgd3Bmb3Jtc19ndXRlbmJlcmdfZm9ybV9zZWxlY3Rvci5pc19tb2Rlcm5fbWFya3VwIHx8XG5cdFx0XHRcdCEgd2luZG93LldQRm9ybXMgfHxcblx0XHRcdFx0ISB3aW5kb3cuV1BGb3Jtcy5Gcm9udGVuZE1vZGVybiB8fFxuXHRcdFx0XHQhIGRldGFpbC5ibG9ja1xuXHRcdFx0KSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgJGZvcm0gPSAkKCBkZXRhaWwuYmxvY2sucXVlcnlTZWxlY3RvciggYCN3cGZvcm1zLSR7ZGV0YWlsLmZvcm1JZH1gICkgKSxcblx0XHRcdFx0RnJvbnRlbmRNb2Rlcm4gPSB3aW5kb3cuV1BGb3Jtcy5Gcm9udGVuZE1vZGVybjtcblxuXHRcdFx0RnJvbnRlbmRNb2Rlcm4udXBkYXRlR0JCbG9ja1BhZ2VJbmRpY2F0b3JDb2xvciggJGZvcm0gKTtcblx0XHRcdEZyb250ZW5kTW9kZXJuLnVwZGF0ZUdCQmxvY2tJY29uQ2hvaWNlc0NvbG9yKCAkZm9ybSApO1xuXHRcdFx0RnJvbnRlbmRNb2Rlcm4udXBkYXRlR0JCbG9ja1JhdGluZ0NvbG9yKCAkZm9ybSApO1xuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBJbml0IE1vZGVybiBzdHlsZSBEcm9wZG93biBmaWVsZHMgKDxzZWxlY3Q+KS5cblx0XHQgKlxuXHRcdCAqIEBzaW5jZSAxLjguMVxuXHRcdCAqXG5cdFx0ICogQHBhcmFtIHtvYmplY3R9IGRldGFpbCBFdmVudCBkZXRhaWxzIG9iamVjdC5cblx0XHQgKi9cblx0XHRsb2FkQ2hvaWNlc0pTOiBmdW5jdGlvbiggZGV0YWlsICkge1xuXG5cdFx0XHRpZiAoIHR5cGVvZiB3aW5kb3cuQ2hvaWNlcyAhPT0gJ2Z1bmN0aW9uJyApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCAkZm9ybSA9ICQoIGRldGFpbC5ibG9jay5xdWVyeVNlbGVjdG9yKCBgI3dwZm9ybXMtJHtkZXRhaWwuZm9ybUlkfWAgKSApO1xuXG5cdFx0XHQkZm9ybS5maW5kKCAnLmNob2ljZXNqcy1zZWxlY3QnICkuZWFjaCggZnVuY3Rpb24oIGlkeCwgZWwgKSB7XG5cblx0XHRcdFx0Y29uc3QgJGVsID0gJCggZWwgKTtcblxuXHRcdFx0XHRpZiAoICRlbC5kYXRhKCAnY2hvaWNlJyApID09PSAnYWN0aXZlJyApIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgYXJncyA9IHdpbmRvdy53cGZvcm1zX2Nob2ljZXNqc19jb25maWcgfHwge30sXG5cdFx0XHRcdFx0c2VhcmNoRW5hYmxlZCA9ICRlbC5kYXRhKCAnc2VhcmNoLWVuYWJsZWQnICksXG5cdFx0XHRcdFx0JGZpZWxkID0gJGVsLmNsb3Nlc3QoICcud3Bmb3Jtcy1maWVsZCcgKTtcblxuXHRcdFx0XHRhcmdzLnNlYXJjaEVuYWJsZWQgPSAndW5kZWZpbmVkJyAhPT0gdHlwZW9mIHNlYXJjaEVuYWJsZWQgPyBzZWFyY2hFbmFibGVkIDogdHJ1ZTtcblx0XHRcdFx0YXJncy5jYWxsYmFja09uSW5pdCA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRcdFx0dmFyIHNlbGYgPSB0aGlzLFxuXHRcdFx0XHRcdFx0JGVsZW1lbnQgPSAkKCBzZWxmLnBhc3NlZEVsZW1lbnQuZWxlbWVudCApLFxuXHRcdFx0XHRcdFx0JGlucHV0ID0gJCggc2VsZi5pbnB1dC5lbGVtZW50ICksXG5cdFx0XHRcdFx0XHRzaXplQ2xhc3MgPSAkZWxlbWVudC5kYXRhKCAnc2l6ZS1jbGFzcycgKTtcblxuXHRcdFx0XHRcdC8vIEFkZCBDU1MtY2xhc3MgZm9yIHNpemUuXG5cdFx0XHRcdFx0aWYgKCBzaXplQ2xhc3MgKSB7XG5cdFx0XHRcdFx0XHQkKCBzZWxmLmNvbnRhaW5lck91dGVyLmVsZW1lbnQgKS5hZGRDbGFzcyggc2l6ZUNsYXNzICk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0LyoqXG5cdFx0XHRcdFx0ICogSWYgYSBtdWx0aXBsZSBzZWxlY3QgaGFzIHNlbGVjdGVkIGNob2ljZXMgLSBoaWRlIGEgcGxhY2Vob2xkZXIgdGV4dC5cblx0XHRcdFx0XHQgKiBJbiBjYXNlIGlmIHNlbGVjdCBpcyBlbXB0eSAtIHdlIHJldHVybiBwbGFjZWhvbGRlciB0ZXh0IGJhY2suXG5cdFx0XHRcdFx0ICovXG5cdFx0XHRcdFx0aWYgKCAkZWxlbWVudC5wcm9wKCAnbXVsdGlwbGUnICkgKSB7XG5cblx0XHRcdFx0XHRcdC8vIE9uIGluaXQgZXZlbnQuXG5cdFx0XHRcdFx0XHQkaW5wdXQuZGF0YSggJ3BsYWNlaG9sZGVyJywgJGlucHV0LmF0dHIoICdwbGFjZWhvbGRlcicgKSApO1xuXG5cdFx0XHRcdFx0XHRpZiAoIHNlbGYuZ2V0VmFsdWUoIHRydWUgKS5sZW5ndGggKSB7XG5cdFx0XHRcdFx0XHRcdCRpbnB1dC5yZW1vdmVBdHRyKCAncGxhY2Vob2xkZXInICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0dGhpcy5kaXNhYmxlKCk7XG5cdFx0XHRcdFx0JGZpZWxkLmZpbmQoICcuaXMtZGlzYWJsZWQnICkucmVtb3ZlQ2xhc3MoICdpcy1kaXNhYmxlZCcgKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGNvbnN0IGNob2ljZXNJbnN0YW5jZSA9ICBuZXcgQ2hvaWNlcyggZWwsIGFyZ3MgKTtcblxuXHRcdFx0XHRcdC8vIFNhdmUgQ2hvaWNlcy5qcyBpbnN0YW5jZSBmb3IgZnV0dXJlIGFjY2Vzcy5cblx0XHRcdFx0XHQkZWwuZGF0YSggJ2Nob2ljZXNqcycsIGNob2ljZXNJbnN0YW5jZSApO1xuXG5cdFx0XHRcdH0gY2F0Y2ggKCBlICkge30gLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1lbXB0eVxuXHRcdFx0fSApO1xuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBJbml0aWFsaXplIFJpY2hUZXh0IGZpZWxkLlxuXHRcdCAqXG5cdFx0ICogQHNpbmNlIDEuOC4xXG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge2ludH0gZm9ybUlkIEZvcm0gSUQuXG5cdFx0ICovXG5cdFx0aW5pdFJpY2hUZXh0RmllbGQ6IGZ1bmN0aW9uKCBmb3JtSWQgKSB7XG5cblx0XHRcdC8vIFNldCBkZWZhdWx0IHRhYiB0byBgVmlzdWFsYC5cblx0XHRcdCQoIGAjd3Bmb3Jtcy0ke2Zvcm1JZH0gLndwLWVkaXRvci13cmFwYCApLnJlbW92ZUNsYXNzKCAnaHRtbC1hY3RpdmUnICkuYWRkQ2xhc3MoICd0bWNlLWFjdGl2ZScgKTtcblx0XHR9LFxuXHR9O1xuXG5cdC8vIFByb3ZpZGUgYWNjZXNzIHRvIHB1YmxpYyBmdW5jdGlvbnMvcHJvcGVydGllcy5cblx0cmV0dXJuIGFwcDtcblxufSggZG9jdW1lbnQsIHdpbmRvdywgalF1ZXJ5ICkgKTtcblxuLy8gSW5pdGlhbGl6ZS5cbldQRm9ybXMuRm9ybVNlbGVjdG9yLmluaXQoKTtcbiJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTs7QUFFQSxZQUFZOztBQUVaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFKQSxTQUFBQSxlQUFBQyxHQUFBLEVBQUFDLENBQUEsV0FBQUMsZUFBQSxDQUFBRixHQUFBLEtBQUFHLHFCQUFBLENBQUFILEdBQUEsRUFBQUMsQ0FBQSxLQUFBRywyQkFBQSxDQUFBSixHQUFBLEVBQUFDLENBQUEsS0FBQUksZ0JBQUE7QUFBQSxTQUFBQSxpQkFBQSxjQUFBQyxTQUFBO0FBQUEsU0FBQUYsNEJBQUFHLENBQUEsRUFBQUMsTUFBQSxTQUFBRCxDQUFBLHFCQUFBQSxDQUFBLHNCQUFBRSxpQkFBQSxDQUFBRixDQUFBLEVBQUFDLE1BQUEsT0FBQUUsQ0FBQSxHQUFBQyxNQUFBLENBQUFD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
},{}]},{},[1])