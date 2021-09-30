/* global wpforms_education */
/**
 * WPForms Education Core.
 *
 * @since 1.6.6
 */

'use strict';

var WPFormsEducation = window.WPFormsEducation || {};

WPFormsEducation.core = window.WPFormsEducation.core || ( function( document, window, $ ) {

	/**
	 * Public functions and properties.
	 *
	 * @since 1.6.6
	 *
	 * @type {object}
	 */
	var app = {

		/**
		 * Start the engine.
		 *
		 * @since 1.6.6
		 */
		init: function() {

			$( app.ready );
		},

		/**
		 * Document ready.
		 *
		 * @since 1.6.6
		 */
		ready: function() {

			app.events();
		},

		/**
		 * Register JS events.
		 *
		 * @since 1.6.6
		 */
		events: function() {

			app.dismissEvents();
		},

		/**
		 * Dismiss button events.
		 *
		 * @since 1.6.6
		 */
		dismissEvents: function() {

			$( '.wpforms-dismiss-container' ).on( 'click', '.wpforms-dismiss-button', function( e ) {

				var $this = $( this ),
					$cont = $this.closest( '.wpforms-dismiss-container' ),
					$out = $cont.find( '.wpforms-dismiss-out' ),
					data = {
						action: 'wpforms_education_dismiss',
						nonce: wpforms_education.nonce,
						section: $this.data( 'section' ),
					};

				if ( $cont.hasClass( 'wpforms-dismiss-out' ) ) {
					$out = $cont;
				}

				if ( $out.length > 0 ) {
					$out.addClass( 'out' );
					setTimeout(
						function() {
							$cont.remove();
						},
						300
					);
				} else {
					$cont.remove();
				}

				$.post( wpforms_education.ajax_url, data );
			} );
		},

		/**
		 * Get UTM content for different elements.
		 *
		 * @since 1.6.9
		 *
		 * @param {jQuery} $el Element.
		 *
		 * @returns {string} UTM content string.
		 */
		getUTMContentValue: function( $el ) {

			// UTM content for Fields.
			if ( $el.hasClass( 'wpforms-add-fields-button' ) ) {
				return $el.data( 'utm-content' ) + ' Field';
			}

			// UTM content for Templates.
			if ( $el.hasClass( 'wpforms-template-select' ) ) {
				return app.slugToUTMcontent( $el.data( 'slug' ) );
			}

			// UTM content for Addons (sidebar).
			if ( $el.hasClass( 'wpforms-panel-sidebar-section' ) ) {
				return app.slugToUTMcontent( $el.data( 'slug' ) ) + ' Addon';
			}

			// UTM content by default.
			return $el.data( 'name' );
		},

		/**
		 * Convert slug to UTM content.
		 *
		 * @since 1.6.9
		 *
		 * @param {string} slug Slug.
		 *
		 * @returns {string} UTM content string.
		 */
		slugToUTMcontent: function( slug ) {

			if ( ! slug ) {
				return '';
			}

			return slug.toString()

				// Replace all non-alphanumeric characters with space.
				.replace( /[^a-z\d ]/gi, ' ' )

				// Uppercase each word.
				.replace( /\b[a-z]/g, function( char ) {
					return char.toUpperCase();
				} );
		},

		/**
		 * Get upgrade URL according to the UTM content and license type.
		 *
		 * @since 1.6.9
		 *
		 * @param {string} utmContent UTM content.
		 * @param {string} type       Feature license type: pro or elite.
		 *
		 * @returns {string} Upgrade URL.
		 */
		getUpgradeURL: function( utmContent, type ) {

			var	baseURL = wpforms_education.upgrade[ type ].url;

			if ( utmContent.toLowerCase().indexOf( 'template' ) > -1 ) {
				baseURL = wpforms_education.upgrade[ type ].url_template;
			}

			// Test if the base URL already contains `?`.
			var appendChar = /(\?)/.test( baseURL ) ? '&' : '?';

			return baseURL + appendChar + 'utm_content=' + encodeURIComponent( utmContent.trim() );
		},
	};

	// Provide access to public functions/properties.
	return app;

}( document, window, jQuery ) );

WPFormsEducation.core.init();
