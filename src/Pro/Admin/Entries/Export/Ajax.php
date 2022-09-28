<?php

namespace WPForms\Pro\Admin\Entries\Export;

use WPForms\Pro\Helpers\CSV;
use WPForms\Helpers\Transient;
use WPForms\Pro\Admin\Entries;

/**
 * Ajax endpoints and data processing.
 *
 * @since 1.5.5
 */
class Ajax {

	use Entries\FilterSearch;

	/**
	 * Instance of Export Class.
	 *
	 * @since 1.5.5
	 *
	 * @var Export
	 */
	protected $export;

	/**
	 * CSV helper class instance.
	 *
	 * @since 1.7.7
	 *
	 * @var CSV
	 */
	private $csv;

	/**
	 * Request data.
	 *
	 * @since 1.5.5
	 *
	 * @var array
	 */
	public $request_data;

	/**
	 * Constructor.
	 *
	 * @since 1.5.5
	 *
	 * @param Export $export Instance of Export.
	 */
	public function __construct( $export ) {

		$this->export = $export;
		$this->csv    = new CSV();

		$this->hooks();
	}

	/**
	 * Register hooks.
	 *
	 * @since 1.5.5
	 */
	public function hooks() {

		add_action( 'wp_ajax_wpforms_tools_entries_export_form_data', [ $this, 'ajax_form_data' ] );
		add_action( 'wp_ajax_wpforms_tools_entries_export_step', [ $this, 'ajax_export_step' ] );
	}

	/**
	 * Ajax endpoint. Send form fields.
	 *
	 * @since 1.5.5
	 *
	 * @throws \Exception Try-catch.
	 */
	public function ajax_form_data() {

		try {

			// Run a security check.
			if ( ! check_ajax_referer( 'wpforms-tools-entries-export-nonce', 'nonce', false ) ) {
				throw new \Exception( $this->export->errors['security'] );
			}

			if ( empty( $this->export->data['form_data'] ) ) {
				throw new \Exception( $this->export->errors['form_data'] );
			}

			$fields = empty( $this->export->data['form_data']['fields'] ) ? [] : (array) $this->export->data['form_data']['fields'];

			$fields = array_map(
				static function ( $field ) {
					/* translators: %d - Field ID. */
					$field['label'] = ! empty( $field['label'] ) ? trim( wp_strip_all_tags( $field['label'] ) ) : sprintf( esc_html__( 'Field #%d', 'wpforms' ), (int) $field['id'] );
					return $field;
				},
				$fields
			);

			wp_send_json_success(
				[
					'fields' => $this->exclude_disallowed_fields( $fields ),
				]
			);

		} catch ( \Exception $e ) {

			$error = $this->export->errors['common'] . '<br>' . $e->getMessage();

			if ( wpforms_debug() ) {
				$error .= '<br><b>WPFORMS DEBUG</b>: ' . $e->__toString();
			}

			wp_send_json_error( [ 'error' => $error ] );
		}
	}

	/**
	 * Exclude disallowed fields from fields array.
	 *
	 * @since 1.6.6
	 *
	 * @param array $fields Fields array.
	 *
	 * @return array
	 */
	private function exclude_disallowed_fields( $fields ) {

		$disallowed_fields = $this->export->configuration['disallowed_fields'];

		return array_filter(
			array_values( $fields ),
			static function ( $v ) use ( $disallowed_fields ) {

				return isset( $v['type'] ) && ! in_array( $v['type'], $disallowed_fields, true );
			}
		);
	}

