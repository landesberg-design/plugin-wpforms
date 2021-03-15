<?php

namespace WPForms\Pro\Admin\Builder;

/**
 * Form Builder changes and enhancements to educate Basic/Plus users on what is available in WPForms Pro.
 *
 * @since 1.5.1
 */
class Education {

	/**
	 * Addons data.
	 *
	 * @since 1.5.1
	 *
	 * @var object
	 */
	public $addons;

	/**
	 * License level slug.
	 *
	 * @since 1.5.1
	 *
	 * @var string
	 */
	public $license;

	/**
	 * Constructor.
	 *
	 * @since 1.5.1
	 */
	public function __construct() {

		$this->hooks();
	}

	/**
	 * Hooks.
	 *
	 * @since 1.5.1
	 */
	public function hooks() {

		if ( wp_doing_ajax() ) {
			// AJAX-callback on targeting the hCaptcha/reCAPTCHA field button.
			add_action( 'wp_ajax_wpforms_update_field_captcha', [ $this, 'captcha_field_callback' ] );
			add_action( 'wpforms_field_options_bottom_advanced-options', [ $this, 'geolocation_options' ], 10, 2 );
		}

		// Only proceed for the form builder.
		if ( ! \wpforms_is_admin_page( 'builder' ) ) {
			return;
		}

		if ( ! \apply_filters( 'wpforms_admin_builder_education', '__return_true' ) ) {
			return;
		}

		// Load addon data.
		$this->addons = \wpforms()->license->addons();

		// Load license level.
		$this->license = wpforms_get_license_type();

		add_action( 'wpforms_field_options_bottom_advanced-options', [ $this, 'geolocation_options' ], 10, 2 );

		add_filter( 'wpforms_builder_strings', [ $this, 'js_strings' ] );

		add_action( 'wpforms_builder_enqueues_before', [ $this, 'enqueues' ] );

		add_filter( 'wpforms_builder_fields_buttons', [ $this, 'fields' ], 100 );

		add_filter( 'wpforms_builder_field_button_attributes', [ $this, 'fields_attributes' ], 100, 3 );

		add_action( 'wpforms_builder_after_panel_sidebar', [ $this, 'settings' ], 100, 2 );

		add_action( 'wpforms_providers_panel_sidebar', [ $this, 'providers' ], 100 );

		add_action( 'wpforms_payments_panel_sidebar', [ $this, 'payments' ], 100 );
	}

	/**
	 * Display geolocation options.
	 *
	 * @since 1.6.5
	 *
	 * @param array  $field    Field data.
	 * @param object $instance Builder instance.
	 */
	public function geolocation_options( $field, $instance ) {

		if ( ! in_array( $field['type'], [ 'text', 'address' ], true ) ) {
			return;
		}

		if (
			in_array( wpforms_get_license_type(), [ 'pro', 'elite', 'agency', 'ultimate' ], true ) &&
			defined( 'WPFORMS_GEOLOCATION_VERSION' ) &&
			version_compare( WPFORMS_GEOLOCATION_VERSION, '2.0.0', '>=' )
		) {
			return;
		}

		$row_args            = $this->get_address_autocomplete_row_attributes();
		$row_args['content'] = $instance->field_element(
			'checkbox',
			$field,
			$this->get_address_autocomplete_field_attributes( $field ),
			false
		);

		$instance->field_element( 'row', $field, $row_args );
	}

