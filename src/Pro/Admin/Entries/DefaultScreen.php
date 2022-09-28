<?php

namespace WPForms\Pro\Admin\Entries;

/**
 * Default Entries screen shows a chart and the form entries stats if no form selected.
 *
 * @since 1.5.5
 */
class DefaultScreen extends \WPForms\Pro\Admin\DashboardWidget {

	/**
	 * Instance slug.
	 *
	 * @since 1.5.5
	 *
	 * @const string
	 */
	const SLUG = 'entries_default_screen';

	/**
	 * Init class.
	 *
	 * @since 1.5.5
	 */
	public function init() {

		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		$is_admin_page   = wpforms_is_admin_page( 'entries' ) && empty( $_GET['view'] );
		$is_ajax_request = wp_doing_ajax() && isset( $_REQUEST['action'] ) && strpos( sanitize_key( $_REQUEST['action'] ), 'wpforms_entries_default_screen' ) !== false;
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		if ( ! $is_admin_page && ! $is_ajax_request ) {
			return;
		}

		$this->hooks();
		$this->settings();
	}

	/**
	 * Hooks. We use filters here to redefine certain settings.
	 * So this method should be called before settings() method.
	 *
	 * @since 1.5.5
	 */
	public function hooks() {

		parent::hooks();
		add_action( 'wpforms_admin_page', [ $this, 'content' ] );

		// Disable "Screen Options" on Default Screen only.
		add_filter(
			'screen_options_show_screen',
			static function () {
				return ! ( wpforms_is_admin_page( 'entries' ) && empty( $_GET['form_id'] ) ); // phpcs:ignore
			}
		);

		// Display all forms.
		add_filter(
			'wpforms_entries_default_screen_forms_list_number_to_display',
			static function () {

				return 0;
			}
		);

		add_filter( 'wpforms_entries_default_screen_forms_list_columns', [ $this, 'forms_list_columns' ], 10, 2 );
		add_filter( 'wpforms_entries_default_screen_forms_list_form_title', [ $this, 'forms_list_form_title' ], 10, 2 );
		add_filter( 'wpforms_entries_default_screen_form_item_fields', [ $this, 'form_item_fields' ], 10, 2 );
		add_filter( 'wpforms_entries_default_screen_forms_list_additional_cells', [ $this, 'forms_list_additional_cells' ], 10, 2 );
		add_filter( 'wpforms_entries_default_screen_timespan_at_top', '__return_true' );
		add_filter( 'wpforms_entries_default_screen_total_entries_title', [ $this, 'total_entries_title' ] );

		// Do not cache results in a table - always display up-to-date information.
		add_filter(
			'wpforms_entries_default_screen_date_end_str',
			static function () {

				return 'today';
			}
		);
		add_filter( 'wpforms_entries_default_screen_allow_data_caching', '__return_false' );
		add_filter( 'wpforms_entries_default_screen_cached_data', '__return_false' );
	}

	/**
	 * Display page content.
	 *
	 * @since 1.5.5
	 */
	public function content() {

		?>
		<div id="wpforms-entries-list" class="wrap wpforms-admin-wrap">
			<h1 class="page-title"><?php esc_html_e( 'Entries', 'wpforms' ); ?></h1>
			<div class="wpforms-admin-content" id="wpforms_reports_widget_pro">
				<?php $this->widget_content(); ?>
			</div>
		</div>
		<?php
	}

	/**
	 * Get timespan options (in days).
	 *
	 * @since 1.5.5
	 *
	 * @return array
	 */
	public function get_timespan_options() {

		$default = array( 7, 30 );

		$options = \apply_filters( 'wpforms_pro_admin_entries_defaultscreen_timespan_options', $default );
		if ( ! \is_array( $options ) ) {
			return $default;
		}

		$options = \array_filter( $options, 'is_numeric' );

		return empty( $options ) ? $default : $options;
	}

	/**
	 * Columns row markup.
	 *
	 * @since 1.5.5
	 *
	 * @param string $columns Columns row markup.
	 * @param array  $forms   Forms list data.
	 *
	 * @return string Table header columns.
	 */
	public function forms_list_columns( $columns, $forms ) {

		$days = empty( $this->runtime_data['days'] ) ? $this->widget_meta( 'get', 'timespan' ) : $this->runtime_data['days'];
		/* translators: %d - Selected timespan (in days). */
		$last_n_days = sprintf( esc_html__( 'Last %d days', 'wpforms' ), (int) $days );

		return '<tr class="wpforms-dash-widget-forms-list-columns">
			<td>' . esc_html__( 'Form Name', 'wpforms' ) . '</td>
			<td>' . esc_html__( 'Created', 'wpforms' ) . '</td>
			<td>' . esc_html__( 'All Time', 'wpforms' ) . '</td>
			<td>' . $last_n_days . '</td>
			<td>' . esc_html__( 'Graph', 'wpforms' ) . '</td>
		</tr>';
	}

	/**
	 * Form title with link to form entries.
	 *
	 * @since 1.5.5
	 *
	 * @param string $form_title Form title.
	 * @param array  $form       Form data.
	 *
	 * @return string Link to form entries.
	 */
	public function forms_list_form_title( $form_title, $form ) {

		$form_title = '<a href="' . \esc_url( $form['total_url'] ) . '" class="">' . esc_html( $form_title ) . '</a>';

		return $form_title;
	}

	/**
	 * Forms list additional cells.
	 *
	 * @since 1.5.5
	 *
	 * @param string $html Cells markup.
	 * @param array  $form Form data.
	 *
	 * @return string Cell `Created` markup.
	 */
	public function forms_list_additional_cells( $html, $form ) {

		return '<td>' . esc_html( $form['created_date'] ) . '</td>
			<td><a href="' . esc_url( $form['total_url'] ) . '">' . esc_html( $form['total'] ) . '</a></td>';
	}

	/**
	 * Form item data elements filter.
	 *
	 * @since 1.5.5
	 *
	 * @param array    $form_item Form item data.
	 * @param \WP_Post $form      Form object.
	 *
	 * @return array Form item data.
	 */
	public function form_item_fields( $form_item, $form ) {

		$form_item['created_date'] = date_i18n( get_option( 'date_format' ), strtotime( $form->post_date ) );
		$form_item['total_url']    = $form_item['edit_url'];

		$form_item['total'] = wpforms()->entry->get_entries(
			array(
				'form_id' => $form_item['form_id'],
			),
			true
		);

		$dates = $this->get_days_interval();
		if ( ! ( empty( $dates['start'] ) || empty( $dates['end'] ) ) ) {
			$form_item['edit_url'] = add_query_arg(
				array(
					'action' => 'filter_date',
					'date'   => $dates['start']->format( 'Y-m-d' ) . ' - ' . $dates['end']->format( 'Y-m-d' ),
				),
				$form_item['edit_url']
			);
		}

		return $form_item;
	}

	/**
	 * Total entries title filter.
	 *
	 * @since 1.5.5
	 *
	 * @param string $title Title.
	 *
	 * @return string Title.
	 */
	public function total_entries_title( $title ) {

		return esc_html__( 'Total Entries', 'wpforms' );
	}

	/**
	 * Do not display recommended plugin block.
	 *
	 * @since 1.5.5
	 * @since 1.7.3 Added plugin parameter.
	 *
	 * @param array $plugin Plugin data.
	 */
	public function recommended_plugin_block_html( $plugin = [] ) {
	}

	/**
	 * Content if a user has no forms.
	 *
	 * @since 1.6.2.3
	 */
	public function widget_content_no_forms_html() {

		echo wpforms_render( 'admin/empty-states/no-forms' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}
