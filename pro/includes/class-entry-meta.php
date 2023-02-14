<?php

/**
 * Entry meta DB class.
 *
 * @since 1.1.6
 */
class WPForms_Entry_Meta_Handler extends WPForms_DB {

	/**
	 * Primary class constructor.
	 *
	 * @since 1.1.6
	 */
	public function __construct() {

		global $wpdb;

		$this->table_name  = $wpdb->prefix . 'wpforms_entry_meta';
		$this->primary_key = 'id';
		$this->type        = 'entry_meta';
	}

	/**
	 * Get table columns.
	 *
	 * @since 1.1.6
	 */
	public function get_columns() {

		return [
			'id'       => '%d',
			'entry_id' => '%d',
			'form_id'  => '%d',
			'user_id'  => '%d',
			'type'     => '%s',
			'status'   => '%s',
			'data'     => '%s',
			'date'     => '%s',
		];
	}

	/**
	 * Default column values.
	 *
	 * @since 1.1.6
	 */
	public function get_column_defaults() {

		return [
			'entry_id' => '',
			'form_id'  => '',
			'user_id'  => '',
			'type'     => '',
			'status'   => '',
			'data'     => '',
			'date'     => date( 'Y-m-d H:i:s' ),
		];
	}

	/**
	 * Get entry meta rows from the database.
	 *
	 * @since 1.1.6
	 *
	 * @param array $args
	 * @param bool $count
	 *
	 * @return array|int
	 */
	public function get_meta( $args = [], $count = false ) {

		global $wpdb;

		$defaults = [
			'number'   => 30,
			'offset'   => 0,
			'id'       => 0,
			'entry_id' => 0,
			'form_id'  => 0,
			'user_id'  => '',
			'status'   => '',
			'type'     => '',
			//'date'          => '', @todo
			'orderby'  => 'id',
			'order'    => 'DESC',
		];

		$args = wp_parse_args( $args, $defaults );

		if ( $args['number'] < 1 ) {
			$args['number'] = PHP_INT_MAX;
		}

		$where = $this->build_where(
			$args,
			[ 'id', 'entry_id', 'form_id', 'user_id' ]
		);

		// Allowed string arg items.
		$keys = [ 'status', 'type', 'data' ];

		foreach ( $keys as $key ) {

			if ( ! empty( $args[ $key ] ) ) {
				$where .= empty( $where ) ? 'WHERE' : 'AND';
				$where .= " `{$key}` = '" . esc_sql( $args[ $key ] ) . "' ";
			}
		}

		// Orderby.
		$args['orderby'] = ! array_key_exists( $args['orderby'], $this->get_columns() ) ? $this->primary_key : $args['orderby'];

		// Offset.
		$args['offset'] = absint( $args['offset'] );

		// Number.
		$args['number'] = absint( $args['number'] );

		// Order.
		if ( 'ASC' === strtoupper( $args['order'] ) ) {
			$args['order'] = 'ASC';
		} else {
			$args['order'] = 'DESC';
		}

		if ( true === $count ) {

			$results = absint( $wpdb->get_var( "SELECT COUNT({$this->primary_key}) FROM {$this->table_name} {$where};" ) );

		} else {

			$results = $wpdb->get_results(
				"SELECT * FROM {$this->table_name} {$where} ORDER BY {$args['orderby']} {$args['order']} LIMIT {$args['offset']}, {$args['number']};"
			);
		}

		return $results;
	}

	/**
	 * Create custom entry meta database table.
	 *
	 * @since 1.1.6
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

		$sql = "CREATE TABLE IF NOT EXISTS {$this->table_name} (
			id bigint(20) NOT NULL AUTO_INCREMENT,
			entry_id bigint(20) NOT NULL,
			form_id bigint(20) NOT NULL,
			user_id bigint(20) NOT NULL,
			status varchar(30) NOT NULL,
			type varchar(255) NOT NULL,
			data longtext NOT NULL,
			date datetime NOT NULL,
			PRIMARY KEY  (id),
			KEY entry_id (entry_id)
		) {$charset_collate};";

		dbDelta( $sql );
	}
}
