<?php

namespace WPForms\Pro\Forms\Fields\Checkbox;

/**
 * Editing Checkbox field entries.
 *
 * @since 1.6.0
 */
class EntriesEdit extends \WPForms\Pro\Forms\Fields\Base\EntriesEdit {

	/**
	 * Constructor.
	 *
	 * @since 1.6.0
	 */
	public function __construct() {

		parent::__construct( 'checkbox' );
	}

	/**
	 * Display the field on the Edit Entry page.
	 *
	 * @since 1.6.0
	 *
	 * @param array $entry_field Entry field data.
	 * @param array $field       Field data and settings.
	 * @param array $form_data   Form data and settings.
	 */
	public function field_display( $entry_field, $field, $form_data ) {

		$value_choices = isset( $entry_field['value_raw'] ) && $entry_field['value_raw'] !== '' ? explode( "\n", $entry_field['value_raw'] ) : [];

		$this->field_object->field_prefill_remove_choices_defaults( $field, $field['properties'] );

		foreach ( $value_choices as $input => $single_value ) {
			$field['properties'] = $this->field_object->get_field_populated_single_property_value_public( $single_value, sanitize_key( $input ), $field['properties'], $field );
		}

		$this->field_object->field_display( $field, null, $form_data );
	}
}
