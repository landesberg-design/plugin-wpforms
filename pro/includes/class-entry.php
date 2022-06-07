<?php

/**
 * Entry DB class.
 *
 * @since 1.0.0
 */
class WPForms_Entry_Handler extends WPForms_DB {

	/**
	 * Primary class constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {

		global $wpdb;

		$this->table_name  = $wpdb->prefix . 'wpforms_entries';
		$this->primary_key = 'entry_id';
		$this->type        = 'entries';
	}

	/**
	 * List of editable fields type.
	 *
	 * @since 1.7.0
	 *
	 * @return array
	 */
	public function get_editable_field_types() {

		return [
			'checkbox',
			'email',
			'name',
			'number',
			'number-slider',
			'radio',
			'select',
			'text',
			'textarea',
			'address',
			'date-time',
			'phone',
			'rating',
			'richtext',
			'url',
			'file-upload',
		];
	}

	/**
	 * Get table columns.
	 *
	 * @since 1.0.0
	 * @since 1.5.7 Added an `Entry Notes` column.
	 */
	public function get_columns() {

		return [
			'entry_id'      => '%d',
			'notes_count'   => '%d',
			'form_id'       => '%d',
			'post_id'       => '%d',
			'user_id'       => '%d',
			'status'        => '%s',
			'type'          => '%s',
			'viewed'        => '%d',
			'starred'       => '%d',
			'fields'        => '%s',
			'meta'          => '%s',
			'date'          => '%s',
			'date_modified' => '%s',
			'ip_address'    => '%s',
			'user_agent'    => '%s',
			'user_uuid'     => '%s',
		];
	}

	/**
	 * Default column values.
	 *
	 * @since 1.0.0
	 */
	public function get_column_defaults() {

		return [
			'form_id'       => '',
			'post_id'       => '',
			'user_id'       => '',
			'status'        => '',
			'type'          => '',
			'fields'        => '',
			'meta'          => '',
			'date'          => date( 'Y-m-d H:i:s' ),
			'date_modified' => date( 'Y-m-d H:i:s' ),
			'ip_address'    => '',
			'user_agent'    => '',
			'user_uuid'     => '',
		];
	}

	/**
	 * Retrieve an entry from the database based on a given entry ID.
	 *
	 * @since 1.5.8
	 *
	 * @param int   $entry_id Entry ID.
	 * @param array $args     Additional arguments.
	 *
	 * @return object|null
	 */
	public function get( $entry_id, $args = [] ) {

		if ( ! isset( $args['cap'] ) && wpforms()->get( 'access' )->init_allowed() ) {
			$args['cap'] = 'view_entry_single';
		}

		if ( ! empty( $args['cap'] ) && ! wpforms_current_user_can( $args['cap'], $entry_id ) ) {
			return null;
		}

		return parent::get( $entry_id );
	}

	/**
	 * Update an existing entry in the database.
	 *
	 * @since 1.5.8
	 *
	 * @param string $id    Entry ID.
	 * @param array  $data  Array of columns and associated data to update.
	 * @param string $where Column to match against in the WHERE clause. If empty, $primary_key
	 *                      will be used.
	 * @param string $type  Data type context.
	 * @param array  $args  Additional arguments.
	 *
	 * @return bool|null
	 */
	public function update( $id, $data = [], $where = '', $type = '', $args = [] ) {

		if ( ! isset( $args['cap'] ) ) {
			$args['cap'] = ( array_key_exists( 'viewed', $data ) || array_key_exists( 'starred', $data ) ) ? 'view_entry_single' : 'edit_entry_single';
		}

		if ( ! empty( $args['cap'] ) && ! wpforms_current_user_can( $args['cap'], $id ) ) {
			return null;
		}

		return parent::update( $id, $data, $where, $type );
	}

