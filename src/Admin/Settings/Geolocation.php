<?php

namespace WPForms\Admin\Settings;

/**
 * Class Geolocation.
 *
 * @since 1.6.5
 */
class Geolocation {

	/**
	 * Slug for settings.
	 *
	 * @since 1.6.5
	 */
	const SLUG = 'geolocation';

	/**
	 * Init hooks.
	 *
	 * @since 1.6.5
	 */
	public function hooks() {

		add_action( 'admin_enqueue_scripts', [ $this, 'enqueues' ] );
		add_filter( 'wpforms_settings_defaults', [ $this, 'add_sections' ] );
	}

	/**
	 * Enqueues.
	 *
	 * @since 1.6.5
	 */
	public function enqueues() {

		if ( ! wpforms_is_admin_page( 'settings', self::SLUG ) ) {
			return;
		}

		// Lity.
		wp_enqueue_style(
			'wpforms-lity',
			WPFORMS_PLUGIN_URL . 'assets/css/lity.min.css',
			null,
			'3.0.0'
		);

		wp_enqueue_script(
			'wpforms-lity',
			WPFORMS_PLUGIN_URL . 'assets/js/lity.min.js',
			[ 'jquery' ],
			'3.0.0',
			true
		);
	}

	/**
	 * Preview of education features for customers with not enough permissions.
	 *
	 * @since 1.6.5
	 *
	 * @param array $settings Settings sections.
	 *
	 * @return array
	 */
	public function add_sections( $settings ) {

		$section_rows = [
			'heading',
			'screenshots',
			'caps',
			'submit',
		];

		foreach ( $section_rows as $section_row ) {
			$settings[ self::SLUG ][ self::SLUG . '-' . $section_row ] = [
				'id'       => self::SLUG . '-' . $section_row,
				'content'  => method_exists( $this, 'output_section_row_' . $section_row ) ? $this->{'output_section_row_' . $section_row}() : '',
				'type'     => 'content',
				'no_label' => true,
				'class'    => [ $section_row, 'wpforms-setting-row-education' ],
			];
		}

		return $settings;
	}

	/**
	 * Generate and output section "Heading" row HTML.
	 *
	 * @since 1.6.5
	 *
	 * @used-by add_sections
	 */
	private function output_section_row_heading() {

		return sprintf(
			'<h4>%1$s%2$s</h4><p>%3$s</p><p>%4$s</p>',
			esc_html__( 'Geolocation', 'wpforms-lite' ),
			$this->get_badge_markup(),
			esc_html__( 'Do you want to learn more about visitors who fill out your online forms? Our geolocation addon allows you to collect and store your website visitors geolocation data along with their form submission. This insight can help you be better informed and turn more leads into customers.', 'wpforms-lite' ),
			esc_html__( 'Additionally, create smart address fields that autocomplete so users can submit your forms even faster, with less mistakes. You can even display map previews and enable location auto-detection to further enhance your forms.', 'wpforms-lite' )
		);
	}

	/**
	 * Get `pro+` badge markup.
	 *
	 * @since 1.6.5
	 *
	 * @return string
	 */
	private function get_badge_markup() {

		if ( wpforms()->pro && ! in_array( wpforms_get_license_type(), [ 'basic', 'plus' ], true ) ) {
			return '';
		}

		return sprintf(
			'<img src="%1$s" alt="%2$s">',
			esc_url( WPFORMS_PLUGIN_URL . 'assets/images/lite-settings-access/pro-plus.svg' ),
			esc_attr__( 'Pro+', 'wpforms-lite' )
		);
	}

	/**
	 * Generate and output section "Screenshots" row HTML.
	 *
	 * @since 1.6.5
	 *
	 * @used-by add_sections
	 */
	private function output_section_row_screenshots() {

		$format = '<div class="cont">
			<img src="%1$s" alt="%3$s"/>
			<a href="%2$s" class="hover" data-lity data-lity-desc="%3$s"></a>
			<span>%3$s</span>
		</div>';

		$images_url = WPFORMS_PLUGIN_URL . 'assets/images/geolocation-education/';

		$content = sprintf(
			$format,
			esc_url( $images_url . 'entry-location.jpg' ),
			esc_url( $images_url . 'entry-location@2x.jpg' ),
			esc_html__( 'Form Entry Location Details', 'wpforms-lite' )
		);

		$content .= sprintf(
			$format,
			esc_url( $images_url . 'address-autocomplete.jpg' ),
			esc_url( $images_url . 'address-autocomplete@2x.jpg' ),
			esc_html__( 'Address Autocomplete', 'wpforms-lite' )
		);

		$content .= sprintf(
			$format,
			esc_url( $images_url . 'smart-address-field.jpg' ),
			esc_url( $images_url . 'smart-address-field@2x.jpg' ),
			esc_html__( 'Address Autocomplete with Map', 'wpforms-lite' )
		);

		return $content;
	}

