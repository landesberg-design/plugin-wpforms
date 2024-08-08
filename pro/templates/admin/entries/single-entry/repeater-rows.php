<?php
/**
 * Single entry repeater field rows template.
 *
 * @since 1.8.9
 *
 * @var array                  $field           Field data.
 * @var array                  $form_data       Form data and settings.
 * @var WPForms_Entries_Single $entries_single  Single entry object.
 * @var bool                   $is_hidden_by_cl Is the field hidden by conditional logic.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use WPForms\Pro\Forms\Fields\Layout\Helpers as LayoutHelpers;

$rows = isset( $field['columns'] ) && is_array( $field['columns'] ) ? LayoutHelpers::get_row_data( $field ) : [];

if ( empty( $rows ) ) {
	return;
}

$field_description = $form_data['fields'][ $field['id'] ]['description'] ?? '';
$hide              = $entries_single->entry_view_settings['fields']['show_field_descriptions']['value'] === 1 ? '' : ' wpforms-hide';

$classes = [ 'wpforms-field-repeater-row' ];

if ( $is_hidden_by_cl ) {
	$classes[] = 'wpforms-conditional-hidden';
}
?>

<div class="<?php echo wpforms_sanitize_classes( $classes, true ); ?>">
	<?php if ( isset( $field['label_hide'] ) && ! $field['label_hide'] ) : ?>
		<p class="wpforms-entry-field-name">
			<?php echo esc_html( $field['label'] ); ?>

			<?php if ( $field_description ) : ?>
				<span class="wpforms-entry-field-description<?php echo esc_attr( $hide ); ?>">
					<?php echo wp_kses_post( $field_description ); ?>
				</span>
			<?php endif; ?>
		</p>
	<?php endif; ?>

	<div class="wpforms-field-repeater-rows">
		<?php foreach ( $rows as $row_data ) : ?>
			<div class="wpforms-layout-row">
				<?php
				echo wpforms_render( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					'admin/entries/single-entry/repeater-column',
					[
						'row_data'       => $row_data,
						'form_data'      => $form_data,
						'entries_single' => $entries_single,
						'rows'           => $rows,
					],
					true
				);
				?>
			</div>
		<?php endforeach; ?>
	</div>
</div>
