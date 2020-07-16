<?php

namespace WPForms\Pro\Admin\Entries\Export;

/**
 * Entries Export.
 *
 * @since 1.5.5
 */
class Export {

	/**
	 * Configuration.
	 *
	 * @since 1.5.5
	 *
	 * @var array
	 */
	public $configuration = array(
		'request_data_ttl'     => DAY_IN_SECONDS, // Export request and a temp file TTL value.
		'entries_per_step'     => 1000,           // Number of entries in a chunk that are retrieved and saved into a temp file per one step.
		'csv_export_separator' => ',',            // Columns separator.
		'disallowed_fields'    => array(          // Disallowed fields array.
			'divider',
			'html',
			'pagebreak',
			'captcha',
		),
	);

	/**
	 * Translatable strings for JS responses.
	 *
	 * @since 1.5.5
	 *
	 * @var array
	 */
	public $i18n = array();

	/**
	 * Error messages.
	 *
	 * @since 1.5.5
	 *
	 * @var array
	 */
	public $errors = array();

	/**
	 * Additional Information checkboxes.
	 *
	 * @since 1.5.5
	 *
	 * @var array
	 */
	public $additional_info_fields = array();

	/**
	 * Array for store/read some data.
	 *
	 * @since 1.5.5
	 *
	 * @var array
	 */
	public $data = array();

	/**
	 * Instance of Admin Object.
	 *
	 * @since 1.5.5
	 *
	 * @var \WPForms\Pro\Admin\Entries\Export\Admin
	 */
	public $admin;

	/**
	 * Instance of Ajax Object.
	 *
	 * @since 1.5.5
	 *
	 * @var \WPForms\Pro\Admin\Entries\Export\Ajax
	 */
	public $ajax;

	/**
	 * Instance of File Object.
	 *
	 * @since 1.5.5
	 *
	 * @var \WPForms\Pro\Admin\Entries\Export\File
	 */
	public $file;

	/**
	 * Initialize.
	 *
	 * @since 1.6.1
	 */
	public function init() {

		if ( ! wpforms_current_user_can( 'view_entries' ) ) {
			return;
		}

		if (
			! $this->is_entries_export_ajax() &&
			! $this->is_tools_export_page()
		) {
			return;
		}

		$this->init_args();
		$this->init_settings();
		$this->init_form_data();

		$this->admin = new Admin( $this );
		$this->file  = new File( $this );
		$this->ajax  = new Ajax( $this );
	}