	/**
	 * Generate and output section "Capabilities" row HTML.
	 *
	 * @since 1.6.5
	 *
	 * @used-by add_sections
	 */
	private function output_section_row_caps() {

		$caps = [
			[
				esc_html__( 'City', 'wpforms-lite' ),
				esc_html__( 'Country', 'wpforms-lite' ),
				esc_html__( 'Postal/Zip Code', 'wpforms-lite' ),
			],
			[
				esc_html__( 'Latitude/Longitude', 'wpforms-lite' ),
				esc_html__( 'Address Autocomplete', 'wpforms-lite' ),
				esc_html__( 'Embedded Map in Forms', 'wpforms-lite' ),
			],
			[
				esc_html__( 'Google Places API', 'wpforms-lite' ),
				esc_html__( 'Algolia Places API', 'wpforms-lite' ),
			],
		];

		$content = '<p>' . esc_html__( 'Powerful location-based insights and features…', 'wpforms-lite' ) . '</p>';

		foreach ( $caps as $column ) {
			$content .= '<ul>';

			foreach ( $column as $cap ) {
				$content .= '<li>' . $cap . '</li>';
			}

			$content .= '</ul>';
		}

		return $content;
	}

	/**
	 * Submit button.
	 *
	 * @since 1.6.5
	 *
	 * @used-by add_sections
	 *
	 * @return string
	 */
	private function output_section_row_submit() {

		if ( ! wpforms()->pro || in_array( wpforms_get_license_type(), [ 'basic', 'plus' ], true ) ) {
			return sprintf(
				'<a href="%1$s" target="_blank" rel="noopener noreferrer" class="wpforms-upgrade-modal wpforms-btn wpforms-btn-lg wpforms-btn-orange">%2$s</a>',
				esc_url( 'https://wpforms.com/lite-upgrade/?discount=LITEUPGRADE&utm_source=WordPress&utm_medium=settings-license&utm_campaign=liteplugin' ),
				esc_html__( 'Upgrade to WPForms Pro', 'wpforms-lite' )
			);
		}

		if ( function_exists( 'wpforms_geolocation' ) ) {
			return sprintf(
				'<a href="%s" class="wpforms-btn wpforms-btn-lg wpforms-btn-blue"><i></i>%s</a><div class="msg info">%s</div>',
				admin_url( 'plugins.php' ),
				esc_html__( 'Visit Plugins Page', 'wpforms-lite' ),
				esc_html__( 'Your plugin is outdated. Please update your Geolocation addon on the plugins page.', 'wpforms-lite' )
			);
		}

		$plugin_file = 'wpforms-geolocation/wpforms-geolocation.php';
		$plugins     = get_plugins();

		if ( ! isset( $plugins[ $plugin_file ] ) ) {
			return sprintf(
				'<button class="status-download wpforms-btn wpforms-btn-lg wpforms-btn-blue toggle-plugin" data-type="addon" data-plugin="%s"><i></i>%s</button>',
				$this->get_download_url(),
				esc_html__( 'Install & Activate', 'wpforms-lite' )
			);
		}

		return sprintf(
			'<button class="status-inactive wpforms-btn wpforms-btn-lg wpforms-btn-blue toggle-plugin" data-type="addon" data-plugin="%s"><i></i>%s</button>',
			$plugin_file,
			esc_html__( 'Activate', 'wpforms-lite' )
		);
	}

	/**
	 * Get the Geolocation download url.
	 *
	 * @since 1.6.5
	 *
	 * @return string
	 */
	private function get_download_url() {

		$addons = wpforms()->license->addons();

		if ( ! $addons ) {
			return '';
		}

		foreach ( $addons as $addon_data ) {
			if ( $addon_data->slug === 'wpforms-geolocation' && ! empty( $addon_data->url ) ) {
				return $addon_data->url;
			}
		}

		return '';
	}
}
