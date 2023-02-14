<?php

use WPForms\Pro\Admin\Entries\Helpers;

/**
 * Generate the table on the entries overview page.
 *
 * @since 1.0.0
 */
class WPForms_Entries_Table extends WP_List_Table {

	/**
	 * The ID of the table column called "Entry ID".
	 *
	 * @since 1.5.7
	 *
	 * @var int
	 */
	const COLUMN_ENTRY_ID = -1;

	/**
	 * The ID of the table column called "Entry Notes".
	 *
	 * @since 1.5.7
	 *
	 * @var int
	 */
	const COLUMN_NOTES_COUNT = -2;

	/**
	 * Number of entries to show per page.
	 *
	 * @since 1.0.0
	 *
	 * @var int
	 */
	public $per_page;

	/**
	 * Form data as an array.
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	public $form_data;

	/**
	 * Form id.
	 *
	 * @since 1.0.0
	 *
	 * @var string|integer
	 */
	public $form_id;

	/**
	 * Number of different entry types.
	 *
	 * @since 1.0.0
	 *
	 * @var int
	 */
	public $counts;

	/**
	 * Primary class constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {

		// Utilize the parent constructor to build the main class properties.
		parent::__construct(
			[
				'singular' => 'entry',
				'plural'   => 'entries',
				'ajax'     => false,
				'screen'   => 'entries',
			]
		);

		// Default number of forms to show per page.
		$this->per_page = wpforms()->entry->get_count_per_page();
	}

	/**
	 * Get the entry counts for various types of entries.
	 *
	 * @since 1.0.0
	 */
	public function get_counts() {

		$this->counts = [];

		$this->counts['total'] = wpforms()->entry->get_entries(
			[
				'form_id' => $this->form_id,
			],
			true
		);

		$this->counts['unread'] = wpforms()->entry->get_entries(
			[
				'form_id' => $this->form_id,
				'viewed'  => '0',
			],
			true
		);

		$this->counts['starred'] = wpforms()->entry->get_entries(
			[
				'form_id' => $this->form_id,
				'starred' => '1',
			],
			true
		);

		$this->counts = apply_filters( 'wpforms_entries_table_counts', $this->counts, $this->form_data );
	}

	/**
	 * Retrieve the view types.
	 *
	 * @since 1.1.6
	 */
	public function get_views() {

		$base = remove_query_arg( [ 'type', 'status', 'paged' ] );

		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		$current = isset( $_GET['type'] ) ? sanitize_key( wp_unslash( $_GET['type'] ) ) : '';
		$total   = '&nbsp;<span class="count">(<span class="total-num">' . $this->counts['total'] . '</span>)</span>';
		$unread  = '&nbsp;<span class="count">(<span class="unread-num">' . $this->counts['unread'] . '</span>)</span>';
		$starred = '&nbsp;<span class="count">(<span class="starred-num">' . $this->counts['starred'] . '</span>)</span>';
		$all     = empty( $_GET['status'] ) && ( $current === 'all' || empty( $current ) ) ? ' class="current"' : '';
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		$views = [
			'all'     => sprintf(
				'<a href="%s"%s>%s</a>',
				esc_url( $base ),
				$all,
				esc_html__( 'All', 'wpforms' ) . $total
			),
			'unread'  => sprintf(
				'<a href="%s"%s>%s</a>',
				esc_url( add_query_arg( 'type', 'unread', $base ) ),
				$current === 'unread' ? ' class="current"' : '',
				esc_html__( 'Unread', 'wpforms' ) . $unread
			),
			'starred' => sprintf(
				'<a href="%s"%s>%s</a>',
				esc_url( add_query_arg( 'type', 'starred', $base ) ),
				$current === 'starred' ? ' class="current"' : '',
				esc_html__( 'Starred', 'wpforms' ) . $starred
			),
		];

		return apply_filters( 'wpforms_entries_table_views', $views, $this->form_data, $this->counts );
	}

	/**
	 * Retrieve the table columns.
	 *
	 * @since 1.0.0
	 *
	 * @return array $columns Array of all the list table columns.
	 */
	public function get_columns() {

		$has_payments  = wpforms_has_payment( 'form', $this->form_data );
		$has_gateway   = wpforms_has_payment_gateway( $this->form_data );
		$field_columns = $has_payments ? 2 : 3;

		$columns               = [];
		$columns['cb']         = '<input type="checkbox" />';
		$columns['indicators'] = '';
		$columns               = $this->get_columns_form_fields( $columns, $field_columns );

		// Additional columns for forms that contain payments.
		if ( $has_payments && $has_gateway ) {
			$columns['payment_total'] = esc_html__( 'Total', 'wpforms' );
		}

		// Show the status column if the form contains payments or if the
		// filter is triggered by an addon.
		if ( $has_payments || apply_filters( 'wpforms_entries_table_column_status', false, $this->form_data ) ) {
			$columns['status'] = esc_html__( 'Status', 'wpforms' );
		}

		$columns['date'] = esc_html__( 'Date', 'wpforms' );

		$actions            = esc_html__( 'Actions', 'wpforms' );
		$actions           .= ' <a href="#" title="' . esc_attr__( 'Change columns to display', 'wpforms' ) . '" id="wpforms-entries-table-edit-columns"><i class="fa fa-cog" aria-hidden="true"></i></a>';
		$columns['actions'] = $actions;

		return apply_filters( 'wpforms_entries_table_columns', $columns, $this->form_data );
	}