	/**
	 * Ajax endpoint. Entries export processing.
	 *
	 * @since 1.5.5
	 *
	 * @throws \Exception Try-catch.
	 */
	public function ajax_export_step() {// phpcs:ignore Generic.Metrics.CyclomaticComplexity.TooHigh

		try {

			// Init arguments.
			$this->export->init_args( 'POST' );
			$args = $this->export->data['post_args'];

			// Security checks.
			if (
				! check_ajax_referer( 'wpforms-tools-entries-export-nonce', 'nonce', false ) ||
				empty( $args['nonce'] ) ||
				empty( $args['action'] ) ||
				! wpforms_current_user_can( 'view_entries' )
			) {
				throw new \Exception( $this->export->errors['security'] );
			}

			// Check for form_id at the first step.
			if ( empty( $args['form_id'] ) && empty( $args['request_id'] ) ) {
				throw new \Exception( $this->export->errors['unknown_form_id'] );
			}

			// Unlimited execution time.
			wpforms_set_time_limit();

			// Apply search by fields and advanced options.
			$this->process_filter_search();

			$this->request_data = $this->get_request_data( $args );

			if ( empty( $this->request_data ) ) {
				throw new \Exception( $this->export->errors['unknown_request'] );
			}

			if ( $this->request_data['type'] === 'xlsx' ) {
				// Write to the .xlsx file.
				$this->export->file->write_xlsx( $this->request_data );
			} else {
				// Writing to the .csv file.
				$this->export->file->write_csv( $this->request_data );
			}

			// Prepare response.
			$response = $this->get_response_data();

			// Store request data.
			Transient::set( 'wpforms-tools-entries-export-request-' . $this->request_data['request_id'], $this->request_data, $this->export->configuration['request_data_ttl'] );

			wp_send_json_success( $response );

		} catch ( \Exception $e ) {

			$error = $this->export->errors['common'] . '<br>' . $e->getMessage();

			if ( wpforms_debug() ) {
				$error .= '<br><b>WPFORMS DEBUG</b>: ' . $e->__toString();
			}
			wp_send_json_error( [ 'error' => $error ] );

		}
	}

	/**
	 * Get request data at first step.
	 *
	 * @since 1.5.5
	 *
	 * @param array $args Arguments array.
	 *
	 * @return array Request data.
	 */
	public function get_request_data( $args ) {

		// Prepare arguments.
		$db_args = [
			'number'      => 0,
			'offset'      => 0,
			'form_id'     => $args['form_id'],
			'entry_id'    => $args['entry_id'],
			'is_filtered' => ! empty( $args['entry_id'] ),
			'date'        => $args['dates'],
			'select'      => 'entry_ids',
		];

		if ( $args['search']['term'] !== '' ) {
			$db_args['value']         = $args['search']['term'];
			$db_args['value_compare'] = $args['search']['comparison'];
			$db_args['field_id']      = $args['search']['field'];
		}

		$db_args['select'] = 'entry_ids';

		// Count total entries.
		$count = wpforms()->get( 'entry' )->get_entries( $db_args, true );

		// Retrieve form data.
		$form_data = wpforms()->get( 'form' )->get(
			$args['form_id'],
			[
				'content_only' => true,
			]
		);

		// Prepare get entries args for further steps.
		unset( $db_args['select'] );
		$db_args['number'] = $this->export->configuration['entries_per_step'];

		$form_data['fields'] = empty( $form_data['fields'] ) ? [] : (array) $form_data['fields'];

		// Prepare `request data` for saving.
		$request_data = [
			'request_id'      => md5( wp_json_encode( $db_args ) . microtime() ),
			'form_data'       => $form_data,
			'db_args'         => $db_args,
			'fields'          => empty( $args['entry_id'] ) ? $args['fields'] : wp_list_pluck( $this->exclude_disallowed_fields( $form_data['fields'] ), 'id' ),
			'additional_info' => empty( $args['entry_id'] ) ? $args['additional_info'] : array_keys( $this->export->additional_info_fields ),
			'count'           => $count,
			'total_steps'     => (int) ceil( $count / $this->export->configuration['entries_per_step'] ),
			'type'            => ! empty( $args['export_options'] ) ? $args['export_options'][0] : 'csv',
		];

		$request_data['columns_row'] = $this->get_csv_cols( $request_data );

		return $request_data;
	}

	/**
	 * Get response data.
	 *
	 * @since 1.5.5
	 *
	 * @return array Export data.
	 */
	protected function get_response_data() {

		return [
			'request_id' => $this->request_data['request_id'],
			'count'      => $this->request_data['count'],
		];

	}

