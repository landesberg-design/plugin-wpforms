<?php

/**
 * Generates the table on the entries overview page.
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
			array(
				'singular' => 'entry',
				'plural'   => 'entries',
				'ajax'     => false,
			)
		);

		// Default number of forms to show per page.
		$this->per_page = apply_filters( 'wpforms_entries_per_page', 30 );
	}

	/**
	 * Get the entry counts for various types of entries.
	 *
	 * @since 1.0.0
	 */
	public function get_counts() {

		$this->counts = array();

		$this->counts['total'] = wpforms()->entry->get_entries(
			array(
				'form_id' => $this->form_id,
			),
			true
		);

		$this->counts['unread'] = wpforms()->entry->get_entries(
			array(
				'form_id' => $this->form_id,
				'viewed'  => '0',
			),
			true
		);

		$this->counts['starred'] = wpforms()->entry->get_entries(
			array(
				'form_id' => $this->form_id,
				'starred' => '1',
			),
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

		$base = add_query_arg(
			array(
				'page'    => 'wpforms-entries',
				'view'    => 'list',
				'form_id' => $this->form_id,
			),
			admin_url( 'admin.php' )
		);

		$current = isset( $_GET['type'] ) ? $_GET['type'] : '';
		$total   = '&nbsp;<span class="count">(<span class="total-num">' . $this->counts['total'] . '</span>)</span>';
		$unread  = '&nbsp;<span class="count">(<span class="unread-num">' . $this->counts['unread'] . '</span>)</span>';
		$starred = '&nbsp;<span class="count">(<span class="starred-num">' . $this->counts['starred'] . '</span>)</span>';
		$all     = ( empty( $_GET['status'] ) && ( 'all' === $current || empty( $current ) ) ) ? 'class="current"' : '';

		$views = array(
			'all'     => sprintf( '<a href="%s"%s>%s</a>', esc_url( remove_query_arg( 'type', $base ) ), $all, esc_html__( 'All', 'wpforms' ) . $total ),
			'unread'  => sprintf( '<a href="%s"%s>%s</a>', esc_url( add_query_arg( 'type', 'unread', $base ) ), 'unread' === $current ? ' class="current"' : '', esc_html__( 'Unread', 'wpforms' ) . $unread ),
			'starred' => sprintf( '<a href="%s"%s>%s</a>', esc_url( add_query_arg( 'type', 'starred', $base ) ), 'starred' === $current ? ' class="current"' : '', esc_html__( 'Starred', 'wpforms' ) . $starred ),
		);

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

		$columns               = array();
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

		$sortable = array(
			'entry_id'      => array( 'id', false ),
			'notes_count'   => array( 'notes_count', false ),
			'id'            => array( 'title', false ),
			'date'          => array( 'date', false ),
			'status'        => array( 'status', false ),
			'payment_total' => array( 'payment_total', false ),
		);

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

		return (array) apply_filters( 'wpforms_entries_table_fields_disallow', array( 'divider', 'html', 'pagebreak', 'captcha' ) );
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
	public function get_columns_form_fields( $columns = array(), $display = 3 ) {

		if ( empty( $this->form_data['fields'] ) ) {
			return array();
		}

		$entry_columns = wpforms()->form->get_meta( $this->form_id, 'entry_columns', array( 'cap' => 'view_entries_form_single' ) );

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

				$columns[ 'wpforms_field_' . $id ] = ! empty( $this->form_data['fields'][ $id ]['label'] ) ? wp_strip_all_tags( $this->form_data['fields'][ $id ]['label'] ) : esc_html__( 'Field', 'wpforms' );
			}
		} else {
			/*
			 * Display default number of first fields in a form.
			 */
			$x = 0;
			foreach ( $this->form_data['fields'] as $id => $field ) {
				if ( ! in_array( $field['type'], self::get_columns_form_disallowed_fields(), true ) && $x < $display ) {
					$columns[ 'wpforms_field_' . $id ] = ! empty( $field['label'] ) ? wp_strip_all_tags( $field['label'] ) : esc_html__( 'Field', 'wpforms' );
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

		if ( false === strpos( $column_name, 'wpforms_field_' ) ) {
			return '';
		}

		$field_id     = str_replace( 'wpforms_field_', '', $column_name );
		$entry_fields = wpforms_decode( $entry->fields );

		if (
			! empty( $entry_fields[ $field_id ] ) &&
			! wpforms_is_empty_string( $entry_fields[ $field_id ]['value'] )
		) {

			$value = $entry_fields[ $field_id ]['value'];

			// Limit to 5 lines.
			$lines = explode( "\n", $value );
			$value = array_slice( $lines, 0, 4 );
			$value = implode( "\n", $value );

			if ( count( $lines ) > 5 ) {
				$value .= '&hellip;';
			} elseif ( strlen( $value ) > 75 ) {
				$value = substr( $value, 0, 75 ) . '&hellip;';
			}

			$value = nl2br( wp_strip_all_tags( trim( $value ) ) );

			return apply_filters( 'wpforms_html_field_value', $value, $entry_fields[ $field_id ], $this->form_data, 'entry-table' );

		}

		return '-';
	}

	/**
	 * Renders the columns.
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
				$value = date_i18n( get_option( 'date_format' ), strtotime( $entry->date ) + ( get_option( 'gmt_offset' ) * 3600 ) );
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
			$value = sprintf( '<div data-field-type="%s">%s</div>', $field_type, $value );
		}

		return apply_filters( 'wpforms_entry_table_column_value', $value, $entry, $column_name );
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

		$actions = array();

		// View.
		$actions[] = sprintf(
			'<a href="%s" title="%s" class="view">%s</a>',
			esc_url(
				add_query_arg(
					array(
						'view'     => 'details',
						'entry_id' => $entry->entry_id,
					),
					admin_url( 'admin.php?page=wpforms-entries' )
				)
			),
			esc_attr__( 'View Form Entry', 'wpforms' ),
			esc_html__( 'View', 'wpforms' )
		);

		if ( wpforms_current_user_can( 'delete_entries_form_single', $this->form_id ) ) {
			// Delete.
			$actions[] = sprintf(
				'<a href="%s" title="%s" class="delete">%s</a>',
				esc_url(
					wp_nonce_url(
						add_query_arg(
							array(
								'view'     => 'list',
								'action'   => 'delete',
								'form_id'  => $this->form_id,
								'entry_id' => $entry->entry_id,
							)
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
		$default_date = 'defaultDate: [],';
		if ( ! empty( $_GET['date'] ) ) {
			$dates = explode( ' - ', $_GET['date'] );

			if ( count( $dates ) === 1 ) {
				$dates[1] = $dates[0];
			}
			$default_date = 'defaultDate: [ "' . sanitize_text_field( $dates[0] ) . '", "' . sanitize_text_field( $dates[1] ) . '" ],';
		}
		?>

		<script>
			var wpforms_lang_code = '<?php echo sanitize_key( wpforms_get_language_code() ); ?>',
				flatpickr_locale = {
					rangeSeparator: ' - '
				};

			if (
				flatpickr !== 'undefined' &&
				flatpickr.hasOwnProperty( 'l10ns' ) &&
				flatpickr.l10ns.hasOwnProperty( wpforms_lang_code )
			) {
				flatpickr_locale = flatpickr.l10ns[ wpforms_lang_code ];
				// Rewrite separator for all locales to make filtering work.
				flatpickr_locale.rangeSeparator = ' - ';
			}

			jQuery(".wpforms-filter-date-selector").flatpickr({
				altInput: true,
				altFormat: "M j, Y",
				dateFormat: "Y-m-d",
				locale: flatpickr_locale,
				mode: "range",
				<?php echo $default_date; ?>
			});
		</script>

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

		return array(
			'read'   => esc_html__( 'Mark Read', 'wpforms' ),
			'unread' => esc_html__( 'Mark Unread', 'wpforms' ),
			'star'   => esc_html__( 'Star', 'wpforms' ),
			'unstar' => esc_html__( 'Unstar', 'wpforms' ),
			'null'   => esc_html__( '----------', 'wpforms' ),
			'delete' => esc_html__( 'Delete', 'wpforms' ),
		);
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
			$ids = array( $ids );
		}

		$ids = array_map( 'absint', $ids );

		if ( empty( $ids ) ) {
			return;
		}

		// Get entries, that would be affected.
		$entries_list = wpforms()->entry->get_entries(
			array(
				'entry_id'    => $ids,
				'is_filtered' => true,
				'number'      => $this->get_items_per_page( 'wpforms_entries_per_page', $this->per_page ),
			)
		);

		$sendback = remove_query_arg( array( 'read', 'unread', 'starred', 'unstarred', 'deleted' ) );

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

		$sendback = remove_query_arg( array( 'action', 'action2', 'entry_id' ), $sendback );

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
				array(
					'viewed' => '1',
				)
			);

			if ( $success ) {

				wpforms()->entry_meta->add(
					array(
						'entry_id' => $id,
						'form_id'  => $form_id,
						'user_id'  => $user_id,
						'type'     => 'log',
						'data'     => wpautop( sprintf( '<em>%s</em>', esc_html__( 'Entry read.', 'wpforms' ) ) ),
					),
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
				array(
					'viewed' => '0',
				)
			);

			if ( $success ) {
				wpforms()->entry_meta->add(
					array(
						'entry_id' => $id,
						'form_id'  => $form_id,
						'user_id'  => $user_id,
						'type'     => 'log',
						'data'     => wpautop( sprintf( '<em>%s</em>', esc_html__( 'Entry unread.', 'wpforms' ) ) ),
					),
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
				array(
					'starred' => '1',
				)
			);

			if ( $success ) {
				wpforms()->entry_meta->add(
					array(
						'entry_id' => $id,
						'form_id'  => $form_id,
						'user_id'  => $user_id,
						'type'     => 'log',
						'data'     => wpautop( sprintf( '<em>%s</em>', esc_html__( 'Entry starred.', 'wpforms' ) ) ),
					),
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
				array(
					'starred' => '0',
				)
			);

			if ( $success ) {
				wpforms()->entry_meta->add(
					array(
						'entry_id' => $id,
						'form_id'  => $form_id,
						'user_id'  => $user_id,
						'type'     => 'log',
						'data'     => wpautop( sprintf( '<em>%s</em>', esc_html__( 'Entry unstarred.', 'wpforms' ) ) ),
					),
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

		$bulk_counts = array(
			'read'      => isset( $_REQUEST['read'] ) ? absint( $_REQUEST['read'] ) : 0,
			'unread'    => isset( $_REQUEST['unread'] ) ? absint( $_REQUEST['unread'] ) : 0,
			'starred'   => isset( $_REQUEST['starred'] ) ? absint( $_REQUEST['starred'] ) : 0,
			'unstarred' => isset( $_REQUEST['unstarred'] ) ? absint( $_REQUEST['unstarred'] ) : 0,
			'deleted'   => isset( $_REQUEST['deleted'] ) ? absint( $_REQUEST['deleted'] ) : 0,
		);

		$bulk_messages = array(
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
		);

		// Leave only non-zero counts, so only those that were processed are left.
		$bulk_counts = array_filter( $bulk_counts );

		// If we have bulk messages to display.
		$messages = array();
		foreach ( $bulk_counts as $type => $count ) {
			if ( isset( $bulk_messages[ $type ] ) ) {
				$messages[] = sprintf( $bulk_messages[ $type ], $count );
			}
		}

		if ( $messages ) {
			WPForms_Admin_Notice::success( implode( '<br>', array_map( 'esc_html', $messages ) ) );
		}
	}

	/**
	 * Message to be displayed when there are no entries.
	 *
	 * @since 1.0.0
	 */
	public function no_items() {

		if ( isset( $_GET['search'] ) || isset( $_GET['date'] ) ) { // phpcs:ignore
			esc_html_e( 'No entries found.', 'wpforms' );
		} else {
			esc_html_e( 'Whoops, it appears you do not have any form entries yet.', 'wpforms' );
		}
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

		$filter_fields = array();
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
		if ( isset( $_GET['search']['field'] ) ) {
			if ( is_numeric( $_GET['search']['field'] ) ) {
				$cur_field = (int) $_GET['search']['field'];
			} else {
				$cur_field = sanitize_key( $_GET['search']['field'] );
			}
		}
		?>

		<p class="search-box wpforms-form-search-box">

			<select name="search[field]" class="wpforms-form-search-box-field">
				<option value="any" <?php selected( 'any', $cur_field, true ); ?>><?php esc_html_e( 'Any form field', 'wpforms' ); ?></option>
				<?php
				if ( ! empty( $filter_fields ) ) {
					foreach ( $filter_fields as $id => $name ) {
						printf( '<option value="%s" %s>%s</option>', esc_attr( $id ), selected( $id, $cur_field, false ), esc_html( $name ) );
					}
				}
				?>
			</select>

			<?php
			$cur_comparison = 'contains';
			if ( ! empty( $_GET['search']['comparison'] ) ) {
				$cur_comparison = sanitize_key( $_GET['search']['comparison'] );
			}
			?>

			<select name="search[comparison]" class="wpforms-form-search-box-comparison">
				<option value="contains" <?php selected( 'contains', $cur_comparison ); ?>><?php esc_html_e( 'contains', 'wpforms' ); ?></option>
				<option value="contains_not" <?php selected( 'contains_not', $cur_comparison ); ?>><?php esc_html_e( 'does not contain', 'wpforms' ); ?></option>
				<option value="is" <?php selected( 'is', $cur_comparison ); ?>><?php esc_html_e( 'is', 'wpforms' ); ?></option>
				<option value="is_not" <?php selected( 'is_not', $cur_comparison ); ?>><?php esc_html_e( 'is not', 'wpforms' ); ?></option>
			</select>

			<?php
			$cur_term = '';

			if ( ! empty( $_GET['search']['term'] ) ) {
				$cur_term = sanitize_text_field( $_GET['search']['term'] );
			}
			?>

			<label class="screen-reader-text" for="<?php echo esc_attr( $input_id ); ?>"><?php echo $text; ?>:</label>
			<input type="search" name="search[term]" class="wpforms-form-search-box-term" value="<?php echo esc_attr( $cur_term ); ?>" id="<?php echo esc_attr( $input_id ); ?>">

			<button type="submit" class="button"><?php echo $text; ?></button>
		</p>

		<?php

		do_action( 'wpforms_entries_list_form_filters_after', $this->form_data );
	}

	/**
	 * Fetch and setup the final data for the table
	 *
	 * @since 1.0.0
	 * @since 1.5.7 Added an `Entry Notes` column support.
	 */
	public function prepare_items() {

		// Retrieve count.
		$this->get_counts();

		// Setup the columns.
		$columns = $this->get_columns();

		// Hidden columns (none).
		$hidden = array();

		// Define which columns can be sorted.
		$sortable = $this->get_sortable_columns();

		// Set column headers.
		$this->_column_headers = array( $columns, $hidden, $sortable );

		// Get entries.
		$total_items = $this->counts['total'];
		$page        = $this->get_pagenum();
		$order       = isset( $_GET['order'] ) ? sanitize_text_field( $_GET['order'] ) : 'DESC';
		$orderby     = isset( $_GET['orderby'] ) ? sanitize_text_field( $_GET['orderby'] ) : 'entry_id';
		$per_page    = $this->get_items_per_page( 'wpforms_entries_per_page', $this->per_page );
		$data_args   = array(
			'form_id' => $this->form_id,
			'number'  => $per_page,
			'offset'  => $per_page * ( $page - 1 ),
			'order'   => $order,
			'orderby' => $orderby,
		);

		if ( ! empty( $_GET['type'] ) && 'starred' === $_GET['type'] ) {
			$data_args['starred'] = '1';
			$total_items          = $this->counts['starred'];
		}
		if ( ! empty( $_GET['type'] ) && 'unread' === $_GET['type'] ) {
			$data_args['viewed'] = '0';
			$total_items         = $this->counts['unread'];
		}
		if ( ! empty( $_GET['status'] ) ) {
			$data_args['status'] = sanitize_text_field( $_GET['status'] );
			$total_items         = $this->counts['abandoned'];
		}

		if ( array_key_exists( 'notes_count', $columns ) ) {
			$data_args['notes_count'] = true;
		}

		$data_args = apply_filters( 'wpforms_entry_table_args', $data_args );
		$data      = wpforms()->entry->get_entries( $data_args );

		// Maybe sort by payment total.
		if ( 'payment_total' === $orderby ) {
			usort( $data, array( $this, 'payment_total_sort' ) );
			if ( 'DESC' === strtoupper( $order ) ) {
				$data = array_reverse( $data );
			}
		}

		// Giddy up.
		$this->items = $data;

		// Finalize pagination.
		$this->set_pagination_args(
			array(
				'total_items' => $total_items,
				'per_page'    => $per_page,
				'total_pages' => ceil( $total_items / $per_page ),
			)
		);
	}

	/**
	 * Sort by payment total.
	 *
	 * @since 1.2.6
	 *
	 * @param object $a First entry to sort.
	 * @param object $b Second entry to sort.
	 *
	 * @return int
	 */
	public function payment_total_sort( $a, $b ) {

		$a_meta  = json_decode( $a->meta, true );
		$a_total = ! empty( $a_meta['payment_total'] ) ? wpforms_sanitize_amount( $a_meta['payment_total'] ) : 0;
		$b_meta  = json_decode( $b->meta, true );
		$b_total = ! empty( $b_meta['payment_total'] ) ? wpforms_sanitize_amount( $b_meta['payment_total'] ) : 0;

		if ( $a_total == $b_total ) {
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
}