	/**
	 * Retrieve the table's sortable columns.
	 *
	 * @since 1.2.6
	 * @since 1.5.7 Added an `Entry Notes` column.
	 *
	 * @return array Array of all the sortable columns
	 */
	public function get_sortable_columns() {

		$sortable = [
			'entry_id'      => [ 'id', false ],
			'notes_count'   => [ 'notes_count', false ],
			'id'            => [ 'title', false ],
			'date'          => [ 'date', false ],
			'status'        => [ 'status', false ],
			'payment_total' => [ 'payment_total', false ],
		];

		return apply_filters( 'wpforms_entries_table_sortable', $sortable, $this->form_data );
	}

	/**
	 * Get the list of fields, that are disallowed to be displayed as column in a table.
	 *
	 * @since 1.4.4
	 *
	 * @return array
	 */
	public static function get_columns_form_disallowed_fields() {

		/**
		 * Filter the list of the disallowed fields in the entries table.
		 *
		 * @since 1.4.4
		 *
		 * @param array $fields Field types list.
		 */
		return (array) apply_filters( 'wpforms_entries_table_fields_disallow', [ 'captcha', 'divider', 'entry-preview', 'html', 'pagebreak', 'layout' ] );
	}

	/**
	 * Logic to determine which fields are displayed in the table columns.
	 *
	 * @since 1.0.0
	 * @since 1.5.7 Added an `Entry Notes` column.
	 *
	 * @param array $columns List of columns.
	 * @param int   $display Number of columns to display.
	 *
	 * @return array
	 */
	public function get_columns_form_fields( $columns = [], $display = 3 ) {

		if ( empty( $this->form_data['fields'] ) ) {
			return [];
		}

		$entry_columns = wpforms()->form->get_meta( $this->form_id, 'entry_columns', [ 'cap' => 'view_entries_form_single' ] );

		/*
		 * Display those columns that were selected by a user.
		 */
		if ( $entry_columns ) {
			foreach ( $entry_columns as $id ) {

				// Check for special columns, like Entry ID.
				if ( self::COLUMN_ENTRY_ID === $id ) {
					$columns['entry_id'] = esc_html__( 'Entry ID', 'wpforms' );
					continue;
				}

				// Check for special columns, like Entry Notes.
				if ( self::COLUMN_NOTES_COUNT === $id ) {
					$columns['notes_count'] = esc_html__( 'Entry Notes', 'wpforms' );
					continue;
				}

				// Check to make sure the field has not been removed.
				if ( empty( $this->form_data['fields'][ $id ] ) ) {
					continue;
				}

				$columns[ 'wpforms_field_' . $id ] = isset( $this->form_data['fields'][ $id ]['label'] ) && ! wpforms_is_empty_string( trim( $this->form_data['fields'][ $id ]['label'] ) ) ? wp_strip_all_tags( $this->form_data['fields'][ $id ]['label'] ) : sprintf( /* translators: %d - field ID. */ __( 'Field #%d', 'wpforms' ), absint( $id ) );
			}
		} else {
			/*
			 * Display default number of first fields in a form.
			 */
			$x = 0;
			foreach ( $this->form_data['fields'] as $id => $field ) {
				if ( ! in_array( $field['type'], self::get_columns_form_disallowed_fields(), true ) && $x < $display ) {
					$columns[ 'wpforms_field_' . $id ] = isset( $field['label'] ) && ! wpforms_is_empty_string( trim( $field['label'] ) ) ? wp_strip_all_tags( $field['label'] ) : sprintf( /* translators: %d - field ID. */ __( 'Field #%d', 'wpforms' ), absint( $field['id'] ) );
					$x ++;
				}
			}
		}

		return $columns;
	}

	/**
	 * Render the checkbox column.
	 *
	 * @since 1.0.0
	 *
	 * @param object $entry Entry data from DB.
	 *
	 * @return string
	 */
	public function column_cb( $entry ) {
		return '<input type="checkbox" name="entry_id[]" value="' . absint( $entry->entry_id ) . '" />';
	}

	/**
	 * Show `status` value.
	 *
	 * @since 1.5.8
	 *
	 * @param object $entry       Current entry data.
	 * @param string $column_name Current column name.
	 *
	 * @return string
	 */
	public function column_status_field( $entry, $column_name ) {

		if ( 'payment' === $entry->type ) {
			// For payments, display dollar icon to easily indicate this
			// status is related to a payment.
			if ( ! empty( $entry->status ) ) {
				$value = ucwords( sanitize_text_field( $entry->status ) );
			} else {
				$value = esc_html__( 'Unknown', 'wpforms' );
			}
			$value .= ' <i class="fa fa-money" aria-hidden="true" style="color:green;font-size: 16px;margin-left:4px;" title="' . esc_html__( 'Payment', 'wpforms' ) . '"></i>';
		} else {
			if ( ! empty( $entry->status ) ) {
				$value = ucwords( sanitize_text_field( $entry->status ) );
			} else {
				$value = esc_html__( 'Completed', 'wpforms' );
			}
		}

		return $value;
	}

