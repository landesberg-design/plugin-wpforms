<?php

namespace WPForms\Pro\Admin\Settings;

/**
 * Access management settings panel.
 *
 * @since 1.5.8
 */
class Access {

	/**
	 * View slug.
	 *
	 * @since 1.5.8
	 *
	 * @var string
	 */
	const SLUG = 'access';

	/**
	 * Init class.
	 *
	 * @since 1.5.8
	 */
	public function init() {

		$this->hooks();
	}

	/**
	 * Access settings panel hooks.
	 *
	 * @since 1.5.8
	 */
	public function hooks() {

		\add_filter( 'wpforms_settings_tabs', array( $this, 'add_tab' ) );
		\add_filter( 'wpforms_settings_defaults', array( $this, 'add_section' ) );
		\add_filter( 'wpforms_settings_exclude_view', array( $this, 'exclude_view' ) );
		\add_filter( 'wpforms_settings_custom_process', array( $this, 'process_settings' ), 10, 2 );

		if ( \wpforms_is_admin_page( 'settings', 'access' ) ) {
			\add_action( 'admin_enqueue_scripts', array( $this, 'enqueues' ) );
		}
	}

	/**
	 * Load enqueues.
	 *
	 * @since 1.5.8.2
	 */
	public function enqueues() {

		$min = \wpforms_get_min_suffix();

		\wp_enqueue_script(
			'wpforms-settings-access',
			\WPFORMS_PLUGIN_URL . "pro/assets/js/admin/settings-access{$min}.js",
			array( 'jquery', 'jquery-confirm' ),
			\WPFORMS_VERSION,
			true
		);

		\wp_localize_script(
			'wpforms-settings-access',
			'wpforms_settings_access',
			array(
				'labels' => array(
					'caps'  => \wpforms()->get( 'access' )->get_caps(),
					'roles' => \wp_list_pluck( \get_editable_roles(), 'name' ),
				),
				'l10n'   => array(
					/* translators: %1$s - capability being granted; %2$s - capability(s) required for a capability being granted; %3$s - role a capability is granted to. */
					'grant_caps'  => '<p>' . \esc_html__( 'In order to give %1$s access, %2$s access is also required.', 'wpforms' ) . '</p><p>' . \esc_html__( 'Would you like to also grant %2$s access to %3$s?', 'wpforms' ) . '</p>',
					/* translators: %1$s - capability being granted; %2$s - capability(s) required for a capability being granted; %3$s - role a capability is granted to. */
					'remove_caps' => '<p>' . \esc_html__( 'In order to remove %1$s access, %2$s access is also required to be removed.', 'wpforms' ) . '</p><p>' . \esc_html__( 'Would you like to also remove %2$s access from %3$s?', 'wpforms' ) . '</p>',
				),
			)
		);
	}

