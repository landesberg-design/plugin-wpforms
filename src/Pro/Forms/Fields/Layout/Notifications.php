<?php

namespace WPForms\Pro\Forms\Fields\Layout;

use WPForms\Emails\Notifications as EmailNotifications;

/**
 * Layout field's Notifications class.
 *
 * @since 1.9.0
 */
class Notifications {

	/**
	 * Initialize.
	 *
	 * @since 1.9.0
	 */
	public function init() {

		$this->hooks();
	}

	/**
	 * Hooks.
	 *
	 * @since 1.9.0
	 */
	private function hooks() {

		add_filter( 'wpforms_emails_notifications_field_message_plain', [ $this, 'get_layout_field_plain' ], 10, 6 );
		add_filter( 'wpforms_emails_notifications_field_message_html', [ $this, 'get_layout_field_html' ], 10, 7 );
	}

	/**
	 * Get the layout field HTML markup.
	 *
	 * @since 1.9.0
	 *
	 * @param string|mixed       $message           Field message.
	 * @param array              $field             Field data.
	 * @param bool               $show_empty_fields Whether to display empty fields in the email.
	 * @param array              $other_fields      List of field types.
	 * @param array              $form_data         Form data.
	 * @param array              $fields            List of submitted fields.
	 * @param EmailNotifications $notifications     Notifications instance.
	 *
	 * @return string
	 */
	public function get_layout_field_html( $message, array $field, bool $show_empty_fields, array $other_fields, array $form_data, array $fields, $notifications ): string { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed

		$message = (string) $message;

		if ( isset( $field['type'] ) && $field['type'] !== 'layout' ) {
			return $message;
		}

		$divider        = '';
		$layout_message = '';

		if ( isset( $field['label_hide'] ) && ! $field['label_hide'] && ! empty( $field['label'] ) ) {
			$divider = '<tr><td class="field-layout-name field-name"><strong>' . $field['label'] . '</strong></td><td class="field-value"></td></tr>';
		}

		$fields_message = '';

		foreach ( $field['columns'] as $column ) {
			foreach ( $column['fields'] as $child_field ) {
				$fields_message .= $notifications->get_field_html( $child_field, $show_empty_fields, $other_fields );
			}
		}

		if ( $fields_message ) {
			$layout_message .= $divider . $fields_message;
		}

		return $layout_message;
	}

	/**
	 * Get the layout field plain text markup.
	 *
	 * @since 1.9.0
	 *
	 * @param string|mixed       $message           Field message.
	 * @param array              $field             Field data.
	 * @param bool               $show_empty_fields Whether to display empty fields in the email.
	 * @param array              $form_data         Form data.
	 * @param array              $fields            List of submitted fields.
	 * @param EmailNotifications $notifications     Notifications instance.
	 *
	 * @return string
	 */
	public function get_layout_field_plain( $message, array $field, bool $show_empty_fields, array $form_data, array $fields, $notifications ): string { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed

		$message = (string) $message;

		if ( isset( $field['type'] ) && $field['type'] !== 'layout' ) {
			return $message;
		}

		$divider        = '';
		$layout_message = '';

		if ( isset( $field['label_hide'] ) && ! $field['label_hide'] && ! empty( $field['label'] ) ) {
			$divider = '--- ' . $field['label'] . " ---\r\n\r\n";
		}

		$fields_message = '';

		foreach ( $field['columns'] as $column ) {
			foreach ( $column['fields'] as $child_field ) {
				$fields_message .= $notifications->get_field_plain( $child_field, $show_empty_fields );
			}
		}

		if ( $fields_message ) {
			$layout_message .= $divider . $fields_message;
		}

		return $layout_message;
	}
}