	/**
	 * Get attributes for address autocomplete row.
	 *
	 * @since 1.6.5
	 *
	 * @return array
	 */
	private function get_address_autocomplete_row_attributes() {

		$default = [
			'slug' => 'enable_address_autocomplete',
		];

		if ( in_array( $this->license, [ 'basic', 'plus' ], true ) ) {
			return wp_parse_args(
				[
					'data'  => [
						'action'  => 'upgrade',
						'name'    => esc_html__( 'Address Autocomplete', 'wpforms' ),
						'licence' => 'pro',
						'message' => esc_html__( 'We\'re sorry, Address Autocomplete is part of the Geolocation Addon and not available on your plan. Please upgrade to the PRO plan to unlock all these awesome features.', 'wpforms' ),
					],
					'class' => 'education-modal',
				],
				$default
			);
		}

		$plugin_name    = esc_html__( 'WPForms Geolocation', 'wpforms' );
		$plugin_slug    = 'wpforms-geolocation';
		$plugin_path    = 'wpforms-geolocation/wpforms-geolocation.php';
		$plugins_status = $this->get_addon_status( $plugin_path );

		if ( $plugins_status === 'missing' ) {
			return wp_parse_args(
				[
					'data'  => [
						'action'  => 'install',
						/* translators: %s - addon name. */
						'name'    => sprintf( esc_html__( '%s addon', 'wpforms' ), $plugin_name ),
						'url'     => $this->get_addon_download_url( $plugin_slug ),
						'nonce'   => wp_create_nonce( 'wpforms-admin' ),
						'license' => 'pro',
					],
					'class' => 'education-modal',
				],
				$default
			);
		}

		if ( $plugins_status === 'installed' ) {
			return wp_parse_args(
				[
					'data'  => [
						'action' => 'activate',
						/* translators: %s - addon name. */
						'name'   => sprintf( esc_html__( '%s addon', 'wpforms' ), $plugin_name ),
						'path'   => $plugin_path,
						'nonce'  => wp_create_nonce( 'wpforms-admin' ),
					],
					'class' => 'education-modal',
				],
				$default
			);
		}

		return $default;
	}

	/**
	 * Get attributes for address autocomplete field.
	 *
	 * @since 1.6.5
	 *
	 * @param array $field Field data.
	 *
	 * @return array
	 */
	private function get_address_autocomplete_field_attributes( $field ) {

		$default = [
			'slug'  => 'enable_address_autocomplete',
			'value' => '0',
			'desc'  => esc_html__( 'Enable Address Autocomplete', 'wpforms' ),
		];

		if ( in_array( $this->license, [ 'basic', 'plus' ], true ) ) {
			return wp_parse_args(
				[
					'desc'  => sprintf(
						'%s<span class="wpforms-field-option-education-pro-badge"></span>',
						esc_html__( 'Enable Address Autocomplete', 'wpforms' )
					),
					'attrs' => [
						'disabled' => 'disabled',
					],
				],
				$default
			);
		}

		if ( function_exists( 'wpforms_geolocation' ) ) {
			return wp_parse_args(
				[
					'tooltip' => sprintf( /* translators: %s - link to the plugins page. */
						wp_kses( __( 'This feature is available in the Geolocation addon v2.0.0. Please update your addon on <a href="%s">the plugins page</a>.', 'wpforms' ), [ 'a' => [ 'href' => [] ] ] ),
						admin_url( 'plugins.php' )
					),
					'attrs'   => [
						'disabled' => 'disabled',
					],
				],
				$default
			);
		}

		return $default;
	}


