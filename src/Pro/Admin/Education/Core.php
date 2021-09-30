<?php

namespace WPForms\Pro\Admin\Education;

/**
 * Education core for Pro.
 *
 * @since 1.6.6
 */
class Core extends \WPForms\Admin\Education\Core {

	/**
	 * Load enqueues.
	 *
	 * @since 1.6.6
	 */
	public function enqueues() {

		parent::enqueues();

		$min = wpforms_get_min_suffix();

		wp_enqueue_script(
			'wpforms-pro-admin-education-core',
			WPFORMS_PLUGIN_URL . "pro/assets/js/admin/education/core{$min}.js",
			[ 'wpforms-admin-education-core' ],
			WPFORMS_VERSION,
			true
		);
	}

	/**
	 * Localize strings.
	 *
	 * @since 1.6.6
	 *
	 * @return array
	 */
	protected function get_js_strings() {

		$strings = parent::get_js_strings();

		$strings['activate_prompt']    = '<p>' . esc_html__( 'The %name% is installed but not activated. Would you like to activate it?', 'wpforms' ) . '</p>';
		$strings['activate_confirm']   = esc_html__( 'Yes, activate', 'wpforms' );
		$strings['activated']          = esc_html__( 'Addon activated', 'wpforms' );
		$strings['activating']         = esc_html__( 'Activating', 'wpforms' );
		$strings['install_prompt']     = '<p>' . esc_html__( 'The %name% is not installed. Would you like to install and activate it?', 'wpforms' ) . '</p>';
		$strings['install_confirm']    = esc_html__( 'Yes, install and activate', 'wpforms' );
		$strings['installing']         = esc_html__( 'Installing', 'wpforms' );
		$strings['save_prompt']        = esc_html__( 'Almost done! Would you like to save and refresh the form builder?', 'wpforms' );
		$strings['save_confirm']       = esc_html__( 'Yes, save and refresh', 'wpforms' );
		$strings['saving']             = esc_html__( 'Saving ...', 'wpforms' );
		$strings['license_prompt']     = esc_html__( 'To access addons please enter and activate your WPForms license key in the plugin settings.', 'wpforms' );
		$strings['addon_error']        = esc_html__( 'Could not install addon. Please download from wpforms.com and install manually.', 'wpforms' );
		$strings['can_install_addons'] = wpforms_can_install( 'addon' );

		if ( ! $strings['can_install_addons'] ) {
			$strings['install_prompt'] = '<p>' . esc_html__( 'The %name% is not installed. Please install and activate it to use this feature.', 'wpforms' ) . '</p>';
		}

		return $strings;
	}
}
