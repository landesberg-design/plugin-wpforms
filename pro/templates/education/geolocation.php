<?php
/**
 * View for geolocation product education.
 *
 * @var string $nonce_hide     Nonce for hide education.
 * @var bool   $install        Is plugin installed?
 * @var string $plugin_file    Plugin file.
 * @var string $plugin_url     URL for download plugin.
 * @var bool   $plugin_allow   Allow using plugin.
 */

?>
<!-- Entry Location metabox -->
<div id="wpforms-entry-geolocation" class="postbox">

	<div class="postbox-header">
		<h2 class="hndle">
			<span><?php esc_html_e( 'Location', 'wpforms' ); ?></span>
			<a
				class="wpforms-education-hide"
				data-plugin="wpforms-geolocation/wpforms-geolocation.php"
				data-nonce="<?php echo esc_attr( $nonce_hide ); ?>">
				<span class="dashicons dashicons-no"></span>
			</a>
		</h2>
	</div>


	<div class="inside">
		<div class="wpforms-geolocation-preview">
			<div class="wpforms-geolocation-map"></div>
			<ul>
				<li>
					<span class="wpforms-geolocation-meta"><?php esc_html_e( 'Location', 'wpforms' ); ?></span>
					<span class="wpforms-geolocation-value"><span class="wpforms-flag wpforms-flag-us"></span>United States</span>
				</li>
				<li>
					<span class="wpforms-geolocation-meta"><?php esc_html_e( 'Zipcode', 'wpforms' ); ?></span>
					<span class="wpforms-geolocation-value">12345</span>
				</li>
				<li>
					<span class="wpforms-geolocation-meta"><?php esc_html_e( 'Country', 'wpforms' ); ?></span>
					<span class="wpforms-geolocation-value">US</span>
				</li>
				<li>
					<span class="wpforms-geolocation-meta"><?php esc_html_e( 'Lat/Long', 'wpforms' ); ?></span>
					<span class="wpforms-geolocation-value">56, -78</span>
				</li>
			</ul>
			<div class="overlay"></div>
			<div class="wpforms-geolocation-form">
				<h2>
					<?php
					esc_html_e( 'Geolocation', 'wpforms' );
					if ( ! $plugin_allow ) {
						?>
						<span class="badge"></span>
					<?php } ?>
				</h2>
				<p><?php esc_html_e( 'Geolocation allows you to quickly see where your visitors are located!', 'wpforms' ); ?></p>
				<?php if ( $plugin_allow ) { ?>
					<p><?php esc_html_e( 'You can install the Geolocation addon with just a few clicks!', 'wpforms' ); ?></p>
					<a
						class="<?php echo esc_attr( $install ? 'status-inactive' : 'status-download' ); ?> wpforms-btn wpforms-btn-lg wpforms-btn-blue toggle-plugin"
						data-type="addon"
						data-plugin="<?php echo $install ? esc_attr( $plugin_file ) : esc_url( $plugin_url ); ?>"
						href="#">
						<?php
						$install
							? esc_html_e( 'Activate', 'wpforms' )
							: esc_html_e( 'Install & Activate', 'wpforms' );
						?>
					</a>
				<?php } else { ?>
					<p><?php esc_html_e( 'Please upgrade to the PRO plan to unlock Geolocation and more awesome features.', 'wpforms' ); ?></p>
					<a
						href="<?php echo esc_url( wpforms_admin_upgrade_link( 'Entries Single', 'Geolocation' ) ); ?>"
						class="wpforms-btn wpforms-btn-lg wpforms-btn-orange"><?php esc_html_e( 'Upgrade to WPForms Pro', 'wpforms' ); ?></a>
				<?php } ?>
			</div>
		</div>
	</div>

</div>
