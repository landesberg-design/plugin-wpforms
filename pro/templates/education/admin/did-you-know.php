<?php
/**
 * Admin/DidYouKnow Education template for Pro.
 *
 * @since 1.6.6
 *
 * @var integer $cols Table columns count.
 * @var string  $desc Message body.
 * @var string  $more Learn More button URL.
 * @var string  $page The current page.
 * @var integer $item DYK message number.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

?>
<tr class="wpforms-dyk wpforms-dismiss-container">
	<td colspan="<?php echo esc_attr( $cols ); ?>">
		<div class="wpforms-dyk-fbox wpforms-dismiss-out">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512" class="wpforms-dyk-bulb"><path d="M176 0C73.05 0-.12 83.54 0 176.24c.06 44.28 16.5 84.67 43.56 115.54C69.21 321.03 93.85 368.68 96 384l.06 75.18c0 3.15.94 6.22 2.68 8.84l24.51 36.84c2.97 4.46 7.97 7.14 13.32 7.14h78.85c5.36 0 10.36-2.68 13.32-7.14l24.51-36.84c1.74-2.62 2.67-5.7 2.68-8.84L256 384c2.26-15.72 26.99-63.19 52.44-92.22C335.55 260.85 352 220.37 352 176 352 78.8 273.2 0 176 0zm47.94 454.31L206.85 480h-61.71l-17.09-25.69-.01-6.31h95.9v6.31zm.04-38.31h-95.97l-.07-32h96.08l-.04 32zm60.4-145.32c-13.99 15.96-36.33 48.1-50.58 81.31H118.21c-14.26-33.22-36.59-65.35-50.58-81.31C44.5 244.3 32.13 210.85 32.05 176 31.87 99.01 92.43 32 176 32c79.4 0 144 64.6 144 144 0 34.85-12.65 68.48-35.62 94.68zM176 64c-61.75 0-112 50.25-112 112 0 8.84 7.16 16 16 16s16-7.16 16-16c0-44.11 35.88-80 80-80 8.84 0 16-7.16 16-16s-7.16-16-16-16z"/></svg>
			<div class="wpforms-dyk-message"><b><?php esc_html_e( 'Did You Know?', 'wpforms' ); ?></b><br>
				<?php echo esc_html( $desc ); ?>
			</div>
			<div class="wpforms-dyk-buttons">
				<?php
				if ( ! empty( $more ) ) {
					echo '<a href="' . esc_url( $more ) . '" target="_blank" rel="noopener noreferrer" class="learn-more">' . esc_html__( 'Learn More', 'wpforms' ) . '</a>';
				}
				?>
				<a href="https://wpforms.com/pricing/?utm_source=WordPress&amp;utm_medium=DYK%20<?php echo esc_attr( ucfirst( $page ) ); ?>&amp;utm_campaign=plugin&amp;utm_content=<?php echo (int) $item; ?>" target="_blank" rel="noopener noreferrer" class="wpforms-btn wpforms-btn-md wpforms-btn-light-grey">
					<?php esc_html_e( 'Upgrade to Pro', 'wpforms' ); ?>
				</a>
				<button type="button" class="wpforms-dismiss-button" title="<?php esc_attr_e( 'Dismiss this message.', 'wpforms' ); ?>" data-section="admin-did-you-know-<?php echo esc_attr( $page ); ?>"></button>
			</div>
		</div>
	</td>
</tr>