	/**
	 * Localize needed strings.
	 *
	 * @since 1.5.1
	 *
	 * @param array $strings JS strings.
	 *
	 * @return array
	 */
	public function js_strings( $strings ) {

		$strings['education_activate_prompt']  = '<p>' . \esc_html__( 'The %name% is installed but not activated. Would you like to activate it?', 'wpforms' ) . '</p>';
		$strings['education_activate_confirm'] = \esc_html__( 'Yes, activate', 'wpforms' );
		$strings['education_activated']        = \esc_html__( 'Addon activated', 'wpforms' );
		$strings['education_activating']       = \esc_html__( 'Activating', 'wpforms' );
		$strings['education_install_prompt']   = '<p>' . \esc_html__( 'The %name% is not installed. Would you like to install and activate it?', 'wpforms' ) . '</p>';
		$strings['education_install_confirm']  = \esc_html__( 'Yes, install and activate', 'wpforms' );
		$strings['education_installing']       = \esc_html__( 'Installing', 'wpforms' );
		$strings['education_save_prompt']      = \esc_html__( 'Almost done! Would you like to save and refresh the form builder?', 'wpforms' );
		$strings['education_save_confirm']     = \esc_html__( 'Yes, save and refresh', 'wpforms' );
		$strings['education_license_prompt']   = \esc_html__( 'To access addons please enter and activate your WPForms license key in the plugin settings.', 'wpforms' );

		$strings['education_upgrade']['pro']['title']   = \esc_html__( 'is a PRO Feature', 'wpforms' );
		$strings['education_upgrade']['pro']['message'] = '<p>' . \esc_html__( 'We\'re sorry, the %name% is not available on your plan. Please upgrade to the PRO plan to unlock all these awesome features.', 'wpforms' ) . '</p>';
		$strings['education_upgrade']['pro']['confirm'] = \esc_html__( 'Upgrade to PRO', 'wpforms' );
		$strings['education_upgrade']['pro']['url']     = 'https://wpforms.com/pricing/?utm_source=WordPress&utm_medium=builder-modal&utm_campaign=plugin';

		$strings['education_upgrade']['elite']['title']   = \esc_html__( 'is an Elite Feature', 'wpforms' );
		$strings['education_upgrade']['elite']['message'] = '<p>' . \esc_html__( 'We\'re sorry, the %name% is not available on your plan. Please upgrade to the Elite plan to unlock all these awesome features.', 'wpforms' ) . '</p>';
		$strings['education_upgrade']['elite']['confirm'] = \esc_html__( 'Upgrade to Elite', 'wpforms' );
		$strings['education_upgrade']['elite']['url']     = 'https://wpforms.com/pricing/?utm_source=WordPress&utm_medium=builder-modal&utm_campaign=plugin';
		$strings['addon_error']                           = esc_html__( 'Could not install addon. Please download from wpforms.com and install manually.', 'wpforms' );

		$license_key = \wpforms_get_license_key();
		if ( ! empty( $license_key ) ) {
			$strings['education_upgrade']['pro']['url'] = \add_query_arg(
				[
					'license_key' => \sanitize_text_field( $license_key ),
				],
				$strings['education_upgrade']['pro']['url']
			);
		}

		$can_install_addons            = wpforms_can_install( 'addon' );
		$strings['can_install_addons'] = $can_install_addons;

		if ( ! $can_install_addons ) {
			$strings['education_install_prompt'] = '<p>' . esc_html__( 'The %name% is not installed. Please install and activate it to use this feature.', 'wpforms' ) . '</p>';
		}

		return $strings;
	}

	/**
	 * Load enqueues.
	 *
	 * @since 1.5.1
	 */
	public function enqueues() {

		$min = \wpforms_get_min_suffix();

		\wp_enqueue_script(
			'wpforms-builder-education',
			\WPFORMS_PLUGIN_URL . "pro/assets/js/admin/builder-education{$min}.js",
			[ 'jquery', 'jquery-confirm' ],
			\WPFORMS_VERSION,
			false
		);
	}