	/**
	 * Get CSV columns row.
	 *
	 * @since 1.5.5
	 *
	 * @param array $request_data Request data array.
	 *
	 * @return array CSV columns (first row).
	 */
	public function get_csv_cols( $request_data ) {

		$columns_row = [];

		if ( ! empty( $request_data['form_data']['fields'] ) ) {
			$fields = array_map(
				static function ( $field ) {
					/* translators: %d - Field ID. */
					$field['label'] = ! empty( $field['label'] ) ? trim( wp_strip_all_tags( $field['label'] ) ) : sprintf( esc_html__( 'Field #%d', 'wpforms' ), (int) $field['id'] );

					return $field;
				},
				$request_data['form_data']['fields']
			);

			$columns_labels = wp_list_pluck( $fields, 'label', 'id' );

			foreach ( $request_data['fields'] as $field_id ) {
				if ( ! isset( $columns_labels[ $field_id ] ) ) {
					continue;
				}
				$columns_row[ $field_id ] = $columns_labels[ $field_id ];
			}
		} else {
			$fields = [];
		}
		if ( ! empty( $request_data['additional_info'] ) ) {
			foreach ( $request_data['additional_info'] as $field_id ) {
				if ( $field_id === 'del_fields' ) {
					$columns_row = $columns_row + $this->get_deleted_fields_columns( $fields, $request_data );
				} else {
					$columns_row[ $field_id ] = $this->export->additional_info_fields[ $field_id ];
				}
			}
		}

		$columns_row = apply_filters_deprecated(
			'wpforms_export_get_csv_cols',
			[ $columns_row, ! empty( $request_data['db_args']['entry_id'] ) ? (int) $request_data['db_args']['entry_id'] : 'all' ],
			'1.5.5 of the WPForms plugin',
			'wpforms_pro_admin_entries_export_ajax_get_csv_cols'
		);

		return apply_filters( 'wpforms_pro_admin_entries_export_ajax_get_csv_cols', $columns_row, $request_data );
	}

	/**
	 * Get single entry data.
	 *
	 * @since 1.6.5
	 *
	 * @param array $entries Entries.
	 *
	 * @return \Generator
	 */
	public function get_entry_data( $entries ) {

		$no_fields  = empty( $this->request_data['form_data']['fields'] );
		$del_fields = in_array( 'del_fields', $this->request_data['additional_info'], true );

		// Prepare entries data.
		foreach ( $entries as $entry ) {

			$fields = $this->get_entry_fields_data( $entry );
			$row    = [];

			foreach ( $this->request_data['columns_row'] as $col_id => $col_label ) {

				if ( is_numeric( $col_id ) ) {
					$row[ $col_id ] = isset( $fields[ $col_id ]['value'] ) ? $fields[ $col_id ]['value'] : '';
				} elseif ( strpos( $col_id, 'del_field_' ) !== false ) {
					$f_id           = str_replace( 'del_field_', '', $col_id );
					$row[ $col_id ] = isset( $fields[ $f_id ]['value'] ) ? $fields[ $f_id ]['value'] : '';
				} else {
					$row[ $col_id ] = $this->get_additional_info_value( $col_id, $entry, $this->request_data['form_data'] );
				}

				$row[ $col_id ] = $this->csv->escape_value( $row[ $col_id ] );
			}

			if ( $no_fields && ! $del_fields ) {
				continue;
			}

			$export_data = apply_filters_deprecated(
				'wpforms_export_get_data',
				[ [ $entry->entry_id => $row ], ! empty( $this->request_data['db_args']['entry_id'] ) ? (int) $this->request_data['db_args']['entry_id'] : 'all' ],
				'1.5.5 of the WPForms plugin',
				'wpforms_pro_admin_entries_export_get_entry_data'
			);

			$export_data = apply_filters_deprecated(
				'wpforms_pro_admin_entries_export_ajax_get_data',
				[ $export_data, $this->request_data ],
				'1.6.5 of the WPForms plugin',
				'wpforms_pro_admin_entries_export_get_entry_data'
			);

			yield apply_filters( 'wpforms_pro_admin_entries_export_ajax_get_entry_data', $export_data[ $entry->entry_id ], $this->request_data );
		}
	}