	/**
	 * Init data.
	 *
	 * @since 1.5.5
	 */
	protected function init_settings() {

		// Additional information fields.
		$this->additional_info_fields = apply_filters(
			'wpforms_pro_admin_entries_export_additional_info_fields',
			array(
				'entry_id'   => esc_html__( 'Entry ID', 'wpforms' ),
				'date'       => esc_html__( 'Entry Date', 'wpforms' ),
				'notes'      => esc_html__( 'Entry Notes', 'wpforms' ),
				'viewed'     => esc_html__( 'Viewed', 'wpforms' ),
				'starred'    => esc_html__( 'Starred', 'wpforms' ),
				'user_agent' => esc_html__( 'User Agent', 'wpforms' ),
				'ip_address' => esc_html__( 'User IP', 'wpforms' ),
				'user_uuid'  => esc_html__( 'Unique Generated User ID', 'wpforms' ),
				'geodata'    => esc_html__( 'Geolocation Details', 'wpforms' ),
				'pstatus'    => esc_html__( 'Payment Status', 'wpforms' ),
				'pginfo'     => esc_html__( 'Payment Gateway Information', 'wpforms' ),
				'del_fields' => esc_html__( 'Include data of previously deleted fields', 'wpforms' ),
			)
		);

		// Error strings.
		$this->errors = array(
			'common'            => esc_html__( 'There were problems while preparing your export file. Please recheck export settings and try again.', 'wpforms' ),
			'security'          => esc_html__( 'You don\'t have enough capabilities to complete this request.', 'wpforms' ),
			'unknown_form_id'   => esc_html__( 'Incorrect form ID has been specified.', 'wpforms' ),
			'unknown_entry_id'  => esc_html__( 'Incorrect entry ID has been specified.', 'wpforms' ),
			'form_data'         => esc_html__( 'Specified form seems to be broken.', 'wpforms' ),
			'unknown_request'   => esc_html__( 'Unknown request.', 'wpforms' ),
			'file_not_readable' => esc_html__( 'Export file cannot be retrieved from a file system.', 'wpforms' ),
			'file_empty'        => esc_html__( 'Export file is empty.', 'wpforms' ),
			'form_empty'        => esc_html__( 'The form does not have any fields for export.', 'wpforms' ),
		);

		// Strings to localize.
		$this->i18n = array(
			'error_prefix'        => $this->errors['common'],
			'error_form_empty'    => $this->errors['form_empty'],
			'prc_1_filtering'     => esc_html__( 'Generating a list of entries according to your filters.', 'wpforms' ),
			'prc_1_please_wait'   => esc_html__( 'This can take a while. Please wait.', 'wpforms' ),
			'prc_2_no_entries'    => esc_html__( 'No entries found after applying your filters.', 'wpforms' ),
			'prc_2_total_entries' => esc_html__( 'Number of entries found: {total_entries}.', 'wpforms' ),
			'prc_2_progress'      => esc_html__( 'Generating a CSV file: {progress}% completed. Please wait for generation to complete, file download will start automatically.', 'wpforms' ),
			'prc_3_done'          => esc_html__( 'The file was generated successfully.', 'wpforms' ),
			'prc_3_download'      => esc_html__( 'If the download does not start automatically', 'wpforms' ),
			'prc_3_click_here'    => esc_html__( 'click here', 'wpforms' ),
		);

		// Keeping default configuration data.
		$default_configuration = $this->configuration;

		// Applying deprecated filters.
		if ( has_filter( 'wpforms_export_fields_allowed' ) ) {

			// We need this because otherwise files can't be downloaded due to 'filter deprecated' notice.
			// Notice will be shown only on the WPForms > Tools > Export page.
			if (
				'wpforms_tools_entries_export_download' === $this->data['get_args']['action'] ||
				'wpforms_tools_single_entry_export_download' === $this->data['get_args']['action']
			) {
				ini_set( 'display_errors', 0 ); // phpcs:ignore
			}

			require_once WPFORMS_PLUGIN_DIR . 'pro/includes/admin/entries/class-entries-export.php';
			$old_export = new \WPForms_Entries_Export();

			$all_fields     = $old_export->all_fields();
			$allowed_fields = $old_export->allowed_fields();

			$disallowed_fields = array_diff( $all_fields, $allowed_fields );

			$this->configuration['disallowed_fields'] = array_unique( array_merge( $this->configuration['disallowed_fields'], $disallowed_fields ) );
		}

		if ( has_filter( 'wpforms_csv_export_separator' ) ) {
			if (
				'wpforms_tools_entries_export_download' === $this->data['get_args']['action'] ||
				'wpforms_tools_single_entry_export_download' === $this->data['get_args']['action']
			) {
				ini_set( 'display_errors', 0 ); // phpcs:ignore
			}

			$this->configuration['csv_export_separator'] = (string) apply_filters_deprecated(
				'wpforms_csv_export_separator',
				array( $this->configuration['csv_export_separator'] ),
				'1.5.5 of the WPForms plugin',
				'wpforms_pro_admin_entries_export_configuration'
			);
		}

		// Apply filter to config parameters.
		$this->configuration = (array) apply_filters( 'wpforms_pro_admin_entries_export_configuration', $this->configuration );

		$this->configuration['disallowed_fields'] = (array) $this->configuration['disallowed_fields'];

		$this->configuration = wp_parse_args( $this->configuration, $default_configuration );
	}

	/**
	 * Get localized data.
	 *
	 * @since 1.5.5
	 */
	public function get_localized_data() {

		return array(
			'nonce'       => wp_create_nonce( 'wpforms-tools-entries-export-nonce' ),
			'lang_code'   => sanitize_key( wpforms_get_language_code() ),
			'export_page' => esc_url( admin_url( 'admin.php?page=wpforms-tools&view=export' ) ),
			'i18n'        => $this->i18n,
			'form_id'     => ! empty( $this->data['form_data'] ) ? $this->data['get_args']['form_id'] : 0,
			'dates'       => $this->data['get_args']['dates'],
		);
	}

