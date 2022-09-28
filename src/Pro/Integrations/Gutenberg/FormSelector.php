<?php

namespace WPForms\Pro\Integrations\Gutenberg;

/**
 * Form Selector Gutenberg block with live preview.
 *
 * @since 1.7.0
 */
class FormSelector extends \WPForms\Integrations\Gutenberg\FormSelector {

	/**
	 * Register WPForms Gutenberg block styles.
	 *
	 * @since 1.7.4.2
	 */
	protected function register_styles() {

		parent::register_styles();

		if ( ! is_admin() ) {
			return;
		}

		$min = wpforms_get_min_suffix();

		wp_register_style(
			'wpforms-pro-integrations',
			WPFORMS_PLUGIN_URL . "assets/pro/css/admin-integrations{$min}.css",
			[ 'wpforms-integrations' ],
			WPFORMS_VERSION
		);
	}

	/**
	 * Load WPForms Gutenberg block scripts.
	 *
	 * @since 1.7.0
	 */
	public function enqueue_block_editor_assets() {

		parent::enqueue_block_editor_assets();

		wp_enqueue_style( 'wpforms-pro-integrations' );
	}
}
