<?php

namespace WPForms\Pro\Forms\Fields\Radio;

/**
 * Editing Radio field entries.
 *
 * @since 1.6.5
 */
class EntriesEdit extends \WPForms\Pro\Forms\Fields\Base\EntriesEdit {

	/**
	 * Constructor.
	 *
	 * @since 1.6.5
	 */
	public function __construct() {

		parent::__construct( 'radio' );
	}

	/**
	 * Display the field on the Edit Entry page.
	 *
	 * @since 1.6.5
	 *
	 * @param array $entry_field Entry field data.
	 * @param array $field       Field data and settings.
	 * @param array $form_data   Form data and settings.
	 */
	public function field_display( $entry_field, $field, $form_data ) {

		// Remove defaults before display.
		$this->field_object->field_prefill_remove_choices_defaults( $field, $field['properties'] );

		parent::field_display( $entry_field, $field, $form_data );
	}
}
