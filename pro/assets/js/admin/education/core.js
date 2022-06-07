/* global wpforms_education, WPFormsAdmin, wpforms_admin */
/**
 * WPForms Education core for Pro.
 *
 * @since 1.6.6
 */

'use strict';

var WPFormsEducation = window.WPFormsEducation || {};

WPFormsEducation.proCore = window.WPFormsEducation.proCore || ( function( document, window, $ ) {

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

			app.openModalButtonClick();
			app.activateButtonClick();
		},

		/**
		 * Open education modal.
		 *
		 * @since 1.6.6
		 */
		openModalButtonClick: function() {

			$( document ).on(
				'click',
				'.education-modal',
				function( event ) {

					var $this = $( this );

					if ( ! $this.data( 'action' ) || [ 'activate', 'install' ].includes( $this.data( 'action' ) ) ) {
						return;
					}

					event.preventDefault();
					event.stopImmediatePropagation();

					switch ( $this.data( 'action' ) ) {
						case 'upgrade':
							app.upgradeModal(
								$this.data( 'name' ),
								$this.data( 'field-name' ),
								WPFormsEducation.core.getUTMContentValue( $this ),
								$this.data( 'license' ),
								$this.data( 'video' )
							);
							break;
						case 'license':
							app.licenseModal();
							break;
					}
				}
			);
		},

		/**
		 * Activate addon by clicking the toggle button.
		 * Used in the Geolocation education box on the single entry view page.
		 *
		 * @since 1.6.6
		 */
		activateButtonClick: function() {

			$( '.wpforms-education-toggle-plugin-btn' ).on( 'click', function( event ) {

				var $button = $( this );

				event.preventDefault();
				event.stopImmediatePropagation();

				if ( $button.hasClass( 'inactive' ) ) {
					return;
				}

				$button.addClass( 'inactive' );

				var $form = $button.closest( '.wpforms-addon-form, .wpforms-setting-row-education' ),
					buttonText = $button.text(),
					plugin = $button.data( 'plugin' ),
					state = $button.data( 'action' ),
					pluginType = $button.data( 'type' );

				$button.html( WPFormsAdmin.settings.iconSpinner + buttonText );
				WPFormsAdmin.setAddonState(
					plugin,
					state,
					pluginType,
					function( res ) {

						if ( res.success ) {
							location.reload();
						} else {
							$form.append( '<div class="msg error" style="display: none">' + wpforms_admin[ pluginType + '_error' ] + '</div>' );
							$form.find( '.msg' ).slideDown();
						}
						$button.text( buttonText );
						setTimeout( function() {

							$button.removeClass( 'inactive' );
							$form.find( '.msg' ).slideUp( '', function() {
								$( this ).remove();
							} );
						}, 5000 );
					} );
			} );
		},

		/**
		 * Upgrade modal.
		 *
		 * @since 1.6.6
		 *
		 * @param {string} feature    Feature name.
		 * @param {string} fieldName  Field name.
		 * @param {string} utmContent UTM content.
		 * @param {string} type       License type.
		 * @param {string} video      Feature video URL.
		 */
		upgradeModal: function( feature, fieldName, utmContent, type, video ) {

			// Provide a default value.
			if ( typeof type === 'undefined' || type.length === 0 ) {
				type = 'pro';
			}

			// Make sure we received only supported type.
			if ( $.inArray( type, [ 'pro', 'elite' ] ) < 0 ) {
				return;
			}

			var modalTitle   = feature + ' ' + wpforms_education.upgrade[type].title,
				isVideoModal = ! _.isEmpty( video ),
				modalWidth   = WPFormsEducation.core.getUpgradeModalWidth( isVideoModal );

			if ( typeof fieldName !== 'undefined' && fieldName.length > 0 ) {
				modalTitle = fieldName + ' ' + wpforms_education.upgrade[type].title;
			}

			var modal = $.alert( {
				backgroundDismiss: true,
				title            : modalTitle,
				icon             : 'fa fa-lock',
				content          : wpforms_education.upgrade[type].message.replace( /%name%/g, feature ),
				boxWidth         : modalWidth,
				theme            : 'modern,wpforms-education',
				closeIcon        : true,
				onOpenBefore: function() {

					if ( isVideoModal ) {
						this.$el.addClass( 'upgrade-modal has-video' );
						this.$btnc.after( '<iframe src="' + video + '" class="pro-feature-video" frameborder="0" allowfullscreen="" width="475" height="267"></iframe>' );
					}

					this.$body.find( '.jconfirm-content' ).addClass( 'lite-upgrade' );
				},
				buttons     : {
					confirm: {
						text    : wpforms_education.upgrade[type].button,
						btnClass: 'btn-confirm',
						keys    : [ 'enter' ],
						action  : function() {

							window.open( WPFormsEducation.core.getUpgradeURL( utmContent, type ), '_blank' );
						},
					},
				},
			} );

			$( window ).on( 'resize', function() {

				modalWidth = WPFormsEducation.core.getUpgradeModalWidth( isVideoModal );

				if ( modal.isOpen() ) {
					modal.setBoxWidth( modalWidth );
				}
			} );
		},

		/**
		 * License modal.
		 *
		 * @since 1.6.6
		 */
		licenseModal: function() {

			$.alert( {
				title  : false,
				content: wpforms_education.license_prompt,
				icon   : 'fa fa-exclamation-circle',
				type   : 'orange',
				buttons: {
					confirm: {
						text    : wpforms_education.close,
						btnClass: 'btn-confirm',
						keys    : [ 'enter' ],
					},
				},
			} );
		},
	};

	// Provide access to public functions/properties.
	return app;

}( document, window, jQuery ) );

// Initialize.
WPFormsEducation.proCore.init();
