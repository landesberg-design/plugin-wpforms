/* global flatpickr, wpforms_admin */

/**
 * Entries page.
 *
 * @since 1.6.3
 */

'use strict';

var WPFormsPagesEntries = window.WPFormsPagesEntries || ( function( document, window, $ ) {

	var app = {

		/**
		 * Start the engine.
		 *
		 * @since 1.6.3
		 */
		init: function() {

			$( app.ready );
		},

		/**
		 * Document ready.
		 *
		 * @since 1.6.3
		 */
		ready: function() {

			app.initFlatpickr();
			app.bindResetButtons();
		},

		/**
		 * Document ready.
		 *
		 * @since 1.6.3
		 */
		initFlatpickr: function() {

			var flatpickrLocale = {
					rangeSeparator: ' - ',
				},
				args = {
					altInput: true,
					altFormat: 'M j, Y',
					dateFormat: 'Y-m-d',
					mode: 'range',
					defaultDate: wpforms_admin.default_date,
				};

			if (
				flatpickr !== 'undefined' &&
				Object.prototype.hasOwnProperty.call( flatpickr, 'l10ns' ) &&
				Object.prototype.hasOwnProperty.call( flatpickr.l10ns, wpforms_admin.lang_code )
			) {
				flatpickrLocale = flatpickr.l10ns[ wpforms_admin.lang_code ];

				// Rewrite separator for all locales to make filtering work.
				flatpickrLocale.rangeSeparator = ' - ';
			}

			args.locale = flatpickrLocale;

			$( '.wpforms-filter-date-selector' ).flatpickr( args );
		},

		/**
		 * Reset input.
		 *
		 * @since 1.6.3
		 *
		 * @param {object} $input Input element.
		 */
		reset: function( $input ) {

			switch ( $input.prop( 'tagName' ).toLowerCase() ) {
				case 'input':
					$input.val( '' );
					break;
				case 'select':
					$input.val( $input.find( 'option' ).first().val() );
					break;
			}
		},

		/**
		 * Input is ignored for reset.
		 *
		 * @since 1.6.3
		 *
		 * @param {object} $input Input element.
		 *
		 * @returns {boolean} Is ignored.
		 */
		isIgnoredForReset: function( $input ) {

			return [ 'submit', 'hidden' ].indexOf( ( $input.attr( 'type' ) || '' ).toLowerCase() ) !== -1 &&
				! $input.hasClass( 'flatpickr-input' );
		},

		/**
		 * Bind reset buttons.
		 *
		 * @since 1.6.3
		 */
		bindResetButtons: function() {

			$( '#wpforms-reset-filter .reset' ).on( 'click', function() {

				var $form = $( this ).parents( 'form' );
				$form.find( $( this ).data( 'scope' ) ).find( 'input,select' ).each( function() {

					var $this = $( this );
					if ( app.isIgnoredForReset( $this ) ) {
						return;
					}
					app.reset( $this );
				} );

				// Submit the form
				$form.submit();
			} );
		},
	};

	// Provide access to public functions/properties.
	return app;

}( document, window, jQuery ) );

// Initialize.
WPFormsPagesEntries.init();