	/**
	 * Display fields.
	 *
	 * @since 1.5.1
	 * @since 1.6.4 Added hCaptcha support.
	 *
	 * @param array $fields Form fields.
	 *
	 * @return array
	 */
	public function fields( $fields ) {

		// Add CAPTCHA field to Standard group.
		$captcha_settings = wpforms_get_captcha_settings();

		if ( ! empty( $captcha_settings['provider'] ) ) {
			if ( ! empty( $captcha_settings['site_key'] ) || ! empty( $captcha_settings['secret_key'] ) ) {
				$captcha_name = $captcha_settings['provider'] === 'hcaptcha' ? esc_html__( 'hCaptcha', 'wpforms' ) : esc_html__( 'reCAPTCHA', 'wpforms' );
				$captcha_icon = $captcha_settings['provider'] === 'hcaptcha' ? 'fa-question-circle-o' : 'fa-google';
			} else {
				$captcha_name = esc_html__( 'CAPTCHA', 'wpforms' );
				$captcha_icon = 'fa-question-circle-o';
			}

			$fields['standard']['fields'][] = [
				'icon'  => $captcha_icon,
				'name'  => $captcha_name,
				'type'  => 'captcha_' . $captcha_settings['provider'],
				'order' => 180,
				'class' => 'not-draggable',
			];
		}

		$addons = [
			[
				'name'        => esc_html__( 'Custom Captcha', 'wpforms' ),
				'slug'        => 'captcha',
				'plugin'      => 'wpforms-captcha/wpforms-captcha.php',
				'plugin_slug' => 'wpforms-captcha',
				'license'     => 'pro',
				'field'       => [
					'icon'  => 'fa-question-circle',
					'name'  => \esc_html__( 'Custom Captcha', 'wpforms' ),
					'type'  => 'captcha',
					'order' => '3000',
					'class' => 'education-modal',
				],
			],
			[
				'name'        => esc_html__( 'Signatures', 'wpforms' ),
				'slug'        => 'signatures',
				'plugin'      => 'wpforms-signatures/wpforms-signatures.php',
				'plugin_slug' => 'wpforms-signatures',
				'license'     => 'pro',
				'field'       => [
					'icon'  => 'fa-pencil',
					'name'  => \esc_html__( 'Signature', 'wpforms' ),
					'type'  => 'signature',
					'order' => '310',
					'class' => 'education-modal',
				],
			],
			[
				'name'        => esc_html__( 'Surveys and Polls', 'wpforms' ),
				'slug'        => 'surveys-polls',
				'plugin'      => 'wpforms-surveys-polls/wpforms-surveys-polls.php',
				'plugin_slug' => 'wpforms-surveys-polls',
				'license'     => 'pro',
				'field'       => [
					'icon'  => 'fa-ellipsis-h',
					'name'  => \esc_html__( 'Likert Scale', 'wpforms' ),
					'type'  => 'likert_scale',
					'order' => '4000',
					'class' => 'education-modal',
				],
			],
			[
				'name'        => esc_html__( 'Surveys and Polls', 'wpforms' ),
				'slug'        => 'surveys-polls',
				'plugin'      => 'wpforms-surveys-polls/wpforms-surveys-polls.php',
				'plugin_slug' => 'wpforms-surveys-polls',
				'license'     => 'pro',
				'field'       => [
					'icon'  => 'fa-tachometer',
					'name'  => \esc_html__( 'Net Promoter Score', 'wpforms' ),
					'type'  => 'net_promoter_score',
					'order' => '4100',
					'class' => 'education-modal',
				],
			],
		];

		$addons = $this->get_addons_available( $addons );

		if ( empty( $addons ) ) {
			return $fields;
		}

		// Restructure data.
		foreach ( $addons as $addon ) {
			$addon['field']['plugin']      = $addon['plugin'];
			$addon['field']['plugin_name'] = $addon['name'];
			$addon['field']['action']      = $addon['action'];
			$addon['field']['url']         = isset( $addon['url'] ) ? $addon['url'] : '';
			$addon['field']['nonce']       = \wp_create_nonce( 'wpforms-admin' );
			$fields['fancy']['fields'][]   = $addon['field'];
		}

		return $fields;
	}

	/**
	 * Adjust attributes on field media_buttons.
	 *
	 * @since 1.5.1
	 *
	 * @param array $atts      Button attributes.
	 * @param array $field     Button properties.
	 * @param array $form_data Form data.
	 *
	 * @return array
	 */
	public function fields_attributes( $atts, $field, $form_data ) {

		if ( empty( $field['action'] ) ) {
			return $atts;
		}

		/* translators: %s - field name. */
		$atts['data']['field-name'] = sprintf( \esc_html__( '%s field', 'wpforms' ), $field['name'] );
		$atts['data']['action']     = $field['action'];
		$atts['data']['nonce']      = \wp_create_nonce( 'wpforms-admin' );

		if ( ! empty( $field['plugin_name'] ) ) {
			/* translators: %s - addon name. */
			$atts['data']['name'] = sprintf( \esc_html__( '%s addon', 'wpforms' ), $field['plugin_name'] );
		}

		if ( ! empty( $field['plugin'] ) ) {
			$atts['data']['path'] = $field['plugin'];
		}

		if ( ! empty( $field['url'] ) ) {
			$atts['data']['url'] = $field['url'];
		}

		return $atts;
	}

