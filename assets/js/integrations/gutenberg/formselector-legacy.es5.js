(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/* global wpforms_gutenberg_form_selector, JSX */
/* jshint es3: false, esversion: 6 */

/**
 * @param strings.update_wp_notice_head
 * @param strings.update_wp_notice_text
 * @param strings.update_wp_notice_link
 * @param strings.wpforms_empty_help
 * @param strings.wpforms_empty_info
 */

var _wp = wp,
  _wp$serverSideRender = _wp.serverSideRender,
  ServerSideRender = _wp$serverSideRender === void 0 ? wp.components.ServerSideRender : _wp$serverSideRender;
var _wp$element = wp.element,
  createElement = _wp$element.createElement,
  Fragment = _wp$element.Fragment;
var registerBlockType = wp.blocks.registerBlockType;
var _ref = wp.blockEditor || wp.editor,
  InspectorControls = _ref.InspectorControls;
var _wp$components = wp.components,
  SelectControl = _wp$components.SelectControl,
  ToggleControl = _wp$components.ToggleControl,
  PanelBody = _wp$components.PanelBody,
  Placeholder = _wp$components.Placeholder;
var __ = wp.i18n.__;
var wpformsIcon = createElement('svg', {
  width: 20,
  height: 20,
  viewBox: '0 0 612 612',
  className: 'dashicon'
}, createElement('path', {
  fill: 'currentColor',
  d: 'M544,0H68C30.445,0,0,30.445,0,68v476c0,37.556,30.445,68,68,68h476c37.556,0,68-30.444,68-68V68 C612,30.445,581.556,0,544,0z M464.44,68L387.6,120.02L323.34,68H464.44z M288.66,68l-64.26,52.02L147.56,68H288.66z M544,544H68 V68h22.1l136,92.14l79.9-64.6l79.56,64.6l136-92.14H544V544z M114.24,263.16h95.88v-48.28h-95.88V263.16z M114.24,360.4h95.88 v-48.62h-95.88V360.4z M242.76,360.4h255v-48.62h-255V360.4L242.76,360.4z M242.76,263.16h255v-48.28h-255V263.16L242.76,263.16z M368.22,457.3h129.54V408H368.22V457.3z'
}));

/**
 * Popup container.
 *
 * @since 1.8.3
 *
 * @type {Object}
 */
var $popup = {};

/**
 * Close button (inside the form builder) click event.
 *
 * @since 1.8.3
 *
 * @param {string} clientID Block Client ID.
 */
var builderCloseButtonEvent = function builderCloseButtonEvent(clientID) {
  $popup.off('wpformsBuilderInPopupClose').on('wpformsBuilderInPopupClose', function (e, action, formId, formTitle) {
    if (action !== 'saved' || !formId) {
      return;
    }

    // Insert a new block when a new form is created from the popup to update the form list and attributes.
    var newBlock = wp.blocks.createBlock('wpforms/form-selector', {
      formId: formId.toString() // Expects string value, make sure we insert string.
    });

    // eslint-disable-next-line camelcase
    wpforms_gutenberg_form_selector.forms = [{
      ID: formId,
      post_title: formTitle
    }];

    // Insert a new block.
    wp.data.dispatch('core/block-editor').removeBlock(clientID);
    wp.data.dispatch('core/block-editor').insertBlocks(newBlock);
  });
};

/**
 * Open builder popup.
 *
 * @since 1.6.2
 *
 * @param {string} clientID Block Client ID.
 */
var openBuilderPopup = function openBuilderPopup(clientID) {
  if (jQuery.isEmptyObject($popup)) {
    var tmpl = jQuery('#wpforms-gutenberg-popup');
    var parent = jQuery('#wpwrap');
    parent.after(tmpl);
    $popup = parent.siblings('#wpforms-gutenberg-popup');
  }
  var url = wpforms_gutenberg_form_selector.get_started_url,
    $iframe = $popup.find('iframe');
  builderCloseButtonEvent(clientID);
  $iframe.attr('src', url);
  $popup.fadeIn();
};
var hasForms = function hasForms() {
  return wpforms_gutenberg_form_selector.forms.length > 0;
};
registerBlockType('wpforms/form-selector', {
  title: wpforms_gutenberg_form_selector.strings.title,
  description: wpforms_gutenberg_form_selector.strings.description,
  icon: wpformsIcon,
  keywords: wpforms_gutenberg_form_selector.strings.form_keywords,
  category: 'widgets',
  attributes: {
    formId: {
      type: 'string'
    },
    displayTitle: {
      type: 'boolean'
    },
    displayDesc: {
      type: 'boolean'
    },
    preview: {
      type: 'boolean'
    }
  },
  example: {
    attributes: {
      preview: true
    }
  },
  supports: {
    customClassName: hasForms()
  },
  edit: function edit(props) {
    // eslint-disable-line max-lines-per-function
    var _props$attributes = props.attributes,
      _props$attributes$for = _props$attributes.formId,
      formId = _props$attributes$for === void 0 ? '' : _props$attributes$for,
      _props$attributes$dis = _props$attributes.displayTitle,
      displayTitle = _props$attributes$dis === void 0 ? false : _props$attributes$dis,
      _props$attributes$dis2 = _props$attributes.displayDesc,
      displayDesc = _props$attributes$dis2 === void 0 ? false : _props$attributes$dis2,
      _props$attributes$pre = _props$attributes.preview,
      preview = _props$attributes$pre === void 0 ? false : _props$attributes$pre,
      setAttributes = props.setAttributes;
    var formOptions = wpforms_gutenberg_form_selector.forms.map(function (value) {
      return {
        value: value.ID,
        label: value.post_title
      };
    });
    var strings = wpforms_gutenberg_form_selector.strings;
    var jsx;
    formOptions.unshift({
      value: '',
      label: wpforms_gutenberg_form_selector.strings.form_select
    });
    function selectForm(value) {
      // eslint-disable-line jsdoc/require-jsdoc
      setAttributes({
        formId: value
      });
    }
    function toggleDisplayTitle(value) {
      // eslint-disable-line jsdoc/require-jsdoc
      setAttributes({
        displayTitle: value
      });
    }
    function toggleDisplayDesc(value) {
      // eslint-disable-line jsdoc/require-jsdoc
      setAttributes({
        displayDesc: value
      });
    }

    /**
     * Get block empty JSX code.
     *
     * @since 1.8.3
     *
     * @param {Object} blockProps Block properties.
     *
     * @return {JSX.Element} Block empty JSX code.
     */
    function getEmptyFormsPreview(blockProps) {
      var clientId = blockProps.clientId;
      return /*#__PURE__*/React.createElement(Fragment, {
        key: "wpforms-gutenberg-form-selector-fragment-block-empty"
      }, /*#__PURE__*/React.createElement("div", {
        className: "wpforms-no-form-preview"
      }, /*#__PURE__*/React.createElement("img", {
        src: wpforms_gutenberg_form_selector.block_empty_url,
        alt: ""
      }), /*#__PURE__*/React.createElement("p", {
        dangerouslySetInnerHTML: {
          __html: strings.wpforms_empty_info
        }
      }), /*#__PURE__*/React.createElement("button", {
        type: "button",
        className: "get-started-button components-button is-button is-primary",
        onClick: function onClick() {
          openBuilderPopup(clientId);
        }
      }, __('Get Started', 'wpforms-lite')), /*#__PURE__*/React.createElement("p", {
        className: "empty-desc",
        dangerouslySetInnerHTML: {
          __html: strings.wpforms_empty_help
        }
      }), /*#__PURE__*/React.createElement("div", {
        id: "wpforms-gutenberg-popup",
        className: "wpforms-builder-popup"
      }, /*#__PURE__*/React.createElement("iframe", {
        src: "about:blank",
        width: "100%",
        height: "100%",
        id: "wpforms-builder-iframe",
        title: "wpforms-gutenberg-popup"
      }))));
    }

    /**
     * Print empty forms notice.
     *
     * @since 1.8.3
     *
     * @param {string} clientId Block client ID.
     *
     * @return {JSX.Element} Field styles JSX code.
     */
    function printEmptyFormsNotice(clientId) {
      return /*#__PURE__*/React.createElement(InspectorControls, {
        key: "wpforms-gutenberg-form-selector-inspector-main-settings"
      }, /*#__PURE__*/React.createElement(PanelBody, {
        className: "wpforms-gutenberg-panel",
        title: strings.form_settings
      }, /*#__PURE__*/React.createElement("p", {
        className: "wpforms-gutenberg-panel-notice wpforms-warning wpforms-empty-form-notice",
        style: {
          display: 'block'
        }
      }, /*#__PURE__*/React.createElement("strong", null, __('You haven’t created a form, yet!', 'wpforms-lite')), __('What are you waiting for?', 'wpforms-lite')), /*#__PURE__*/React.createElement("button", {
        type: "button",
        className: "get-started-button components-button is-button is-secondary",
        onClick: function onClick() {
          openBuilderPopup(clientId);
        }
      }, __('Get Started', 'wpforms-lite'))));
    }

    /**
     * Get styling panels preview.
     *
     * @since 1.8.8
     *
     * @return {JSX.Element} JSX code.
     */
    function getStylingPanelsPreview() {
      return /*#__PURE__*/React.createElement(Fragment, null, /*#__PURE__*/React.createElement(PanelBody, {
        className: "wpforms-gutenberg-panel disabled_panel",
        title: strings.themes
      }, /*#__PURE__*/React.createElement("div", {
        className: "wpforms-panel-preview wpforms-panel-preview-themes"
      })), /*#__PURE__*/React.createElement(PanelBody, {
        className: "wpforms-gutenberg-panel disabled_panel",
        title: strings.field_styles
      }, /*#__PURE__*/React.createElement("div", {
        className: "wpforms-panel-preview wpforms-panel-preview-field"
      })), /*#__PURE__*/React.createElement(PanelBody, {
        className: "wpforms-gutenberg-panel disabled_panel",
        title: strings.label_styles
      }, /*#__PURE__*/React.createElement("div", {
        className: "wpforms-panel-preview wpforms-panel-preview-label"
      })), /*#__PURE__*/React.createElement(PanelBody, {
        className: "wpforms-gutenberg-panel disabled_panel",
        title: strings.button_styles
      }, /*#__PURE__*/React.createElement("div", {
        className: "wpforms-panel-preview wpforms-panel-preview-button"
      })), /*#__PURE__*/React.createElement(PanelBody, {
        className: "wpforms-gutenberg-panel disabled_panel",
        title: strings.container_styles
      }, /*#__PURE__*/React.createElement("div", {
        className: "wpforms-panel-preview wpforms-panel-preview-container"
      })), /*#__PURE__*/React.createElement(PanelBody, {
        className: "wpforms-gutenberg-panel disabled_panel",
        title: strings.background_styles
      }, /*#__PURE__*/React.createElement("div", {
        className: "wpforms-panel-preview wpforms-panel-preview-background"
      })));
    }
    if (!hasForms()) {
      jsx = [printEmptyFormsNotice(props.clientId)];
      jsx.push(getEmptyFormsPreview(props));
      return jsx;
    }
    jsx = [/*#__PURE__*/React.createElement(InspectorControls, {
      key: "wpforms-gutenberg-form-selector-inspector-controls"
    }, /*#__PURE__*/React.createElement(PanelBody, {
      title: wpforms_gutenberg_form_selector.strings.form_settings
    }, /*#__PURE__*/React.createElement(SelectControl, {
      label: wpforms_gutenberg_form_selector.strings.form_selected,
      value: formId,
      options: formOptions,
      onChange: selectForm
    }), /*#__PURE__*/React.createElement(ToggleControl, {
      label: wpforms_gutenberg_form_selector.strings.show_title,
      checked: displayTitle,
      onChange: toggleDisplayTitle
    }), /*#__PURE__*/React.createElement(ToggleControl, {
      label: wpforms_gutenberg_form_selector.strings.show_description,
      checked: displayDesc,
      onChange: toggleDisplayDesc
    }), /*#__PURE__*/React.createElement("p", {
      className: "wpforms-gutenberg-panel-notice wpforms-warning"
    }, /*#__PURE__*/React.createElement("strong", null, strings.update_wp_notice_head), strings.update_wp_notice_text, " ", /*#__PURE__*/React.createElement("a", {
      href: strings.update_wp_notice_link,
      rel: "noreferrer",
      target: "_blank"
    }, strings.learn_more))), getStylingPanelsPreview())];
    if (formId) {
      jsx.push( /*#__PURE__*/React.createElement(ServerSideRender, {
        key: "wpforms-gutenberg-form-selector-server-side-renderer",
        block: "wpforms/form-selector",
        attributes: props.attributes
      }));
    } else if (preview) {
      jsx.push( /*#__PURE__*/React.createElement(Fragment, {
        key: "wpforms-gutenberg-form-selector-fragment-block-preview"
      }, /*#__PURE__*/React.createElement("img", {
        src: wpforms_gutenberg_form_selector.block_preview_url,
        style: {
          width: '100%'
        },
        alt: ""
      })));
    } else {
      jsx.push( /*#__PURE__*/React.createElement(Placeholder, {
        key: "wpforms-gutenberg-form-selector-wrap",
        className: "wpforms-gutenberg-form-selector-wrap"
      }, /*#__PURE__*/React.createElement("img", {
        src: wpforms_gutenberg_form_selector.logo_url,
        alt: ""
      }), /*#__PURE__*/React.createElement(SelectControl, {
        key: "wpforms-gutenberg-form-selector-select-control",
        value: formId,
        options: formOptions,
        onChange: selectForm
      })));
    }
    return jsx;
  },
  save: function save() {
    return null;
  }
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfd3AiLCJ3cCIsIl93cCRzZXJ2ZXJTaWRlUmVuZGVyIiwic2VydmVyU2lkZVJlbmRlciIsIlNlcnZlclNpZGVSZW5kZXIiLCJjb21wb25lbnRzIiwiX3dwJGVsZW1lbnQiLCJlbGVtZW50IiwiY3JlYXRlRWxlbWVudCIsIkZyYWdtZW50IiwicmVnaXN0ZXJCbG9ja1R5cGUiLCJibG9ja3MiLCJfcmVmIiwiYmxvY2tFZGl0b3IiLCJlZGl0b3IiLCJJbnNwZWN0b3JDb250cm9scyIsIl93cCRjb21wb25lbnRzIiwiU2VsZWN0Q29udHJvbCIsIlRvZ2dsZUNvbnRyb2wiLCJQYW5lbEJvZHkiLCJQbGFjZWhvbGRlciIsIl9fIiwiaTE4biIsIndwZm9ybXNJY29uIiwid2lkdGgiLCJoZWlnaHQiLCJ2aWV3Qm94IiwiY2xhc3NOYW1lIiwiZmlsbCIsImQiLCIkcG9wdXAiLCJidWlsZGVyQ2xvc2VCdXR0b25FdmVudCIsImNsaWVudElEIiwib2ZmIiwib24iLCJlIiwiYWN0aW9uIiwiZm9ybUlkIiwiZm9ybVRpdGxlIiwibmV3QmxvY2siLCJjcmVhdGVCbG9jayIsInRvU3RyaW5nIiwid3Bmb3Jtc19ndXRlbmJlcmdfZm9ybV9zZWxlY3RvciIsImZvcm1zIiwiSUQiLCJwb3N0X3RpdGxlIiwiZGF0YSIsImRpc3BhdGNoIiwicmVtb3ZlQmxvY2siLCJpbnNlcnRCbG9ja3MiLCJvcGVuQnVpbGRlclBvcHVwIiwialF1ZXJ5IiwiaXNFbXB0eU9iamVjdCIsInRtcGwiLCJwYXJlbnQiLCJhZnRlciIsInNpYmxpbmdzIiwidXJsIiwiZ2V0X3N0YXJ0ZWRfdXJsIiwiJGlmcmFtZSIsImZpbmQiLCJhdHRyIiwiZmFkZUluIiwiaGFzRm9ybXMiLCJsZW5ndGgiLCJ0aXRsZSIsInN0cmluZ3MiLCJkZXNjcmlwdGlvbiIsImljb24iLCJrZXl3b3JkcyIsImZvcm1fa2V5d29yZHMiLCJjYXRlZ29yeSIsImF0dHJpYnV0ZXMiLCJ0eXBlIiwiZGlzcGxheVRpdGxlIiwiZGlzcGxheURlc2MiLCJwcmV2aWV3IiwiZXhhbXBsZSIsInN1cHBvcnRzIiwiY3VzdG9tQ2xhc3NOYW1lIiwiZWRpdCIsInByb3BzIiwiX3Byb3BzJGF0dHJpYnV0ZXMiLCJfcHJvcHMkYXR0cmlidXRlcyRmb3IiLCJfcHJvcHMkYXR0cmlidXRlcyRkaXMiLCJfcHJvcHMkYXR0cmlidXRlcyRkaXMyIiwiX3Byb3BzJGF0dHJpYnV0ZXMkcHJlIiwic2V0QXR0cmlidXRlcyIsImZvcm1PcHRpb25zIiwibWFwIiwidmFsdWUiLCJsYWJlbCIsImpzeCIsInVuc2hpZnQiLCJmb3JtX3NlbGVjdCIsInNlbGVjdEZvcm0iLCJ0b2dnbGVEaXNwbGF5VGl0bGUiLCJ0b2dnbGVEaXNwbGF5RGVzYyIsImdldEVtcHR5Rm9ybXNQcmV2aWV3IiwiYmxvY2tQcm9wcyIsImNsaWVudElkIiwiUmVhY3QiLCJrZXkiLCJzcmMiLCJibG9ja19lbXB0eV91cmwiLCJhbHQiLCJkYW5nZXJvdXNseVNldElubmVySFRNTCIsIl9faHRtbCIsIndwZm9ybXNfZW1wdHlfaW5mbyIsIm9uQ2xpY2siLCJ3cGZvcm1zX2VtcHR5X2hlbHAiLCJpZCIsInByaW50RW1wdHlGb3Jtc05vdGljZSIsImZvcm1fc2V0dGluZ3MiLCJzdHlsZSIsImRpc3BsYXkiLCJnZXRTdHlsaW5nUGFuZWxzUHJldmlldyIsInRoZW1lcyIsImZpZWxkX3N0eWxlcyIsImxhYmVsX3N0eWxlcyIsImJ1dHRvbl9zdHlsZXMiLCJjb250YWluZXJfc3R5bGVzIiwiYmFja2dyb3VuZF9zdHlsZXMiLCJwdXNoIiwiZm9ybV9zZWxlY3RlZCIsIm9wdGlvbnMiLCJvbkNoYW5nZSIsInNob3dfdGl0bGUiLCJjaGVja2VkIiwic2hvd19kZXNjcmlwdGlvbiIsInVwZGF0ZV93cF9ub3RpY2VfaGVhZCIsInVwZGF0ZV93cF9ub3RpY2VfdGV4dCIsImhyZWYiLCJ1cGRhdGVfd3Bfbm90aWNlX2xpbmsiLCJyZWwiLCJ0YXJnZXQiLCJsZWFybl9tb3JlIiwiYmxvY2siLCJibG9ja19wcmV2aWV3X3VybCIsImxvZ29fdXJsIiwic2F2ZSJdLCJzb3VyY2VzIjpbImZha2VfMTJhYzRhZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgd3Bmb3Jtc19ndXRlbmJlcmdfZm9ybV9zZWxlY3RvciwgSlNYICovXG4vKiBqc2hpbnQgZXMzOiBmYWxzZSwgZXN2ZXJzaW9uOiA2ICovXG5cbi8qKlxuICogQHBhcmFtIHN0cmluZ3MudXBkYXRlX3dwX25vdGljZV9oZWFkXG4gKiBAcGFyYW0gc3RyaW5ncy51cGRhdGVfd3Bfbm90aWNlX3RleHRcbiAqIEBwYXJhbSBzdHJpbmdzLnVwZGF0ZV93cF9ub3RpY2VfbGlua1xuICogQHBhcmFtIHN0cmluZ3Mud3Bmb3Jtc19lbXB0eV9oZWxwXG4gKiBAcGFyYW0gc3RyaW5ncy53cGZvcm1zX2VtcHR5X2luZm9cbiAqL1xuXG5jb25zdCB7IHNlcnZlclNpZGVSZW5kZXI6IFNlcnZlclNpZGVSZW5kZXIgPSB3cC5jb21wb25lbnRzLlNlcnZlclNpZGVSZW5kZXIgfSA9IHdwO1xuY29uc3QgeyBjcmVhdGVFbGVtZW50LCBGcmFnbWVudCB9ID0gd3AuZWxlbWVudDtcbmNvbnN0IHsgcmVnaXN0ZXJCbG9ja1R5cGUgfSA9IHdwLmJsb2NrcztcbmNvbnN0IHsgSW5zcGVjdG9yQ29udHJvbHMgfSA9IHdwLmJsb2NrRWRpdG9yIHx8IHdwLmVkaXRvcjtcbmNvbnN0IHsgU2VsZWN0Q29udHJvbCwgVG9nZ2xlQ29udHJvbCwgUGFuZWxCb2R5LCBQbGFjZWhvbGRlciB9ID0gd3AuY29tcG9uZW50cztcbmNvbnN0IHsgX18gfSA9IHdwLmkxOG47XG5cbmNvbnN0IHdwZm9ybXNJY29uID0gY3JlYXRlRWxlbWVudCggJ3N2ZycsIHsgd2lkdGg6IDIwLCBoZWlnaHQ6IDIwLCB2aWV3Qm94OiAnMCAwIDYxMiA2MTInLCBjbGFzc05hbWU6ICdkYXNoaWNvbicgfSxcblx0Y3JlYXRlRWxlbWVudCggJ3BhdGgnLCB7XG5cdFx0ZmlsbDogJ2N1cnJlbnRDb2xvcicsXG5cdFx0ZDogJ001NDQsMEg2OEMzMC40NDUsMCwwLDMwLjQ0NSwwLDY4djQ3NmMwLDM3LjU1NiwzMC40NDUsNjgsNjgsNjhoNDc2YzM3LjU1NiwwLDY4LTMwLjQ0NCw2OC02OFY2OCBDNjEyLDMwLjQ0NSw1ODEuNTU2LDAsNTQ0LDB6IE00NjQuNDQsNjhMMzg3LjYsMTIwLjAyTDMyMy4zNCw2OEg0NjQuNDR6IE0yODguNjYsNjhsLTY0LjI2LDUyLjAyTDE0Ny41Niw2OEgyODguNjZ6IE01NDQsNTQ0SDY4IFY2OGgyMi4xbDEzNiw5Mi4xNGw3OS45LTY0LjZsNzkuNTYsNjQuNmwxMzYtOTIuMTRINTQ0VjU0NHogTTExNC4yNCwyNjMuMTZoOTUuODh2LTQ4LjI4aC05NS44OFYyNjMuMTZ6IE0xMTQuMjQsMzYwLjRoOTUuODggdi00OC42MmgtOTUuODhWMzYwLjR6IE0yNDIuNzYsMzYwLjRoMjU1di00OC42MmgtMjU1VjM2MC40TDI0Mi43NiwzNjAuNHogTTI0Mi43NiwyNjMuMTZoMjU1di00OC4yOGgtMjU1VjI2My4xNkwyNDIuNzYsMjYzLjE2eiBNMzY4LjIyLDQ1Ny4zaDEyOS41NFY0MDhIMzY4LjIyVjQ1Ny4zeicsXG5cdH0gKVxuKTtcblxuLyoqXG4gKiBQb3B1cCBjb250YWluZXIuXG4gKlxuICogQHNpbmNlIDEuOC4zXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xubGV0ICRwb3B1cCA9IHt9O1xuXG4vKipcbiAqIENsb3NlIGJ1dHRvbiAoaW5zaWRlIHRoZSBmb3JtIGJ1aWxkZXIpIGNsaWNrIGV2ZW50LlxuICpcbiAqIEBzaW5jZSAxLjguM1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBjbGllbnRJRCBCbG9jayBDbGllbnQgSUQuXG4gKi9cbmNvbnN0IGJ1aWxkZXJDbG9zZUJ1dHRvbkV2ZW50ID0gZnVuY3Rpb24oIGNsaWVudElEICkge1xuXHQkcG9wdXBcblx0XHQub2ZmKCAnd3Bmb3Jtc0J1aWxkZXJJblBvcHVwQ2xvc2UnIClcblx0XHQub24oICd3cGZvcm1zQnVpbGRlckluUG9wdXBDbG9zZScsIGZ1bmN0aW9uKCBlLCBhY3Rpb24sIGZvcm1JZCwgZm9ybVRpdGxlICkge1xuXHRcdFx0aWYgKCBhY3Rpb24gIT09ICdzYXZlZCcgfHwgISBmb3JtSWQgKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gSW5zZXJ0IGEgbmV3IGJsb2NrIHdoZW4gYSBuZXcgZm9ybSBpcyBjcmVhdGVkIGZyb20gdGhlIHBvcHVwIHRvIHVwZGF0ZSB0aGUgZm9ybSBsaXN0IGFuZCBhdHRyaWJ1dGVzLlxuXHRcdFx0Y29uc3QgbmV3QmxvY2sgPSB3cC5ibG9ja3MuY3JlYXRlQmxvY2soICd3cGZvcm1zL2Zvcm0tc2VsZWN0b3InLCB7XG5cdFx0XHRcdGZvcm1JZDogZm9ybUlkLnRvU3RyaW5nKCksIC8vIEV4cGVjdHMgc3RyaW5nIHZhbHVlLCBtYWtlIHN1cmUgd2UgaW5zZXJ0IHN0cmluZy5cblx0XHRcdH0gKTtcblxuXHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNhbWVsY2FzZVxuXHRcdFx0d3Bmb3Jtc19ndXRlbmJlcmdfZm9ybV9zZWxlY3Rvci5mb3JtcyA9IFsgeyBJRDogZm9ybUlkLCBwb3N0X3RpdGxlOiBmb3JtVGl0bGUgfSBdO1xuXG5cdFx0XHQvLyBJbnNlcnQgYSBuZXcgYmxvY2suXG5cdFx0XHR3cC5kYXRhLmRpc3BhdGNoKCAnY29yZS9ibG9jay1lZGl0b3InICkucmVtb3ZlQmxvY2soIGNsaWVudElEICk7XG5cdFx0XHR3cC5kYXRhLmRpc3BhdGNoKCAnY29yZS9ibG9jay1lZGl0b3InICkuaW5zZXJ0QmxvY2tzKCBuZXdCbG9jayApO1xuXHRcdH0gKTtcbn07XG5cbi8qKlxuICogT3BlbiBidWlsZGVyIHBvcHVwLlxuICpcbiAqIEBzaW5jZSAxLjYuMlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBjbGllbnRJRCBCbG9jayBDbGllbnQgSUQuXG4gKi9cbmNvbnN0IG9wZW5CdWlsZGVyUG9wdXAgPSBmdW5jdGlvbiggY2xpZW50SUQgKSB7XG5cdGlmICggalF1ZXJ5LmlzRW1wdHlPYmplY3QoICRwb3B1cCApICkge1xuXHRcdGNvbnN0IHRtcGwgPSBqUXVlcnkoICcjd3Bmb3Jtcy1ndXRlbmJlcmctcG9wdXAnICk7XG5cdFx0Y29uc3QgcGFyZW50ID0galF1ZXJ5KCAnI3dwd3JhcCcgKTtcblxuXHRcdHBhcmVudC5hZnRlciggdG1wbCApO1xuXG5cdFx0JHBvcHVwID0gcGFyZW50LnNpYmxpbmdzKCAnI3dwZm9ybXMtZ3V0ZW5iZXJnLXBvcHVwJyApO1xuXHR9XG5cblx0Y29uc3QgdXJsID0gd3Bmb3Jtc19ndXRlbmJlcmdfZm9ybV9zZWxlY3Rvci5nZXRfc3RhcnRlZF91cmwsXG5cdFx0JGlmcmFtZSA9ICRwb3B1cC5maW5kKCAnaWZyYW1lJyApO1xuXG5cdGJ1aWxkZXJDbG9zZUJ1dHRvbkV2ZW50KCBjbGllbnRJRCApO1xuXHQkaWZyYW1lLmF0dHIoICdzcmMnLCB1cmwgKTtcblx0JHBvcHVwLmZhZGVJbigpO1xufTtcblxuY29uc3QgaGFzRm9ybXMgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHdwZm9ybXNfZ3V0ZW5iZXJnX2Zvcm1fc2VsZWN0b3IuZm9ybXMubGVuZ3RoID4gMDtcbn07XG5cbnJlZ2lzdGVyQmxvY2tUeXBlKCAnd3Bmb3Jtcy9mb3JtLXNlbGVjdG9yJywge1xuXHR0aXRsZTogd3Bmb3Jtc19ndXRlbmJlcmdfZm9ybV9zZWxlY3Rvci5zdHJpbmdzLnRpdGxlLFxuXHRkZXNjcmlwdGlvbjogd3Bmb3Jtc19ndXRlbmJlcmdfZm9ybV9zZWxlY3Rvci5zdHJpbmdzLmRlc2NyaXB0aW9uLFxuXHRpY29uOiB3cGZvcm1zSWNvbixcblx0a2V5d29yZHM6IHdwZm9ybXNfZ3V0ZW5iZXJnX2Zvcm1fc2VsZWN0b3Iuc3RyaW5ncy5mb3JtX2tleXdvcmRzLFxuXHRjYXRlZ29yeTogJ3dpZGdldHMnLFxuXHRhdHRyaWJ1dGVzOiB7XG5cdFx0Zm9ybUlkOiB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHR9LFxuXHRcdGRpc3BsYXlUaXRsZToge1xuXHRcdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdH0sXG5cdFx0ZGlzcGxheURlc2M6IHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHR9LFxuXHRcdHByZXZpZXc6IHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHR9LFxuXHR9LFxuXHRleGFtcGxlOiB7XG5cdFx0YXR0cmlidXRlczoge1xuXHRcdFx0cHJldmlldzogdHJ1ZSxcblx0XHR9LFxuXHR9LFxuXHRzdXBwb3J0czoge1xuXHRcdGN1c3RvbUNsYXNzTmFtZTogaGFzRm9ybXMoKSxcblx0fSxcblx0ZWRpdCggcHJvcHMgKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxpbmVzLXBlci1mdW5jdGlvblxuXHRcdGNvbnN0IHsgYXR0cmlidXRlczogeyBmb3JtSWQgPSAnJywgZGlzcGxheVRpdGxlID0gZmFsc2UsIGRpc3BsYXlEZXNjID0gZmFsc2UsIHByZXZpZXcgPSBmYWxzZSB9LCBzZXRBdHRyaWJ1dGVzIH0gPSBwcm9wcztcblx0XHRjb25zdCBmb3JtT3B0aW9ucyA9IHdwZm9ybXNfZ3V0ZW5iZXJnX2Zvcm1fc2VsZWN0b3IuZm9ybXMubWFwKCAoIHZhbHVlICkgPT4gKFxuXHRcdFx0eyB2YWx1ZTogdmFsdWUuSUQsIGxhYmVsOiB2YWx1ZS5wb3N0X3RpdGxlIH1cblx0XHQpICk7XG5cblx0XHRjb25zdCBzdHJpbmdzID0gd3Bmb3Jtc19ndXRlbmJlcmdfZm9ybV9zZWxlY3Rvci5zdHJpbmdzO1xuXHRcdGxldCBqc3g7XG5cblx0XHRmb3JtT3B0aW9ucy51bnNoaWZ0KCB7IHZhbHVlOiAnJywgbGFiZWw6IHdwZm9ybXNfZ3V0ZW5iZXJnX2Zvcm1fc2VsZWN0b3Iuc3RyaW5ncy5mb3JtX3NlbGVjdCB9ICk7XG5cblx0XHRmdW5jdGlvbiBzZWxlY3RGb3JtKCB2YWx1ZSApIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBqc2RvYy9yZXF1aXJlLWpzZG9jXG5cdFx0XHRzZXRBdHRyaWJ1dGVzKCB7IGZvcm1JZDogdmFsdWUgfSApO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRvZ2dsZURpc3BsYXlUaXRsZSggdmFsdWUgKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUganNkb2MvcmVxdWlyZS1qc2RvY1xuXHRcdFx0c2V0QXR0cmlidXRlcyggeyBkaXNwbGF5VGl0bGU6IHZhbHVlIH0gKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiB0b2dnbGVEaXNwbGF5RGVzYyggdmFsdWUgKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUganNkb2MvcmVxdWlyZS1qc2RvY1xuXHRcdFx0c2V0QXR0cmlidXRlcyggeyBkaXNwbGF5RGVzYzogdmFsdWUgfSApO1xuXHRcdH1cblxuXHRcdC8qKlxuXHRcdCAqIEdldCBibG9jayBlbXB0eSBKU1ggY29kZS5cblx0XHQgKlxuXHRcdCAqIEBzaW5jZSAxLjguM1xuXHRcdCAqXG5cdFx0ICogQHBhcmFtIHtPYmplY3R9IGJsb2NrUHJvcHMgQmxvY2sgcHJvcGVydGllcy5cblx0XHQgKlxuXHRcdCAqIEByZXR1cm4ge0pTWC5FbGVtZW50fSBCbG9jayBlbXB0eSBKU1ggY29kZS5cblx0XHQgKi9cblx0XHRmdW5jdGlvbiBnZXRFbXB0eUZvcm1zUHJldmlldyggYmxvY2tQcm9wcyApIHtcblx0XHRcdGNvbnN0IGNsaWVudElkID0gYmxvY2tQcm9wcy5jbGllbnRJZDtcblxuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0PEZyYWdtZW50XG5cdFx0XHRcdFx0a2V5PVwid3Bmb3Jtcy1ndXRlbmJlcmctZm9ybS1zZWxlY3Rvci1mcmFnbWVudC1ibG9jay1lbXB0eVwiPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwid3Bmb3Jtcy1uby1mb3JtLXByZXZpZXdcIj5cblx0XHRcdFx0XHRcdDxpbWcgc3JjPXsgd3Bmb3Jtc19ndXRlbmJlcmdfZm9ybV9zZWxlY3Rvci5ibG9ja19lbXB0eV91cmwgfSBhbHQ9XCJcIiAvPlxuXHRcdFx0XHRcdFx0PHAgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9eyB7IF9faHRtbDogc3RyaW5ncy53cGZvcm1zX2VtcHR5X2luZm8gfSB9PjwvcD5cblx0XHRcdFx0XHRcdDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImdldC1zdGFydGVkLWJ1dHRvbiBjb21wb25lbnRzLWJ1dHRvbiBpcy1idXR0b24gaXMtcHJpbWFyeVwiXG5cdFx0XHRcdFx0XHRcdG9uQ2xpY2s9e1xuXHRcdFx0XHRcdFx0XHRcdCgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdG9wZW5CdWlsZGVyUG9wdXAoIGNsaWVudElkICk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHQ+XG5cdFx0XHRcdFx0XHRcdHsgX18oICdHZXQgU3RhcnRlZCcsICd3cGZvcm1zLWxpdGUnICkgfVxuXHRcdFx0XHRcdFx0PC9idXR0b24+XG5cdFx0XHRcdFx0XHQ8cCBjbGFzc05hbWU9XCJlbXB0eS1kZXNjXCIgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9eyB7IF9faHRtbDogc3RyaW5ncy53cGZvcm1zX2VtcHR5X2hlbHAgfSB9PjwvcD5cblxuXHRcdFx0XHRcdFx0eyAvKiBUZW1wbGF0ZSBmb3IgcG9wdXAgd2l0aCBidWlsZGVyIGlmcmFtZSAqLyB9XG5cdFx0XHRcdFx0XHQ8ZGl2IGlkPVwid3Bmb3Jtcy1ndXRlbmJlcmctcG9wdXBcIiBjbGFzc05hbWU9XCJ3cGZvcm1zLWJ1aWxkZXItcG9wdXBcIj5cblx0XHRcdFx0XHRcdFx0PGlmcmFtZSBzcmM9XCJhYm91dDpibGFua1wiIHdpZHRoPVwiMTAwJVwiIGhlaWdodD1cIjEwMCVcIiBpZD1cIndwZm9ybXMtYnVpbGRlci1pZnJhbWVcIiB0aXRsZT1cIndwZm9ybXMtZ3V0ZW5iZXJnLXBvcHVwXCI+PC9pZnJhbWU+XG5cdFx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PC9GcmFnbWVudD5cblx0XHRcdCk7XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0ICogUHJpbnQgZW1wdHkgZm9ybXMgbm90aWNlLlxuXHRcdCAqXG5cdFx0ICogQHNpbmNlIDEuOC4zXG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gY2xpZW50SWQgQmxvY2sgY2xpZW50IElELlxuXHRcdCAqXG5cdFx0ICogQHJldHVybiB7SlNYLkVsZW1lbnR9IEZpZWxkIHN0eWxlcyBKU1ggY29kZS5cblx0XHQgKi9cblx0XHRmdW5jdGlvbiBwcmludEVtcHR5Rm9ybXNOb3RpY2UoIGNsaWVudElkICkge1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0PEluc3BlY3RvckNvbnRyb2xzIGtleT1cIndwZm9ybXMtZ3V0ZW5iZXJnLWZvcm0tc2VsZWN0b3ItaW5zcGVjdG9yLW1haW4tc2V0dGluZ3NcIj5cblx0XHRcdFx0XHQ8UGFuZWxCb2R5IGNsYXNzTmFtZT1cIndwZm9ybXMtZ3V0ZW5iZXJnLXBhbmVsXCIgdGl0bGU9eyBzdHJpbmdzLmZvcm1fc2V0dGluZ3MgfT5cblx0XHRcdFx0XHRcdDxwIGNsYXNzTmFtZT1cIndwZm9ybXMtZ3V0ZW5iZXJnLXBhbmVsLW5vdGljZSB3cGZvcm1zLXdhcm5pbmcgd3Bmb3Jtcy1lbXB0eS1mb3JtLW5vdGljZVwiIHN0eWxlPXsgeyBkaXNwbGF5OiAnYmxvY2snIH0gfT5cblx0XHRcdFx0XHRcdFx0PHN0cm9uZz57IF9fKCAnWW91IGhhdmVu4oCZdCBjcmVhdGVkIGEgZm9ybSwgeWV0IScsICd3cGZvcm1zLWxpdGUnICkgfTwvc3Ryb25nPlxuXHRcdFx0XHRcdFx0XHR7IF9fKCAnV2hhdCBhcmUgeW91IHdhaXRpbmcgZm9yPycsICd3cGZvcm1zLWxpdGUnICkgfVxuXHRcdFx0XHRcdFx0PC9wPlxuXHRcdFx0XHRcdFx0PGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZ2V0LXN0YXJ0ZWQtYnV0dG9uIGNvbXBvbmVudHMtYnV0dG9uIGlzLWJ1dHRvbiBpcy1zZWNvbmRhcnlcIlxuXHRcdFx0XHRcdFx0XHRvbkNsaWNrPXtcblx0XHRcdFx0XHRcdFx0XHQoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRvcGVuQnVpbGRlclBvcHVwKCBjbGllbnRJZCApO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0PlxuXHRcdFx0XHRcdFx0XHR7IF9fKCAnR2V0IFN0YXJ0ZWQnLCAnd3Bmb3Jtcy1saXRlJyApIH1cblx0XHRcdFx0XHRcdDwvYnV0dG9uPlxuXHRcdFx0XHRcdDwvUGFuZWxCb2R5PlxuXHRcdFx0XHQ8L0luc3BlY3RvckNvbnRyb2xzPlxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHQvKipcblx0XHQgKiBHZXQgc3R5bGluZyBwYW5lbHMgcHJldmlldy5cblx0XHQgKlxuXHRcdCAqIEBzaW5jZSAxLjguOFxuXHRcdCAqXG5cdFx0ICogQHJldHVybiB7SlNYLkVsZW1lbnR9IEpTWCBjb2RlLlxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIGdldFN0eWxpbmdQYW5lbHNQcmV2aWV3KCkge1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0PEZyYWdtZW50PlxuXHRcdFx0XHRcdDxQYW5lbEJvZHkgY2xhc3NOYW1lPVwid3Bmb3Jtcy1ndXRlbmJlcmctcGFuZWwgZGlzYWJsZWRfcGFuZWxcIiB0aXRsZT17IHN0cmluZ3MudGhlbWVzIH0+XG5cdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIndwZm9ybXMtcGFuZWwtcHJldmlldyB3cGZvcm1zLXBhbmVsLXByZXZpZXctdGhlbWVzXCI+PC9kaXY+XG5cdFx0XHRcdFx0PC9QYW5lbEJvZHk+XG5cdFx0XHRcdFx0PFBhbmVsQm9keSBjbGFzc05hbWU9XCJ3cGZvcm1zLWd1dGVuYmVyZy1wYW5lbCBkaXNhYmxlZF9wYW5lbFwiIHRpdGxlPXsgc3RyaW5ncy5maWVsZF9zdHlsZXMgfT5cblx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwid3Bmb3Jtcy1wYW5lbC1wcmV2aWV3IHdwZm9ybXMtcGFuZWwtcHJldmlldy1maWVsZFwiPjwvZGl2PlxuXHRcdFx0XHRcdDwvUGFuZWxCb2R5PlxuXHRcdFx0XHRcdDxQYW5lbEJvZHkgY2xhc3NOYW1lPVwid3Bmb3Jtcy1ndXRlbmJlcmctcGFuZWwgZGlzYWJsZWRfcGFuZWxcIiB0aXRsZT17IHN0cmluZ3MubGFiZWxfc3R5bGVzIH0+XG5cdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIndwZm9ybXMtcGFuZWwtcHJldmlldyB3cGZvcm1zLXBhbmVsLXByZXZpZXctbGFiZWxcIj48L2Rpdj5cblx0XHRcdFx0XHQ8L1BhbmVsQm9keT5cblx0XHRcdFx0XHQ8UGFuZWxCb2R5IGNsYXNzTmFtZT1cIndwZm9ybXMtZ3V0ZW5iZXJnLXBhbmVsIGRpc2FibGVkX3BhbmVsXCIgdGl0bGU9eyBzdHJpbmdzLmJ1dHRvbl9zdHlsZXMgfT5cblx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwid3Bmb3Jtcy1wYW5lbC1wcmV2aWV3IHdwZm9ybXMtcGFuZWwtcHJldmlldy1idXR0b25cIj48L2Rpdj5cblx0XHRcdFx0XHQ8L1BhbmVsQm9keT5cblx0XHRcdFx0XHQ8UGFuZWxCb2R5IGNsYXNzTmFtZT1cIndwZm9ybXMtZ3V0ZW5iZXJnLXBhbmVsIGRpc2FibGVkX3BhbmVsXCIgdGl0bGU9eyBzdHJpbmdzLmNvbnRhaW5lcl9zdHlsZXMgfT5cblx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwid3Bmb3Jtcy1wYW5lbC1wcmV2aWV3IHdwZm9ybXMtcGFuZWwtcHJldmlldy1jb250YWluZXJcIj48L2Rpdj5cblx0XHRcdFx0XHQ8L1BhbmVsQm9keT5cblx0XHRcdFx0XHQ8UGFuZWxCb2R5IGNsYXNzTmFtZT1cIndwZm9ybXMtZ3V0ZW5iZXJnLXBhbmVsIGRpc2FibGVkX3BhbmVsXCIgdGl0bGU9eyBzdHJpbmdzLmJhY2tncm91bmRfc3R5bGVzIH0+XG5cdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIndwZm9ybXMtcGFuZWwtcHJldmlldyB3cGZvcm1zLXBhbmVsLXByZXZpZXctYmFja2dyb3VuZFwiPjwvZGl2PlxuXHRcdFx0XHRcdDwvUGFuZWxCb2R5PlxuXHRcdFx0XHQ8L0ZyYWdtZW50PlxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHRpZiAoICEgaGFzRm9ybXMoKSApIHtcblx0XHRcdGpzeCA9IFsgcHJpbnRFbXB0eUZvcm1zTm90aWNlKCBwcm9wcy5jbGllbnRJZCApIF07XG5cblx0XHRcdGpzeC5wdXNoKCBnZXRFbXB0eUZvcm1zUHJldmlldyggcHJvcHMgKSApO1xuXHRcdFx0cmV0dXJuIGpzeDtcblx0XHR9XG5cblx0XHRqc3ggPSBbXG5cdFx0XHQ8SW5zcGVjdG9yQ29udHJvbHMga2V5PVwid3Bmb3Jtcy1ndXRlbmJlcmctZm9ybS1zZWxlY3Rvci1pbnNwZWN0b3ItY29udHJvbHNcIj5cblx0XHRcdFx0PFBhbmVsQm9keSB0aXRsZT17IHdwZm9ybXNfZ3V0ZW5iZXJnX2Zvcm1fc2VsZWN0b3Iuc3RyaW5ncy5mb3JtX3NldHRpbmdzIH0+XG5cdFx0XHRcdFx0PFNlbGVjdENvbnRyb2xcblx0XHRcdFx0XHRcdGxhYmVsPXsgd3Bmb3Jtc19ndXRlbmJlcmdfZm9ybV9zZWxlY3Rvci5zdHJpbmdzLmZvcm1fc2VsZWN0ZWQgfVxuXHRcdFx0XHRcdFx0dmFsdWU9eyBmb3JtSWQgfVxuXHRcdFx0XHRcdFx0b3B0aW9ucz17IGZvcm1PcHRpb25zIH1cblx0XHRcdFx0XHRcdG9uQ2hhbmdlPXsgc2VsZWN0Rm9ybSB9XG5cdFx0XHRcdFx0Lz5cblx0XHRcdFx0XHQ8VG9nZ2xlQ29udHJvbFxuXHRcdFx0XHRcdFx0bGFiZWw9eyB3cGZvcm1zX2d1dGVuYmVyZ19mb3JtX3NlbGVjdG9yLnN0cmluZ3Muc2hvd190aXRsZSB9XG5cdFx0XHRcdFx0XHRjaGVja2VkPXsgZGlzcGxheVRpdGxlIH1cblx0XHRcdFx0XHRcdG9uQ2hhbmdlPXsgdG9nZ2xlRGlzcGxheVRpdGxlIH1cblx0XHRcdFx0XHQvPlxuXHRcdFx0XHRcdDxUb2dnbGVDb250cm9sXG5cdFx0XHRcdFx0XHRsYWJlbD17IHdwZm9ybXNfZ3V0ZW5iZXJnX2Zvcm1fc2VsZWN0b3Iuc3RyaW5ncy5zaG93X2Rlc2NyaXB0aW9uIH1cblx0XHRcdFx0XHRcdGNoZWNrZWQ9eyBkaXNwbGF5RGVzYyB9XG5cdFx0XHRcdFx0XHRvbkNoYW5nZT17IHRvZ2dsZURpc3BsYXlEZXNjIH1cblx0XHRcdFx0XHQvPlxuXHRcdFx0XHRcdDxwIGNsYXNzTmFtZT1cIndwZm9ybXMtZ3V0ZW5iZXJnLXBhbmVsLW5vdGljZSB3cGZvcm1zLXdhcm5pbmdcIj5cblx0XHRcdFx0XHRcdDxzdHJvbmc+eyBzdHJpbmdzLnVwZGF0ZV93cF9ub3RpY2VfaGVhZCB9PC9zdHJvbmc+XG5cdFx0XHRcdFx0XHR7IHN0cmluZ3MudXBkYXRlX3dwX25vdGljZV90ZXh0IH0gPGEgaHJlZj17IHN0cmluZ3MudXBkYXRlX3dwX25vdGljZV9saW5rIH0gcmVsPVwibm9yZWZlcnJlclwiIHRhcmdldD1cIl9ibGFua1wiPnsgc3RyaW5ncy5sZWFybl9tb3JlIH08L2E+XG5cdFx0XHRcdFx0PC9wPlxuXHRcdFx0XHQ8L1BhbmVsQm9keT5cblx0XHRcdFx0eyBnZXRTdHlsaW5nUGFuZWxzUHJldmlldygpIH1cblx0XHRcdDwvSW5zcGVjdG9yQ29udHJvbHM+LFxuXHRcdF07XG5cblx0XHRpZiAoIGZvcm1JZCApIHtcblx0XHRcdGpzeC5wdXNoKFxuXHRcdFx0XHQ8U2VydmVyU2lkZVJlbmRlclxuXHRcdFx0XHRcdGtleT1cIndwZm9ybXMtZ3V0ZW5iZXJnLWZvcm0tc2VsZWN0b3Itc2VydmVyLXNpZGUtcmVuZGVyZXJcIlxuXHRcdFx0XHRcdGJsb2NrPVwid3Bmb3Jtcy9mb3JtLXNlbGVjdG9yXCJcblx0XHRcdFx0XHRhdHRyaWJ1dGVzPXsgcHJvcHMuYXR0cmlidXRlcyB9XG5cdFx0XHRcdC8+XG5cdFx0XHQpO1xuXHRcdH0gZWxzZSBpZiAoIHByZXZpZXcgKSB7XG5cdFx0XHRqc3gucHVzaChcblx0XHRcdFx0PEZyYWdtZW50XG5cdFx0XHRcdFx0a2V5PVwid3Bmb3Jtcy1ndXRlbmJlcmctZm9ybS1zZWxlY3Rvci1mcmFnbWVudC1ibG9jay1wcmV2aWV3XCI+XG5cdFx0XHRcdFx0PGltZyBzcmM9eyB3cGZvcm1zX2d1dGVuYmVyZ19mb3JtX3NlbGVjdG9yLmJsb2NrX3ByZXZpZXdfdXJsIH0gc3R5bGU9eyB7IHdpZHRoOiAnMTAwJScgfSB9IGFsdD1cIlwiIC8+XG5cdFx0XHRcdDwvRnJhZ21lbnQ+XG5cdFx0XHQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRqc3gucHVzaChcblx0XHRcdFx0PFBsYWNlaG9sZGVyXG5cdFx0XHRcdFx0a2V5PVwid3Bmb3Jtcy1ndXRlbmJlcmctZm9ybS1zZWxlY3Rvci13cmFwXCJcblx0XHRcdFx0XHRjbGFzc05hbWU9XCJ3cGZvcm1zLWd1dGVuYmVyZy1mb3JtLXNlbGVjdG9yLXdyYXBcIj5cblx0XHRcdFx0XHQ8aW1nIHNyYz17IHdwZm9ybXNfZ3V0ZW5iZXJnX2Zvcm1fc2VsZWN0b3IubG9nb191cmwgfSBhbHQ9XCJcIiAvPlxuXHRcdFx0XHRcdDxTZWxlY3RDb250cm9sXG5cdFx0XHRcdFx0XHRrZXk9XCJ3cGZvcm1zLWd1dGVuYmVyZy1mb3JtLXNlbGVjdG9yLXNlbGVjdC1jb250cm9sXCJcblx0XHRcdFx0XHRcdHZhbHVlPXsgZm9ybUlkIH1cblx0XHRcdFx0XHRcdG9wdGlvbnM9eyBmb3JtT3B0aW9ucyB9XG5cdFx0XHRcdFx0XHRvbkNoYW5nZT17IHNlbGVjdEZvcm0gfVxuXHRcdFx0XHRcdC8+XG5cdFx0XHRcdDwvUGxhY2Vob2xkZXI+XG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdHJldHVybiBqc3g7XG5cdH0sXG5cdHNhdmUoKSB7XG5cdFx0cmV0dXJuIG51bGw7XG5cdH0sXG59ICk7XG4iXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxJQUFBQSxHQUFBLEdBQWdGQyxFQUFFO0VBQUFDLG9CQUFBLEdBQUFGLEdBQUEsQ0FBMUVHLGdCQUFnQjtFQUFFQyxnQkFBZ0IsR0FBQUYsb0JBQUEsY0FBR0QsRUFBRSxDQUFDSSxVQUFVLENBQUNELGdCQUFnQixHQUFBRixv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
},{}]},{},[1])