/* global wpforms_admin */

/**
 * Logger scripts
 *
 * @since 1.6.3
 */

'use strict';

var WPFormsLogger = window.WPFormsLogger || ( function( document, window, $ ) {

	var app = {

		/**
		 * Start the engine.
		 *
		 * @since 1.6.3
		 */
		init: function() {

			app.bindPopup();
		},

		/**
		 * Bind popup to the click on logger link.
		 *
		 * @since 1.6.3
		 */
		bindPopup: function() {

			$( '.wp-list-table.logs' ).on( 'click', '.js-single-log-target', function( e ) {

				e.preventDefault();
				$.get(
					wpforms_admin.ajax_url,
					{
						action: 'wpforms_get_log_record',
						nonce: wpforms_admin.nonce,
						recordId: $( this ).attr( 'data-log-id' ),
					},
					app.showPopup
				);
			} );
		},

		/**
		 * Show popup.
		 *
		 * @since 1.6.3
		 *
		 * @param {object} res Ajax response.
		 */
		showPopup: function( res ) {

			if ( ! res.success || ! res.data ) {
				return;
			}
			var popupTemplate = wp.template( 'wpforms-log-record' );
			$.dialog( {
				title: false,
				boxWidth: Math.min( 550, $( window ).width() ),
				content: popupTemplate( res.data ),
				animation: 'scale',
				columnClass: 'medium',
				closeAnimation: 'scale',
				backgroundDismiss: true,
			} );
		},
	};

	return app;

}( document, window, jQuery ) );

// Initialize.
WPFormsLogger.init();
