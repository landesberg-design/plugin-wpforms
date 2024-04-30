<?php

namespace WPForms\Pro\Forms\Fields\Layout;

/**
 * Class Helpers for Layout Field.
 *
 * @since 1.8.8
 */
class Helpers {

	/**
	 * Reorder fields within rows in the form data.
	 *
	 * @since 1.8.8
	 *
	 * @param array $form_data Form data.
	 *
	 * @return array
	 */
	public static function reorder_fields_within_rows( array $form_data ): array {

		foreach ( $form_data['fields'] as $field_id => $field ) {
			if ( $field['type'] !== 'layout' || ( isset( $field['display'] ) && $field['display'] === 'columns' ) || ! isset( $field['display'] ) ) {
				continue;
			}

			$rows           = self::get_row_data( $field );
			$current_fields = self::get_current_fields( $rows, $form_data );
			$form_data      = self::reorder_fields( $field_id, $current_fields, $form_data );
		}

		return $form_data;
	}

	/**
	 * Reorders fields within rows and reconstructs the form data array.
	 *
	 * @since 1.8.8
	 *
	 * @param int   $field_id       The ID of the layout field.
	 * @param array $current_fields The fields to be reordered within rows.
	 * @param array $form_data      The original form data.
	 *
	 * @return array
	 */
	private static function reorder_fields( int $field_id, array $current_fields, array $form_data ): array {

		$new_array = [];

		foreach ( $form_data['fields'] as $key => $value ) {
			$new_array[ $key ] = $value;

			if ( (int) $key === $field_id ) {
				foreach ( $current_fields as $new_key => $new_value ) {
					$new_array[ $new_key ] = $new_value;
				}
			}
		}

		$form_data['fields'] = $new_array;

		return $form_data;
	}

	/**
	 * Retrieves and removes current fields from the form data.
	 *
	 * @since 1.8.8
	 *
	 * @param array $rows      The rows extracted from the layout field.
	 * @param array $form_data Reference to the original form data.
	 *
	 * @return array
	 */
	private static function get_current_fields( array $rows, array &$form_data ): array {

		$current_fields = [];

		foreach ( $rows as $row ) {
			foreach ( $row as $column ) {
				if ( empty( $column['field'] ) || ! isset( $form_data['fields'][ $column['field'] ] ) ) {
					continue;
				}

				$current_fields[ $column['field'] ] = $form_data['fields'][ $column['field'] ];

				unset( $form_data['fields'][ $column['field'] ] );
			}
		}

		return $current_fields;
	}

	/**
	 * Convert columns to rows.
	 *
	 * @since 1.8.8
	 *
	 * @param array $columns Columns data.
	 *
	 * @return array
	 */
	public static function get_row_data( array $columns ): array {

		$rows = [];

		foreach ( $columns['columns'] as $column_index => $item ) {
			$fields    = $item['fields'];
			$preset    = $item['width_preset'];
			$row_index = 0;

			foreach ( $fields as $field ) {
				$rows[ $row_index ][ $column_index ] = [
					'width_preset' => $preset,
					'field'        => $field,
				];

				++$row_index;
			}
		}

		self::add_missing_columns_to_row( $columns, $rows );

		return $rows;
	}

	/**
	 * Add missing columns to row.
	 *
	 * @since 1.8.8
	 *
	 * @param array $columns Columns data.
	 * @param array $rows    Rows data.
	 */
	private static function add_missing_columns_to_row( array $columns, array &$rows ) {

		$preset_values = explode( '-', $columns['preset'] );
		$columns_count = count( $preset_values );

		foreach ( $rows as $row_index => $row ) {
			if ( count( $row ) < $columns_count ) {
				self::add_missing_presets_to_row( $rows, $preset_values, $row_index );
			}
		}
	}


	/**
	 * Add missing width presets to row.
	 *
	 * @since 1.8.8
	 *
	 * @param array $rows          Rows data.
	 * @param array $preset_values Preset values.
	 * @param int   $row_index     Row index.
	 */
	private static function add_missing_presets_to_row( array &$rows, array $preset_values, int $row_index ) {

		foreach ( $preset_values as $preset_index => $preset ) {
			if ( ! isset( $rows[ $row_index ][ $preset_index ] ) ) {
				$rows[ $row_index ][ $preset_index ] = [
					'width_preset' => $preset,
					'field'        => '',
				];

				ksort( $rows[ $row_index ] );
			}
		}
	}
}