	/**
	 * Get value of additional information column.
	 *
	 * @since 1.5.5
	 * @since 1.5.9 Added $form_data parameter and Payment Status data processing.
	 *
	 * @param string $col_id    Column id.
	 * @param object $entry     Entry object.
	 * @param array  $form_data Form data.
	 *
	 * @return string
	 */
	public function get_additional_info_value( $col_id, $entry, $form_data = [] ) {

		$entry = (array) $entry;

		switch ( $col_id ) {
			case 'date':
				$val = date_i18n( $this->date_format(), strtotime( $entry['date'] ) + $this->gmt_offset_sec() );
				break;

			case 'notes':
				$val = $this->get_additional_info_notes_value( $entry );
				break;

			case 'status':
				$val = $this->get_additional_info_status_value( $entry );
				break;

			case 'geodata':
				$val = $this->get_additional_info_geodata_value( $entry );
				break;

			case 'pstatus':
				$val = wpforms_has_payment( 'form', $form_data ) ? $this->get_additional_info_pstatus_value( $entry ) : '';
				break;

			case 'pginfo':
				$val = wpforms_has_payment( 'form', $form_data ) ? $this->get_additional_info_pginfo_value( $entry ) : '';
				break;

			case 'viewed':
			case 'starred':
				$val = (bool) $entry[ $col_id ] ? esc_html__( 'Yes', 'wpforms' ) : esc_html__( 'No', 'wpforms' );
				break;

			default:
				$val = $entry[ $col_id ];
		}

		/**
		 * Modify value of additional information column.
		 *
		 * @since 1.5.5
		 *
		 * @param string $val    The value.
		 * @param string $col_id Column id.
		 * @param object $entry  Entry object.
		 */
		return apply_filters( 'wpforms_pro_admin_entries_export_ajax_get_additional_info_value', $val, $col_id, $entry );
	}

	/**
	 * Get value of additional information notes.
	 *
	 * @since 1.5.5
	 *
	 * @param array $entry Entry data.
	 *
	 * @return string
	 */
	public function get_additional_info_notes_value( $entry ) {

		$entry_notes = wpforms()->entry_meta->get_meta(
			[
				'entry_id' => $entry['entry_id'],
				'type'     => 'note',
			]
		);

		$val = '';

		if ( empty( $entry_notes ) ) {
			return $val;
		}

		$val = array_reduce(
			$entry_notes,
			function ( $carry, $item ) {

				$item = (array) $item;

				$author       = get_userdata( $item['user_id'] );
				$author_name  = ! empty( $author->first_name ) ? $author->first_name : $author->user_login;
				$author_name .= ! empty( $author->last_name ) ? ' ' . $author->last_name : '';

				$carry .= date_i18n( $this->date_format(), strtotime( $item['date'] ) + $this->gmt_offset_sec() ) . ', ';
				$carry .= $author_name . ': ';
				$carry .= wp_strip_all_tags( $item['data'] ) . "\n";

				return $carry;
			},
			$val
		);

		return $val;
	}

	/**
	 * Get value of entry status (Additional Information).
	 *
	 * @since 1.7.3
	 *
	 * @param array $entry Entry data.
	 *
	 * @return string
	 */
	public function get_additional_info_status_value( $entry ) {

		return in_array( $entry['status'], [ 'partial', 'abandoned' ], true ) ? ucwords( sanitize_text_field( $entry['status'] ) ) : esc_html__( 'Completed', 'wpforms' );
	}

