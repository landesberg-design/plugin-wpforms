<?php
/**
 * Single entry layout field columns template.
 *
 * @since 1.9.0
 *
 * @var array                  $field           Field data.
 * @var array                  $form_data       Form data and settings.
 * @var WPForms_Entries_Single $entries_single  Single entry object.
 * @var bool                   $is_hidden_by_cl Is the field hidden by conditional logic.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$field_description = $form_data['fields'][ $field['id'] ]['description'] ?? '';
$hide              = $entries_single->entry_view_settings['fields']['show_field_descriptions']['value'] === 1 ? '' : ' wpforms-hide';

$classes = [ 'wpforms-field-layout-column' ];

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

	<div class="wpforms-entry-field-layout">
		<?php foreach ( $field['columns'] as $column ) : ?>
			<?php $width = $entries_single->get_layout_col_width( $column ); ?>
			<div class="wpforms-entry-field-layout-inner wpforms-field-layout-column" style="width: <?php echo esc_attr( $width ); ?>%">
				<?php
				foreach ( $column['fields'] as $child_field ) {
					$entries_single->print_field( $child_field, $form_data );
				}
				?>
			</div>
		<?php endforeach; ?>
	</div>
</div>