	/**
	 * Get Access settings panel labels.
	 *
	 * @since 1.5.8
	 */
	protected function get_caps_settings_labels() {

		return array(
			'create_forms'   => array(
				'title' => \esc_html__( 'Create Forms', 'wpforms' ),
				'caps'  => array(
					'wpforms_create_forms' => array(
						'title' => '',
						'desc'  => '',
					),
				),
			),
			'view_forms'     => array(
				'title' => \esc_html__( 'View Forms', 'wpforms' ),
				'caps'  => array(
					'wpforms_view_own_forms'    => array(
						'title' => \esc_html__( 'Own', 'wpforms' ),
						'desc'  => \esc_html__( 'Can view forms created by themselves.', 'wpforms' ),
					),
					'wpforms_view_others_forms' => array(
						'title' => \esc_html__( 'Others', 'wpforms' ),
						'desc'  => \esc_html__( 'Can view forms created by others.', 'wpforms' ),
					),
				),
			),
			'edit_forms'     => array(
				'title' => \esc_html__( 'Edit Forms', 'wpforms' ),
				'caps'  => array(
					'wpforms_edit_own_forms'    => array(
						'title' => \esc_html__( 'Own', 'wpforms' ),
						'desc'  => \esc_html__( 'Can edit forms created by themselves.', 'wpforms' ),
					),
					'wpforms_edit_others_forms' => array(
						'title' => \esc_html__( 'Others', 'wpforms' ),
						'desc'  => \esc_html__( 'Can edit forms created by others.', 'wpforms' ),
					),
				),
			),
			'delete_forms'   => array(
				'title' => \esc_html__( 'Delete Forms', 'wpforms' ),
				'caps'  => array(
					'wpforms_delete_own_forms'    => array(
						'title' => \esc_html__( 'Own', 'wpforms' ),
						'desc'  => \esc_html__( 'Can delete forms created by themselves.', 'wpforms' ),
					),
					'wpforms_delete_others_forms' => array(
						'title' => \esc_html__( 'Others', 'wpforms' ),
						'desc'  => \esc_html__( 'Can delete forms created by others.', 'wpforms' ),
					),
				),
			),
			// Entry categories.
			'view_entries'   => array(
				'title' => \esc_html__( 'View Entries', 'wpforms' ),
				'caps'  => array(
					'wpforms_view_entries_own_forms'    => array(
						'title' => \esc_html__( 'Own', 'wpforms' ),
						'desc'  => \esc_html__( 'Can view entries of forms created by themselves.', 'wpforms' ),
					),
					'wpforms_view_entries_others_forms' => array(
						'title' => \esc_html__( 'Others', 'wpforms' ),
						'desc'  => \esc_html__( 'Can view entries of forms created by others.', 'wpforms' ),
					),
				),
			),
			'edit_entries'   => array(
				'title' => \esc_html__( 'Edit Entries', 'wpforms' ),
				'caps'  => array(
					'wpforms_edit_entries_own_forms'    => array(
						'title' => \esc_html__( 'Own', 'wpforms' ),
						'desc'  => \esc_html__( 'Can edit entries of forms created by themselves.', 'wpforms' ),
					),
					'wpforms_edit_entries_others_forms' => array(
						'title' => \esc_html__( 'Others', 'wpforms' ),
						'desc'  => \esc_html__( 'Can edit entries of forms created by others.', 'wpforms' ),
					),
				),
			),
			'delete_entries' => array(
				'title' => \esc_html__( 'Delete Entries', 'wpforms' ),
				'caps'  => array(
					'wpforms_delete_entries_own_forms'    => array(
						'title' => \esc_html__( 'Own', 'wpforms' ),
						'desc'  => \esc_html__( 'Can delete entries of forms created by themselves.', 'wpforms' ),
					),
					'wpforms_delete_entries_others_forms' => array(
						'title' => \esc_html__( 'Others', 'wpforms' ),
						'desc'  => \esc_html__( 'Can delete entries of forms created by others.', 'wpforms' ),
					),
				),
			),
		);
	}

	/**
	 * Add Access settings tab on the left of Misc tab.
	 *
	 * @since 1.5.8
	 *
	 * @param array $tabs Settings tabs.
	 *
	 * @return array
	 */
	public function add_tab( $tabs ) {

		$tab = array(
			self::SLUG => array(
				'name'   => \esc_html__( 'Access', 'wpforms' ),
				'form'   => true,
				'submit' => \esc_html__( 'Save Settings', 'wpforms' ),
			),
		);

		return \wpforms_list_insert_after( $tabs, 'integrations', $tab );
	}

