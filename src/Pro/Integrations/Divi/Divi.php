<?php

namespace WPForms\Pro\Integrations\Divi;

/**
 * Class Divi.
 *
 * @since 1.6.3
 */
class Divi extends \WPForms\Integrations\Divi\Divi {

	/**
	 * Register frontend styles.
	 *
	 * @since 1.6.3
	 */
	public function frontend_styles() {

		if ( ! $this->is_divi_plugin_loaded() ) {
			return;
		}

		parent::frontend_styles();

		$min = wpforms_get_min_suffix();

		wp_register_style(
			'wpforms-dropzone',
			WPFORMS_PLUGIN_URL . "pro/assets/css/integrations/divi/dropzone{$min}.css",
			[],
			\WPForms_Field_File_Upload::DROPZONE_VERSION
		);

		wp_enqueue_style(
			'wpforms-smart-phone-field',
			WPFORMS_PLUGIN_URL . "pro/assets/css/integrations/divi/intl-tel-input{$min}.css",
			[],
			\WPForms_Field_Phone::INTL_VERSION
		);
	}
}
