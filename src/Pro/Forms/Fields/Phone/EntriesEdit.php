<?php

namespace WPForms\Pro\Forms\Fields\Phone;

/**
 * Editing Address field entries.
 *
 * @since 1.6.0
 */
class EntriesEdit extends \WPForms\Pro\Forms\Fields\Base\EntriesEdit {

	/**
	 * Constructor.
	 *
	 * @since 1.6.0
	 */
	public function __construct() {

		parent::__construct( 'phone' );
	}

	/**
	 * Enqueues for the Edit Entry page.
	 *
	 * @since 1.6.0
	 */
	public function enqueues() {

		$min = wpforms_get_min_suffix();

		// International Telephone Input library CSS.
		wp_enqueue_style(
			'wpforms-smart-phone-field',
			WPFORMS_PLUGIN_URL . "pro/assets/css/vendor/intl-tel-input{$min}.css",
			[],
			'17.0.5'
		);

		// Load International Telephone Input library - https://github.com/jackocnr/intl-tel-input.
		wp_enqueue_script(
			'wpforms-smart-phone-field',
			WPFORMS_PLUGIN_URL . "pro/assets/js/vendor/jquery.intl-tel-input{$min}.js",
			[ 'jquery' ],
			'17.0.5',
			true
		);

		// Load jQuery input mask library - https://github.com/RobinHerbots/jquery.inputmask.
		wp_enqueue_script(
			'wpforms-maskedinput',
			WPFORMS_PLUGIN_URL . 'assets/js/jquery.inputmask.min.js',
			[ 'jquery' ],
			'5.0.7-beta.29',
			true
		);
	}
}
