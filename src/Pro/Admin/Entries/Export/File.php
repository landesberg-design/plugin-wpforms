<?php

namespace WPForms\Pro\Admin\Entries\Export;

use \Goodby\CSV\Export\Standard\Exporter;
use \Goodby\CSV\Export\Standard\ExporterConfig;

/**
 * File-related routines.
 *
 * @since 1.5.5
 */
class File {

	/**
	 * Instance of Export Class.
	 *
	 * @since 1.5.5
	 *
	 * @var \WPForms\Pro\Admin\Entries\Export\Export
	 */
	protected $export;

	/**
	 * Constructor.
	 *
	 * @since 1.5.5
	 *
	 * @param \WPForms\Pro\Admin\Entries\Export\Export $export Instance of Export.
	 */
	public function __construct( $export ) {

		$this->export = $export;

		$this->hooks();
	}

	/**
	 * Register hooks.
	 *
	 * @since 1.5.5
	 */
	public function hooks() {

		add_action( 'wpforms_tools_init', array( $this, 'entries_export_download_file' ) );
		add_action( 'wpforms_tools_init', array( $this, 'single_entry_export_download_file' ) );
		add_action( 'admin_init', array( $this, 'remove_old_export_files' ) );
	}

	/**
	 * Export helper. Write data to a temporary .csv file.
	 *
	 * @since 1.5.5
	 *
	 * @param array $export_data  Export data array.
	 * @param array $request_data Request data array.
	 */
	public function write_csv( $export_data, $request_data ) {

		$export_file = $this->get_tmpfname( $request_data );

		// Include Exporter.
		require_once WPFORMS_PLUGIN_DIR . 'vendor/autoload.php';

		$config = new ExporterConfig();
		$config->setDelimiter( $this->export->configuration['csv_export_separator'] );
		$config->setFileMode( 'a' );
		$exporter = new Exporter( $config );
		$exporter->export( $export_file, $export_data );
	}

	/**
	 * Tmp files directory.
	 *
	 * @since 1.5.5
	 *
	 * @return string Temporary files directory path.
	 */
	public function get_tmpdir() {

		$uploads              = wp_upload_dir();
		$wpforms_uploads_root = trailingslashit( $uploads['basedir'] ) . 'wpforms';

		// Apply filter to allow redefine tmp directory.
		$custom_uploads_root = apply_filters( 'wpforms_upload_root', $wpforms_uploads_root );
		if ( wp_is_writable( $custom_uploads_root ) ) {
			$wpforms_uploads_root = $custom_uploads_root;
		}

		$export_dir = trailingslashit( $wpforms_uploads_root ) . 'export';
		if ( ! file_exists( $export_dir ) ) {
			wp_mkdir_p( $export_dir );
		}

		// Normalize slashes for Windows.
		$export_dir = wp_normalize_path( $export_dir );

		return $export_dir;
	}

	/**
	 * Full pathname of the tmp file.
	 *
	 * @since 1.5.5
	 *
	 * @param array $request_data Request data.
	 *
	 * @return string Temporary file full pathname.
	 */
	public function get_tmpfname( $request_data ) {

		$export_dir  = $this->get_tmpdir();
		$export_file = $export_dir . '/' . sanitize_key( $request_data['request_id'] );
		touch( $export_file );

		return $export_file;
	}

	/**
	 * Send HTTP headers for .csv file download.
	 *
	 * @since 1.5.5.1
	 *
	 * @param string $file_name File name.
	 */
	public function http_headers( $file_name ) {

		$file_name = empty( $file_name ) ? 'wpforms-entries.csv' : $file_name;

		nocache_headers();
		header( 'Content-Description: File Transfer' );
		header( 'Content-Type: text/csv' );
		header( 'Content-Disposition: attachment; filename=' . $file_name );
		header( 'Content-Transfer-Encoding: binary' );
	}

