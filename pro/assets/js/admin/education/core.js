/* global wpforms_education, WPFormsBuilder, WPFormsAdmin, wpforms_admin */
/**
 * WPForms Education core for Pro.
 *
 * @since 1.6.6
 */

'use strict';

var WPFormsEducation = window.WPFormsEducation || {};

WPFormsEducation.proCore = window.WPFormsEducation.proCore || ( function( document, window, $ ) {

	/**
	 * Runtime variables.
	 *
	 * @since 1.6.8
	 *
	 * @type {object}
	 */
	var vars = {};

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

			vars.spinner = '<i class="wpforms-loading-spinner wpforms-loading-white wpforms-loading-inline"></i>';

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

					event.preventDefault();
					event.stopImmediatePropagation();

					switch ( $this.data( 'action' ) ) {
						case 'activate':
							app.activateModal( $this.data( 'name' ), $this.data( 'path' ), $this.data( 'nonce' ) );
							break;
						case 'install':
							app.installModal( $this.data( 'name' ), $this.data( 'url' ), $this.data( 'nonce' ), $this.data( 'license' ) );
							break;
						case 'upgrade':
							app.upgradeModal( $this.data( 'name' ), $this.data( 'field-name' ), $this.data( 'license' ), $this.data( 'video' ) );
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
		 * Addon activate modal.
		 *
		 * @since 1.6.6
		 *
		 * @param {string} feature Feature name.
		 * @param {string} path    Addon path.
		 * @param {string} nonce   Action nonce.
		 */
		activateModal: function( feature, path, nonce ) {

			$.alert( {
				title  : false,
				content: wpforms_education.activate_prompt.replace( /%name%/g, feature ),
				icon   : 'fa fa-info-circle',
				type   : 'blue',
				buttons: {
					confirm: {
						text    : wpforms_education.activate_confirm,
						btnClass: 'btn-confirm',
						keys    : [ 'enter' ],
						action  : function() {

							this.$$confirm
								.prop( 'disabled', true )
								.html( vars.spinner + wpforms_education.activating );

							this.$$cancel
								.prop( 'disabled', true );

							app.activateAddon( path, nonce, this );

							return false;
						},
					},
					cancel : {
						text: wpforms_education.cancel,
					},
				},
			} );
		},

		/**
		 * Activate addon via AJAX.
		 *
		 * @since 1.6.6
		 *
		 * @param {string} path          Addon path.
		 * @param {string} nonce         Action nonce.
		 * @param {object} previousModal Previous modal instance.
		 */
		activateAddon: function( path, nonce, previousModal ) {

			$.post(
				wpforms_education.ajax_url,
				{
					action: 'wpforms_activate_addon',
					nonce : nonce,
					plugin: path,
				},
				function( res ) {

					previousModal.close();

					if ( res.success ) {
						app.saveModal();
					} else {
						$.alert( {
							title  : false,
							content: res.data,
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
					}
				}
			);
		},

		/**
		 * Ask user if they would like to save form and refresh form builder.
		 *
		 * @since 1.6.6
		 *
		 * @param {string} title Modal title.
		 */
		saveModal: function( title ) {

			title = title || wpforms_education.activated;

			$.alert( {
				title  : title.replace( /\.$/, '' ), // Remove a dot in the title end.
				content: wpforms_education.save_prompt,
				icon   : 'fa fa-check-circle',
				type   : 'green',
				buttons: {
					confirm: {
						text    : wpforms_education.save_confirm,
						btnClass: 'btn-confirm',
						keys    : [ 'enter' ],
						action  : function() {

							if ( 'undefined' === typeof WPFormsBuilder ) {
								location.reload();

								return;
							}

							this.$$confirm
								.prop( 'disabled', true )
								.html( vars.spinner + wpforms_education.saving );

							this.$$cancel
								.prop( 'disabled', true );

							if ( WPFormsBuilder.formIsSaved() ) {
								location.reload();
							}

							WPFormsBuilder.formSave().done( function() {
								location.reload();
							} );

							return false;
						},
					},
					cancel : {
						text: wpforms_education.close,
					},
				},
			} );
		},

		/**
		 * Addon install modal.
		 *
		 * @since 1.6.6
		 *
		 * @param {string} feature Feature name.
		 * @param {string} url     Install URL.
		 * @param {string} nonce   Action nonce.
		 * @param {string} type    License level.
		 */
		installModal: function( feature, url, nonce, type ) {

			if ( ! url || '' === url ) {
				app.upgradeModal( feature, '', type, '' );
				return;
			}

			$.alert( {
				title   : false,
				content : wpforms_education.install_prompt.replace( /%name%/g, feature ),
				icon    : 'fa fa-info-circle',
				type    : 'blue',
				boxWidth: '425px',
				buttons : {
					confirm: {
						text    : wpforms_education.install_confirm,
						btnClass: 'btn-confirm',
						keys    : [ 'enter' ],
						isHidden: ! wpforms_education.can_install_addons,
						action  : function() {

							this.$$confirm.prop( 'disabled', true )
								.html( vars.spinner + wpforms_education.installing );

							this.$$cancel
								.prop( 'disabled', true );

							app.installAddon( url, nonce, this );

							return false;
						},
					},
					cancel : {
						text: wpforms_education.cancel,
					},
				},
			} );
		},

		/**
		 * Install addon via AJAX.
		 *
		 * @since 1.6.6
		 *
		 * @param {string} url           Install URL.
		 * @param {string} nonce         Action nonce.
		 * @param {object} previousModal Previous modal instance.
		 */
		installAddon: function( url, nonce, previousModal ) {

			$.post(
				wpforms_education.ajax_url,
				{
					action: 'wpforms_install_addon',
					nonce : nonce,
					plugin: url,
				},
				function( res ) {

					previousModal.close();

					if ( res.success ) {
						app.saveModal( res.data.msg );
					} else {
						var message = res.data;

						if ( 'object' === typeof res.data ) {
							message = wpforms_education.addon_error;
						}

						$.alert( {
							title  : false,
							content: message,
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
					}
				}
			);
		},

		/**
		 * Upgrade modal.
		 *
		 * @since 1.6.6
		 *
		 * @param {string} feature   Feature name.
		 * @param {string} fieldName Field name.
		 * @param {string} type      License type.
		 * @param {string} video     Feature video URL.
		 */
		upgradeModal: function( feature, fieldName, type, video ) {

			// Provide a default value.
			if ( typeof type === 'undefined' || type.length === 0 ) {
				type = 'pro';
			}

			// Make sure we received only supported type.
			if ( $.inArray( type, [ 'pro', 'elite' ] ) < 0 ) {
				return;
			}

			var modalTitle = feature + ' ' + wpforms_education.upgrade[type].title;

			if ( typeof fieldName !== 'undefined' && fieldName.length > 0 ) {
				modalTitle = fieldName + ' ' + wpforms_education.upgrade[type].title;
			}

			$.alert( {
				title       : modalTitle,
				icon        : 'fa fa-lock',
				content     : wpforms_education.upgrade[type].message.replace( /%name%/g, feature ),
				boxWidth    : '550px',
				theme       : 'modern,wpforms-education',
				onOpenBefore: function() {

					if ( ! _.isEmpty( video ) ) {
						this.$btnc.after( '<iframe src="' + video + '" class="pro-feature-video" frameborder="0" allowfullscreen="" width="490" height="276"></iframe>' );
					}

					this.$body.find( '.jconfirm-content' ).addClass( 'lite-upgrade' );
				},
				buttons     : {
					confirm: {
						text    : wpforms_education.upgrade[type].button,
						btnClass: 'btn-confirm',
						keys    : [ 'enter' ],
						action  : function() {

							var appendChar = /(\?)/.test( wpforms_education.upgrade[ type ].url ) ? '&' : '?',
								upgradeURL = wpforms_education.upgrade[ type ].url + appendChar + 'utm_content=' + encodeURIComponent( feature.trim() );

							window.open( upgradeURL, '_blank' );
						},
					},
				},
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
