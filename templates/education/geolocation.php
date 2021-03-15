<?php
/**
 * View for geolocation product education.
 *
 * @since 1.6.5
 *
 * @var string $nonce_hide   Nonce for hide education.
 * @var bool   $install      Is plugin installed?
 * @var string $plugin_file  Plugin file.
 * @var string $plugin_url   URL for download plugin.
 * @var bool   $plugin_allow Allow using plugin.
 */

?>

<!-- Entry Location metabox -->
<div id="wpforms-entry-geolocation" class="postbox">

	<h2 class="hndle">
		<span><?php esc_html_e( 'Location', 'wpforms-lite' ); ?></span>
		<a
			class="wpforms-education-hide"
			data-plugin="wpforms-geolocation/wpforms-geolocation.php"
			data-nonce="<?php echo esc_attr( $nonce_hide ); ?>">
			<span class="dashicons dashicons-no"></span>
		</a>
	</h2>


	<div class="inside">
		<div class="wpforms-geolocation-preview">
			<div class="wpforms-geolocation-map"></div>
			<ul>
				<li>
					<span class="wpforms-geolocation-meta"><?php esc_html_e( 'Location', 'wpforms-lite' ); ?></span>
					<span class="wpforms-geolocation-value"><span class="wpforms-flag wpforms-flag-us"></span>United States</span>
				</li>
				<li>
					<span class="wpforms-geolocation-meta"><?php esc_html_e( 'Zipcode', 'wpforms-lite' ); ?></span>
					<span class="wpforms-geolocation-value"><?php esc_html_e( 'Sign up to access', 'wpforms-lite' ); ?></span>
				</li>
				<li>
					<span class="wpforms-geolocation-meta"><?php esc_html_e( 'Country', 'wpforms-lite' ); ?></span>
					<span class="wpforms-geolocation-value">US</span>
				</li>
				<li>
					<span class="wpforms-geolocation-meta"><?php esc_html_e( 'Lat/Long', 'wpforms-lite' ); ?></span>
					<span class="wpforms-geolocation-value"><?php esc_html_e( 'Sign up to access', 'wpforms-lite' ); ?>, <?php esc_html_e( 'Sign up to access', 'wpforms-lite' ); ?></span>
				</li>
			</ul>
			<div class="overlay"></div>
			<div class="wpforms-geolocation-form">
				<h2>
					<?php
					esc_html_e( 'Geolocation', 'wpforms-lite' );
					if ( ! $plugin_allow ) {
						?>
						<span class="badge"></span>
					<?php } ?>
				</h2>
				<p><?php esc_html_e( 'Geolocation allows you to quickly see where your visitors are located!', 'wpforms-lite' ); ?></p>
				<?php if ( $plugin_allow ) { ?>
					<p><?php esc_html_e( 'You can install the Geolocation addon with just a few clicks!', 'wpforms-lite' ); ?></p>
					<a
						class="<?php echo esc_attr( $install ? 'status-inactive' : 'status-download' ); ?> wpforms-btn wpforms-btn-lg wpforms-btn-blue toggle-plugin"
						data-type="addon"
						data-plugin="<?php echo $install ? esc_attr( $plugin_file ) : esc_url( $plugin_url ); ?>"
						href="#">
						<?php
						$install
							? esc_html_e( 'Activate', 'wpforms-lite' )
							: esc_html_e( 'Install & Activate', 'wpforms-lite' );
						?>
					</a>
				<?php } else { ?>
					<p><?php esc_html_e( 'Please upgrade to the PRO plan to unlock Geolocation and more awesome features.', 'wpforms-lite' ); ?></p>
					<a
						href="<?php echo esc_url( wpforms_admin_upgrade_link( 'geolocation' ) ); ?>"
						class="wpforms-btn wpforms-btn-lg wpforms-btn-orange"><?php esc_html_e( 'Upgrade to WPForms Pro', 'wpforms-lite' ); ?></a>
				<?php } ?>
			</div>
		</div>
	</div>

</div>
