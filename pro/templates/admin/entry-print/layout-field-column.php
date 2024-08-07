<?php
/**
 * Field Layout template for the Entry Print page.
 *
 * @var object $entry           Entry.
 * @var array  $form_data       Form data and settings.
 * @var array  $field           Entry field data.
 * @var bool   $is_hidden_by_cl Whether the field is hidden by conditional logic.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$field_description = $form_data['fields'][ $field['id'] ]['description'] ?? '';

$classes = [ 'wpforms-field-layout-column' ];

if ( $is_hidden_by_cl ) {
	$classes[] = 'wpforms-conditional-hidden';
}
?>

<div class="<?php echo wpforms_sanitize_classes( $classes, true ); ?>">
	<p class="print-item-title field-name">
		<?php echo esc_html( $field['label'] ); ?>

		<span class="print-item-description field-description">
			<?php echo esc_html( $field_description ); ?>
		</span>
	</p>

	<div class="print-item field wpforms-field-layout">
		<?php
		foreach ( $field['columns'] as $column ) {
			$preset_width = ! empty( $column['width_preset'] ) ? (int) $column['width_preset'] : 50;

			if ( $preset_width === 33 ) {
				$preset_width = 33.33333;
			}

			if ( $preset_width === 67 ) {
				$preset_width = 66.66666;
			}

			if ( ! empty( $column['width_custom'] ) ) {
				$preset_width = (int) $column['width_custom'];
			}

			?>
			<div class="wpforms-field-layout-column" style="width: <?php echo (float) $preset_width; ?>%">
				<?php
				foreach ( $column['fields'] as $child_field ) {
					// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					echo wpforms_render(
						'admin/entry-print/field',
						[
							'entry'           => $entry,
							'form_data'       => $form_data,
							'field'           => $child_field,
							'is_hidden_by_cl' => $is_hidden_by_cl,
						],
						true
					);
				}
				?>
			</div>
		<?php } ?>
	</div>
</div>