	/**
	 * Display settings panels.
	 *
	 * @since 1.5.1
	 *
	 * @param \WPForms_Form_Handler $form Current form.
	 * @param string                $slug Panel slug.
	 */
	public function settings( $form, $slug ) {

		if ( empty( $form ) || $slug !== 'settings' ) {
			return;
		}

		$addons = [
			[
				'name'        => esc_html__( 'Conversational Forms', 'wpforms' ),
				'slug'        => 'conversational-forms',
				'plugin'      => 'wpforms-conversational-forms/wpforms-conversational-forms.php',
				'plugin_slug' => 'wpforms-conversational-forms',
				'license'     => 'pro',
			],
			[
				'name'        => esc_html__( 'Surveys and Polls', 'wpforms' ),
				'slug'        => 'surveys-polls',
				'plugin'      => 'wpforms-surveys-polls/wpforms-surveys-polls.php',
				'plugin_slug' => 'wpforms-surveys-polls',
				'license'     => 'pro',
			],
			[
				'name'        => esc_html__( 'Form Pages', 'wpforms' ),
				'slug'        => 'form-pages',
				'plugin'      => 'wpforms-form-pages/wpforms-form-pages.php',
				'plugin_slug' => 'wpforms-form-pages',
				'license'     => 'pro',
			],
			[
				'name'        => esc_html__( 'Form Locker', 'wpforms' ),
				'slug'        => 'form-locker',
				'plugin'      => 'wpforms-form-locker/wpforms-form-locker.php',
				'plugin_slug' => 'wpforms-form-locker',
				'license'     => 'pro',
			],
			[
				'name'        => esc_html__( 'Form Abandonment', 'wpforms' ),
				'slug'        => 'form-abandonment',
				'plugin'      => 'wpforms-form-abandonment/wpforms-form-abandonment.php',
				'plugin_slug' => 'wpforms-form-abandonment',
				'license'     => 'pro',
			],
			[
				'name'        => esc_html__( 'Post Submissions', 'wpforms' ),
				'slug'        => 'post-submissions',
				'plugin'      => 'wpforms-post-submissions/wpforms-post-submissions.php',
				'plugin_slug' => 'wpforms-post-submissions',
				'license'     => 'pro',
			],
			[
				'name'        => esc_html__( 'Webhooks', 'wpforms' ),
				'slug'        => 'webhooks',
				'plugin'      => 'wpforms-webhooks/wpforms-webhooks.php',
				'plugin_slug' => 'wpforms-webhooks',
				'license'     => 'elite',
			],
		];

		$settings = $this->get_addons_available( $addons );

		if ( empty( $settings ) ) {
			return;
		}

		foreach ( $settings as $setting ) {

			/* translators: %s - addon name. */
			$modal_name = sprintf( \esc_html__( '%s addon', 'wpforms' ), $setting['name'] );

			printf(
				'<a href="#" class="wpforms-panel-sidebar-section wpforms-panel-sidebar-section-%s education-modal" data-name="%s" data-action="%s" data-path="%s" data-url="%s" data-nonce="%s" data-license="%s">',
				\esc_attr( $setting['slug'] ),
				\esc_attr( $modal_name ),
				\esc_attr( $setting['action'] ),
				\esc_attr( $setting['plugin'] ),
				isset( $setting['url'] ) ? \esc_attr( $setting['url'] ) : '',
				\esc_attr( \wp_create_nonce( 'wpforms-admin' ) ),
				\esc_attr( $setting['license'] )
			);
				echo \esc_html( $setting['name'] );
				echo '<i class="fa fa-angle-right wpforms-toggle-arrow"></i>';
			echo '</a>';
		}
	}

