/**
 * View single entry page.
 *
 * @since 1.7.0
 */

'use strict';

var WPFormsViewEntry = window.WPFormsViewEntry || ( function( document, window, $ ) { // eslint-disable-line no-unused-vars

	/**
	 * Public functions and properties.
	 *
	 * @since 1.7.0
	 *
	 * @type {object}
	 */
	var app = {

		/**
		 * Start the engine.
		 *
		 * @since 1.7.0
		 */
		init: function() {

			// Document ready.
			$( app.ready );
		},

		/**
		 * Document ready.
		 *
		 * @since 1.7.0
		 */
		ready: function() {

			app.loadAllRichTextFields();
		},

		/**
		 * Load all Rich Text fields.
		 *
		 * @since 1.7.0
		 */
		loadAllRichTextFields: function() {

			$( '.wpforms-entry-field-value-richtext' ).each( function() {

				var iframe = this,
					$iframe = $( this );

				$iframe.on( 'load', function() {

					app.loadRichTextField( iframe );
				} );

				$iframe.attr( 'src', $iframe.data( 'src' ) );
			} );
		},

		/**
		 * Rich Text field iframe onload handler.
		 *
		 * @since 1.7.0
		 *
		 * @param {object} obj Iframe element.
		 */
		loadRichTextField: function( obj ) {

			// Replicate `font-family` from the admin page to the iframe document.
			$( obj.contentWindow.document.documentElement ).find( 'body' ).css( 'font-family', $( 'body' ).css( 'font-family' ) );

			app.resizeRichTextField( obj );
			app.addLinksAttr( obj );
		},

		/**
		 * Resize Rich Text field.
		 *
		 * @since 1.7.0
		 *
		 * @param {object} obj Iframe element.
		 */
		resizeRichTextField: function( obj ) {

			if ( ! obj || ! obj.contentWindow ) {
				return;
			}

			var doc = obj.contentWindow.document.documentElement || false;

			if ( ! doc ) {
				return;
			}

			var height = doc.scrollHeight;

			height += doc.scrollWidth > doc.clientWidth ? 20 : 0;

			obj.style.height = height + 'px';
		},

		/**
		 * Add links attributes inside iframe.
		 *
		 * @since 1.7.0
		 *
		 * @param {object} obj Iframe element.
		 */
		addLinksAttr: function( obj ) {

			$( obj ).contents().find( 'a' ).each( function() {

				var $this = $( this );

				$this.attr( 'rel', 'noopener' );

				if ( ! $this.attr( 'target' ) ) {
					$this.attr( 'target', '_top' );
				}
			} );
		},
	};

	// Provide access to public functions/properties.
	return app;

}( document, window, jQuery ) );

WPFormsViewEntry.init();
