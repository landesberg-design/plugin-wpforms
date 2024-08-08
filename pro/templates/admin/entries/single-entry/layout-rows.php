<?php
/**
 * Single entry layout field rows template.
 *
 * @since 1.9.0
 *
 * @var array                  $field          Field data.
 * @var array                  $form_data      Form data and settings.
 * @var WPForms_Entries_Single $entries_single Single entry object.
 * @var bool                   $is_hidden_by_cl Is the field hidden by conditional logic.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use WPForms\Pro\Forms\Fields\Layout\Helpers as LayoutHelpers;

$rows              = isset( $field['columns'] ) && is_array( $field['columns'] ) ? LayoutHelpers::get_row_data( $field ) : [];
$field_description = $form_data['fields'][ $field['id'] ]['description'] ?? '';
$hide              = $entries_single->entry_view_settings['fields']['show_field_descriptions']['value'] === 1 ? '' : ' wpforms-hide';

if ( empty( $rows ) ) {
	return;
}

$classes = [ 'wpforms-field-layout-row' ];

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

	<div class="wpforms-field-layout-rows">
		<?php foreach ( $rows as $row ) : ?>
			<div class="wpforms-layout-row">
				<?php foreach ( $row as $data ) : ?>
					<?php $width = $entries_single->get_layout_col_width( $data ); ?>
					<div class="wpforms-entry-field-layout-inner wpforms-field-layout-column" style="width: <?php echo esc_attr( $width ); ?>%">
						<?php
						if ( $data['field'] ) {
							$entries_single->print_field( $data['field'], $form_data );
						}
						?>
					</div>
				<?php endforeach; ?>
			</div>
		<?php endforeach; ?>
	</div>
</div>

