<?php

namespace WPForms\Pro\Admin\Settings;

/**
 * Settings enhancements to educate users on what is
 * available in addons and high level licenses.
 *
 * @since 1.5.5
 */
class Education {

	/**
	 * Addons data.
	 *
	 * @since 1.5.5
	 *
	 * @var object
	 */
	public $addons;

	/**
	 * License level slug.
	 *
	 * @since 1.5.5
	 *
	 * @var string
	 */
	public $license;

	/**
	 * Constructor.
	 *
	 * @since 1.5.5
	 */
	public function __construct() {

		$this->hooks();
	}

	/**
	 * Hooks.
	 *
	 * @since 1.5.5
	 */
	public function hooks() {

		// Only proceed for the Settings > Integrations tab.
		if ( ! \wpforms_is_admin_page( 'settings' ) ) {
			return;
		}

		// Load license level.
		$this->license = $this->get_license_type();

		// Load addon data.
		$this->addons = \wpforms()->license->addons();

		// Integrations related hooks.
		if ( \wpforms_is_admin_page( 'settings', 'integrations' ) ) {
			\add_filter( 'wpforms_admin_strings', array( $this, 'js_strings' ) );
			\add_action( 'admin_enqueue_scripts', array( $this, 'enqueues' ) );
			\add_action( 'wpforms_settings_providers', array( $this, 'providers' ), 10000, 1 );
		}
	}

	/**
	 * Localize needed strings.
	 *
	 * @since 1.5.5
	 *
	 * @param array $strings JS strings.
	 *
	 * @return array
	 */
	public function js_strings( $strings ) {

		$strings['education_activate_prompt']  = '<p>' . \esc_html__( 'The %name% is installed but not activated. Would you like to activate it?', 'wpforms' ) . '</p>';
		$strings['education_activate_confirm'] = \esc_html__( 'Yes, activate', 'wpforms' );
		$strings['education_activated']        = \esc_html__( 'Addon activated', 'wpforms' );
		$strings['education_activating']       = \esc_html__( 'Activating', 'wpforms' );
		$strings['education_install_prompt']   = '<p>' . \esc_html__( 'The %name% is not installed. Would you like to install and activate it?', 'wpforms' ) . '</p>';
		$strings['education_install_confirm']  = \esc_html__( 'Yes, install and activate', 'wpforms' );
		$strings['education_installing']       = \esc_html__( 'Installing', 'wpforms' );
		$strings['education_activated']        = \esc_html__( 'Addon activated', 'wpforms' );
		$strings['education_save_prompt']      = \esc_html__( 'Almost done! Would you like to refresh the page?', 'wpforms' );
		$strings['education_save_confirm']     = \esc_html__( 'Refresh page', 'wpforms' );
		$strings['education_upgrade_title']    = \esc_html__( 'is a PRO Feature', 'wpforms' );
		$strings['education_upgrade_message']  = '<p>' . \esc_html__( 'We\'re sorry, the %name% is not available on your plan. Please upgrade to the PRO plan to unlock all these awesome features.', 'wpforms' ) . '</p>';
		$strings['education_upgrade_confirm']  = \esc_html__( 'Upgrade to PRO', 'wpforms' );
		$strings['education_upgrade_url']      = 'https://wpforms.com/pricing/?utm_source=WordPress&utm_medium=settings-modal&utm_campaign=plugin';
		$strings['education_license_prompt']   = \esc_html__( 'To access addons please enter and activate your WPForms license key in the plugin settings.', 'wpforms' );

		$license_key = \wpforms()->license->get();
		if ( ! empty( $license_key ) ) {
			$strings['education_upgrade_url'] = \add_query_arg(
				array(
					'license_key' => \sanitize_text_field( $license_key ),
				),
				$strings['education_upgrade_url']
			);
		}

		return $strings;
	}

	/**
	 * Load enqueues.
	 *
	 * @since 1.5.5
	 */
	public function enqueues() {

		$min = \wpforms_get_min_suffix();

		\wp_enqueue_script(
			'wpforms-settings-education',
			\WPFORMS_PLUGIN_URL . "pro/assets/js/admin/settings-education{$min}.js",
			array( 'jquery', 'jquery-confirm' ),
			\WPFORMS_VERSION,
			false
		);
	}

