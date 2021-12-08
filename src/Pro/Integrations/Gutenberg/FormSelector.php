<?php

namespace WPForms\Pro\Integrations\Gutenberg;

/**
 * Form Selector Gutenberg block with live preview.
 *
 * @since 1.7.0
 */
class FormSelector extends \WPForms\Integrations\Gutenberg\FormSelector {

	/**
	 * Load WPForms Gutenberg block scripts.
	 *
	 * @since 1.7.0
	 */
	public function enqueue_block_editor_assets() {

		parent::enqueue_block_editor_assets();

		$min = wpforms_get_min_suffix();

		wp_enqueue_style(
			'wpforms-pro-integrations',
			WPFORMS_PLUGIN_URL . "pro/assets/css/admin-integrations{$min}.css",
			[],
			WPFORMS_VERSION
		);
	}
}