	/**
	 * Show `payment_total` value.
	 *
	 * @since 1.5.8
	 *
	 * @param object $entry       Current entry data.
	 * @param string $column_name Current column name.
	 *
	 * @return string
	 */
	public function column_payment_total_field( $entry, $column_name ) {

		$entry_meta = json_decode( $entry->meta, true );

		if ( 'payment' === $entry->type && isset( $entry_meta['payment_total'] ) ) {
			$amount = wpforms_sanitize_amount( $entry_meta['payment_total'], $entry_meta['payment_currency'] );
			$total  = wpforms_format_amount( $amount, true, $entry_meta['payment_currency'] );
			$value  = $total;

			if ( ! empty( $entry_meta['payment_subscription'] ) ) {
				$value .= ' <i class="fa fa-refresh" aria-hidden="true" style="color:#ccc;margin-left:4px;" title="' . esc_html__( 'Recurring', 'wpforms' ) . '"></i>';
			}
		} else {
			$value = '-';
		}

		return $value;
	}

	/**
	 * Show specific form fields.
	 *
	 * @since 1.0.0
	 *
	 * @param object $entry       Entry data from DB.
	 * @param string $column_name Column unique name.
	 *
	 * @return string
	 */
	public function column_form_field( $entry, $column_name ) {

		if ( strpos( $column_name, 'wpforms_field_' ) === false ) {
			return '';
		}

		$field_id     = (int) str_replace( 'wpforms_field_', '', $column_name );
		$entry_fields = (array) wpforms_decode( $entry->fields );

		if (
			isset( $entry_fields[ $field_id ]['value'] ) &&
			! wpforms_is_empty_string( $entry_fields[ $field_id ]['value'] )
		) {

			$field_type = isset( $entry_fields[ $field_id ]['type'] ) ? $entry_fields[ $field_id ]['type'] : '';

			$value = wp_strip_all_tags( trim( $entry_fields[ $field_id ]['value'] ) );
			$value = $this->truncate_long_value( $value, $field_type );
			$value = nl2br( $value );

			// phpcs:disable WPForms.PHP.ValidateHooks.InvalidHookName

			/** This filter is documented in src/SmartTags/SmartTag/FieldHtmlId.php.*/
			return apply_filters( 'wpforms_html_field_value', $value, $entry_fields[ $field_id ], $this->form_data, 'entry-table' );

			// phpcs:enable WPForms.PHP.ValidateHooks.InvalidHookName
		}

		return '-';
	}

	/**
	 * Render the columns.
	 *
	 * @since 1.0.0
	 * @since 1.5.7 Added an `Entry Notes` column.
	 *
	 * @param object $entry       Current entry data.
	 * @param string $column_name Current column name.
	 *
	 * @return string
	 */
	public function column_default( $entry, $column_name ) {

		$field_type = $this->get_field_type( $entry, $column_name );

		switch ( strtolower( $column_name ) ) {
			case 'entry_id':
			case 'id':
				$value = absint( $entry->entry_id );
				break;

			case 'notes_count':
				$value = absint( $entry->notes_count );
				break;

			case 'date':
				$value = wpforms_datetime_format( $entry->date, '', true );
				break;

			case 'status':
				$value = $this->column_status_field( $entry, $column_name );
				break;

			case 'payment_total':
				$value = $this->column_payment_total_field( $entry, $column_name );
				break;

			default:
				$value = $this->column_form_field( $entry, $column_name );
		}

		// Adds a wrapper with a field type in data attribute.
		if ( ! empty( $value ) && ! empty( $field_type ) ) {
			$value = sprintf( '<div data-field-type="%s">%s</div>', esc_attr( $field_type ), $value );
		}

		/**
		 * Allow filtering entry table column value.
		 *
		 * @since 1.0.0
		 * @since 1.7.0 Added Field type.
		 *
		 * @param string $value       Value.
		 * @param object $entry       Current entry data.
		 * @param string $column_name Current column name.
		 * @param string $field_type  Field type.
		 */
		return apply_filters( 'wpforms_entry_table_column_value', $value, $entry, $column_name, $field_type );
	}

	/**
	 * Retrieve a field type.
	 *
	 * @since 1.5.8
	 *
	 * @param object $entry       Current entry data.
	 * @param string $column_name Current column name.
	 *
	 * @return string
	 */
	public function get_field_type( $entry, $column_name ) {

		$field_id     = str_replace( 'wpforms_field_', '', $column_name );
		$entry_fields = wpforms_decode( $entry->fields );
		$field_type   = '';

		if (
			! empty( $entry_fields[ $field_id ] ) &&
			isset( $entry_fields[ $field_id ]['type'] ) &&
			! wpforms_is_empty_string( $entry_fields[ $field_id ]['type'] )
		) {
			$field_type = $entry_fields[ $field_id ]['type'];
		}

		return $field_type;
	}

