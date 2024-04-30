<?php
/**
 * Field Layout template for the Entry Print page.
 *
 * @var object $entry     Entry.
 * @var array  $form_data Form data and settings.
 * @var array  $field     Entry field data.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use WPForms\Pro\Forms\Fields\Layout\Helpers;

$fields_layout = new WPForms_Field_Layout();
$rows          = isset( $field['columns'] ) && is_array( $field['columns'] ) ? Helpers::get_row_data( $field ) : [];

?>
<div class="print-item field wpforms-field-layout-rows">
	<?php
	foreach ( $rows as $row ) {
		$preset_width = ! empty( $column['width_preset'] ) ? (int) $column['width_preset'] : 50;

		if ( $preset_width === 33 ) {
			$preset_width = 33.33333;
		}

		if ( $preset_width === 67 ) {
			$preset_width = 66.66666;
		}

		$custom_width = ! empty( $column['width_custom'] ) ? (int) $column['width_custom'] : 50;
		$width        = min( $preset_width, $custom_width );

		?>
		<div class="wpforms-layout-row">
			<?php
			foreach ( $row as $column ) {
				$field_html = '';

				if ( ! empty( $column['field'] ) ) {
					$field_html = wpforms_render(
						'admin/entry-print/field',
						[
							'entry'     => $entry,
							'form_data' => $form_data,
							'field'     => $column['field'],
						],
						true
					);
				}
				printf(
					'<div class="print-item wpforms-field-layout-column" style="width: %1$s">%2$s</div>',
					esc_attr( (float) $width . '%' ),
					$field_html // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				);
			}
			?>
		</div>
	<?php } ?>
</div>