	/**
	 * Init GET or POST args.
	 *
	 * @since 1.5.5
	 *
	 * @param string $method GET|POST.
	 */
	public function init_args( $method = 'GET' ) {

		$args = array();

		$method = 'GET' === $method ? 'GET' : 'POST';
		$req    = 'GET' === $method ? $_GET : $_POST; // phpcs:ignore

		// Action.
		$args['action'] = '';
		if ( ! empty( $req['action'] ) ) {
			$args['action'] = sanitize_text_field( wp_unslash( $req['action'] ) );
		}

		// Nonce.
		$args['nonce'] = '';
		if ( ! empty( $req['nonce'] ) ) {
			$args['nonce'] = sanitize_text_field( wp_unslash( $req['nonce'] ) );
		}

		// Form ID.
		$args['form_id'] = 0;
		if ( ! empty( $req['form'] ) ) {
			$args['form_id'] = (int) $req['form'];
		}

		// Entry ID.
		$args['entry_id'] = 0;
		if ( ! empty( $req['entry_id'] ) ) {
			$args['entry_id'] = (int) $req['entry_id'];
		}

		// Fields.
		$args['fields'] = array();
		if ( ! empty( $req['fields'] ) ) {
			$args['fields'] = array_map( 'intval', wp_unslash( $req['fields'] ) );
		}

		// Additional Information.
		$args['additional_info'] = array();
		if ( ! empty( $req['additional_info'] ) ) {
			$args['additional_info'] = array_map( 'sanitize_text_field', wp_unslash( $req['additional_info'] ) );
		}

		// Date range.
		$args['dates'] = array();
		if ( ! empty( $req['date'] ) ) {
			$dates = explode( ' - ', sanitize_text_field( wp_unslash( $req['date'] ) ) );

			switch ( count( $dates ) ) {
				case 1:
					$args['dates'] = sanitize_text_field( $req['date'] ); // phpcs:ignore
					break;

				case 2:
					$args['dates'] = array_map( 'sanitize_text_field', $dates );
					break;
			}
		}

		// Search.
		$args['search'] = array(
			'field'      => 'any',
			'comparison' => 'contains',
			'term'       => '',
		);
		if ( isset( $req['search'] ) ) {
			if ( isset( $req['search']['field'] ) && is_numeric( $req['search']['field'] ) ) {
				$args['search']['field'] = (int) $req['search']['field'];
			}
			if ( ! empty( $req['search']['comparison'] ) ) {
				$args['search']['comparison'] = sanitize_key( $req['search']['comparison'] );
			}
			if ( ! empty( $req['search']['term'] ) ) {
				$args['search']['term'] = sanitize_text_field( $req['search']['term'] );
			}
		}

		// Request ID.
		$args['request_id'] = '';
		if ( ! empty( $req['request_id'] ) ) {
			$args['request_id'] = sanitize_text_field( wp_unslash( $req['request_id'] ) );
		}

		$this->data[ strtolower( $method ) . '_args' ] = $args;
	}

	/**
	 * Init selected form data.
	 *
	 * @since 1.5.5
	 */
	protected function init_form_data() {

		$this->data['form_data'] = wpforms()->form->get(
			$this->data['get_args']['form_id'],
			array(
				'content_only' => true,
				'cap'          => 'view_entries_form_single',
			)
		);
	}

	/**
	 * Check if current page request meets requirements for Export tool.
	 *
	 * @since 1.5.5
	 *
	 * @return bool
	 */
	public function is_tools_export_page() {

		// Only proceed for the Tools > Export.
		if ( ! wpforms_is_admin_page( 'tools', 'export' ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Helper function to determine if it is entries export ajax request.
	 *
	 * @since 1.6.1
	 *
	 * @return bool
	 */
	public function is_entries_export_ajax() { // phpcs:ignore Generic.Metrics.CyclomaticComplexity.TooHigh

		if ( ! wp_doing_ajax() ) {
			return false;
		}

		$ref = wp_get_referer();

		if ( ! $ref ) {
			return false;
		}

		$query = wp_parse_url( $ref, PHP_URL_QUERY );
		wp_parse_str( $query, $query_vars );

		if (
			empty( $query_vars['page'] ) ||
			empty( $query_vars['view'] )
		) {
			return false;
		}

		if (
			$query_vars['page'] !== 'wpforms-tools' ||
			$query_vars['view'] !== 'export'
		) {
			return false;
		}

		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		if (
			empty( $_REQUEST['action'] ) ||
			empty( $_REQUEST['nonce'] ) ||
			( empty( $_REQUEST['form'] ) && empty( $_REQUEST['request_id'] ) )
		) {
			return false;
		}

		if (
			$_REQUEST['action'] !== 'wpforms_tools_entries_export_form_data' &&
			$_REQUEST['action'] !== 'wpforms_tools_entries_export_step'
		) {
			return false;
		}
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		return true;
	}
}