	/**
	 * Display providers.
	 *
	 * @since 1.5.5
	 */
	public function providers() {

		$addons = wpforms_get_providers_all();

		$providers = $this->get_addons_available( $addons );

		if ( empty( $providers ) ) {
			return;
		}

		foreach ( $providers as $provider ) {

			/* translators: %s - addon name*/
			$modal_name = sprintf( \__( '%s addon', 'wpforms' ), $provider['name'] );

			/* translators: %s - addon name*/
			$descr = sprintf( \__( 'Integrate %s with WPForms', 'wpforms' ), $provider['name'] );

			printf(
				'<div id="wpforms-integration-%1$s" class="wpforms-settings-provider wpforms-clear focus-out education-modal" data-name="%2$s" data-action="%3$s" data-path="%4$s" data-url="%5$s">
					<div class="wpforms-settings-provider-header wpforms-clear">
						<div class="wpforms-settings-provider-logo ">
							<i class="fa fa-chevron-right"></i>
							%6$s
						</div>
						<div class="wpforms-settings-provider-info">
							<h3>%7$s</h3>
							<p>%8$s</p>
						</div>
					</div>
				</div>',
				\esc_attr( $provider['slug'] ),
				\esc_attr( $modal_name ),
				\esc_attr( $provider['action'] ),
				\esc_attr( $provider['plugin'] ),
				isset( $provider['url'] ) ? \esc_attr( $provider['url'] ) : '',
				'<img src="' . \esc_attr( WPFORMS_PLUGIN_URL ) . 'assets/images/' . \esc_attr( $provider['img'] ) . '">',
				\esc_html( $provider['name'] ),
				\esc_html( $descr )
			);
		}
	}

	/**
	 * Return status of a addon.
	 *
	 * @since 1.5.5
	 *
	 * @param string $plugin Plugin path.
	 *
	 * @return string
	 */
	public function get_addon_status( $plugin ) {

		if ( \is_plugin_active( $plugin ) ) {
			return 'active';
		}

		$plugins = \get_plugins();

		if ( ! empty( $plugins[ $plugin ] ) ) {
			return 'installed';
		}

		return 'missing';
	}

	/**
	 * Return a list of addons available.
	 *
	 * @since 1.5.5
	 *
	 * @param array $addons Addons to check.
	 *
	 * @return array
	 */
	public function get_addons_available( $addons ) {

		foreach ( $addons as $key => $addon ) {

			$status = $this->get_addon_status( $addon['plugin'] );

			if ( 'active' === $status ) {
				unset( $addons[ $key ] );
				continue;
			}

			if ( 'installed' === $status ) {
				$addons[ $key ]['action'] = 'activate';
			} else {
				if ( ! $this->license ) {
					$addons[ $key ]['action'] = 'license';
				} elseif ( $this->has_addon_access( $addon['plugin_slug'] ) ) {
					$addons[ $key ]['action'] = 'install';
					$addons[ $key ]['url']    = $this->get_addon_download_url( $addon['plugin_slug'] );
				} else {
					$addons[ $key ]['action'] = 'upgrade';
				}
			}
		}

		return $addons;
	}

	/**
	 * Return a download URL for an addon.
	 *
	 * @since 1.5.5
	 *
	 * @param string $slug Addon slug.
	 *
	 * @return string|false
	 */
	public function get_addon_download_url( $slug ) {

		if ( empty( $this->addons ) ) {
			return false;
		}

		foreach ( $this->addons as $addon_data ) {
			if (
				$addon_data->slug === $slug &&
				! empty( $addon_data->url )
			) {
				return $addon_data->url;
			}
		}

		return false;
	}

	/**
	 * Determine if user's license level has access.
	 *
	 * @since 1.5.5
	 *
	 * @param string $slug Addons slug.
	 *
	 * @return bool
	 */
	public function has_addon_access( $slug ) {

		if ( empty( $this->addons ) ) {
			return false;
		}

		foreach ( $this->addons as $addon_data ) {

			$license = ( 'elite' === $this->license ) ? 'agency' : $this->license;

			if (
				$addon_data->slug === $slug &&
				in_array( $license, $addon_data->types, true )
			) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Get the current installation license type (always lowercase).
	 *
	 * @since 1.5.5
	 *
	 * @return string|false
	 */
	public function get_license_type() {

		$type = \wpforms_setting( 'type', '', 'wpforms_license' );

		if ( empty( $type ) || ! \wpforms()->pro ) {
			return false;
		}

		return strtolower( $type );
	}
}
