<?php

namespace WPForms\Pro\Integrations\WPorg;

use WPForms\Integrations\IntegrationInterface;

/**
 * Load translations from WordPress.org for the Lite version.
 *
 * @since 1.5.6
 */
class Translations implements IntegrationInterface {

	/**
	 * Indicates if current integration is allowed to load.
	 *
	 * @since 1.5.6
	 *
	 * @return bool
	 */
	public function allow_load() {

		return true;
	}

	/**
	 * Loads an integration.
	 *
	 * @since 1.5.6
	 */
	public function load() {

		add_filter( 'http_request_args', array( $this, 'request_lite_translations' ), 10, 2 );
	}

	/**
	 * Add WPForms Lite translation files to the update checklist of installed plugins, to check for new translations.
	 *
	 * @since 1.5.6
	 *
	 * @param array  $args HTTP Request arguments to modify.
	 * @param string $url  The HTTP request URI that is executed.
	 *
	 * @return array The modified Request arguments to use in the update request.
	 */
	public function request_lite_translations( $args, $url ) {

		// Only do something on upgrade requests.
		if ( strpos( $url, 'api.wordpress.org/plugins/update-check' ) === false ) {
			return $args;
		}

		/*
		 * If WPForms Lite is already in the list, don't add it again.
		 *
		 * Checking this by name because the install path is not guaranteed.
		 * The capitalized json data defines the array keys, therefore we need to check and define these as such.
		 */
		$plugins = json_decode( $args['body']['plugins'], true );
		foreach ( $plugins['plugins'] as $slug => $data ) {
			if ( isset( $data['Name'] ) && 'WPForms Lite' === $data['Name'] ) {
				return $args;
			}
		}

		/*
		 * Add an entry to the list that matches the WordPress.org slug for WPForms Lite.
		 *
		 * This entry is based on the currently present data from this plugin, to make sure the version and textdomain
		 * settings are as expected. Take care of the capitalized array key as before.
		 */
		$plugins['plugins']['wpforms-lite/wpforms.php'] = $plugins['plugins']['wpforms/wpforms.php'];
		// Override the name of the plugin.
		$plugins['plugins']['wpforms-lite/wpforms.php']['Name'] = 'WPForms Lite';
		// Override the version of the plugin to prevent increasing the update count.
		$plugins['plugins']['wpforms-lite/wpforms.php']['Version'] = '9999.0';

		// Overwrite the plugins argument in the body to be sent in the upgrade request.
		$args['body']['plugins'] = wp_json_encode( $plugins );

		return $args;
	}
}
