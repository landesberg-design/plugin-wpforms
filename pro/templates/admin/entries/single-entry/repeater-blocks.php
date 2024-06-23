<?php
/**
 * Single entry repeater field blocks template.
 *
 * @since 1.8.9
 *
 * @var array                  $field          Field data.
 * @var array                  $form_data      Form data and settings.
 * @var WPForms_Entries_Single $entries_single Single entry object.
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
$hide              = $entries_single->entry_view_settings['fields']['show_field_descriptions']['value'] === 1 ? '' : ' wpforms-hide';

?>

<?php foreach ( $blocks as $key => $rows ) : ?>
	<div class="wpforms-field-repeater-block">
		<?php
		$block_number = $key >= 1 ? ' #' . ( $key + 1 ) : '';
		?>

		<?php if ( isset( $field['label_hide'] ) && ! $field['label_hide'] ) : ?>
			<p class="wpforms-entry-field-name">
				<?php echo esc_html( $field['label'] . $block_number ); ?>

				<?php if ( $field_description ) : ?>
					<span class="wpforms-entry-field-description<?php echo esc_attr( $hide ); ?>">
						<?php echo wp_kses_post( $field_description ); ?>
					</span>
				<?php endif; ?>
			</p>
		<?php endif; ?>

		<div class="wpforms-field-repeater-blocks">
			<?php foreach ( $rows as $row_data ) : ?>
				<div class="wpforms-layout-row">
					<?php
					echo wpforms_render( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						'admin/entries/single-entry/repeater-column',
						[
							'row_data'       => $row_data,
							'form_data'      => $form_data,
							'entries_single' => $entries_single,
						],
						true
					);
					?>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
<?php endforeach; ?>