	/**
	 * Display providers.
	 *
	 * @since 1.5.1
	 */
	public function providers() {

		$addons = [
			[
				'name'        => esc_html__( 'ActiveCampaign', 'wpforms' ),
				'slug'        => 'activecampaign',
				'img'         => 'addon-icon-activecampaign.png',
				'plugin'      => 'wpforms-activecampaign/wpforms-activecampaign.php',
				'plugin_slug' => 'wpforms-activecampaign',
				'license'     => 'elite',
			],
			[
				'name'        => esc_html__( 'AWeber', 'wpforms' ),
				'slug'        => 'aweber',
				'img'         => 'addon-icon-aweber.png',
				'plugin'      => 'wpforms-aweber/wpforms-aweber.php',
				'plugin_slug' => 'wpforms-aweber',
				'license'     => 'pro',
			],
			[
				'name'        => esc_html__( 'Campaign Monitor', 'wpforms' ),
				'slug'        => 'campaign-monitor',
				'img'         => 'addon-icon-campaign-monitor.png',
				'plugin'      => 'wpforms-campaign-monitor/wpforms-campaign-monitor.php',
				'plugin_slug' => 'wpforms-campaign-monitor',
				'license'     => 'pro',
			],
			[
				'name'        => esc_html__( 'Drip', 'wpforms' ),
				'slug'        => 'drip',
				'img'         => 'addon-icon-drip.png',
				'plugin'      => 'wpforms-drip/wpforms-drip.php',
				'plugin_slug' => 'wpforms-drip',
				'license'     => 'pro',
			],
			[
				'name'        => esc_html__( 'GetResponse', 'wpforms' ),
				'slug'        => 'getresponse',
				'img'         => 'addon-icon-getresponse.png',
				'plugin'      => 'wpforms-getresponse/wpforms-getresponse.php',
				'plugin_slug' => 'wpforms-getresponse',
				'license'     => 'pro',
			],
			[
				'name'        => esc_html__( 'Mailchimp', 'wpforms' ),
				'slug'        => 'mailchimp',
				'img'         => 'addon-icon-mailchimp.png',
				'plugin'      => 'wpforms-mailchimp/wpforms-mailchimp.php',
				'plugin_slug' => 'wpforms-mailchimp',
				'license'     => 'pro',
			],
			[
				'name'        => esc_html__( 'Salesforce', 'wpforms' ),
				'slug'        => 'salesforce',
				'img'         => 'addon-icon-salesforce.png',
				'plugin'      => 'wpforms-salesforce/wpforms-salesforce.php',
				'plugin_slug' => 'wpforms-salesforce',
				'license'     => 'elite',
			],
			[
				'name'        => esc_html__( 'Sendinblue', 'wpforms' ),
				'slug'        => 'sendinblue',
				'img'         => 'addon-icon-sendinblue.png',
				'plugin'      => 'wpforms-sendinblue/wpforms-sendinblue.php',
				'plugin_slug' => 'wpforms-sendinblue',
				'license'     => 'pro',
			],
			[
				'name'        => esc_html__( 'Zapier', 'wpforms' ),
				'slug'        => 'zapier',
				'img'         => 'addon-icon-zapier.png',
				'plugin'      => 'wpforms-zapier/wpforms-zapier.php',
				'plugin_slug' => 'wpforms-zapier',
				'license'     => 'pro',
			],
		];

		$providers = $this->get_addons_available( $addons );

		if ( empty( $providers ) ) {
			return;
		}

		foreach ( $providers as $provider ) {

			/* translators: %s - addon name. */
			$modal_name = sprintf( \esc_html__( '%s addon', 'wpforms' ), $provider['name'] );

			printf(
				'<a href="#" class="wpforms-panel-sidebar-section icon wpforms-panel-sidebar-section-%s education-modal" data-name="%s" data-action="%s" data-path="%s" data-url="%s" data-nonce="%s" data-license="%s">',
				\esc_attr( $provider['slug'] ),
				\esc_attr( $modal_name ),
				\esc_attr( $provider['action'] ),
				\esc_attr( $provider['plugin'] ),
				isset( $provider['url'] ) ? \esc_attr( $provider['url'] ) : '',
				\esc_attr( \wp_create_nonce( 'wpforms-admin' ) ),
				\esc_attr( $provider['license'] )
			);
				echo '<img src="' . \esc_url( WPFORMS_PLUGIN_URL . 'assets/images/' . $provider['img'] ) . '">';
				echo \esc_html( $provider['name'] );
				echo '<i class="fa fa-angle-right wpforms-toggle-arrow"></i>';
			echo '</a>';
		}
	}

	/**
	 * Display payment.
	 *
	 * @since 1.5.1
	 */
	public function payments() {

		$addons = [
			[
				'name'        => esc_html__( 'PayPal Standard', 'wpforms' ),
				'slug'        => 'paypal_standard',
				'img'         => 'addon-icon-paypal.png',
				'plugin'      => 'wpforms-paypal-standard/wpforms-paypal-standard.php',
				'plugin_slug' => 'wpforms-paypal-standard',
				'license'     => 'pro',
			],
			[
				'name'        => esc_html__( 'Stripe', 'wpforms' ),
				'slug'        => 'stripe',
				'img'         => 'addon-icon-stripe.png',
				'plugin'      => 'wpforms-stripe/wpforms-stripe.php',
				'plugin_slug' => 'wpforms-stripe',
				'license'     => 'pro',
			],
			[
				'name'        => esc_html__( 'Authorize.Net', 'wpforms' ),
				'slug'        => 'authorize_net',
				'img'         => 'addon-icon-authorize-net.png',
				'plugin'      => 'wpforms-authorize-net/wpforms-authorize-net.php',
				'plugin_slug' => 'wpforms-authorize-net',
				'license'     => 'elite',
			],
		];

		$payments = $this->get_addons_available( $addons );

		if ( empty( $payments ) ) {
			return;
		}

		foreach ( $payments as $payment ) {

			/* translators: %s - addon name. */
			$modal_name = sprintf( \esc_html__( '%s addon', 'wpforms' ), $payment['name'] );

			printf(
				'<a href="#" class="wpforms-panel-sidebar-section icon wpforms-panel-sidebar-section-%s education-modal" data-name="%s" data-action="%s" data-path="%s" data-url="%s" data-nonce="%s" data-license="%s">',
				\esc_attr( $payment['slug'] ),
				\esc_attr( $modal_name ),
				\esc_attr( $payment['action'] ),
				\esc_attr( $payment['plugin'] ),
				isset( $payment['url'] ) ? \esc_attr( $payment['url'] ) : '',
				\esc_attr( \wp_create_nonce( 'wpforms-admin' ) ),
				\esc_attr( $payment['license'] )
			);
				echo '<img src="' . \esc_url( WPFORMS_PLUGIN_URL . 'assets/images/' . $payment['img'] ) . '">';
				echo \esc_html( $payment['name'] );
				echo '<i class="fa fa-angle-right wpforms-toggle-arrow"></i>';
			echo '</a>';
		}
	}

