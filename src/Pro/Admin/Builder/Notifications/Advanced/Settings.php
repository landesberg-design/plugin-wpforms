<?php

namespace WPForms\Pro\Admin\Builder\Notifications\Advanced;

use WPForms_Builder_Panel_Settings;

/**
 * Advanced Form Notifications.
 *
 * @since 1.7.7
 */
class Settings {

	/**
	 * Initialize class.
	 *
	 * @since 1.7.7
	 */
	public function init() {

		$this->hooks();
	}

	/**
	 * Hooks.
	 *
	 * @since 1.7.7
	 */
	private function hooks() {

		add_action( 'wpforms_builder_enqueues', [ $this, 'builder_assets' ] );
		add_action( 'wpforms_form_settings_notifications_single_after', [ $this, 'content' ], 20, 2 );
	}

	/**
	 * Enqueue assets for the builder.
	 *
	 * @since 1.7.7
	 *
	 * @param string $view Current view.
	 */
	public function builder_assets( $view ) {

		$min = wpforms_get_min_suffix();

		// JavaScript.
		wp_enqueue_script(
			'wpforms-builder-notifications-advanced',
			WPFORMS_PLUGIN_URL . "assets/pro/js/admin/builder/notifications{$min}.js",
			[ 'jquery', 'conditionals', 'choicesjs' ],
			WPFORMS_VERSION,
			true
		);
	}

	/**
	 * Output Notification Advanced section.
	 *
	 * @since 1.7.7
	 *
	 * @param WPForms_Builder_Panel_Settings $settings Builder panel settings.
	 * @param int                            $id       Notification id.
	 *
	 * @return void
	 */
	public function content( $settings, $id ) {

		/**
		 * Filter the "Advanced" content.
		 *
		 * @since 1.7.7
		 *
		 * @param string                         $content  The content.
		 * @param WPForms_Builder_Panel_Settings $settings Builder panel settings.
		 * @param int                            $id       Notification id.
		 */
		$content = apply_filters( 'wpforms_pro_admin_builder_notifications_advanced_settings_content', '', $settings, $id );

		// Wrap advanced settings to the unfoldable group.
		wpforms_panel_fields_group(
			$content,
			[
				'borders'    => [ 'top' ],
				'class'      => 'wpforms-builder-notifications-advanced',
				'group'      => 'settings_notifications_advanced',
				'title'      => esc_html__( 'Advanced', 'wpforms' ),
				'unfoldable' => true,
			]
		);
	}

	/**
	 * Log Entry error.
	 *
	 * @since 1.7.7
	 *
	 * @param string $title    Title of the error.
	 * @param mixed  $data     Data to be logged.
	 * @param int    $form_id  Form ID.
	 * @param int    $entry_id Entry ID.
	 */
	public static function log_error( $title, $data, $form_id, $entry_id ) {

		wpforms_log(
			$title,
			$data,
			[
				'form_id' => $form_id,
				'parent'  => $entry_id,
				'type'    => [ 'entry', 'error' ],
			]
		);
	}
}