	/**
	 * Render the indicators column.
	 *
	 * @since 1.1.6
	 *
	 * @param object $entry Entry data from DB.
	 *
	 * @return string
	 */
	public function column_indicators( $entry ) {

		// Stars.
		$star_action = ! empty( $entry->starred ) ? 'unstar' : 'star';
		$star_title  = ! empty( $entry->starred ) ? esc_html__( 'Unstar entry', 'wpforms' ) : esc_html__( 'Star entry', 'wpforms' );
		$star_icon   = '<a href="#" class="indicator-star ' . $star_action . '" data-id="' . absint( $entry->entry_id ) . '" data-form-id="' . absint( $entry->form_id ) . '" title="' . esc_attr( $star_title ) . '"><span class="dashicons dashicons-star-filled"></span></a>';

		// Viewed.
		$read_action = ! empty( $entry->viewed ) ? 'unread' : 'read';
		$read_title  = ! empty( $entry->viewed ) ? esc_html__( 'Mark entry unread', 'wpforms' ) : esc_html__( 'Mark entry read', 'wpforms' );
		$read_icon   = '<a href="#" class="indicator-read ' . $read_action . '" data-id="' . absint( $entry->entry_id ) . '" data-form-id="' . absint( $entry->form_id ) . '" title="' . esc_attr( $read_title ) . '"><span class="dashicons dashicons-marker"></span></a>';

		return $star_icon . $read_icon;
	}

	/**
	 * Render the actions column.
	 *
	 * @since 1.0.0
	 *
	 * @param object $entry Entry data from DB.
	 *
	 * @return string
	 */
	public function column_actions( $entry ) {

		$actions = [];

		// View.
		$actions[] = sprintf(
			'<a href="%s" title="%s" class="view">%s</a>',
			esc_url(
				add_query_arg(
					[
						'view'     => 'details',
						'entry_id' => $entry->entry_id,
					],
					admin_url( 'admin.php?page=wpforms-entries' )
				)
			),
			esc_attr__( 'View Form Entry', 'wpforms' ),
			esc_html__( 'View', 'wpforms' )
		);

		if (
			wpforms_current_user_can( 'edit_entries_form_single', $this->form_id ) &&
			wpforms()->get( 'entry' )->has_editable_fields( $entry )
		) {
			// Edit.
			$actions[] = sprintf(
				'<a href="%s" title="%s" class="edit">%s</a>',
				esc_url(
					add_query_arg(
						[
							'view'     => 'edit',
							'entry_id' => $entry->entry_id,
						],
						admin_url( 'admin.php?page=wpforms-entries' )
					)
				),
				esc_attr__( 'Edit Form Entry', 'wpforms' ),
				esc_html__( 'Edit', 'wpforms' )
			);
		}

		if ( wpforms_current_user_can( 'delete_entries_form_single', $this->form_id ) ) {
			// Delete.
			$actions[] = sprintf(
				'<a href="%s" title="%s" class="delete">%s</a>',
				esc_url(
					wp_nonce_url(
						add_query_arg(
							[
								'view'     => 'list',
								'action'   => 'delete',
								'form_id'  => $this->form_id,
								'entry_id' => $entry->entry_id,
							]
						),
						'bulk-entries'
					)
				),
				esc_attr__( 'Delete Form Entry', 'wpforms' ),
				esc_html__( 'Delete', 'wpforms' )
			);
		}

		return implode( ' <span class="sep">|</span> ', apply_filters( 'wpforms_entry_table_actions', $actions, $entry ) );
	}

	/**
	 * Extra controls to be displayed between bulk actions and pagination.
	 *
	 * @since 1.4.4
	 *
	 * @param string $which Either top or bottom of the page.
	 */
	protected function extra_tablenav( $which ) {

		if ( $which === 'bottom' ) {
			return;
		}
		?>

		<div class="alignleft actions wpforms-filter-date">

			<input type="text" name="date" class="regular-text wpforms-filter-date-selector"
				placeholder="<?php esc_attr_e( 'Select a date range', 'wpforms' ); ?>"
				style="cursor: pointer">

			<button type="submit" name="action" value="filter_date" class="button">
				<?php esc_html_e( 'Filter', 'wpforms' ); ?>
			</button>

		</div>

		<?php
	}

	/**
	 * Define bulk actions available for our table listing
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_bulk_actions() {

		return [
			'read'   => esc_html__( 'Mark Read', 'wpforms' ),
			'unread' => esc_html__( 'Mark Unread', 'wpforms' ),
			'star'   => esc_html__( 'Star', 'wpforms' ),
			'unstar' => esc_html__( 'Unstar', 'wpforms' ),
			'null'   => esc_html__( '----------', 'wpforms' ),
			'delete' => esc_html__( 'Delete', 'wpforms' ),
		];
	}

	/**
	 * Process the bulk actions
	 *
	 * @since 1.0.0
	 */
	public function process_bulk_actions() {

		if ( empty( $_REQUEST['_wpnonce'] ) ) {
			return;
		}

		if (
			! wp_verify_nonce( sanitize_key( $_REQUEST['_wpnonce'] ), 'bulk-entries' ) &&
			! wp_verify_nonce( sanitize_key( $_REQUEST['_wpnonce'] ), 'bulk-entries-nonce' )
		) {
			return;
		}

		$this->process_bulk_action_single();
		$this->display_bulk_action_message();
	}

