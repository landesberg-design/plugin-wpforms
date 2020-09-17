<?php
/**
 * No entries HTML template.
 *
 * @since 1.6.2.3
 */

if ( ! \defined( 'ABSPATH' ) ) {
	exit;
}

?>
<div class="wpforms-admin-empty-state-container wpforms-admin-no-entries">

	<h2 class="waving-hand-emoji"><?php esc_html_e( 'Hi there!', 'wpforms-lite' ); ?></h2>

	<p><?php esc_html_e( 'It looks like you don’t have any form entries just yet - check back soon!', 'wpforms-lite' ); ?></p>

	<img src="<?php echo esc_url( WPFORMS_PLUGIN_URL . 'assets/images/empty-states/no-entries.svg' ); ?>" alt=""/>

</div>
