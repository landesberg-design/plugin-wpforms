/* globals wpforms_admin */
/**
 * WPForms Settings Education function.
 *
 * @since 1.5.5
 */

'use strict';

var WPFormsSettingsEducation = window.WPFormsSettingsEducation || ( function( document, window, $ ) {

	/**
	 * Public functions and properties.
	 *
	 * @since 1.5.5
	 *
	 * @type {Object}
	 */
	var app = {

		/**
		 * Start the engine.
		 *
		 * @since 1.5.5
		 */
		init: function() {
			$( document ).ready( app.ready );
		},

		/**
		 * Document ready.
		 *
		 * @since 1.5.5
		 */
		ready: function() {
			app.events();
		},

		/**
		 * Register JS events.
		 *
		 * @since 1.5.5
		 */
		events: function() {
			app.clickEvents();
		},

		/**
		 * Registers JS click events.
		 *
		 * @since 1.5.5
		 */
		clickEvents: function() {

			$( document ).on(
				'click',
				'.wpforms-settings-provider.education-modal',
				function( event ) {

					var $this = $( this );

					event.preventDefault();
					event.stopImmediatePropagation();

					switch ( $this.data( 'action' ) ) {
						case 'activate':
							app.activateModal( $this.data( 'name' ), $this.data( 'path' ) );
							break;
						case 'install':
							app.installModal( $this.data( 'name' ), $this.data( 'url' ) );
							break;
						case 'upgrade':
							app.upgradeModal( $this.data( 'name' ) );
							break;
						case 'license':
							app.licenseModal();
							break;
					}
				}
			);
		},

		/**
		 * Addon activate modal.
		 *
		 * @since 1.5.5
		 *
		 * @param {string} feature Feature name.
		 * @param {string} path    Addon path.
		 */
		activateModal: function( feature, path ) {

			$.alert( {
				title  : false,
				content: wpforms_admin.education_activate_prompt.replace( /%name%/g, feature ),
				icon   : 'fa fa-info-circle',
				type   : 'blue',
				buttons: {
					confirm: {
						text    : wpforms_admin.education_activate_confirm,
						btnClass: 'btn-confirm',
						keys    : [ 'enter' ],
						action  : function() {

							var currentModal = this,
								$confirm     = currentModal.$body.find( '.btn-confirm' );

							$confirm.prop( 'disabled', true ).html( '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> ' + wpforms_admin.education_activating );

							app.activateAddon( path, wpforms_admin.nonce, currentModal );

							return false;
						},
					},
					cancel : {
						text: wpforms_admin.cancel,
					},
				},
			} );
		},

		/**
		 * Activate addon via AJAX.
		 *
		 * @since 1.5.5
		 *
		 * @param {string} path          Addon path.
		 * @param {string} nonce         Action nonce.
		 * @param {object} previousModal Previous modal instance.
		 */
		activateAddon: function( path, nonce, previousModal ) {

			$.post(
				wpforms_admin.ajax_url,
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
									text    : wpforms_admin.close,
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
		 * @since 1.5.5
		 */
		saveModal: function() {

			$.alert( {
				title  : wpforms_admin.education_activated,
				content: wpforms_admin.education_save_prompt,
				icon   : 'fa fa-check-circle',
				type   : 'green',
				buttons: {
					confirm: {
						text    : wpforms_admin.education_save_confirm,
						btnClass: 'btn-confirm',
						keys    : [ 'enter' ],
						action  : function() {
							window.location = window.location;
						},
					},
					cancel : {
						text: wpforms_admin.close,
					}
				}
			} );
		},

		/**
		 * Addon install modal.
		 *
		 * @since 1.5.5
		 *
		 * @param {string} feature Feature name.
		 * @param {string} url     Install URL.
		 */
		installModal: function( feature, url ) {

			if ( ! url || '' === url ) {
				app.upgradeModal( feature, false );
				return;
			}

			$.alert( {
				title   : false,
				content : wpforms_admin.education_install_prompt.replace( /%name%/g, feature ),
				icon    : 'fa fa-info-circle',
				type    : 'blue',
				boxWidth: '425px',
				buttons : {
					confirm: {
						text    : wpforms_admin.education_install_confirm,
						btnClass: 'btn-confirm',
						keys    : [ 'enter' ],
						action  : function() {

							var currentModal = this,
								$confirm     = currentModal.$body.find( '.btn-confirm' );

							$confirm.prop( 'disabled', true ).html( '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> ' + wpforms_admin.education_installing );

							app.installAddon( url, wpforms_admin.nonce, currentModal );

							return false;
						},
					},
					cancel : {
						text: wpforms_admin.cancel,
					},
				},
			} );
		},

		/**
		 * Install addon via AJAX.
		 *
		 * @since 1.5.5
		 *
		 * @param {string} url           Install URL.
		 * @param {string} nonce         Action nonce.
		 * @param {object} previousModal Previous modal instance.
		 */
		installAddon: function( url, nonce, previousModal ) {

			$.post(
				wpforms_admin.ajax_url,
				{
					action: 'wpforms_install_addon',
					nonce : nonce,
					plugin: url,
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
									text    : wpforms_admin.close,
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
		 * @since 1.5.5
		 *
		 * @param {string} feature Feature name.
		 */
		upgradeModal: function( feature, fieldName ) {

			var modalTitle = feature + ' ' + wpforms_admin.education_upgrade_title;

			if ( fieldName ) {
				modalTitle = fieldName + ' ' + wpforms_admin.education_upgrade_title;
			}

			$.alert( {
				title       : modalTitle,
				icon        : 'fa fa-lock',
				content     : wpforms_admin.education_upgrade_message.replace( /%name%/g, feature ),
				boxWidth    : '550px',
				onOpenBefore: function() {
					this.$body.find( '.jconfirm-content' ).addClass( 'lite-upgrade' );
				},
				buttons     : {
					confirm: {
						text    : wpforms_admin.education_upgrade_confirm,
						btnClass: 'btn-confirm',
						keys    : [ 'enter' ],
						action  : function() {
							window.open(
								wpforms_admin.education_upgrade_url + '&utm_content=' + encodeURI( feature.trim() ),
								'_blank'
							);
						},
					},
				},
			} );
		},

		/**
		 * License modal.
		 *
		 * @since 1.5.5
		 */
		licenseModal: function() {

			$.alert( {
				title  : false,
				content: wpforms_admin.education_license_prompt,
				icon   : 'fa fa-exclamation-circle',
				type   : 'orange',
				buttons: {
					confirm: {
						text    : wpforms_admin.close,
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
WPFormsSettingsEducation.init();