	/**
	 * Get value of additional information geodata.
	 *
	 * @since 1.5.5
	 *
	 * @param array $entry Entry data.
	 *
	 * @return string
	 */
	public function get_additional_info_geodata_value( $entry ) {

		$location = wpforms()->entry_meta->get_meta(
			[
				'entry_id' => $entry['entry_id'],
				'type'     => 'location',
				'number'   => 1,
			]
		);

		$val = '';

		if ( empty( $location[0]->data ) ) {
			return $val;
		}

		$location = json_decode( $location[0]->data, true );
		$loc_ary  = [];

		$map_query_args = [];

		$loc = '';

		if ( ! empty( $location['city'] ) ) {
			$map_query_args['q'] = $location['city'];
			$loc                 = $location['city'];
		}

		if ( ! empty( $location['region'] ) ) {
			if ( ! isset( $map_query_args['q'] ) ) {
				$map_query_args['q'] = '';
			}
			$map_query_args['q'] .= empty( $map_query_args['q'] ) ? $location['region'] : ',' . $location['region'];
			$loc                 .= empty( $loc ) ? $location['region'] : ', ' . $location['region'];
		}

		if ( ! empty( $location['latitude'] ) && ! empty( $location['longitude'] ) ) {
			if ( ! isset( $map_query_args['ll'] ) ) {
				$map_query_args['ll'] = '';
			}
			$map_query_args['ll'] .= $location['latitude'] . ',' . $location['longitude'];
			$loc_ary['latlong']    = [
				'label' => esc_html__( 'Lat/Long', 'wpforms' ),
				'val'   => $location['latitude'] . ', ' . $location['longitude'],
			];
		}

		if ( ! empty( $map_query_args ) ) {
			$map_query_args['z']      = apply_filters( 'wpforms_geolocation_map_zoom', '6' );
			$map_query_args['output'] = 'embed';

			$map = add_query_arg( $map_query_args, 'https://maps.google.com/maps' );

			$loc_ary['map'] = [
				'label' => esc_html__( 'Map', 'wpforms' ),
				'val'   => $map,
			];
		}

		if ( ! empty( $loc ) ) {
			$loc_ary['loc'] = [
				'label' => esc_html__( 'Location', 'wpforms' ),
				'val'   => $loc,
			];
		}

		if ( ! empty( $location['postal'] ) ) {
			$loc_ary['zip'] = [];

			if ( ! empty( $location['country'] ) && $location['country'] === 'US' ) {
				$loc_ary['zip']['label'] = esc_html__( 'Zipcode', 'wpforms' );
			} else {
				$loc_ary['zip']['label'] = esc_html__( 'Postal', 'wpforms' );
			}
			$loc_ary['zip']['val'] = $location['postal'];
		}

		if ( ! empty( $location['country'] ) ) {
			$loc_ary['country'] = [
				'label' => esc_html__( 'Country', 'wpforms' ),
				'val'   => $location['country'],
			];
		}

		$val = array_reduce(
			$loc_ary,
			function ( $carry, $item ) {

				$item   = (array) $item;
				$carry .= $item['label'] . ': ' . $item['val'] . "\n";

				return $carry;
			},
			$val
		);

		return $val;
	}

	/**
	 * Get the value of additional payment status information.
	 *
	 * @since 1.5.9
	 *
	 * @param array $entry Entry array.
	 *
	 * @return string
	 */
	public function get_additional_info_pstatus_value( $entry ) {

		if ( $entry['type'] !== 'payment' ) {
			return '';
		}

		if ( ! empty( $entry['status'] ) ) {
			$val = ucwords( sanitize_text_field( $entry['status'] ) );
		} else {
			$val = esc_html__( 'Unknown', 'wpforms' );
		}

		return $val;
	}