	/**
	 * Process single bulk action.
	 *
	 * @since 1.5.7
	 */
	protected function process_bulk_action_single() {

		$doaction = $this->current_action();

		if ( empty( $doaction ) || $doaction === 'filter_date' ) {
			return;
		}

		$ids = isset( $_GET['entry_id'] ) ? wp_unslash( $_GET['entry_id'] ) : false; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

		if ( ! is_array( $ids ) ) {
			$ids = [ $ids ];
		}

		$ids = array_map( 'absint', $ids );

		if ( empty( $ids ) ) {
			return;
		}

		// Get entries, that would be affected.
		$entries_list = wpforms()->entry->get_entries(
			[
				'entry_id'    => $ids,
				'is_filtered' => true,
				'number'      => $this->get_items_per_page( 'wpforms_entries_per_page', $this->per_page ),
			]
		);

		$sendback = remove_query_arg( [ 'read', 'unread', 'starred', 'unstarred', 'deleted' ] );

		switch ( $doaction ) {
			// Mark as read.
			case 'read':
				$sendback = $this->process_bulk_action_single_read( $entries_list, $ids, $sendback );
				break;

			// Mark as unread.
			case 'unread':
				$sendback = $this->process_bulk_action_single_unread( $entries_list, $ids, $sendback );
				break;

			// Star entry.
			case 'star':
				$sendback = $this->process_bulk_action_single_star( $entries_list, $ids, $sendback );
				break;

			// Unstar entry.
			case 'unstar':
				$sendback = $this->process_bulk_action_single_unstar( $entries_list, $ids, $sendback );
				break;

			// Delete entries.
			case 'delete':
				$sendback = $this->process_bulk_action_single_delete( $ids, $sendback );
				break;
		}

		$sendback = remove_query_arg( [ 'action', 'action2', 'entry_id' ], $sendback );

		wp_safe_redirect( $sendback );
		exit();
	}

	/**
	 * Process the bulk action read.
	 *
	 * @since 1.5.7
	 *
	 * @param array  $entries_list Filtered entries list.
	 * @param array  $ids          IDs to process.
	 * @param string $sendback     URL query string.
	 *
	 * @return string
	 */
	protected function process_bulk_action_single_read( $entries_list, $ids, $sendback ) {

		$form_id = ! empty( $_GET['form_id'] ) ? absint( $_GET['form_id'] ) : false;

		if ( empty( $form_id ) ) {
			return $sendback;
		}

		$user_id = get_current_user_id();
		$entries = wp_list_pluck( $entries_list, 'viewed', 'entry_id' );
		$read    = 0;

		foreach ( $ids as $id ) {

			if ( ! array_key_exists( $id, $entries ) ) {
				continue;
			}

			if ( '1' === $entries[ $id ] ) {
				continue;
			}

			$success = wpforms()->entry->update(
				$id,
				[
					'viewed' => '1',
				]
			);

			if ( $success ) {

				wpforms()->entry_meta->add(
					[
						'entry_id' => $id,
						'form_id'  => $form_id,
						'user_id'  => $user_id,
						'type'     => 'log',
						'data'     => wpautop( sprintf( '<em>%s</em>', esc_html__( 'Entry read.', 'wpforms' ) ) ),
					],
					'entry_meta'
				);

				$read++;
			}
		}

		return add_query_arg( 'read', $read, $sendback );
	}

	/**
	 * Process the bulk action unread.
	 *
	 * @since 1.5.7
	 *
	 * @param array  $entries_list Filtered entries list.
	 * @param array  $ids          IDs to process.
	 * @param string $sendback     URL query string.
	 *
	 * @return string
	 */
	protected function process_bulk_action_single_unread( $entries_list, $ids, $sendback ) {

		$form_id = ! empty( $_GET['form_id'] ) ? absint( $_GET['form_id'] ) : false;

		if ( empty( $form_id ) ) {
			return $sendback;
		}

		$user_id = get_current_user_id();
		$entries = wp_list_pluck( $entries_list, 'viewed', 'entry_id' );
		$unread  = 0;

		foreach ( $ids as $id ) {

			if ( ! array_key_exists( $id, $entries ) ) {
				continue;
			}

			if ( '0' === $entries[ $id ] ) {
				continue;
			}

			$success = wpforms()->entry->update(
				$id,
				[
					'viewed' => '0',
				]
			);

			if ( $success ) {
				wpforms()->entry_meta->add(
					[
						'entry_id' => $id,
						'form_id'  => $form_id,
						'user_id'  => $user_id,
						'type'     => 'log',
						'data'     => wpautop( sprintf( '<em>%s</em>', esc_html__( 'Entry unread.', 'wpforms' ) ) ),
					],
					'entry_meta'
				);

				$unread++;
			}
		}

		return add_query_arg( 'unread', $unread, $sendback );
	}

	/**
	 * Process the bulk action star.
	 *
	 * @since 1.5.7
	 *
	 * @param array  $entries_list Filtered entries list.
	 * @param array  $ids          IDs to process.
	 * @param string $sendback     URL query string.
	 *
	 * @return string
	 */
	protected function process_bulk_action_single_star( $entries_list, $ids, $sendback ) {

		$form_id = ! empty( $_GET['form_id'] ) ? absint( $_GET['form_id'] ) : false;

		if ( empty( $form_id ) ) {
			return $sendback;
		}

		$user_id = get_current_user_id();
		$entries = wp_list_pluck( $entries_list, 'starred', 'entry_id' );
		$starred = 0;

		foreach ( $ids as $id ) {

			if ( ! array_key_exists( $id, $entries ) ) {
				continue;
			}

			if ( '1' === $entries[ $id ] ) {
				continue;
			}

			$success = wpforms()->entry->update(
				$id,
				[
					'starred' => '1',
				]
			);

			if ( $success ) {
				wpforms()->entry_meta->add(
					[
						'entry_id' => $id,
						'form_id'  => $form_id,
						'user_id'  => $user_id,
						'type'     => 'log',
						'data'     => wpautop( sprintf( '<em>%s</em>', esc_html__( 'Entry starred.', 'wpforms' ) ) ),
					],
					'entry_meta'
				);

				$starred++;
			}
		}

		return add_query_arg( 'starred', $starred, $sendback );
	}