	/**
	 * Add Access settings section.
	 *
	 * @since 1.5.8
	 *
	 * @param array $settings Settings sections.
	 *
	 * @return array
	 */
	public function add_section( $settings ) {

		$settings[ self::SLUG ][ self::SLUG . '-heading' ] = array(
			'id'       => self::SLUG . '-heading',
			'content'  => '<h4>' . \esc_html__( 'Access', 'wpforms' ) . '</h4><p>' . \esc_html__( 'Select the user roles that are allowed access to WPForms.', 'wpforms' ) . '</p>',
			'type'     => 'content',
			'no_label' => true,
			'class'    => array( 'section-heading' ),
		);

		$labels     = $this->get_caps_settings_labels();
		$roles      = \get_editable_roles();
		$caps       = \wpforms()->get( 'access' )->get_caps();
		$master_cap = \wpforms_get_capability_manage_options();

		// Get a list of assigned capabilities for every role.
		foreach ( $roles as $role => $details ) {
			if ( $role === $master_cap || ! empty( $details['capabilities'][ $master_cap ] ) ) {
				continue;
			}
			$options[ $role ]   = $details['name'];
			$role_caps[ $role ] = \array_intersect_key( $caps, \array_filter( $details['capabilities'] ) );
		}

		foreach ( $labels as $row_id => $row ) {

			$columns = array();

			foreach ( $row['caps'] as $cap_id => $cap ) {

				$selected = \array_keys( \wp_list_filter( $role_caps, array( $cap_id => $caps[ $cap_id ] ) ) );

				$columns[ $cap_id ] = array(
					'id'        => $cap_id,
					'name'      => \esc_html( $cap['title'] ),
					'desc'      => \esc_html( $cap['desc'] ),
					'type'      => 'select',
					'choicesjs' => true,
					'multiple'  => true,
					'options'   => $options,
					'selected'  => $selected,
					'data'      => array( 'cap' => $cap_id ),
				);
			}

			$settings[ self::SLUG ][ $row_id ] = array(
				'id'      => $row_id,
				'name'    => \esc_html( $row['title'] ),
				'type'    => 'columns',
				'columns' => $columns,
			);
		}

		return $settings;
	}

	/**
	 * Exclude Access settings from a saved settings list.
	 *
	 * @since 1.5.8
	 *
	 * @param array $exclude_views Views to exclude from saving.
	 *
	 * @return array
	 */
	public function exclude_view( $exclude_views ) {

		$exclude_views[] = self::SLUG;

		return $exclude_views;
	}

	/**
	 * Run own processing of a settings view.
	 *
	 * @since 1.5.8
	 *
	 * @param string $view Settings view slug.
	 * @param array  $rows Set of settings fields rows for Access view.
	 */
	public function process_settings( $view, $rows ) {

		if ( $view !== self::SLUG ) {
			return;
		}

		// Check nonce and other various security checks.
		if ( ! isset( $_POST['wpforms-settings-submit'] ) || empty( $_POST['nonce'] ) ) {
			return;
		}

		if ( ! \wp_verify_nonce( \sanitize_text_field( \wp_unslash( $_POST['nonce'] ) ), 'wpforms-settings-nonce' ) ) {
			return;
		}

		if ( ! \wpforms_current_user_can() ) {
			return;
		}

		$columns = \wp_filter_object_list( $rows, array( 'type' => 'columns' ), 'and', 'columns' );

		foreach ( $columns as $column ) {

			if ( empty( $column ) || ! \is_array( $column ) ) {
				continue;
			}

			foreach ( $column as $cap_id => $cap ) {

				$value      = isset( $_POST[ $cap_id ] ) && \is_array( $_POST[ $cap_id ] ) ? \array_map( 'sanitize_text_field', \wp_unslash( $_POST[ $cap_id ] ) ) : array();
				$value_prev = isset( $cap['selected'] ) ? $cap['selected'] : array();

				$add_cap_roles    = \array_diff( $value, $value_prev );
				$remove_cap_roles = \array_diff( $value_prev, $value );

				$this->save_caps( $cap_id, $add_cap_roles, $remove_cap_roles );
			}
		}
	}

	/**
	 * Add or remove a capability to a set of roles.
	 *
	 * @since 1.5.8
	 *
	 * @param string $cap_id           Capability name.
	 * @param array  $add_cap_roles    Set of roles to add the capability to.
	 * @param array  $remove_cap_roles Set of roles to remove the capability from.
	 */
	protected function save_caps( $cap_id, $add_cap_roles, $remove_cap_roles ) {

		if ( empty( $add_cap_roles ) && empty( $remove_cap_roles ) ) {
			return;
		}

		\WPForms\Pro\Admin\DashboardWidget::clear_widget_cache();
		\WPForms\Pro\Admin\Entries\DefaultScreen::clear_widget_cache();

		$roles = \get_editable_roles();

		foreach ( $add_cap_roles as $role ) {
			if ( \array_key_exists( $role, $roles ) ) {
				\get_role( $role )->add_cap( $cap_id );
			}
		}

		foreach ( $remove_cap_roles as $role ) {
			if ( \array_key_exists( $role, $roles ) ) {
				\get_role( $role )->remove_cap( $cap_id );
			}
		}
	}
}
