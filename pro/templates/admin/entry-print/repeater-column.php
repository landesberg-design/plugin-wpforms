<?php
/**
 * Entry print repeater field columns template.
 *
 * @since 1.8.9
 *
 * @var array  $field     Field data.
 * @var array  $form_data Form data and settings.
 * @var object $entry     Entry.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( empty( $form_data['fields'] ) || empty( $row_data ) ) {
	return;
}

?>
<?php foreach ( $row_data as $data ) : ?>
	<?php
	$preset_width = ! empty( $data['width_preset'] ) ? (int) $data['width_preset'] : 50;

	if ( $preset_width === 33 ) {
		$preset_width = 33.33333;
	} elseif ( $preset_width === 67 ) {
		$preset_width = 66.66666;
	}

	if ( ! empty( $data['width_custom'] ) ) {
		$preset_width = (int) $data['width_custom'];
	}

	?>

	<div class="wpforms-field-layout-column" style="width: <?php echo esc_attr( $preset_width ); ?>%">
		<?php if ( $data['field'] ) : ?>
			<?php
			echo wpforms_render( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				'admin/entry-print/field',
				[
					'entry'     => $entry,
					'form_data' => $form_data,
					'field'     => $data['field'],
				],
				true
			);
			?>
		<?php endif; ?>
	</div>
<?php endforeach; ?>
