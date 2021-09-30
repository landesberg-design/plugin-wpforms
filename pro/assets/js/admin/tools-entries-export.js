/* global wpforms_tools_entries_export, ajaxurl */
/**
 * WPForms Entries Export function.
 *
 * @since 1.5.5
 */

'use strict';

var WPFormsEntriesExport = window.WPFormsEntriesExport || ( function( document, window, $ ) {

	/**
	 * Elements.
	 *
	 * @since 1.5.5
	 *
	 * @type {object}
	 */
	var el = {

		$form 			     : $( '#wpforms-tools-entries-export' ),
		$selectForm          : $( '#wpforms-tools-entries-export-selectform' ),
		$selectFormSpinner   : $( '#wpforms-tools-entries-export-selectform-spinner' ),
		$selectFormMsg       : $( '#wpforms-tools-entries-export-selectform-msg' ),
		$expOptions          : $( '#wpforms-tools-entries-export-options' ),
		$fieldsCheckboxes    : $( '#wpforms-tools-entries-export-options-fields-checkboxes' ),
		$dateSection         : $( '#wpforms-tools-entries-export-options-date' ),
		$dateFlatpickr       : $( '#wpforms-tools-entries-export-options-date-flatpickr' ),
		$searchSection       : $( '#wpforms-tools-entries-export-options-search' ),
		$searchField         : $( '#wpforms-tools-entries-export-options-search-field' ),
		$submitButton        : $( '#wpforms-tools-entries-export-submit' ),
		$cancelButton        : $( '#wpforms-tools-entries-export-cancel' ),
		$processMsg          : $( '#wpforms-tools-entries-export-process-msg' ),

	};

	/**
	 * Shorthand to translated strings.
	 *
	 * @since 1.5.5
	 *
	 * @type {object}
	 */
	var i18n = wpforms_tools_entries_export.i18n;

	/**
	 * Runtime variables.
	 *
	 * @since 1.5.5
	 *
	 * @type {object}
	 */
	var vars = {};

	/**
	 * Public functions and properties.
	 *
	 * @since 1.5.5
	 *
	 * @type {object}
	 */
	var app = {

		/**
		 * Forms data cached.
		 *
		 * @since 1.5.5
		 *
		 * @type {object}
		 */
		formsCache: {},

		/**
		 * Start the engine.
		 *
		 * @since 1.5.5
		 */
		init: function() {

			$( app.ready );
		},

		/**
		 * Document ready.
		 *
		 * @since 1.5.5
		 */
		ready: function() {

			vars.processing = false;

			app.initDateRange();
			app.initFormCont();
			app.initSubmit();
			app.events();
		},

		/**
		 * Register JS events.
		 *
		 * @since 1.5.5
		 */
		events: function() {

			// Selecting form.
			el.$selectForm[0].addEventListener( 'choice', function( e ) {

				if ( e.detail.choice.placeholder ) {
					el.$expOptions.addClass( 'hidden' );
					return;
				}
				if ( vars.formID === e.detail.choice.value ) {
					return;
				}
				vars.formID = e.detail.choice.value;
				if ( 'undefined' === typeof app.formsCache[ vars.formID ] ) {
					app.retrieveFormAndRenderFields();
				} else {
					app.renderFields( app.formsCache[ vars.formID ] );
				}
			} );

			// Display file download error.
			$( document ).on( 'csv_file_error', function( e, msg ) {
				app.displaySubmitMsg( msg, 'error' );
			} );

		},

		/**
		 * Retrieve the form fields and render fields checkboxes.
		 *
		 * @since 1.5.5
		 */
		retrieveFormAndRenderFields: function() {

			vars.ajaxData = {
				action: 'wpforms_tools_entries_export_form_data',
				nonce:  wpforms_tools_entries_export.nonce,
				form:   vars.formID,
			};
			el.$selectFormSpinner.removeClass( 'hidden' );
			app.displayFormsMsg( '' );
			$.get( ajaxurl, vars.ajaxData )
				.done( function( res ) {
					if ( res.success ) {
						app.renderFields( res.data.fields );
						app.formsCache[ vars.formID ] = res.data.fields;
						el.$expOptions.removeClass( 'hidden' );
					} else {
						app.displayFormsMsg( res.data.error );
						el.$expOptions.addClass( 'hidden' );
					}
				} )
				.fail( function( jqXHR, textStatus, errorThrown ) {
					app.displayFormsMsg( i18n.error_prefix + ':<br>' + errorThrown );
					el.$expOptions.addClass( 'hidden' );
				} )
				.always( function() {
					el.$selectFormSpinner.addClass( 'hidden' );
				} );
		},

		/**
		 * Export step ajax request.
		 *
		 * @since 1.5.5
		 *
		 * @param {string} requestId Request Identifier.
		 */
		exportAjaxStep: function( requestId ) {

			var ajaxData;

			if ( ! vars.processing ) {
				return;
			}

			ajaxData = app.getAjaxPostData( requestId );
			$.post( ajaxurl, ajaxData )
				.done( function( res ) {
					var msg = '';
					clearTimeout( vars.timerId );
					if ( ! res.success ) {
						app.displaySubmitMsg( res.data.error, 'error' );
						return;
					}
					if ( res.data.count === 0 ) {
						app.displaySubmitMsg( i18n.prc_2_no_entries );
						return;
					}
					msg = i18n.prc_3_done;
					msg += '<br>' + i18n.prc_3_download + ', <a href="#" class="wpforms-download-link">' + i18n.prc_3_click_here + '</a>.';
					app.displaySubmitMsg( msg, 'info' );
					app.triggerDownload( res.data.request_id );
				} )
				.fail( function( jqXHR, textStatus, errorThrown ) {
					clearTimeout( vars.timerId );
					app.displaySubmitMsg( i18n.error_prefix + ':<br>' + errorThrown, 'error' );
				} )
				.always( function() {
					app.displaySubmitSpinner( false );
				} );
		},

		/**
		 * Get export step ajax POST data.
		 *
		 * @since 1.5.5
		 *
		 * @param {string} requestId Request Identifier.
		 *
		 * @returns {object} Ajax POST data.
		 */
		getAjaxPostData: function( requestId ) {

			var ajaxData;

			if ( requestId === 'first-step' ) {
				ajaxData = el.$form.serializeArray().reduce( function( obj, item ) {
					obj[ item.name ] = item.value;
					return obj;
				}, {} );
				if ( el.$fieldsCheckboxes.find( 'input' ).length < 1 ) {
					ajaxData.date = '';
					ajaxData['search[term]'] = '';
				}
			} else {
				ajaxData = {
					'action':     'wpforms_tools_entries_export_step',
					'nonce':      wpforms_tools_entries_export.nonce,
					'request_id': requestId,
				};
			}

			return ajaxData;
		},

		/**
		 * Submit button click.
		 *
		 * @since 1.5.5
		 */
		initSubmit: function() {

			el.$submitButton.on( 'click', function( e ) {

				e.preventDefault();

				var $t = $( this );

				if ( $t.hasClass( 'wpforms-btn-spinner-on' ) ) {
					return;
				}

				el.$submitButton.blur();
				app.displaySubmitSpinner( true );
				app.displaySubmitMsg( '' );

				vars.timerId = setTimeout(
					function() {
						app.displaySubmitMsg( i18n.prc_1_filtering + '<br>' + i18n.prc_1_please_wait, 'info' );
					},
					3000
				);

				app.exportAjaxStep( 'first-step' );

			} );

			el.$cancelButton.on( 'click', function( e ) {

				e.preventDefault();
				el.$cancelButton.blur();
				app.displaySubmitMsg( '' );
				app.displaySubmitSpinner( false );
			} );
		},

		/**
		 * Init Form container.
		 *
		 * @since 1.5.5
		 */
		initFormCont: function() {

			if ( wpforms_tools_entries_export.form_id > 0 ) {
				el.$expOptions.removeClass( 'hidden' );

				if ( el.$fieldsCheckboxes.find( 'input' ).length < 1 ) {
					el.$dateSection.addClass( 'hidden' );
					el.$searchSection.addClass( 'hidden' );
				}
			}
		},

		/**
		 * Init Flatpickr at Date Range field.
		 *
		 * @since 1.5.5
		 */
		initDateRange: function() {

			var langCode = wpforms_tools_entries_export.lang_code,
				flatpickr = window.flatpickr,
				flatpickrLocale = {
					rangeSeparator: ' - ',
				};

			if (
				flatpickr !== 'undefined' &&
				flatpickr.hasOwnProperty( 'l10ns' ) &&
				flatpickr.l10ns.hasOwnProperty( langCode )
			) {
				flatpickrLocale = flatpickr.l10ns[ langCode ];
				flatpickrLocale.rangeSeparator = ' - ';
			}

			el.$dateFlatpickr.flatpickr( {
				altInput: true,
				altFormat: 'M j, Y',
				dateFormat: 'Y-m-d',
				locale: flatpickrLocale,
				mode: 'range',
				defaultDate: wpforms_tools_entries_export.dates,
			} );
		},

		/**
		 * Render fields checkboxes.
		 *
		 * @since 1.5.5
		 *
		 * @param {object} fields Form fields data.
		 */
		renderFields: function( fields ) {

			if ( typeof fields !== 'object' ) {
				return;
			}

			var html = {
					checkboxes: '',
					options: '',
				},
				fieldsKeys = Object.keys( fields );

			if ( fieldsKeys.length === 0 ) {

				html.checkboxes = '<span>' + i18n.error_form_empty + '</span>';
				el.$dateSection.addClass( 'hidden' );
				el.$searchSection.addClass( 'hidden' );
			} else {

				fieldsKeys.forEach( function( key, i ) {
					var ch = '<label><input type="checkbox" name="fields[{i}]" value="{id}" checked> {label}</label>',
						id = parseInt( fields[ key ].id, 10 );
					ch = ch.replace( '{i}', parseInt( i, 10 ) );
					ch = ch.replace( '{id}', id );
					ch = ch.replace( '{label}', fields[ key ].label );
					html.checkboxes += ch;

					var op = '<option value="{id}">{label}</option>';
					op = op.replace( '{id}', id );
					op = op.replace( '{label}', fields[ key ].label );
					html.options += op;
				} );
				el.$dateSection.removeClass( 'hidden' );
				el.$searchSection.removeClass( 'hidden' );
			}

			el.$fieldsCheckboxes.html( html.checkboxes );

			el.$searchField.find( 'optgroup:first-child option:not(:first-child)' ).remove();
			el.$searchField.find( 'optgroup:first-child' ).append( html.options );
		},

		/**
		 * Show/hide submit button spinner.
		 *
		 * @since 1.5.5
		 *
		 * @param {boolean} show Show or hide the submit button spinner.
		 */
		displaySubmitSpinner: function( show ) {

			if ( show ) {
				el.$submitButton.addClass( 'wpforms-btn-spinner-on' );
				el.$cancelButton.removeClass( 'hidden' );
				vars.processing = true;
			} else {
				el.$submitButton.removeClass( 'wpforms-btn-spinner-on' );
				el.$cancelButton.addClass( 'hidden' );
				vars.processing = false;
			}
		},

		/**
		 * Display error message under form selector.
		 *
		 * @since 1.5.5
		 *
		 * @param {string} msg  Message.
		 */
		displayFormsMsg: function( msg ) {

			el.$selectFormMsg.html( msg );

			if ( msg.length > 0 ) {
				el.$selectFormMsg.removeClass('hidden');
			} else {
				el.$selectFormMsg.addClass('hidden');
			}
		},

		/**
		 * Display message under submit button.
		 *
		 * @since 1.5.5
		 *
		 * @param {string} msg  Message.
		 * @param {string} type Use 'error' for errors messages.
		 */
		displaySubmitMsg: function( msg, type ) {

			if ( type && type === 'error' ) {
				el.$processMsg.addClass( 'wpforms-error' );
			} else {
				el.$processMsg.removeClass( 'wpforms-error' );
			}

			el.$processMsg.html( msg );

			if ( msg.length > 0 ) {
				el.$processMsg.removeClass( 'hidden' );
			} else {
				el.$processMsg.addClass( 'hidden' );
			}
		},

		/**
		 * Initiating file downloading.
		 *
		 * @since 1.5.5
		 *
		 * @param {string} requestId Request ID.
		 */
		triggerDownload: function( requestId ) {

			var url = wpforms_tools_entries_export.export_page;

			url += '&action=wpforms_tools_entries_export_download';
			url += '&nonce=' + wpforms_tools_entries_export.nonce;
			url += '&request_id=' + requestId;

			el.$expOptions.find( 'iframe' ).remove();
			el.$expOptions.append( '<iframe src="' + url + '"></iframe>' );
			el.$processMsg.find( '.wpforms-download-link' ).attr( 'href', url );
		},

	};

	// Provide access to public functions/properties.
	return app;

}( document, window, jQuery ) );

// Initialize.
WPFormsEntriesExport.init();
