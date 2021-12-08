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
	 * Required for the plugin version of builder only.
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

		$styles_name = $this->get_current_styles_name();

		if ( $styles_name ) {
			wp_enqueue_style(
				"wpforms-pro-{$styles_name}",
				WPFORMS_PLUGIN_URL . "pro/assets/css/integrations/divi/wpforms-{$styles_name}{$min}.css",
				[],
				WPFORMS_VERSION
			);
		}

	}

	/**
	 * Load styles.
	 *
	 * @since 1.7.0
	 */
	public function builder_styles() {

		parent::builder_styles();

		$min = wpforms_get_min_suffix();

		wp_enqueue_style(
			'wpforms-pro-integrations',
			WPFORMS_PLUGIN_URL . "pro/assets/css/admin-integrations{$min}.css",
			[],
			WPFORMS_VERSION
		);

		wp_enqueue_style(
			'wpforms-richtext-field',
			WPFORMS_PLUGIN_URL . "pro/assets/css/integrations/divi/richtext{$min}.css",
			[],
			WPFORMS_VERSION
		);
	}
}
