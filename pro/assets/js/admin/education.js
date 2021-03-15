/* global ajaxurl, wpforms_admin, wpforms_admin, WPFormsAdmin */

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
			$( app.ready );
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

			app.dyk();
			app.hideEducation();
			app.activateEducation();
		},

		/**
		 * Did You Know? events.
		 *
		 * @since 1.6.3
		 */
		dyk: function() {

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
				setTimeout( function() {
					$tr.remove();
				}, 300 );

				$.get( ajaxurl, data );
			} );
		},

		/**
		 * Activate plugin in education popup.
		 *
		 * @since 1.6.3
		 */
		activateEducation: function() {

			$( '.toggle-plugin' ).on( 'click', function( e ) {

				e.preventDefault();
				if ( $( this ).hasClass( 'inactive' ) ) {
					return;
				}
				$( this ).addClass( 'inactive' );

				var $button = $( this ),
					$form = $( this ).closest( '.wpforms-geolocation-form, .wpforms-setting-row-education' ),
					buttonText = $button.text(),
					plugin = $button.attr( 'data-plugin' ),
					state = $button.hasClass( 'status-inactive' ) ? 'activate' : 'install',
					pluginType = $button.attr( 'data-type' );

				$button.html( WPFormsAdmin.settings.iconSpinner + buttonText );
				WPFormsAdmin.setAddonState(
					plugin,
					state,
					pluginType,
					function( res ) {

						if ( res.success ) {
							location.reload();
						} else {
							var message = typeof res.data === 'string' ? res.data : wpforms_admin[ pluginType + '_error' ];

							$form.append( '<div class="msg error" style="display: none">' + message + '</div>' );
							$form.find( '.msg' ).slideDown();
						}
						$button.text( buttonText );
						setTimeout( function() {

							$button.removeClass( 'inactive' );
							$form.find( '.msg' ).slideUp( '', function() {
								$( this ).remove();
							} );
						}, 3000 );
					} );
			} );
		},

		/**
		 * Hide education message.
		 *
		 * @since 1.6.3
		 */
		hideEducation: function() {

			$( '.wpforms-education-hide' ).on( 'click', function( e ) {
				e.preventDefault();
				var container = $( this ).closest( '.postbox' );
				var data = {
					action: 'hide_education',
					nonce: $( this ).attr( 'data-nonce' ),
					plugin: $( this ).attr( 'data-plugin' ),
				};
				$.post(
					wpforms_admin.ajax_url,
					data,
					function( data ) {
						if ( data ) {
							container.slideUp();
						}
					} );
			} );
		},

	};

	return app;

}( document, window, jQuery ) );

// Initialize.
WPFormsAdminEducation.init();