	/**
	 * Get value of additional payment gateway information.
	 *
	 * @since 1.5.5
	 *
	 * @param array $entry Entry array.
	 *
	 * @return string
	 */
	public function get_additional_info_pginfo_value( $entry ) {

		$payment = wpforms()->entry_meta->get_meta(
			[
				'entry_id' => $entry['entry_id'],
				'type'     => 'payment',
				'number'   => 1,
			]
		);

		$val = '';

		if ( empty( $payment[0]->data ) ) {
			if ( empty( $entry['meta'] ) ) {
				return $val;
			}
			$payment = json_decode( $entry['meta'], true );
		} else {
			$payment = json_decode( $payment[0]->data, true );
		}

		$pginfo_labels = [
			'payment_type'         => esc_html__( 'Payment gateway', 'wpforms' ),
			'payment_recipient'    => esc_html__( 'Recipient', 'wpforms' ),
			'payment_transaction'  => esc_html__( 'Transaction', 'wpforms' ),
			'payment_total'        => esc_html__( 'Total', 'wpforms' ),
			'payment_currency'     => esc_html__( 'Currency', 'wpforms' ),
			'payment_mode'         => esc_html__( 'Mode', 'wpforms' ),
			'payment_subscription' => esc_html__( 'Subscription', 'wpforms' ),
			'payment_customer'     => esc_html__( 'Customer', 'wpforms' ),
			'payment_period'       => esc_html__( 'Period', 'wpforms' ),
		];

		$val = '';

		array_walk(
			$payment,
			static function( $item, $key ) use ( $pginfo_labels, &$val ) {
				if ( strpos( $key, 'payment_' ) === false ) {
					return;
				}
				$val .= ! empty( $pginfo_labels[ $key ] ) ? $pginfo_labels[ $key ] . ': ' : '';
				$val .= $item . "\n";
			}
		);

		return $val;
	}

	/**
	 * Get deleted fields columns.
	 *
	 * @since 1.5.5
	 *
	 * @param array $existing_fields Existing fields array.
	 * @param array $request_data    Request data array.
	 *
	 * @return array Deleted fields columns
	 */
	public function get_deleted_fields_columns( $existing_fields, $request_data ) {

		global $wpdb;

		$table_name = wpforms()->entry_fields->table_name;

		$sql = $wpdb->prepare(
			"SELECT DISTINCT field_id FROM `{$table_name}` WHERE `form_id` = %d AND `field_id` NOT IN ( " . implode( ',', wp_list_pluck( $existing_fields, 'id' ) ) . " )", // phpcs:ignore
			(int) $request_data['db_args']['form_id']
		);

		$deleted_fields_columns = [];
		$db_result              = $wpdb->get_col( $sql ); // phpcs:ignore

		foreach ( $db_result as $id ) {
			/* translators: %d - deleted field ID. */
			$deleted_fields_columns[ 'del_field_' . $id ] = sprintf( esc_html__( 'Deleted field #%d', 'wpforms' ), (int) $id );
		}

		return $deleted_fields_columns;
	}

	/**
	 * Get entry fields data.
	 *
	 * @since 1.5.5
	 *
	 * @param object $entry Entry data.
	 *
	 * @return array Fields data by ID.
	 */
	public function get_entry_fields_data( $entry ) {

		$fields_by_id = [];

		if ( empty( $entry->fields ) ) {
			return $fields_by_id;
		}

		$fields = json_decode( $entry->fields, true );

		if ( empty( $fields ) ) {
			return $fields_by_id;
		}

		foreach ( $fields as $field ) {

			if ( ! isset( $field['id'] ) ) {
				continue;
			}

			$fields_by_id[ $field['id'] ] = $field;
		}

		return $fields_by_id;
	}

	/**
	 * Get date format.
	 *
	 * @since 1.5.5
	 */
	public function date_format() {

		$this->export->data['date_format'] = empty( $this->export->data['date_format'] ) ? sprintf( '%s %s', get_option( 'date_format' ), get_option( 'time_format' ) ) : $this->export->data['date_format'];

		return $this->export->data['date_format'];
	}

	/**
	 * Get GMT offset in seconds.
	 *
	 * @since 1.5.5
	 */
	public function gmt_offset_sec() {

		$this->export->data['gmt_offset_sec'] = empty( $this->export->data['gmt_offset_sec'] ) ? get_option( 'gmt_offset' ) * 3600 : $this->export->data['gmt_offset_sec'];

		return $this->export->data['gmt_offset_sec'];
	}
}