	/**
	 * Process the bulk action unstar.
	 *
	 * @since 1.5.7
	 *
	 * @param array  $entries_list Filtered entries list.
	 * @param array  $ids          IDs to process.
	 * @param string $sendback     URL query string.
	 *
	 * @return string
	 */
	protected function process_bulk_action_single_unstar( $entries_list, $ids, $sendback ) {

		$form_id = ! empty( $_GET['form_id'] ) ? absint( $_GET['form_id'] ) : false;

		if ( empty( $form_id ) ) {
			return $sendback;
		}

		$user_id   = get_current_user_id();
		$entries   = wp_list_pluck( $entries_list, 'starred', 'entry_id' );
		$unstarred = 0;

		foreach ( $ids as $id ) {

			if ( ! array_key_exists( $id, $entries ) ) {
				continue;
			}

			if ( '0' === $entries[ $id ] ) {
				continue;
			}

			$success = wpforms()->entry->update(
				$id,
				[
					'starred' => '0',
				]
			);

			if ( $success ) {
				wpforms()->entry_meta->add(
					[
						'entry_id' => $id,
						'form_id'  => $form_id,
						'user_id'  => $user_id,
						'type'     => 'log',
						'data'     => wpautop( sprintf( '<em>%s</em>', esc_html__( 'Entry unstarred.', 'wpforms' ) ) ),
					],
					'entry_meta'
				);

				$unstarred++;
			}
		}

		return add_query_arg( 'unstarred', $unstarred, $sendback );
	}

	/**
	 * Process the bulk action delete.
	 *
	 * @since 1.5.7
	 *
	 * @param array  $ids      IDs to process.
	 * @param string $sendback URL query string.
	 *
	 * @return string
	 */
	protected function process_bulk_action_single_delete( $ids, $sendback ) {

		$deleted = 0;

		foreach ( $ids as $id ) {
			if ( wpforms()->entry->delete( $id ) ) {
				$deleted++;
			}
		}

		return add_query_arg( 'deleted', $deleted, $sendback );
	}

	/**
	 * Display bulk action result message.
	 *
	 * @since 1.5.7
	 */
	protected function display_bulk_action_message() {

		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		$bulk_counts = [
			'read'      => isset( $_REQUEST['read'] ) ? absint( $_REQUEST['read'] ) : 0,
			'unread'    => isset( $_REQUEST['unread'] ) ? absint( $_REQUEST['unread'] ) : 0,
			'starred'   => isset( $_REQUEST['starred'] ) ? absint( $_REQUEST['starred'] ) : 0,
			'unstarred' => isset( $_REQUEST['unstarred'] ) ? absint( $_REQUEST['unstarred'] ) : 0,
			'deleted'   => isset( $_REQUEST['deleted'] ) ? (int) $_REQUEST['deleted'] : 0,
		];
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		$bulk_messages = [
			/* translators: %d - number of processed entries. */
			'read'      => _n( '%d entry was successfully marked as read.', '%d entries were successfully marked as read.', $bulk_counts['read'] ),
			/* translators: %d - number of processed entries. */
			'unread'    => _n( '%d entry was successfully marked as unread.', '%d entries were successfully marked as unread.', $bulk_counts['unread'] ),
			/* translators: %d - number of processed entries. */
			'starred'   => _n( '%d entry was successfully starred.', '%d entries were successfully starred.', $bulk_counts['starred'] ),
			/* translators: %d - number of processed entries. */
			'unstarred' => _n( '%d entry was successfully unstarred.', '%d entries were successfully unstarred.', $bulk_counts['unstarred'] ),
			/* translators: %d - number of processed entries. */
			'deleted'   => _n( '%d entry was successfully deleted.', '%d entries were successfully deleted.', $bulk_counts['deleted'] ),
		];

		if ( $bulk_counts['deleted'] === -1 ) {
			$bulk_messages['deleted'] = esc_html__( 'All entries for the currently selected form were successfully deleted.', 'wpforms' );
		}

		// Leave only non-zero counts, so only those that were processed are left.
		$bulk_counts = array_filter( $bulk_counts );

		// If we have bulk messages to display.
		$messages = [];

		foreach ( $bulk_counts as $type => $count ) {
			if ( isset( $bulk_messages[ $type ] ) ) {
				$messages[] = sprintf( $bulk_messages[ $type ], $count );
			}
		}

		if ( $messages ) {
			\WPForms\Admin\Notice::success( implode( '<br>', array_map( 'esc_html', $messages ) ) );
		}
	}

	/**
	 * Message to be displayed when there are no entries.
	 *
	 * @since 1.0.0
	 */
	public function no_items() {

		esc_html_e( 'No entries found.', 'wpforms' );
	}

