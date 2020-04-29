/* globals ajaxurl, wpforms_admin */

/**
 * WPForms Admin Education module.
 *
 * @since 1.5.6
 */

'use strict';

var WPFormsAdminEducation = window.WPFormsAdminEducation || ( function( document, window, $ ) {

	/**
	 * Public functions and properties.
	 *
	 * @since 1.5.6
	 *
	 * @type {object}
	 */
	var app = {

		/**
		 * Start the engine.
		 *
		 * @since 1.5.6
		 */
		init: function() {
			$( document ).ready( app.ready );
		},

		/**
		 * Document ready.
		 *
		 * @since 1.5.6
		 */
		ready: function() {
			app.events();
		},

		/**
		 * Register JS events.
		 *
		 * @since 1.5.6
		 */
		events: function() {

			// "Did You Know?" Click on the dismiss button.
			$( '.wpforms-dyk' ).on( 'click', '.dismiss', function( e ) {
				var $t = $( this ),
					$tr = $t.closest( '.wpforms-dyk' ),
					data = {
						action: 'wpforms_dyk_dismiss',
						nonce: wpforms_admin.nonce,
						page: $t.attr( 'data-page' ),
					};

				$tr.find( '.wpforms-dyk-fbox' ).addClass( 'out' );
				setTimeout(
					function() {
						$tr.remove();
					},
					300
				);

				$.get( ajaxurl, data );
			} );
		},

	};

	return app;

}( document, window, jQuery ) );

// Initialize.
WPFormsAdminEducation.init();
