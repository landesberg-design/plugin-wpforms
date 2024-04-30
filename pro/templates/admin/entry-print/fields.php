<?php
/**
 * Fields template for the Entry Print page.
 *
 * @var object $entry     Entry.
 * @var array  $form_data Form data and settings.
 * @var array  $fields    Fields.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( empty( $fields ) ) {
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo wpforms_render(
		'admin/entry-print/no-fields',
		[
			'entry'     => $entry,
			'form_data' => $form_data,
		],
		true
	);

	return;
}

foreach ( $fields as $field ) {
	if ( $field['type'] === 'layout' ) {
		if ( isset( $field['display'] ) && $field['display'] === 'rows' ) {
			echo wpforms_render( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				'admin/entry-print/layout-field-row',
				[
					'entry'     => $entry,
					'form_data' => $form_data,
					'field'     => $field,
				],
				true
			);
		} else {
			echo wpforms_render( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				'admin/entry-print/layout-field-column',
				[
					'entry'     => $entry,
					'form_data' => $form_data,
					'field'     => $field,
				],
				true
			);
		}

		continue;
	}

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo wpforms_render(
		'admin/entry-print/field',
		[
			'entry'     => $entry,
			'form_data' => $form_data,
			'field'     => $field,
		],
		true
	);
}