	/**
	 * Delete an entry from the database, also removes entry meta.
	 *
	 * Please note: successfully deleting a record flushes the cache.
	 *
	 * @since 1.1.6
	 *
	 * @param int   $entry_id Entry ID.
	 * @param array $args     Additional arguments.
	 *
	 * @return bool False if the record could not be deleted, true otherwise.
	 */
	public function delete( $entry_id = 0, $args = [] ) {

		if ( ! isset( $args['cap'] ) ) {
			$args['cap'] = 'delete_entry_single';
		}

		if ( ! empty( $args['cap'] ) && ! wpforms_current_user_can( $args['cap'], $entry_id ) ) {
			return false;
		}

		\WPForms_Field_File_Upload::delete_uploaded_files_from_entry( $entry_id );

		$entry  = parent::delete( $entry_id );
		$meta   = wpforms()->entry_meta->delete_by( 'entry_id', $entry_id );
		$fields = wpforms()->entry_fields->delete_by( 'entry_id', $entry_id );

		WPForms\Pro\Admin\DashboardWidget::clear_widget_cache();
		WPForms\Pro\Admin\Entries\DefaultScreen::clear_widget_cache();

		return ( $entry && $meta && $fields );
	}

	/**
	 * Get next entry.
	 *
	 * @since 1.1.5
	 *
	 * @param int $entry_id Entry ID.
	 * @param int $form_id  Form ID.
	 *
	 * @return object|null Object from DB values or null.
	 */
	public function get_next( $entry_id, $form_id ) {

		global $wpdb;

		if ( empty( $entry_id ) || empty( $form_id ) ) {
			return null;
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.NoCaching
		return $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$this->table_name}
				WHERE `form_id` = %d
  				  AND {$this->primary_key} > %d
				ORDER BY {$this->primary_key}
				LIMIT 1;",
				absint( $form_id ),
				absint( $entry_id )
			)
		);
	}

	/**
	 * Get previous entry.
	 *
	 * @since 1.1.5
	 *
	 * @param int $entry_id Entry ID.
	 * @param int $form_id  Form ID.
	 *
	 * @return object|null Object from DB values or null.
	 */
	public function get_prev( $entry_id, $form_id ) {

		global $wpdb;

		if ( empty( $entry_id ) || empty( $form_id ) ) {
			return null;
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.NoCaching
		return $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$this->table_name}
				WHERE `form_id` = %d
				  AND {$this->primary_key} < %d
				ORDER BY {$this->primary_key} DESC
				LIMIT 1;",
				absint( $form_id ),
				absint( $entry_id )
			)
		);
	}

	/**
	 * Get last entry of a specific form.
	 *
	 * @since 1.5.0
	 *
	 * @param int $form_id Form ID.
	 *
	 * @return object|null Object from DB values or null.
	 */
	public function get_last( $form_id ) {

		global $wpdb;

		if ( empty( $form_id ) ) {
			return null;
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.NoCaching
		return $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$this->table_name}
				WHERE `form_id` = %d
				ORDER BY {$this->primary_key} DESC
				LIMIT 1;",
				(int) $form_id
			)
		);
	}

	/**
	 * Mark all entries read for a form.
	 *
	 * @since 1.1.6
	 *
	 * @param int $form_id Form ID.
	 *
	 * @return bool
	 */
	public function mark_all_read( $form_id = 0 ) {

		global $wpdb;

		if ( empty( $form_id ) ) {
			return false;
		}

		return (bool) $wpdb->query( $wpdb->prepare( "UPDATE $this->table_name SET `viewed` = '1' WHERE `form_id` = %d", (int) $form_id ) ); // phpcs:ignore WordPress.DB
	}

	/**
	 * Get next entries count.
	 *
	 * @since 1.5.0
	 *
	 * @param int $entry_id Entry ID.
	 * @param int $form_id  Form ID.
	 *
	 * @return int
	 */
	public function get_next_count( $entry_id, $form_id ) {

		global $wpdb;

		if ( empty( $form_id ) ) {
			return 0;
		}

		$prev_count = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT({$this->primary_key}) FROM {$this->table_name}
				WHERE `form_id` = %d AND {$this->primary_key} > %d
				ORDER BY {$this->primary_key} ASC;",
				absint( $form_id ),
				absint( $entry_id )
			)
		);

		return absint( $prev_count );
	}

	/**
	 * Get previous entries count.
	 *
	 * @since 1.5.0 Changed return type to always be an integer.
	 * @since 1.1.5
	 *
	 * @param int $entry_id Entry ID.
	 * @param int $form_id  Form ID.
	 *
	 * @return int
	 */
	public function get_prev_count( $entry_id, $form_id ) {

		global $wpdb;

		if ( empty( $entry_id ) || empty( $form_id ) ) {
			return 0;
		}

		$prev_count = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT({$this->primary_key}) FROM {$this->table_name}
				WHERE `form_id` = %d AND {$this->primary_key} < %d
				ORDER BY {$this->primary_key} ASC;",
				absint( $form_id ),
				absint( $entry_id )
			)
		);

		return absint( $prev_count );
	}

	/**
	 * Get entries from the database.
	 *
	 * @since 1.0.0
	 * @since 1.5.7 Added a `notes_count` argument to request the count of notes for each entry.
	 * @since 1.6.9 Implemented filtering by `entry_id`, `ip_address` and `notes` in case of "any fields" search.
	 *
	 * @param array $args  Redefine query parameters by providing own arguments.
	 * @param bool  $count Whether to just count entries or get the list of them. True to just count.
	 *
	 * @return array|int
	 */
	public function get_entries( $args = [], $count = false ) {

		global $wpdb;

		$defaults = [
			'select'          => 'all',
			'number'          => $this->get_count_per_page(),
			'offset'          => 0,
			'form_id'         => 0,
			'entry_id'        => 0,
			'is_filtered'     => false,
			'post_id'         => '',
			'user_id'         => '',
			'status'          => '',
			'type'            => '',
			'viewed'          => '',
			'starred'         => '',
			'user_uuid'       => '',
			'field_id'        => '',
			'value'           => '',
			'value_compare'   => '',
			'date'            => '',
			'date_modified'   => '',
			'ip_address'      => '',
			'advanced_search' => '',
			'notes_count'     => false,
			'orderby'         => 'entry_id',
			'order'           => 'DESC',
		];

		/**
		 * Allow developers to filter the `get_entries()` method arguments.
		 *
		 * @since 1.4.4
		 *
		 * @param array $args {
		 *     Entries query arguments.
		 *
		 *     @type string  $select        Table field. Possible values: 'all', 'entry_ids'. By default 'all'.
		 *     @type integer $number        Number of the entries.
		 *     @type integer $offset        Offset.
		 *     @type integer $form_id       Form ID.
		 *     @type mixed   $entry_id      Entry ID. Integer or array of integers.
		 *     @type bool    $is_filtered   Skip filtering by entry IDs.
		 *     @type mixed   $post_id       Post ID.
		 *     @type mixed   $user_id       User ID.
		 *     @type string  $status        Entry status.
		 *     @type string  $type          Not used, rudimentary key.
		 *     @type string  $viewed        Viewed flag.
		 *     @type string  $starred       Starred flag.
		 *     @type string  $user_uuid     Unique user ID.
		 *     @type mixed   $field_id      Field ID.
		 *     @type string  $value         Field value.
		 *     @type string  $value_compare Possible values: 'is', 'is_not', 'contains', 'contains_not'.
		 *     @type mixed   $date          Created date. Array with two items, start and end date.
		 *                                  String value considered as same value for start and end.
		 *                                  Format: `Y-m-d H:i:s`.
		 *     @type string  $date_modified Modified date. See details for `date`.
		 *     @type string  $ip_address    IP address.
		 *     @type string  $notes_count   Notes count.
		 *     @type string  $orderby       Order by.
		 *     @type string  $order         Order: 'ASC' or 'DESC', Default: 'DESC'.
		 * }
		 */
		$args = apply_filters(
			'wpforms_entry_handler_get_entries_args',
			wp_parse_args( $args, $defaults )
		);

		$meta_table = wpforms()->get( 'entry_meta' )->table_name;

		/*
		 * Modify the SELECT.
		 */
		$select = '*';

		/**
		 * Allow developers to filter the array of the possible values of the $args['select'] argument.
		 *
		 * @since 1.4.4
		 *
		 * @param array $possible_select_values Array of key/value pairs that defines how to interpret 'select' argument in the real SQL query.
		 */
		$possible_select_values = apply_filters(
			'wpforms_entry_handler_get_entries_select',
			[
				'all'       => '*',
				'entry_ids' => "{$this->table_name}.entry_id",
			]
		);

		if ( array_key_exists( $args['select'], $possible_select_values ) ) {
			$select = esc_sql( $possible_select_values[ $args['select'] ] );
		}

		/*
		 * Modify the WHERE.
		 *
		 * Always define a default WHERE clause.
		 * MySQL/MariaDB optimizations are clever enough to strip this out later before actual execution.
		 * But having this default here in the code will make everything a bit better to read and understand.
		 */
		$where = [
			'default' => '1=1',
		];

		// Allowed int arg items.
		foreach ( [ 'entry_id', 'form_id', 'post_id', 'user_id', 'viewed', 'starred' ] as $key ) {

			// Value `$args[ $key ]` can be a natural number and a numeric string.
			// We should skip empty string values.
			if (
				! is_array( $args[ $key ] ) &&
				(
					! is_numeric( $args[ $key ] ) ||
					$args[ $key ] === 0
				)
			) {
				continue;
			}

			if ( is_array( $args[ $key ] ) && ! empty( $args[ $key ] ) ) {
				$ids = implode( ',', array_map( 'intval', $args[ $key ] ) );
			} else {
				$ids = (int) $args[ $key ];
			}

			$where[ 'arg_' . $key ] = "{$this->table_name}.{$key} IN ( {$ids} )";
		}

		// Allowed string arg items.
		foreach ( [ 'status', 'type', 'user_uuid' ] as $key ) {

			if ( $args[ $key ] !== '' ) {
				$where[ 'arg_' . $key ] = "{$this->table_name}.{$key} = '" . esc_sql( $args[ $key ] ) . "'";
			}
		}

		// Process dates.
		foreach ( [ 'date', 'date_modified' ] as $key ) {

			if ( empty( $args[ $key ] ) ) {
				continue;
			}

			// We can pass array and treat it as a range from:to.
			if ( is_array( $args[ $key ] ) && count( $args[ $key ] ) === 2 ) {
				$date_start = wpforms_get_day_period_date( 'start_of_day', strtotime( $args[ $key ][0] ), 'Y-m-d H:i:s', true );
				$date_end   = wpforms_get_day_period_date( 'end_of_day', strtotime( $args[ $key ][1] ), 'Y-m-d H:i:s', true );

				if ( ! empty( $date_start ) && ! empty( $date_end ) ) {
					$where[ 'arg_' . $key . '_start' ] = "{$this->table_name}.{$key} >= '{$date_start}'";
					$where[ 'arg_' . $key . '_end' ]   = "{$this->table_name}.{$key} <= '{$date_end}'";
				}
			} elseif ( is_string( $args[ $key ] ) ) {
				/*
				 * If we pass the only string representation of a date -
				 * that means we want to get records of that day only.
				 * So we generate start and end MySQL dates for the specified day.
				 */
				$timestamp  = strtotime( $args[ $key ] );
				$date_start = wpforms_get_day_period_date( 'start_of_day', $timestamp, 'Y-m-d H:i:s', true );
				$date_end   = wpforms_get_day_period_date( 'end_of_day', $timestamp, 'Y-m-d H:i:s', true );

				if ( ! empty( $date_start ) && ! empty( $date_end ) ) {
					$where[ 'arg_' . $key . '_start' ] = "{$this->table_name}.{$key} >= '{$date_start}'";
					$where[ 'arg_' . $key . '_end' ]   = "{$this->table_name}.{$key} <= '{$date_end}'";
				}
			}
		}

		// Remove filtering by entry_id if it is not a filtered query.
		if ( ! $args['is_filtered'] ) {
			unset( $where['arg_entry_id'] );
		}

		/*
		 * Modify the ORDER BY.
		 */
		$args['orderby'] = ! array_key_exists( $args['orderby'], $this->get_columns() ) ? $this->primary_key : $args['orderby'];
		$args['orderby'] = "{$this->table_name}.{$args['orderby']}";

		if ( 'ASC' === strtoupper( $args['order'] ) ) {
			$args['order'] = 'ASC';
		} else {
			$args['order'] = 'DESC';
		}

		/*
		 * Modify the OFFSET / NUMBER.
		 */
		$args['offset'] = absint( $args['offset'] );

		if ( $args['number'] < 1 ) {
			$args['number'] = PHP_INT_MAX;
		}
		$args['number'] = absint( $args['number'] );

		/*
		 * Retrieve the results.
		 */

		$sql_from = $this->table_name;

		// Add a LEFT OUTER JOIN for retrieve a notes count.
		if ( $args['notes_count'] ) {
			$sql_from .= ' LEFT JOIN';
			$sql_from .= " ( SELECT {$meta_table}.entry_id AS meta_entry_id, COUNT({$meta_table}.id) AS notes_count";
			$sql_from .= " FROM {$meta_table}";
			$sql_from .= " WHERE {$meta_table}.type = 'note'";
			$sql_from .= ' GROUP BY meta_entry_id )';
			$sql_from .= " notes_counts ON notes_counts.meta_entry_id = {$this->table_name}.entry_id";

			// Changed the ORDER BY - notes count sorting support.
			if ( $args['orderby'] === "{$this->table_name}.notes_count" ) {
				$args['orderby'] = 'notes_counts.notes_count';
			}
		}

		// In the case of search, we maybe need to run an additional query first.
		if ( ! empty( $args['value_compare'] ) ) {
			$where = $this->second_query_update_where( $args, $where );
		}

		/**
		 * Give developers an ability to modify WHERE (unset clauses, add new, etc).
		 *
		 * @since 1.4.4
		 *
		 * @param array $where The array of the chunks of the WHERE clause. Each chunk will be added to the SQL query using AND logical operator.
		 * @param array $args  Entries query arguments (arguments of the \WPForms_Entry_Handler::`get_entries( $args )` method).
		 */
		$where     = (array) apply_filters( 'wpforms_entry_handler_get_entries_where', $where, $args );
		$where_sql = implode( ' AND ', array_unique( array_filter( $where ) ) );

		if ( $count === true ) {
			return absint(
				// phpcs:disable WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$wpdb->get_var(
					"SELECT COUNT({$this->table_name}.{$this->primary_key}) 
					FROM {$sql_from}
					WHERE {$where_sql};"
				)
				// phpcs:enable WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			);
		}

		$sql = "
			SELECT {$select} 
			FROM {$sql_from}
			WHERE {$where_sql} 
			ORDER BY {$args['orderby']} {$args['order']} 
			LIMIT {$args['offset']}, {$args['number']}
		";

		return $wpdb->get_results( $sql ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared
	}

	/**
	 * Compile and perform additional SQL query if needed.
	 *
	 * We need to perform the additional "second" query to prepare the where clause for the main query.
	 * Unfortunately, compile all the logic to the one query appeared overcomplicated solution that hard to debug and maintain.
	 *
	 * @since 1.6.9
	 *
	 * @param array $args  Arguments of main `get_entries()` method.
	 * @param array $where Main `get_entries()` query WHERE array.
	 *
	 * @return array Updated WHERE array needed to perform main get_entries() query.
	 */
	protected function second_query_update_where( $args, $where ) {

		$second_where = $this->second_query_where( $args );

		if ( empty( $second_where ) ) {
			return $where;
		}

		$arg_entry_id_where = isset( $where['arg_entry_id'] ) ? $where['arg_entry_id'] : '';

		unset( $where['arg_entry_id'] );

		$second_where     = array_merge( $where, array_filter( $second_where ) );
		$second_where_sql = implode( ' AND ', $second_where );
		$second_sql_from  = $this->table_name;

		// Join fields table only if we need to search the fields.
		if (
			empty( $args['advanced_search'] ) &&
			! empty( $args['value_compare'] ) &&
			( ! empty( $args['value'] ) || ! empty( $args['field_id'] ) )
		) {
			$fields_table     = wpforms()->get( 'entry_fields' )->table_name;
			$second_sql_from .= " JOIN {$fields_table} ON {$this->table_name}.`entry_id` = {$fields_table}.`entry_id`";
		}

		$second_sql = "
			SELECT {$this->table_name}.`entry_id`
			FROM {$second_sql_from}
			WHERE {$second_where_sql}
			GROUP BY `entry_id`
			ORDER BY {$args['orderby']} {$args['order']} 
		";

		global $wpdb;

		$second_result    = $wpdb->get_results( $second_sql ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared
		$second_entry_ids = ! empty( $second_result ) ? wp_list_pluck( $second_result, 'entry_id' ) : [];

		if ( empty( $second_entry_ids ) ) {
			$where['arg_entry_id'] = empty( $args['value'] )
				? "{$this->table_name}.`entry_id` IN ( 0 )"
				: $arg_entry_id_where;

			return $where;
		}

		$ids = array_map( 'intval', (array) $args['entry_id'] );

		// `Any form field does not contains` and `Any form field is not` is a special cases.
		$any_field_not = empty( $args['advanced_search'] ) &&
						 ( empty( $args['field_id'] ) || $args['field_id'] === 'any' ) &&
						 in_array( $args['value_compare'], [ 'is_not', 'contains_not' ], true );

		if (
			! empty( $args['advanced_search'] ) ||
			in_array( $args['value_compare'], [ 'is', 'contains' ], true ) ||
			$any_field_not
		) {
			$ids = array_merge( $ids, $second_entry_ids );
		} else {
			$ids = array_intersect( $second_entry_ids, $ids );
		}

		$ids = array_unique( $ids );
		$ids = empty( $ids ) ? [ 0 ] : $ids;
		$ids = implode( ',', array_map( 'intval', $ids ) );

		$where['arg_entry_id'] = "{$this->table_name}.`entry_id` IN ({$ids})";

		return $where;
	}

	/**
	 * Prepare second query WHERE, needed to perform main get_entries() query.
	 *
	 * @since 1.6.9
	 *
	 * @param array $args Arguments of main `get_entries()` method.
	 *
	 * @return array Updated WHERE array.
	 */
	protected function second_query_where( $args ) { // phpcs:ignore Generic.Metrics.CyclomaticComplexity.TooHigh

		$fields_table = wpforms()->get( 'entry_fields' )->table_name;

		$second_where = [
			'arg_value' => $this->second_query_where_arg_value( $args ),
		];

		if ( empty( $args['advanced_search'] ) && is_numeric( $args['field_id'] ) ) {
			$args['field_id']             = (int) $args['field_id'];
			$second_where['arg_field_id'] = "{$fields_table}.field_id = '{$args['field_id']}'";
		}

		if ( empty( $args['value'] ) || in_array( $args['value_compare'], [ 'is', 'contains' ], true ) ) {
			return $second_where;
		}

		// For `inverse` logic (is_not or contains_not) we should use different approach.
		if (
			empty( $args['advanced_search'] ) &&
			( is_numeric( $args['field_id'] ) || empty( $args['field_id'] ) || $args['field_id'] === 'any' )
		) {
			if ( empty( $args['field_id'] ) || $args['field_id'] === 'any' ) {
				unset( $second_where['arg_value'] );
			}

			$escaped_value   = esc_sql( $args['value'] );
			$condition_value = $args['value_compare'] === 'is_not' ? " = '{$escaped_value}'" : " LIKE '%{$escaped_value}%'";
			$form_ids        = implode( ',', array_map( 'intval', (array) $args['form_id'] ) );
			$form_ids_where  = ! empty( $form_ids ) ? "AND `form_id` IN ( $form_ids )" : '';

			if ( empty( $escaped_value ) ) {

				$second_where['fields_entry_not_in'] = "{$this->table_name}.`entry_id` NOT IN ( 0 )";

			} else {

				$second_where['fields_entry_not_in'] = "{$this->table_name}.`entry_id` NOT IN (
					SELECT `entry_id`
					FROM {$fields_table}
					WHERE
						`value` {$condition_value}
						{$form_ids_where}    
				)";

			}
		}

		if ( $args['advanced_search'] === 'entry_notes' ) {
			$entry_ids                         = $this->second_query_where_entry_notes_result_ids( $args );
			$second_where['meta_entry_not_in'] = "{$this->table_name}.`entry_id` NOT IN ( {$entry_ids} )";
		}

		return $second_where;
	}

	/**
	 * Prepare second query WHERE with arg_value item.
	 *
	 * @since 1.6.9
	 *
	 * @param array $args Arguments of main `get_entries()` method.
	 *
	 * @return string
	 */
	protected function second_query_where_arg_value( $args ) {

		if ( empty( $args['value_compare'] ) ) {
			return '';
		}

		if ( ! empty( $args['value'] ) ) {
			return $this->second_query_where_arg_value_not_empty( $args );
		}

		// If the sanitized search term is empty we should return nothing in the case of direct logic.
		if ( in_array( $args['value_compare'], [ 'is', 'contains' ], true ) ) {
			return "{$this->table_name}.`entry_id` IN ( 0 )";
		}

		return '';
	}

	/**
	 * Prepare second query WHERE arg_value.
	 *
	 * @since 1.6.9
	 *
	 * @param array $args Arguments of main `get_entries()` method.
	 *
	 * @return string
	 */
	protected function second_query_where_arg_value_not_empty( $args ) {

		$value_compare = empty( $args['value_compare'] ) ? 'is' : $args['value_compare'];
		$escaped_value = esc_sql( $args['value'] );

		$condition_values = [
			'is'           => " = '{$escaped_value}'",
			'is_not'       => " <> '{$escaped_value}'",
			'contains'     => " LIKE '%{$escaped_value}%'",
			'contains_not' => " NOT LIKE '%{$escaped_value}%'",
		];

		$condition_value = empty( $condition_values[ $value_compare ] ) ? $condition_values['is'] : $condition_values[ $value_compare ];

		if ( empty( $args['advanced_search'] ) ) {
			$fields_table = wpforms()->get( 'entry_fields' )->table_name;

			return "{$fields_table}.`value` {$condition_value}";
		}

		// In the case of searching the `entry_id` with `is` or `is_not` we should prepare the value and generate different WHERE part.
		if (
			$args['advanced_search'] === 'entry_id' &&
			in_array( $value_compare, [ 'is', 'is_not' ], true )
		) {
			return $this->second_query_where_arg_value_for_entry_id_is( $args );
		}

		return $this->second_query_where_arg_value_advanced_search( $args, $condition_value );
	}

	/**
	 * Prepare second query WHERE arg_value element for advanced search.
	 *
	 * @since 1.6.9
	 *
	 * @param array  $args            Arguments of main `get_entries()` method.
	 * @param string $condition_value Condition with escaped value.
	 *
	 * @return string
	 */
	private function second_query_where_arg_value_advanced_search( $args, $condition_value ) { // phpcs:ignore Generic.Metrics.CyclomaticComplexity.TooHigh

		if ( empty( $args['advanced_search'] ) ) {
			return '';
		}

		if ( $args['advanced_search'] === 'entry_id' ) {
			return "{$this->table_name}.`entry_id` {$condition_value}";
		}

		if ( $args['advanced_search'] === 'ip_address' ) {
			return "{$this->table_name}.`ip_address` {$condition_value}";
		}

		if ( $args['advanced_search'] === 'user_agent' ) {
			return "{$this->table_name}.`user_agent` {$condition_value}";
		}

		if ( $args['advanced_search'] !== 'entry_notes' ) {
			return '';
		}

		if ( in_array( $args['value_compare'], [ 'is', 'contains' ], true ) ) {
			$entry_ids = $this->second_query_where_entry_notes_result_ids( $args );

			return "{$this->table_name}.`entry_id` IN ( {$entry_ids} )";
		}

		return '';
	}

	/**
	 * Prepare second query WHERE arg_value element for searching entry_id.
	 *
	 * @since 1.6.9
	 *
	 * @param array $args Arguments of main `get_entries()` method.
	 *
	 * @return string
	 */
	private function second_query_where_arg_value_for_entry_id_is( $args ) {

		$value_compare = empty( $args['value_compare'] ) ? 'is' : $args['value_compare'];
		$escaped_value = esc_sql( $args['value'] );

		// Convert all non-numeric chars to commas.
		$escaped_value = preg_replace( '/\D+/', ',', $escaped_value );

		// Convert several commas to one comma.
		$escaped_value = preg_replace( '/,+/', ',', $escaped_value );

		// Strip comma from the beginning of the string.
		$escaped_value = preg_replace( '/^,/', '', $escaped_value );

		// Strip comma from the end of the string.
		$escaped_value = preg_replace( '/,$/', '', $escaped_value );

		$escaped_value = ! empty( $escaped_value ) ? $escaped_value : '0';

		$operator = $value_compare === 'is' ? 'IN' : 'NOT IN';

		return "{$this->table_name}.`entry_id` {$operator} ( {$escaped_value} )";
	}

	/**
	 * Advanced search by Entry Notes.
	 *
	 * @since 1.6.9
	 *
	 * @param array $args Arguments.
	 *
	 * @return string Comma separated list of entry ids.
	 */
	private function second_query_where_entry_notes_result_ids( $args ) {

		global $wpdb;

		$meta_table = wpforms()->get( 'entry_meta' )->table_name;

		$form_ids       = implode( ',', array_map( 'intval', (array) $args['form_id'] ) );
		$form_ids_where = ! empty( $form_ids ) ? "AND `form_id` IN ( $form_ids )" : '';
		$escaped_value  = strtolower( esc_sql( $args['value'] ) );

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$notes = $wpdb->get_results(
			"
			SELECT `entry_id`, `data`
			FROM {$meta_table}
			WHERE
				`type` = 'note'
				AND `data` LIKE '%{$escaped_value}%'
				{$form_ids_where}
			"
		);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		if ( empty( $notes ) ) {
			return '0';
		}

		foreach ( $notes as $key => $note ) {

			$clean_value = strtolower( trim( wp_strip_all_tags( $note->data ) ) );

			if (
				in_array( $args['value_compare'], [ 'is', 'is_not' ], true ) &&
				$clean_value !== $escaped_value
			) {
				unset( $notes[ $key ] );
			}

			if (
				in_array( $args['value_compare'], [ 'contains', 'contains_not' ], true ) &&
				strpos( $clean_value, $escaped_value ) === false
			) {
				unset( $notes[ $key ] );
			}
		}

		$entry_ids = ! empty( $notes ) ? wp_list_pluck( $notes, 'entry_id' ) : [ 0 ];

		return implode( ',', array_unique( $entry_ids ) );
	}

	/**
	 * Create custom entry database table.
	 *
	 * @since 1.0.0
	 */
	public function create_table() {

		global $wpdb;

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$charset_collate = '';

		if ( ! empty( $wpdb->charset ) ) {
			$charset_collate .= "DEFAULT CHARACTER SET {$wpdb->charset}";
		}
		if ( ! empty( $wpdb->collate ) ) {
			$charset_collate .= " COLLATE {$wpdb->collate}";
		}

		$sql = "CREATE TABLE {$this->table_name} (
			entry_id bigint(20) NOT NULL AUTO_INCREMENT,
			form_id bigint(20) NOT NULL,
			post_id bigint(20) NOT NULL,
			user_id bigint(20) NOT NULL,
			status varchar(30) NOT NULL,
			type varchar(30) NOT NULL,
			viewed tinyint(1) DEFAULT 0,
			starred tinyint(1) DEFAULT 0,
			fields longtext NOT NULL,
			meta longtext NOT NULL,
			date datetime NOT NULL,
			date_modified datetime NOT NULL,
			ip_address varchar(128) NOT NULL,
			user_agent varchar(256) NOT NULL,
			user_uuid varchar(36) NOT NULL,
			PRIMARY KEY  (entry_id),
			KEY form_id (form_id)
		) {$charset_collate};";

		dbDelta( $sql );
	}

	/**
	 * Get entries count per page.
	 *
	 * @since 1.6.5
	 *
	 * @return int
	 */
	public function get_count_per_page() {

		return (int) apply_filters( 'wpforms_entries_per_page', 30 );
	}

	/**
	 * Check if entry has editable fields.
	 *
	 * @since 1.6.9
	 *
	 * @param object $entry Submitted entry values.
	 *
	 * @return bool True if editable field is found.
	 */
	public function has_editable_fields( $entry ) {

		$entry_fields = wpforms_decode( $entry->fields );

		if ( empty( $entry_fields ) ) {
			return false;
		}

		$form_data = wpforms()->get( 'form' )->get( (int) $entry->form_id, [ 'content_only' => true ] );

		if ( ! is_array( $form_data ) || empty( $form_data['fields'] ) ) {
			return false;
		}

		foreach ( $form_data['fields'] as $id => $form_field ) {

			/** This filter is documented in src/Pro/Admin/Entries/Edit.php */
			$is_editable = (bool) apply_filters(
				'wpforms_pro_admin_entries_edit_field_output_editable',
				$this->is_field_editable( $form_field['type'] ),
				$form_field,
				$entry_fields,
				$form_data
			);

			if ( ! $is_editable ) {
				unset( $form_data['fields'][ $id ] );
			}
		}

		return ! empty( $form_data['fields'] );
	}

	/**
	 * Determine whether the field type is editable.
	 *
	 * @since 1.7.0
	 *
	 * @param string $type Field type.
	 *
	 * @return bool True if editable.
	 */
	private function is_field_editable( $type ) {

		$editable = in_array( $type, $this->get_editable_field_types(), true );

		/** This filter is documented in src/Pro/Admin/Entries/Edit.php */
		return (bool) apply_filters( 'wpforms_pro_admin_entries_edit_field_editable', $editable, $type );
	}
}
