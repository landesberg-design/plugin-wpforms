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
		$strings['addon_error']    = sprintf(
			wp_kses( /* translators: %1$s - An addon download URL, %2$s - Link to manual installation guide. */
				__( 'Could not install the addon. Please <a href="%1$s" target="_blank" rel="noopener noreferrer">download it from wpforms.com</a> and <a href="%2$s" target="_blank" rel="noopener noreferrer">install it manually</a>.', 'wpforms' ),
				[
					'a' => [
						'href'   => true,
						'target' => true,
						'rel'    => true,
					],
				]
			),
			'https://wpforms.com/account/licenses/',
			'https://wpforms.com/docs/how-to-manually-install-addons-in-wpforms/'
		);

		return $strings;
	}
}
