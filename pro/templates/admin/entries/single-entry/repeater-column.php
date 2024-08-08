<?php
/**
 * Single entry repeater field column template.
 *
 * @since 1.8.9
 *
 * @var array                  $row_data       Row data.
 * @var array                  $form_data      Form data and settings.
 * @var WPForms_Entries_Single $entries_single Single entry object.
 * @var array                  $rows           Rows data.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use WPForms\Pro\Forms\Fields\Layout\Helpers as LayoutHelpers;

if ( empty( $form_data['fields'] ) || empty( $row_data ) ) {
	return;
}

$current_column = 0;
$rows           = $rows ?? [];

?>
<?php foreach ( $row_data as $data ) : ?>
	<?php
		$column = [];

		foreach ( $rows as $row_id => $row ) {
			$column['fields'][] = $row[ $current_column ]['field'] ?? [];
		}

		$width           = $entries_single->get_layout_col_width( $data );
		$is_empty_column = LayoutHelpers::is_column_empty( $column );
		$column_classes  = [
			'wpforms-entry-field-layout-inner',
			'wpforms-field-layout-column',
			$is_empty_column ? 'wpforms-field-layout-column-empty' : '',
		];
	?>

	<div class="<?php echo wpforms_sanitize_classes( $column_classes, true ); ?>" style="width: <?php echo esc_attr( $width ); ?>%">
		<?php if ( $data['field'] ) : ?>
			<?php $entries_single->print_field( $data['field'], $form_data ); ?>
		<?php endif; ?>
	</div>
<?php

	++$current_column;

	endforeach;
?>
