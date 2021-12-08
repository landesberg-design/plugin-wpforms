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

		$strings['license_prompt'] = esc_html__( 'To access addons please enter and activate your WPForms license key in the plugin settings.', 'wpforms' );
		$strings['addon_error']    = esc_html__( 'Could not install the addon. Please download it from wpforms.com and install it manually.', 'wpforms' );

		return $strings;
	}
}