	/**
	 * Entries list form search.
	 *
	 * @since 1.4.4
	 *
	 * @param string $text     The 'submit' button label.
	 * @param string $input_id ID attribute value for the search input field.
	 */
	public function search_box( $text, $input_id ) {

		$input_id .= '-search-input';

		do_action( 'wpforms_entries_list_form_filters_before', $this->form_data );

		$filter_fields = [];

		if ( ! empty( $this->form_data['fields'] ) ) {
			foreach ( $this->form_data['fields'] as $id => $field ) {
				if ( in_array( $field['type'], self::get_columns_form_disallowed_fields(), true ) ) {
					continue;
				}
				$filter_fields[ $id ] = ! empty( $field['label'] ) ? wp_strip_all_tags( $field['label'] ) : esc_html__( 'Field', 'wpforms' );
			}
		}
		$filter_fields = (array) apply_filters( 'wpforms_entries_list_form_filters_search_fields', $filter_fields, $this );

		$cur_field = 'any';

		// phpcs:disable WordPress.Security.NonceVerification.Recommended

		if ( isset( $_GET['search']['field'] ) ) {
			if ( is_numeric( $_GET['search']['field'] ) ) {
				$cur_field = (int) $_GET['search']['field'];
			} else {
				$cur_field = sanitize_key( $_GET['search']['field'] );
			}
		}

		$advanced_options = Helpers::get_search_fields_advanced_options();

		$cur_comparison = ! empty( $_GET['search']['comparison'] ) ? sanitize_key( $_GET['search']['comparison'] ) : 'contains';

		$cur_term = '';

		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		if ( isset( $_GET['search']['term'] ) && ! wpforms_is_empty_string( $_GET['search']['term'] ) ) {
			$cur_term = sanitize_text_field( wp_unslash( $_GET['search']['term'] ) );
			$cur_term = empty( $cur_term ) ? htmlspecialchars( wp_unslash( $_GET['search']['term'] ) ) : $cur_term; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		}

		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		$this->search_box_output( $text, $input_id, $filter_fields, $advanced_options, $cur_field, $cur_comparison, $cur_term );

		/**
		 * Allows developers output some HTML after the filter forms on the entries list page.
		 *
		 * @since 1.4.4
		 *
		 * @param array $form_data Form data.
		 */
		do_action( 'wpforms_entries_list_form_filters_after', $this->form_data );
	}

	/**
	 * Entries list form search.
	 *
	 * @since 1.6.9
	 *
	 * @param string $text                    The 'submit' button label.
	 * @param string $input_id                ID attribute value for the search input field.
	 * @param array  $filter_fields           Filter fields options.
	 * @param array  $search_advanced_options Advanced options.
	 * @param mixed  $cur_field               Current (selected) field or advanced option.
	 * @param string $cur_comparison          Current comparison.
	 * @param string $cur_term                Current search term.
	 */
	private function search_box_output( $text, $input_id, $filter_fields, $search_advanced_options, $cur_field, $cur_comparison, $cur_term ) {

		?>
		<p class="search-box wpforms-form-search-box">

			<select name="search[field]" class="wpforms-form-search-box-field">
				<optgroup label="<?php esc_attr_e( 'Form fields', 'wpforms' ); ?>">
					<option value="any" <?php selected( 'any', $cur_field ); ?>><?php esc_html_e( 'Any form field', 'wpforms' ); ?></option>
					<?php
					if ( ! empty( $filter_fields ) ) {
						foreach ( $filter_fields as $id => $name ) {
							printf(
								'<option value="%1$s" %2$s>%3$s</option>',
								esc_attr( $id ),
								selected( $id, $cur_field, false ),
								esc_html( $name )
							);
						}
					}
					?>
				</optgroup>
				<?php if ( ! empty( $search_advanced_options ) ) : ?>
					<optgroup label="<?php esc_attr_e( 'Advanced Options', 'wpforms' ); ?>">
						<?php
						foreach ( $search_advanced_options as $val => $name ) {
							printf(
								'<option value="%1$s" %2$s>%3$s</option>',
								esc_attr( $val ),
								selected( $val, $cur_field, false ),
								esc_html( $name )
							);
						}
						?>
					</optgroup>
				<?php endif; // Advanced options group. ?>
			</select>

			<select name="search[comparison]" class="wpforms-form-search-box-comparison">
				<option value="contains" <?php selected( 'contains', $cur_comparison ); ?>>
					<?php esc_html_e( 'contains', 'wpforms' ); ?>
				</option>
				<option value="contains_not" <?php selected( 'contains_not', $cur_comparison ); ?>>
					<?php esc_html_e( 'does not contain', 'wpforms' ); ?>
				</option>
				<option value="is" <?php selected( 'is', $cur_comparison ); ?>>
					<?php esc_html_e( 'is', 'wpforms' ); ?>
				</option>
				<option value="is_not" <?php selected( 'is_not', $cur_comparison ); ?>>
					<?php esc_html_e( 'is not', 'wpforms' ); ?>
				</option>
			</select>

			<label class="screen-reader-text" for="<?php echo esc_attr( $input_id ); ?>">
				<?php echo esc_html( $text ); ?>:
			</label>
			<input type="search" name="search[term]" class="wpforms-form-search-box-term" value="<?php echo esc_attr( wp_unslash( $cur_term ) ); ?>" id="<?php echo esc_attr( $input_id ); ?>">

			<button type="submit" class="button"><?php echo esc_html( $text ); ?></button>
		</p>
		<?php
	}

