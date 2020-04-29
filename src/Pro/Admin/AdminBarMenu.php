<?php

namespace WPForms\Pro\Admin;

/**
 * WPForms admin bar menu.
 *
 * @since 1.6.0
 */
class AdminBarMenu extends \WPForms\Admin\AdminBarMenu {

	/**
	 * Register hooks.
	 *
	 * @since 1.6.0
	 */
	public function hooks() {

		parent::hooks();

		add_action( 'wpforms_admin_adminbarmenu_forms_menu_after', [ $this, 'view_entries_menu' ], 10, 2 );

		add_action( 'wpforms_admin_adminbarmenu_register_all_forms_menu_after', [ $this, 'entries_menu' ] );
	}

	/**
	 * Check if form contains a survey.
	 *
	 * @since 1.6.0
	 *
	 * @param array $form Form data array.
	 *
	 * @return bool
	 */
	public function has_survey( $form ) {

		if ( ! function_exists( 'wpforms_surveys_polls' ) ) {
			return false;
		}

		if ( ! empty( $form['settings']['survey_enable'] ) ) {
			return true;
		}

		if ( ! empty( $form['fields'] ) ) {
			foreach ( $form['fields'] as $field ) {
				if ( ! empty( $field['survey'] ) ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Render View Entries admin menu bar sub-item.
	 * Maybe include Survey results admin menu bar sub-item.
	 *
	 * @since 1.6.0
	 *
	 * @param \WP_Admin_Bar $wp_admin_bar WordPress Admin Bar object.
	 * @param array         $form         Form data.
	 */
	public function view_entries_menu( \WP_Admin_Bar $wp_admin_bar, $form ) {

		$form_id = absint( $form['id'] );

		$wp_admin_bar->add_menu(
			[
				'parent' => 'wpforms-form-id-' . $form_id,
				'id'     => 'wpforms-view-form-id-' . $form_id,
				'title'  => __( 'View Entries', 'wpforms' ),
				'href'   => admin_url( 'admin.php?page=wpforms-entries&view=list&form_id=' . $form_id ),
			]
		);

		if ( $this->has_survey( $form ) ) {
			$wp_admin_bar->add_menu(
				[
					'parent' => 'wpforms-form-id-' . $form_id,
					'id'     => 'wpforms-view-survey-results-id-' . $form_id,
					'title'  => __( 'Survey Results', 'wpforms' ),
					'href'   => admin_url( 'admin.php?page=wpforms-entries&view=survey&form_id=' . $form_id ),
				]
			);
		}
	}

	/**
	 * Render View Entries admin menu bar sub-item.
	 *
	 * @since 1.6.0
	 *
	 * @param \WP_Admin_Bar $wp_admin_bar WordPress Admin Bar object.
	 */
	public function entries_menu( \WP_Admin_Bar $wp_admin_bar ) {

		$wp_admin_bar->add_menu(
			[
				'parent' => 'wpforms-menu',
				'id'     => 'wpforms-entries',
				'title'  => __( 'Entries', 'wpforms' ),
				'href'   => admin_url( 'admin.php?page=wpforms-entries' ),
			]
		);
	}
}
