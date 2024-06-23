<?php
/**
 * Single entry repeater field columns template.
 *
 * @since 1.8.9
 *
 * @var array                  $row_data       Row data.
 * @var array                  $form_data      Form data and settings.
 * @var WPForms_Entries_Single $entries_single Single entry object.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( empty( $form_data['fields'] ) || empty( $row_data ) ) {
	return;
}

?>
<?php foreach ( $row_data as $data ) : ?>
	<?php $width = $entries_single->get_layout_col_width( $data ); ?>

	<div class="wpforms-entry-field-layout-inner wpforms-field-layout-column" style="width: <?php echo esc_attr( $width ); ?>%">
		<?php if ( $data['field'] ) : ?>
			<?php $entries_single->print_field( $data['field'], $form_data ); ?>
		<?php endif; ?>
	</div>
<?php endforeach; ?>
