<?php
/**
 * Entry print repeater field blocks template.
 *
 * @since 1.8.9
 *
 * @var array  $field           Field data.
 * @var array  $form_data       Form data and settings.
 * @var object $entry           Entry.
 * @var bool   $is_hidden_by_cl Whether the field is hidden by conditional logic.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use WPForms\Pro\Forms\Fields\Repeater\Helpers as RepeaterHelpers;

$blocks = RepeaterHelpers::get_blocks( $field, $form_data );

if ( ! $blocks ) {
	return '';
}

$field_description = $form_data['fields'][ $field['id'] ]['description'] ?? '';

$classes = [ 'wpforms-field-repeater-block' ];

if ( $is_hidden_by_cl ) {
	$classes[] = 'wpforms-conditional-hidden';
}
?>

<?php foreach ( $blocks as $key => $rows ) : ?>
	<div class="<?php echo wpforms_sanitize_classes( $classes, true ); ?>">
		<?php $block_number = $key >= 1 ? ' #' . ( $key + 1 ) : ''; ?>

		<p class="print-item-title field-name">
			<?php echo esc_html( $field['label'] . $block_number ); ?>

			<span class="print-item-description field-description">
				<?php echo esc_html( $field_description ); ?>
			</span>
		</p>

		<div class="wpforms-field-repeater-blocks">
			<?php foreach ( $rows as $row_data ) : ?>
				<div class="wpforms-layout-row">
					<?php
					echo wpforms_render( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						'admin/entry-print/repeater-column',
						[
							'entry'           => $entry,
							'row_data'        => $row_data,
							'form_data'       => $form_data,
							'is_hidden_by_cl' => $is_hidden_by_cl,
						],
						true
					);
					?>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
<?php endforeach; ?>
