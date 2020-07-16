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

		if ( empty( $export_file ) ) {
			return;
		}

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

		$upload_dir  = wpforms_upload_dir();
		$upload_path = $upload_dir['path'];

		$export_path = trailingslashit( $upload_path ) . 'export';
		if ( ! file_exists( $export_path ) ) {
			wp_mkdir_p( $export_path );
		}

		// Check if the .htaccess exists in the upload directory, if not - create it.
		wpforms_create_upload_dir_htaccess_file();

		// Check if the index.html exists in the directories, if not - create it.
		wpforms_create_index_html_file( $upload_path );
		wpforms_create_index_html_file( $export_path );

		// Normalize slashes for Windows.
		$export_path = wp_normalize_path( $export_path );

		return $export_path;
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

		if ( empty( $request_data ) ) {
			return '';
		}

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
	 * Output the file.
	 *
	 * @since 1.6.0.2
	 *
	 * @param array $request_data Request data.
	 *
	 * @throws \Exception In case of file error.
	 */
	public function output_file( $request_data ) {

		$export_file = $this->get_tmpfname( $request_data );

		if ( empty( $export_file ) ) {
			throw new \Exception( $this->export->errors['unknown_request'] );
		}

		clearstatcache( true, $export_file );

		if ( ! is_readable( $export_file ) || is_dir( $export_file ) ) {
			throw new \Exception( $this->export->errors['file_not_readable'] );
		}

		if ( @filesize( $export_file ) === 0 ) { //phpcs:ignore
			throw new \Exception( $this->export->errors['file_empty'] );
		}

		$entry_suffix = ! empty( $request_data['db_args']['entry_id'] ) ? '-entry-' . $request_data['db_args']['entry_id'] : '';

		$file_name = 'wpforms-' . $request_data['db_args']['form_id'] . '-' . sanitize_file_name( get_the_title( $request_data['db_args']['form_id'] ) ) . $entry_suffix . '-' . current_time( 'Y-m-d-H-i-s' ) . '.csv';
		$this->http_headers( $file_name );

		readfile( $export_file ); // phpcs:ignore

		exit;
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

			$this->output_file( $request_data );

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

			$this->output_file( $request_data );

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
