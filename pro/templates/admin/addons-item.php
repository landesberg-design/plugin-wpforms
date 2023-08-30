<?php
/**
 * Admin > Addons page for Pro.
 * Template of the single addon item.
 *
 * @since 1.6.7
 *
 * @var string $image        Image URL.
 * @var array  $addon        Addon data.
 * @var string $status_label Status label.
 * @var string $url          Addon page URL.
 * @var string $button       Button HTML.
 * @var bool   $recommended  Flag for recommended addons.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

?>
<div class="addon-container">
	<div class="addon-item">
		<div class="details wpforms-clear">
			<img src="<?php echo esc_url( $image ); ?>" alt="<?php echo esc_attr( $addon['title'] ); ?> <?php esc_attr_e( 'logo', 'wpforms' ); ?>">
			<h5 class="addon-name">
				<a class="addon-link" href="<?php echo esc_url( $url ); ?>" title="<?php echo esc_attr__( 'Learn more', 'wpforms' ); ?>" target="_blank" rel="noopener noreferrer"><?php echo esc_html( $addon['title'] ); ?></a>
				<?php if ( ! empty( $recommended ) ) : ?>
					<span class="wpforms-addon-recommended">
						<i class="fa fa-star" aria-hidden="true"></i>
						<?php esc_html_e( 'Recommended', 'wpforms' ); ?>
					</span>
				<?php endif; ?>
			</h5>
			<p class="addon-desc"><?php echo esc_html( $addon['excerpt'] ); ?></p>
		</div>
		<div class="actions wpforms-clear">

		<?php
		if ( ! empty( $addon['status'] ) && $addon['action'] !== 'upgrade' && $addon['plugin_allow'] ) :
			$action_class = 'action-button';
		?>
			<div class="status">
				<strong>
					<?php
					printf(
						/* translators: %s - status label. */
						esc_html__( 'Status: %s', 'wpforms' ),
						'<span class="status-label status-' . esc_attr( $addon['status'] ) . '">' . wp_kses_post( $status_label ) . '</span>'
					);
					?>
				</strong>
			</div>
		<?php
		endif;

		$action_class = empty( $action_class ) ? 'upgrade-button' : $action_class;
		?>
			<div class="<?php echo esc_attr( $action_class ); ?>">
				<?php echo $button; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</div>
		</div>
	</div>
</div>
