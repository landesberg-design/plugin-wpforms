<?php

namespace WPForms\Pro\Forms\Fields\Layout;

use WPForms\Emails\Notifications as EmailNotifications;
use WPForms\Pro\Forms\Fields\Layout\Helpers as LayoutHelpers;

/**
 * Layout field's Notifications class.
 *
 * @since 1.9.0
 */
class Notifications {

	/**
	 * Email type (plain or html).
	 *
	 * @since 1.9.0.4
	 *
	 * @var string
	 */
	private $type;

	/**
	 * Field data.
	 *
	 * @since 1.9.0.4
	 *
	 * @var array
	 */
	private $field;

	/**
	 * Email notification object.
	 *
	 * @since 1.9.0.4
	 *
	 * @var EmailNotifications
	 */
	private $notifications;

	/**
	 * Whether to display empty fields in the email.
	 *
	 * @since 1.9.0.4
	 *
	 * @var bool
	 */
	private $show_empty_fields;

	/**
	 * List of field types.
	 *
	 * @since 1.9.0.4
	 *
	 * @var array
	 */
	private $other_fields;

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

		add_filter( 'wpforms_emails_notifications_field_message_html', [ $this, 'get_layout_field_html' ], 10, 7 );
		add_filter( 'wpforms_emails_notifications_field_message_plain', [ $this, 'get_layout_field_plain' ], 10, 6 );
	}

	/**
	 * Check if the field is a layout field.
	 *
	 * @since 1.9.0.4
	 *
	 * @param array $field Field data.
	 *
	 * @return bool
	 */
	private function is_layout_field( array $field ): bool {

		return isset( $field['type'] ) && $field['type'] === 'layout';
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
	public function get_layout_field_html( $message, array $field, bool $show_empty_fields, array $other_fields, array $form_data, array $fields, EmailNotifications $notifications ): string {

		$message = (string) $message;

		if ( ! $this->is_layout_field( $field ) ) {
			return $message;
		}

		$this->type              = 'html';
		$this->field             = $field;
		$this->notifications     = $notifications;
		$this->show_empty_fields = $show_empty_fields;
		$this->other_fields      = $other_fields;

		return $this->get_field_message();
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
	public function get_layout_field_plain( $message, array $field, bool $show_empty_fields, array $form_data, array $fields, EmailNotifications $notifications ): string {

		$message = (string) $message;

		if ( ! $this->is_layout_field( $field ) ) {
			return $message;
		}

		$this->type              = 'plain';
		$this->field             = $field;
		$this->notifications     = $notifications;
		$this->show_empty_fields = $show_empty_fields;

		return $this->get_field_message();
	}

	/**
	 * Get field markup for an email.
	 *
	 * @since 1.9.0.4
	 *
	 * @return string
	 */
	private function get_field_message(): string {

		$header = $this->get_header();

		if ( isset( $this->field['display'] ) && $this->field['display'] === 'rows' ) {
			return $header . $this->get_layout_field_rows();
		}

		return $header . $this->get_layout_field_columns();
	}

	/**
	 * Get layout field header.
	 *
	 * @since 1.9.0.4
	 *
	 * @return string
	 */
	private function get_header(): string {

		if ( ! empty( $this->field['label_hide'] ) || ! isset( $this->field['label'] ) || wpforms_is_empty_string( $this->field['label'] ) ) {
			return '';
		}

		if ( $this->type === 'html' ) {
			return '<tr><td class="field-layout-name field-name"><strong>' . esc_html( $this->field['label'] ) . '</strong></td><td class="field-value"></td></tr>';
		}

		// In plain email all HTML tags deleted automatically before sending, so we can skip escaping at all.
		return '--- ' . $this->field['label'] . " ---\r\n\r\n";
	}

	/**
	 * Get the layout field rows markup.
	 *
	 * @since 1.9.0.4
	 *
	 * @return string
	 */
	private function get_layout_field_rows(): string {

		$rows = isset( $this->field['columns'] ) && is_array( $this->field['columns'] ) ? LayoutHelpers::get_row_data( $this->field ) : [];

		if ( empty( $rows ) ) {
			return '';
		}

		$fields_message = '';

		foreach ( $rows as $row ) {
			foreach ( $row as $column ) {
				if ( ! empty( $column['field'] ) ) {
					$fields_message .= $this->get_subfield_message( $column['field'] );
				}
			}
		}

		return $fields_message;
	}

	/**
	 * Get the layout field columns markup.
	 *
	 * @since 1.9.0.4
	 *
	 * @return string
	 */
	private function get_layout_field_columns(): string {

		if ( ! isset( $this->field['columns'] ) ) {
			return '';
		}

		$fields_message = '';

		foreach ( $this->field['columns'] as $column ) {
			foreach ( $column['fields'] as $child_field ) {
				$fields_message .= $this->get_subfield_message( $child_field );
			}
		}

		return $fields_message;
	}

	/**
	 * Get layout subfield markup for email.
	 *
	 * @since 1.9.0.4
	 *
	 * @param array $field Field data.
	 *
	 * @return string
	 */
	private function get_subfield_message( array $field ): string {

		return $this->type === 'html' ?
			$this->notifications->get_field_html( $field, $this->show_empty_fields, $this->other_fields ) :
			$this->notifications->get_field_plain( $field, $this->show_empty_fields );
	}
}
