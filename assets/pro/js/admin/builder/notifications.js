/* global Choices, wpf, wpforms_builder */

'use strict';

var WPForms = window.WPForms || {};

WPForms.Admin = WPForms.Admin || {};
WPForms.Admin.Builder = WPForms.Admin.Builder || {};

WPForms.Admin.Builder.Notifications = WPForms.Admin.Builder.Notifications || ( function( document, window, $ ) {

	/**
	 * Elements holder.
	 *
	 * @since 1.7.7
	 *
	 * @type {object}
	 */
	let el = {};

	/**
	 * ChoicesJS config.
	 *
	 * @since 1.7.7
	 *
	 * @type {object}
	 */
	const choicesJSConfig = {
		removeItemButton: true,
		shouldSort: false,
	};

	/**
	 * Public functions and properties.
	 *
	 * @since 1.7.7
	 *
	 * @type {object}
	 */
	const app = {

		/**
		 * Init Advanced Notifications section.
		 *
		 * @since 1.7.7
		 */
		init: function() {

			$( app.ready );
		},

		/**
		 * Document ready.
		 *
		 * @since 1.7.7
		 */
		ready: function() {

			app.setup();
			app.bindEvents();
			app.maybeSaveFormState();
		},

		/**
		 * Setup. Prepare some variables.
		 *
		 * @since 1.7.7
		 */
		setup: function() {

			app.choicesJSHelperMethods.extendChoicesJS();

			// Cache DOM elements.
			el = {
				$builder: $( '#wpforms-builder' ),
			};

			$( '.wpforms-notification.wpforms-builder-settings-block' ).each( function( index, block ) {
				app.initEntryCSVSection( $( block ) );
			} );
		},

		/**
		 * Initialized the Entry CSV-related fields.
		 *
		 * @since 1.7.7
		 *
		 * @param {object}  $block             jQuery element of the block.
		 * @param {boolean} isDynamicallyAdded Whether this block is dynamically added or not.
		 * @param {string}  originalId         Original notification block id if notification is cloned.
		 */
		// eslint-disable-next-line complexity
		initEntryCSVSection: function( $block, isDynamicallyAdded = false, originalId = '' ) {

			const blockID = $block.data( 'blockId' );

			if ( $block.data( 'blockType' ) !== 'notification' || ! blockID ) {
				return;
			}

			const $toggleEl = $block.find( '.notifications_enable_entry_csv_attachment_toggle' ).first();
			if ( $toggleEl.length <= 0 ) {
				return;
			}

			app.setupEnableEntryCSVAttachmentConditional( $toggleEl, blockID );

			// Handle initial Entry Information field.
			if ( ! isDynamicallyAdded ) {
				const $entryInformationField = $block.find( '.entry_csv_attachment_entry_information' ).first();
				if ( $entryInformationField.length <= 0 ) {
					return;
				}

				app.initChoicesJS( $entryInformationField );
				return;
			}

			/*
			 We should clear existing choices for added notification block
			 But not on cloned blocks.
			 */
			const shouldClearExistingChoices = ! originalId;
			const preSelectedFileName = originalId ? $( `#wpforms-panel-field-notifications-${originalId}-entry_csv_attachment_file_name` ).val() : '';

			app.initDynamicallyAddedEntryInformationChoicesJS( $block, shouldClearExistingChoices );
			app.setDynamicallyAddedEntryInformationFileNameFieldValue( $block, preSelectedFileName );
		},

		/**
		 * Setup conditional for "Enable Entry CSV Attachment" toggle.
		 *
		 * @since 1.7.7
		 *
		 * @param {object} $toggleEl jQuery element of the "Enable Entry CSV Attachment" toggle.
		 * @param {number} blockID   Block ID.
		 */
		setupEnableEntryCSVAttachmentConditional: function( $toggleEl, blockID ) {

			const entryInformationWrapId = `#wpforms-panel-field-notifications-${blockID}-entry_csv_attachment_entry_information-wrap`;
			const entryFileNameId = `#wpforms-panel-field-notifications-${blockID}-entry_csv_attachment_file_name-wrap`;
			const actionElement = entryInformationWrapId + ',' + entryFileNameId;

			$toggleEl.conditions( [
				{
					conditions: {
						element:   $toggleEl,
						type:      'checked',
						operator:  'is',
						condition: '1',
					},
					actions: {
						if: {
							element: actionElement,
							action: 'show',
						},
						else: {
							element: actionElement,
							action:  'hide',
						},
					},
					effect: 'appear',
				},
			] );
		},

		/**
		 * Initialize ChoicesJS in a given select field.
		 *
		 * @since 1.7.7
		 *
		 * @param {object}  $selectEl jQuery element of the select field.
		 *
		 * @returns {false|Choices} ChoicesJS instance.
		 */
		initChoicesJS: function( $selectEl ) {

			const fieldName = $selectEl.attr( 'name' );

			if ( ! fieldName || typeof window.Choices !== 'function' ) {
				return false;
			}

			// Original val.
			const originalVal = $selectEl.val();

			const choicesJS = new Choices( $selectEl[0], choicesJSConfig );

			// Init and cache the ChoicesJS init.
			$selectEl.data( 'choicesjs', choicesJS );

			const hiddenField = $( `<input type="hidden" name="${fieldName}[hidden]">` );

			if ( originalVal ) {
				hiddenField.val( JSON.stringify( originalVal ) );
			}

			$selectEl
				.closest( '.wpforms-panel-field' )
				.append( hiddenField );

			$selectEl
				.on( 'change', app.changeEntryCSVAttachment );

			app.choicesJSHelperMethods.populateInstance( choicesJS, originalVal );

			return choicesJS;
		},

		/**
		 * Bind events.
		 *
		 * @since 1.7.7
		 */
		bindEvents: function() {

			el.$builder
				.on( 'wpformsSettingsBlockAdded', app.notificationBlockAdded )
				.on( 'wpformsFieldAdd', app.newFieldAdded )
				.on( 'wpformsFieldDelete', app.fieldDeleted )
				.on( 'wpformsSettingsBlockCloned', app.notificationsBlockCloned );
		},

		/**
		 * Resetting fields when we add a new webhook.
		 *
		 * @since 1.7.7
		 *
		 * @param {object} event  Event object.
		 * @param {object} $block New Webhook block.
		 */
		notificationBlockAdded: function( event, $block ) {

			app.initEntryCSVSection( $block, true );
		},

		/**
		 * Initialized ChoicesJS in Entry Information field in the newly added notifications block.
		 *
		 * @since 1.7.7
		 *
		 * @param {object}  $block                     jQuery element of the newly added notifications block.
		 * @param {boolean} shouldClearExistingChoices Whether to clear existing selected choices or not.
		 */
		initDynamicallyAddedEntryInformationChoicesJS: function( $block, shouldClearExistingChoices ) {

			const blockID = $block.data( 'blockId' );

			// Find the Entry CSV Attachment Entry Information wrapper.
			const $divWrapper = $block.find( `#wpforms-panel-field-notifications-${blockID}-entry_csv_attachment_entry_information-wrap` );

			if ( $divWrapper.length <= 0 ) {
				return;
			}

			// Find the ChoicesJS Wrapper inside the newly added notification.
			const $choicesWrapper = $divWrapper.find( '.choices' );

			if ( $choicesWrapper.length <= 0 ) {
				return;
			}

			const $newEntryCSVAttachmentInformationEntry = $choicesWrapper.find( '.entry_csv_attachment_entry_information' ).first();

			if ( $newEntryCSVAttachmentInformationEntry.length <= 0 ) {
				return;
			}

			// Remove the ChoicesJS artifact.
			$newEntryCSVAttachmentInformationEntry
				.removeClass( 'choices__input' )
				.removeAttr( 'hidden' )
				.removeAttr( 'data-choice' )
				.removeData( 'choice' )
				.appendTo( $divWrapper.first() );

			// Delete the ChoicesJS wrapper DOM.
			$choicesWrapper.first().remove();

			// Make sure nothing is pre-selected for
			if ( shouldClearExistingChoices ) {
				$newEntryCSVAttachmentInformationEntry.val( [] );
			}

			app.initChoicesJS( $newEntryCSVAttachmentInformationEntry );
		},

		/**
		 * Insert the default value in File Name field for dynamically added
		 * notification block.
		 *
		 * @since 1.7.7
		 *
		 * @param {object} $block jQuery element of the newly added notifications block.
		 * @param {string} preSelectedFileName Pre-selected filename.
		 */
		setDynamicallyAddedEntryInformationFileNameFieldValue: function( $block, preSelectedFileName ) {

			const $entryInformationFileNameField = $block.find( '.entry_csv_attachment_file_name' );

			if ( $entryInformationFileNameField.length <= 0 ) {
				return;
			}

			$entryInformationFileNameField.val( preSelectedFileName ? preSelectedFileName : wpforms_builder.entry_information.default_file_name );
		},

		/**
		 * Entry CSV Attachment field change event handler.
		 *
		 * @since 1.7.7
		 */
		changeEntryCSVAttachment: function() {

			const $this = $( this );
			const currentVal = $this.data( 'choicesjs' ).getValue();
			let fieldName = $this.attr( 'name' );

			if ( ! fieldName || ! currentVal ) {
				return;
			}

			// Find the closest hidden field designated to this field.
			const hiddenFieldName = fieldName + '[hidden]';
			const hiddenField = $this.closest( '.wpforms-panel-field' ).find( `input[name="${hiddenFieldName}"]` );

			if ( hiddenField.length <= 0 ) {
				return;
			}

			const newVal = [];

			for ( let i = 0; i < currentVal.length; i++ ) {
				newVal.push( currentVal[ i ].value );
			}

			hiddenField.val( JSON.stringify( newVal ) );
		},

		/**
		 * Trigger when a new field is added.
		 *
		 * @since 1.7.7
		 *
		 * @param {Event}  event Event object.
		 * @param {number} id    Field ID.
		 * @param {string} type  Field type.
		 */
		newFieldAdded: function( event, id, type ) {

			if ( wpforms_builder.entry_information.excluded_field_types.includes( type ) ) {
				return;
			}

			const newField = wpf.getField( id );

			if ( ! newField ) {
				return;
			}

			app.updateChoicesJSFields( newField.id, newField.label, false );
		},

		/**
		 * Trigger when a field is deleted.
		 *
		 * @since 1.7.7
		 *
		 * @param {Event}  event     Event object.
		 * @param {number} deletedId Field ID.
		 * @param {string} type      Field type.
		 */
		fieldDeleted: function( event, deletedId, type ) {

			app.updateChoicesJSFields( deletedId, '', true );
		},

		/**
		 * Update the ChoicesJS fields.
		 *
		 * @since 1.7.7
		 *
		 * @param {number}  fieldId   ID of the field that was added or deleted.
		 * @param {string}  fieldName Name of the field that was added.
		 * @param {boolean} isDelete  Whether or not the field is added or deleted. Set `true` if deleted.
		 */
		updateChoicesJSFields: function( fieldId, fieldName, isDelete ) {

			$( '.entry_csv_attachment_entry_information' ).each( function() {

				const choicesJS = $( this ).data( 'choicesjs' );

				if ( ! choicesJS ) {
					return;
				}

				if ( isDelete ) {
					app.choicesJSHelperMethods.deleteChoices( choicesJS, fieldId );
					return;
				}

				app.choicesJSHelperMethods.addNewFieldsInAvailableFieldsGroup( choicesJS, fieldId, fieldName );
			} );
		},

		/**
		 * Triggered when a notification block was cloned.
		 *
		 * @since 1.7.7
		 *
		 * @param {Event}  ev         Event object.
		 * @param {object} $clone     jQuery element cloned.
		 * @param {string} originalId Original notification ID.
		 */
		notificationsBlockCloned: function( ev, $clone, originalId ) {

			app.initEntryCSVSection( $clone, true, originalId );
		},

		/**
		 * Save the form state if it was changed during the initialization process.
		 *
		 * @since 1.7.7
		 */
		maybeSaveFormState: function() {

			const currentState = wpf.getFormState( '#wpforms-builder-form' );

			// If some elements were changed (e.g. ChoiceJS instance was pre-populated),
			// then the whole form state was changed as well.
			// That's why we need to re-save it.
			if ( wpf.savedState !== currentState ) {
				wpf.savedState = currentState;
			}
		},

		/**
		 * Helper methods for ChoicesJS.
		 *
		 * @since 1.7.7
		 */
		choicesJSHelperMethods: {

			/**
			 * Extends ChoicesJS.
			 *
			 * @since 1.7.7
			 */
			extendChoicesJS: function() {

				/**
				 * Use to re-render ChoicesJS after removing a choice.
				 *
				 * @since 1.7.7
				 */
				Choices.prototype.renderAfterRemoveChoice = function() {

					if ( this._store.isLoading() ) {
						return;
					}

					this._currentState = this._store.state;
					this._renderChoices();
					this._prevState = this._currentState;
				};
			},

			/**
			 * Add newly added fields under "Available Fields" in ChoicesJS instance.
			 *
			 * @since 1.7.7
			 *
			 * @param {Choices} choicesJS    ChoicesJS instance.
			 * @param {number}  newFieldId   ID of the new field.
			 * @param {string}  newFieldName Name of the new field.
			 */
			addNewFieldsInAvailableFieldsGroup: function( choicesJS, newFieldId, newFieldName ) {

				const availableFieldsGroupId = app.choicesJSHelperMethods.findAvailableFieldsGroupId( choicesJS );

				if ( ! availableFieldsGroupId ) {
					return;
				}

				/*
				 * We are currently using an internal method to add a new choice because there
				 * are currently no public method to add a new choice to an existing group.
				 */
				choicesJS._addChoice( {
					value: newFieldId,
					label: newFieldName,
					groupId: availableFieldsGroupId,
				} );

				choicesJS.renderAfterRemoveChoice();
			},

			/**
			 * Find the group ID of 'Available Fields' group.
			 *
			 * @since 1.7.7
			 * @param {Choices} choicesJS ChoicesJS instance.
			 *
			 * @returns {false|number} Returns the group ID of 'Available Fields' group. Otherwise, return `false`.
			 */
			findAvailableFieldsGroupId: function( choicesJS ) {

				for ( const group of choicesJS._currentState.groups ) {
					if ( group.value === 'Available Fields' ) {
						return group.id;
					}
				}

				return false;
			},

			/**
			 * Remove deleted fields in ChoicesJS instance.
			 *
			 * @since 1.7.7
			 *
			 * @param {Choices} choicesJS ChoicesJS instance.
			 * @param {number}  deletedId Deleted ID field.
			 */
			deleteChoices: function( choicesJS, deletedId ) {

				for ( let i = choicesJS._currentState.choices.length - 1; i >= 0; i-- ) {
					const choice = choicesJS._currentState.choices[ i ];

					if ( deletedId.toString() !== choice.value.toString() ) {
						continue;
					}

					choicesJS.removeActiveItemsByValue( choice.value );
					choicesJS._currentState.choices.splice( i, 1 );
				}

				choicesJS.renderAfterRemoveChoice();
			},

			/**
			 * Get Available field options.
			 *
			 * @since 1.7.7
			 *
			 * @returns {*[]} Returns an array of objects containing the label and value (field key).
			 */
			getAvailableChoices: function() {

				let availableFields = [];

				const fields = wpf.getFields( false, true );

				for ( const fieldKey of wpf.orders.fields ) {

					const field = fields[ fieldKey ];

					if ( ! field || wpforms_builder.entry_information.excluded_field_types.includes( field.type ) ) {
						continue;
					}

					availableFields.push( {
						label: field.label,
						value: field.id.toString(),
					} );
				}

				return availableFields;
			},

			/**
			 * Get "Other" options.
			 *
			 * @since 1.7.7
			 *
			 * @returns {*[]} Returns an array of objects containing the label and value (field key).
			 */
			getOtherChoices: function() {

				let otherFields = [];

				// Get "Others".
				for ( const smartTagKey in wpforms_builder.smart_tags ) {

					if ( wpforms_builder.entry_information.excluded_tags.includes( smartTagKey ) ) {
						continue;
					}

					// Replace the value if necessary.
					let value = Object.hasOwn( wpforms_builder.entry_information.replacement_tags, smartTagKey ) ? wpforms_builder.entry_information.replacement_tags[ smartTagKey ] : smartTagKey;

					otherFields.push( {
						label: wpforms_builder.smart_tags[ smartTagKey ],
						value: value,
					} );
				}

				return otherFields;
			},

			/**
			 * Populate ChoiceJS instance with values with optional pre-selected ones.
			 *
			 * @since 1.7.7
			 *
			 * @param {Choices} choicesJS   ChoicesJS instance.
			 * @param {Array}   preSelected Array of pre-selected choices.
			 */
			populateInstance: function( choicesJS, preSelected = [] ) {

				if ( ! choicesJS ) {
					return;
				}

				choicesJS.clearStore();

				choicesJS.setChoices( [
					{
						label: 'hidden',
						choices: [
							{
								value: 'all_fields',
								label: wpforms_builder.entry_information.localized.all_fields,
							},
						],
					},
					{
						label: wpforms_builder.fields_available,
						choices: app.choicesJSHelperMethods.getAvailableChoices(),
					},
					{
						label: wpforms_builder.other,
						choices: app.choicesJSHelperMethods.getOtherChoices(),
					},
				] );

				if ( ! Array.isArray( preSelected ) ) {
					return;
				}

				preSelected.forEach( function( item ) {
					choicesJS.setChoiceByValue( item );
				} );
			},
		},
	};

	// Provide access to public functions/properties.
	return app;

}( document, window, jQuery ) );

// Initialize.
WPForms.Admin.Builder.Notifications.init();