	/**
	 * Entries export file download.
	 *
	 * @since 1.5.5
	 *
	 * @throws \Exception Try-catch.
	 */
	public function entries_export_download_file() {

		$args = $this->export->data['get_args'];

		if ( 'wpforms_tools_entries_export_download' !== $args['action'] ) {
			return;
		}

		try {

			// Security check.
			if (
				! wp_verify_nonce( $args['nonce'], 'wpforms-tools-entries-export-nonce' ) ||
				! wpforms_current_user_can( 'view_entries' )
			) {
				throw new \Exception( $this->export->errors['security'] );
			}

			// Check for request_id.
			if ( empty( $args['request_id'] ) ) {
				throw new \Exception( $this->export->errors['unknown_request'] );
			}

			// Get stored request data.
			$request_data = get_transient( 'wpforms-tools-entries-export-request-' . $args['request_id'] );

			$export_file = $this->get_tmpfname( $request_data );

			clearstatcache( true, $export_file );

			if ( ! is_readable( $export_file ) ) {
				throw new \Exception( $this->export->errors['file_not_readable'] );
			}

			if ( @filesize( $export_file ) === 0 ) { //phpcs:ignore
				throw new \Exception( $this->export->errors['file_empty'] );
			}

			$file_name = 'wpforms-' . $request_data['db_args']['form_id'] . '-' . sanitize_file_name( get_the_title( $request_data['db_args']['form_id'] ) ) . '-' . date( 'Y-m-d-H-i-s' ) . '.csv';
			$this->http_headers( $file_name );

			readfile( $export_file ); // phpcs:ignore
			exit;

		} catch ( \Exception $e ) {
			// phpcs:disable
			$error = $this->export->errors['common'] . '<br>' . $e->getMessage();
			if ( wpforms_debug() ) {
				$error .= '<br><b>WPFORMS DEBUG</b>: ' . $e->__toString();
			}
			$error = str_replace( "'", '&#039;', $error );

			echo "
			<script>
				( function() {
					var w = window;
					if ( w.frameElement != null &&
						 w.frameElement.nodeName === 'IFRAME' &&
						 w.parent.jQuery )
					{
						w.parent.jQuery( w.parent.document ).trigger( 'csv_file_error', [ '" . str_replace( "\n", '', $error ) . "' ] );
						w.parent.WPFormsEntriesExport.displaySubmitSpinner( false );
					}
				} )();
			</script>
			<pre>" . $error . '</pre>';
			exit;
			// phpcs:enable
		}
	}

	/**
	 * Single entry export file download.
	 *
	 * @since 1.5.5
	 *
	 * @throws \Exception Try-catch.
	 */
	public function single_entry_export_download_file() {

		$args = $this->export->data['get_args'];

		if ( 'wpforms_tools_single_entry_export_download' !== $args['action'] ) {
			return;
		}

		try {

			// Check for form_id.
			if ( empty( $args['form_id'] ) ) {
				throw new \Exception( $this->export->errors['unknown_form_id'] );
			}

			// Check for entry_id.
			if ( empty( $args['entry_id'] ) ) {
				throw new \Exception( $this->export->errors['unknown_entry_id'] );
			}

			// Security check.
			if (
				! wp_verify_nonce( $args['nonce'], 'wpforms-tools-single-entry-export-nonce' ) ||
				! wpforms_current_user_can( 'view_entries' )
			) {
				throw new \Exception( $this->export->errors['security'] );
			}

			// Get stored request data.
			$request_data = $this->export->ajax->get_request_data( $args );

			$this->export->ajax->request_data = $request_data;

			// Get export data.
			$export_data = $this->export->ajax->get_data();

			// Writing to csv file.
			$this->write_csv( $export_data, $request_data );

			$export_file = $this->get_tmpfname( $request_data );

			clearstatcache( true, $export_file );

			if ( ! is_readable( $export_file ) ) {
				throw new \Exception( $this->export->errors['file_not_readable'] );
			}

			if ( @filesize( $export_file ) === 0 ) { //phpcs:ignore
				throw new \Exception( $this->export->errors['file_empty'] );
			}

			$file_name = 'wpforms-' . $request_data['db_args']['form_id'] . '-' . sanitize_file_name( get_the_title( $request_data['db_args']['form_id'] ) ) . '-entry-' . $request_data['db_args']['entry_id'] . '-' . date( 'Y-m-d-H-i-s' ) . '.csv';
			$this->http_headers( $file_name );

			readfile( $export_file ); // phpcs:ignore
			exit;

		} catch ( \Exception $e ) {

			$error = $this->export->errors['common'] . '<br>' . $e->getMessage();
			if ( wpforms_debug() ) {
				$error .= '<br><b>WPFORMS DEBUG</b>: ' . $e->__toString();
			}

			\WPForms_Admin_Notice::error( $error );
		}
	}

	/**
	 * Garbage clearing.
	 * Actually we need to clear only temporary files
	 * because transients clears automagically.
	 *
	 * TODO: rewrite to use wp-cron or actions scheduler.
	 *
	 * @since 1.5.5
	 */
	public function remove_old_export_files() {

		if ( (bool) get_transient( 'wpforms_entries_export_tmpdata_cleared' ) ) {
			return;
		}

		$files = glob( $this->get_tmpdir() . '/*' );
		$now   = time();

		foreach ( $files as $file ) {
			if (
				is_file( $file ) &&
				( $now - filemtime( $file ) ) > $this->export->configuration['request_data_ttl']
			) {
				unlink( $file );
			}
		}

		set_transient( 'wpforms_entries_export_tmpdata_cleared', 'yes', HOUR_IN_SECONDS );
	}
}