	/**
	 * Fetch and setup the final data for the table.
	 *
	 * @since 1.0.0
	 * @since 1.5.7 Added an `Entry Notes` column support.
	 */
	public function prepare_items() { // phpcs:ignore Generic.Metrics.CyclomaticComplexity.TooHigh

		// Retrieve count.
		$this->get_counts();

		// Setup the columns.
		$columns = $this->get_columns();

		// Hidden columns (none).
		$hidden = [];

		// Define which columns can be sorted.
		$sortable = $this->get_sortable_columns();

		// Get a primary column. It's will be a 3-rd column.
		$primary = key( array_slice( $columns, 2, 1 ) );

		// Set column headers.
		$this->_column_headers = [ $columns, $hidden, $sortable, $primary ];

		// Get entries.
		$total_items = $this->counts['total'];
		$page        = $this->get_pagenum();
		$order       = isset( $_GET['order'] ) ? sanitize_key( $_GET['order'] ) : 'DESC';
		$orderby     = isset( $_GET['orderby'] ) ? sanitize_key( $_GET['orderby'] ) : 'entry_id';
		$per_page    = $this->get_items_per_page( 'wpforms_entries_per_page', $this->per_page );
		$data_args   = [
			'form_id' => $this->form_id,
			'number'  => $per_page,
			'offset'  => $per_page * ( $page - 1 ),
			'order'   => $order,
			'orderby' => $orderby,
		];

		if ( ! empty( $_GET['type'] ) && $_GET['type'] === 'starred' ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$data_args['starred'] = '1';
			$total_items          = $this->counts['starred'];
		}
		if ( ! empty( $_GET['type'] ) && $_GET['type'] === 'unread' ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$data_args['viewed'] = '0';
			$total_items         = $this->counts['unread'];
		}
		if ( ! empty( $_GET['status'] ) ) {
			$data_args['status'] = sanitize_text_field( $_GET['status'] ); // phpcs:ignore WordPress.Security
			$total_items         = ! empty( $this->counts[ $data_args['status'] ] ) ? $this->counts[ $data_args['status'] ] : 0;
		}

		if ( array_key_exists( 'notes_count', $columns ) ) {
			$data_args['notes_count'] = true;
		}

		$data_args = apply_filters( 'wpforms_entry_table_args', $data_args );
		$data      = wpforms()->get( 'entry' )->get_entries( $data_args );

		// Giddy up.
		$this->items = $data;

		// Finalize pagination.
		$this->set_pagination_args(
			[
				'total_items' => $total_items,
				'total_pages' => ceil( $total_items / $per_page ),
				'per_page'    => $per_page,
			]
		);
	}

	/**
	 * Sort by payment total.
	 *
	 * @since 1.2.6
	 * @deprecated 1.7.6
	 *
	 * @param object $a First entry to sort.
	 * @param object $b Second entry to sort.
	 *
	 * @return int
	 * @noinspection PhpUnused
	 */
	public function payment_total_sort( $a, $b ) {

		_deprecated_function( __METHOD__, '1.7.6 of the WPForms plugin' );

		$a_meta  = json_decode( $a->meta, true );
		$a_total = ! empty( $a_meta['payment_total'] ) ? wpforms_sanitize_amount( $a_meta['payment_total'] ) : 0;
		$b_meta  = json_decode( $b->meta, true );
		$b_total = ! empty( $b_meta['payment_total'] ) ? wpforms_sanitize_amount( $b_meta['payment_total'] ) : 0;

		if ( (float) $a_total === (float) $b_total ) {
			return 0;
		}

		return ( $a_total < $b_total ) ? - 1 : 1;
	}

	/**
	 * Extending the `display_rows()` method in order to add hooks.
	 *
	 * @since 1.5.6
	 */
	public function display_rows() {

		do_action( 'wpforms_admin_entries_before_rows', $this );

		parent::display_rows();

		do_action( 'wpforms_admin_entries_after_rows', $this );
	}

	/**
	 * Truncate long text value to X lines and Y characters.
	 *
	 * @since 1.7.6
	 *
	 * @param string $value      The value to truncate, if needed.
	 * @param string $field_type Field type.
	 *
	 * @return string
	 */
	private function truncate_long_value( $value, $field_type ) {

		// Limit multiline text to 4 lines, 5 for Address field, and overall length to 75 characters.
		$lines_limit = $field_type === 'address' ? 5 : 4;
		$chars_limit = 75;

		$lines = preg_split( '/\r\n|\r|\n/', $value );
		$value = array_slice( $lines, 0, $lines_limit );
		$value = implode( PHP_EOL, $value );

		if ( strlen( $value ) > $chars_limit ) {
			return mb_substr( $value, 0, $chars_limit ) . '&hellip;';
		}

		// Ellipsis should be on a new line if the value is multiline, and extra lines were truncated.
		if ( count( $lines ) > $lines_limit ) {
			return $value . PHP_EOL . '&hellip;';
		}

		return $value;
	}
}