	/**
	 * Return status of a addon.
	 *
	 * @since 1.5.1
	 *
	 * @param string $plugin Plugin path.
	 *
	 * @return string
	 */
	public function get_addon_status( $plugin ) {

		if ( \is_plugin_active( $plugin ) ) {
			return 'active';
		}

		$plugins = \get_plugins();

		if ( ! empty( $plugins[ $plugin ] ) ) {
			return 'installed';
		}

		return 'missing';
	}

	/**
	 * Return array of addons available.
	 *
	 * @since 1.5.1
	 *
	 * @param array $addons Addons to check.
	 *
	 * @return array
	 */
	public function get_addons_available( $addons ) {

		foreach ( $addons as $key => $addon ) {

			$status = $this->get_addon_status( $addon['plugin'] );

			if ( $status === 'active' ) {
				unset( $addons[ $key ] );
				continue;
			}

			if ( $status === 'installed' ) {
				$addons[ $key ]['action'] = 'activate';
			} else {
				if ( ! $this->license ) {
					$addons[ $key ]['action'] = 'license';
				} elseif ( $this->has_addon_access( $addon['plugin_slug'] ) ) {
					$addons[ $key ]['action'] = 'install';
					$addons[ $key ]['url']    = $this->get_addon_download_url( $addon['plugin_slug'] );
				} else {
					$addons[ $key ]['action'] = 'upgrade';
				}
			}
		}

		return $addons;
	}

	/**
	 * Return download URL for an addon.
	 *
	 * @since 1.5.1
	 *
	 * @param string $slug Addon slug.
	 *
	 * @return string|false
	 */
	public function get_addon_download_url( $slug ) {

		if ( empty( $this->addons ) ) {
			return false;
		}

		foreach ( $this->addons as $addon_data ) {
			if (
				$addon_data->slug === $slug &&
				! empty( $addon_data->url )
			) {
				return $addon_data->url;
			}
		}

		return false;
	}

	/**
	 * Determine if user's license level has access.
	 *
	 * @since 1.5.1
	 *
	 * @param string $slug Addons slug.
	 *
	 * @return bool
	 */
	public function has_addon_access( $slug ) {

		if ( empty( $this->addons ) ) {
			return false;
		}

		foreach ( $this->addons as $addon_data ) {

			$license = ( $this->license === 'elite' ) ? 'agency' : $this->license;

			if (
				$addon_data->slug === $slug &&
				in_array( $license, $addon_data->types, true )
			) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Get the current installation license type (always lowercase).
	 *
	 * @deprecated Use wpforms_get_license_type().
	 *
	 * @since 1.5.1
	 * @since 1.5.9.3 Deprecated.
	 *
	 * @return string|false
	 */
	public function get_license_type() {

		_deprecated_function( __FUNCTION__, '1.5.9.3 of the WPForms plugin', 'wpforms_get_license_type()' );

		return wpforms_get_license_type();
	}

	/**
	 * Targeting on hCaptcha/reCAPTCHA field button in the builder.
	 *
	 * TODO: Lite and Pro Education duplicate this code.
	 *
	 * @since 1.6.4
	 */
	public function captcha_field_callback() {

		// Run a security check.
		check_ajax_referer( 'wpforms-builder', 'nonce' );

		// Check for permissions.
		if ( ! wpforms_current_user_can() ) {
			wp_send_json_error( esc_html__( 'You do not have permission.', 'wpforms' ) );
		}

		// Check for form ID.
		if ( ! isset( $_POST['id'] ) || empty( $_POST['id'] ) ) {
			wp_send_json_error( esc_html__( 'No form ID found.', 'wpforms' ) );
		}

		// Get an actual form data.
		$form_id   = absint( $_POST['id'] );
		$form_data = wpforms()->form->get( $form_id, [ 'content_only' => true ] );

		// Check that CAPTCHA is configured in the settings.
		$captcha_settings = wpforms_get_captcha_settings();
		$captcha_name     = $this->get_captcha_name( $captcha_settings );

		if ( empty( $form_data ) || empty( $captcha_name ) ) {
			wp_send_json_error( esc_html__( 'Something wrong. Please, try again later.', 'wpforms' ) );
		}

		// Prepare result array.
		$data = [
			'current'  => false,
			'cases'    => [
				'not_configured'         => [
					'title'   => esc_html__( 'Heads up!', 'wpforms' ),
					'content' => sprintf(
						wp_kses( /* translators: %1$s - CAPTCHA settings page URL; %2$s - WPForms.com doc URL; %3$s - CAPTCHA name. */
							__( 'The %3$s settings have not been configured yet. Please complete the setup in your <a href="%1$s" target="_blank">WPForms Settings</a>, and check out our <a href="%2$s" target="_blank" rel="noopener noreferrer">step by step tutorial</a> for full details.', 'wpforms' ),
							[
								'a' => [
									'href'   => true,
									'rel'    => true,
									'target' => true,
								],
							]
						),
						esc_url( admin_url( 'admin.php?page=wpforms-settings&view=captcha' ) ),
						'https://wpforms.com/docs/setup-captcha-wpforms/',
						$captcha_name
					),
				],
				'configured_not_enabled' => [
					'title'   => false,
					/* translators: %s - CAPTCHA name. */
					'content' => sprintf( esc_html__( '%s has been enabled for this form. Don\'t forget to save your form!', 'wpforms' ), $captcha_name ),
				],
				'configured_enabled'     => [
					'title'   => false,
					/* translators: %s - CAPTCHA name. */
					'content' => sprintf( esc_html__( 'Are you sure you want to disable %s for this form?', 'wpforms' ), $captcha_name ),
					'cancel'  => true,
				],
			],
			'provider' => $captcha_settings['provider'],
		];

		if ( empty( $captcha_settings['site_key'] ) || empty( $captcha_settings['secret_key'] ) ) {

			// If CAPTCHA is not configured in the WPForms plugin settings.
			$data['current'] = 'not_configured';

		} elseif ( ! isset( $form_data['settings']['recaptcha'] ) || '1' !== $form_data['settings']['recaptcha'] ) {

			// If CAPTCHA is configured in WPForms plugin settings, but wasn't set in form settings.
			$data['current'] = 'configured_not_enabled';

		} else {

			// If CAPTCHA is configured in WPForms plugin and form settings.
			$data['current'] = 'configured_enabled';
		}

		wp_send_json_success( $data );
	}

	/**
	 * Retrieve the CAPTCHA name.
	 *
	 * @since 1.6.4
	 *
	 * @param array $settings The CAPTCHA settings.
	 *
	 * @return string
	 */
	protected function get_captcha_name( $settings ) {

		if ( empty( $settings['provider'] ) ) {
			return '';
		}

		if ( empty( $settings['site_key'] ) && empty( $settings['secret_key'] ) ) {
			return esc_html__( 'CAPTCHA', 'wpforms' );
		}

		if ( 'hcaptcha' === $settings['provider'] ) {
			return esc_html__( 'hCaptcha', 'wpforms' );
		}

		$recaptcha_names = [
			'v2'        => esc_html__( 'Google Checkbox v2 reCAPTCHA', 'wpforms' ),
			'invisible' => esc_html__( 'Google Invisible v2 reCAPTCHA', 'wpforms' ),
			'v3'        => esc_html__( 'Google v3 reCAPTCHA', 'wpforms' ),
		];

		return isset( $recaptcha_names[ $settings['recaptcha_type'] ] ) ? $recaptcha_names[ $settings['recaptcha_type'] ] : '';
	}
}
