<?php

namespace WPForms\Pro\Admin\Entries\Export;

/**
 * HTML-related stuff for Admin page.
 *
 * @since 1.5.5
 */
class Admin {

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

		add_action( 'admin_enqueue_scripts', array( $this, 'scripts' ) );
		add_action( 'wpforms_admin_tools_export_top', array( $this, 'display_entries_export_form' ) );
	}

	/**
	 * Outputs HTML of the Entries export form.
	 *
	 * @since 1.5.5
	 */
	public function display_entries_export_form() {

		?>
		<div class="wpforms-setting-row tools">

			<h3><?php esc_html_e( 'Export Entries', 'wpforms' ); ?></h3>

			<p><?php esc_html_e( 'Select a form to export entries, then select the fields you would like to include. You can also define search and date filters to further personalize the list of entries you want to retrieve. WPForms will generate a downloadable CSV of your entries.', 'wpforms' ); ?></p>

			<form method="post" action="<?php echo esc_url( admin_url( 'admin.php?page=wpforms-tools&view=export' ) ); ?>" id="wpforms-tools-entries-export">
				<input type="hidden" name="action" value="wpforms_tools_entries_export_step">
				<?php
				wp_nonce_field( 'wpforms-tools-entries-export-nonce', 'nonce' );
				$this->display_form_selection_block();
				?>

				<div id="wpforms-tools-entries-export-options" class="hidden">

					<section class="wp-clearfix" id="wpforms-tools-entries-export-options-fields">
						<h5><?php esc_html_e( 'Form Fields', 'wpforms' ); ?></h5>

						<div id="wpforms-tools-entries-export-options-fields-checkboxes">
							<?php $this->display_fields_selection_block(); ?>
						</div>
					</section>

					<section class="wp-clearfix" id="wpforms-tools-entries-export-options-additional-info">
						<h5><?php esc_html_e( 'Additional Information', 'wpforms' ); ?></h5>
						<?php $this->display_additional_info_block(); ?>
					</section>

					<section class="wp-clearfix" id="wpforms-tools-entries-export-options-date">
						<h5><?php esc_html_e( 'Custom Date Range', 'wpforms' ); ?></h5>
						<input type="text" name="date" class="wpforms-date-selector"
							id="wpforms-tools-entries-export-options-date-flatpickr"
							placeholder="<?php esc_attr_e( 'Select a date range', 'wpforms' ); ?>">
					</section>

					<section class="wp-clearfix" id="wpforms-tools-entries-export-options-search">
						<h5><?php esc_html_e( 'Search', 'wpforms' ); ?></h5>
						<?php $this->display_search_block(); ?>
					</section>

					<section class="wp-clearfix">
						<button type="submit" name="submit-entries-export" id="wpforms-tools-entries-export-submit"
							class="wpforms-btn wpforms-btn-md wpforms-btn-orange">
							<span class="wpforms-btn-text"><?php esc_html_e( 'Download Export File', 'wpforms' ); ?></span>
							<span class="wpforms-btn-spinner"><i class="fa fa-cog fa-spin fa-lg"></i></span>
						</button>
						<a href="#" class="hidden" id="wpforms-tools-entries-export-cancel"><?php esc_html_e( 'Cancel', 'wpforms' ); ?></a>
						<div id="wpforms-tools-entries-export-process-msg" class="hidden"></div>
					</section>

				</div>
			</form>
		</div>
		<?php
	}

	/**
	 * Forms field block HTML.
	 *
	 * @since 1.5.5
	 */
	public function display_form_selection_block() {

		// Retrieve available forms.
		$forms = wpforms()->form->get(
			'',
			array(
				'orderby' => 'title',
				'cap'     => 'view_entries_form_single',
			)
		);

		$form_id = $this->export->data['get_args']['form_id'];

		if ( ! empty( $forms ) ) {
			?>
			<span class="choicesjs-select-wrap">
				<select id="wpforms-tools-entries-export-selectform" class="choicesjs-select" name="form">';
					<option value="" placeholder><?php esc_attr_e( 'Select a Form', 'wpforms' ); ?></option>
					<?php
					foreach ( $forms as $form ) {
						printf(
							'<option value="%d" %s>%s</option>',
							(int) $form->ID,
							selected( $form->ID, $form_id, true ),
							esc_html( $form->post_title )
						);
					}
					?>
				</select>
				<span class="hidden" id="wpforms-tools-entries-export-selectform-spinner"><i class="fa fa-cog fa-spin fa-lg"></i></span>
			</span>
			<div id="wpforms-tools-entries-export-selectform-msg" class="hidden wpforms-error"></div>
			<?php
		} else {
			echo '<p>' . esc_html__( 'You need to have at least one form before you can use entries export.', 'wpforms' ) . '</p>';
		}
	}

	/**
	 * Form fields checkboxes block HTML.
	 *
	 * @since 1.5.5
	 */
	public function display_fields_selection_block() {

		$form_data = $this->export->data['form_data'];
		$fields    = $this->export->data['get_args']['fields'];

		if ( empty( $form_data['fields'] ) ) {
			printf( '<span>%s</span>', $this->export->errors['form_empty'] ); // phpcs:ignore

			return;
		}

		$i = 0;
		foreach ( $form_data['fields'] as $id => $field ) {
			if ( in_array( $field['type'], $this->export->configuration['disallowed_fields'], true ) ) {
				continue;
			}
			/* translators: %d - Field ID. */
			$name = ! empty( $field['label'] ) ? trim( wp_strip_all_tags( $field['label'] ) ) : sprintf( esc_html__( 'Field #%d', 'wpforms' ), (int) $id );
			printf(
				'<label><input type="checkbox" name="fields[%d]" value="%d"%s> %s</label>',
				$i,
				(int) $id,
				esc_attr( $this->get_checked_property( $id, $fields ) ),
				esc_html( $name )
			);
			$i ++;
		}
	}

	/**
	 * Additional information block HTML.
	 *
	 * @since 1.5.5
	 */
	public function display_additional_info_block() {

		$additional_info        = $this->export->data['get_args']['additional_info'];
		$additional_info_fields = $this->export->additional_info_fields;

		$i = 0;
		foreach ( $additional_info_fields as $slug => $label ) {
			if ( 'geodata' === $slug && ! class_exists( 'WPForms_Geolocation' ) ) {
				continue;
			}
			if ( 'pginfo' === $slug && ! ( class_exists( 'WPForms_Paypal_Standard' ) || function_exists( 'wpforms_stripe' ) ) ) {
				continue;
			}
			printf(
				'<label><input type="checkbox" name="additional_info[%d]" value="%s"%s> %s</label>',
				$i,
				esc_attr( $slug ),
				esc_attr( $this->get_checked_property( $slug, $additional_info, '' ) ),
				esc_html( $label )
			);
			$i ++;
		}
	}

	/**
	 * Search block HTML.
	 *
	 * @since 1.5.5
	 */
	public function display_search_block() {

		$search    = $this->export->data['get_args']['search'];
		$form_data = $this->export->data['form_data'];

		?>
		<select name="search[field]" class="wpforms-search-box-field" id="wpforms-tools-entries-export-options-search-field">
			<option value="any" <?php selected( 'any', $search['field'], true ); ?>><?php esc_html_e( 'Any form field', 'wpforms' ); ?></option>
			<?php
			if ( ! empty( $form_data['fields'] ) ) {
				foreach ( $form_data['fields'] as $id => $field ) {
					if ( in_array( $field['type'], $this->export->configuration['disallowed_fields'], true ) ) {
						continue;
					}
					/* translators: %d - Field ID. */
					$name = ! empty( $field['label'] ) ? wp_strip_all_tags( $field['label'] ) : sprintf( esc_html__( 'Field #%d', 'wpforms' ), (int) $id );
					printf(
						'<option value="%d" %s>%s</option>',
						(int) $id,
						esc_attr( selected( $id, $search['field'], false ) ),
						esc_html( $name )
					);
				}
			}
			?>
		</select>
		<select name="search[comparison]" class="wpforms-search-box-comparison">
			<option value="contains" <?php selected( 'contains', $search['comparison'] ); ?>><?php esc_html_e( 'contains', 'wpforms' ); ?></option>
			<option value="contains_not" <?php selected( 'contains_not', $search['comparison'] ); ?>><?php esc_html_e( 'does not contain', 'wpforms' ); ?></option>
			<option value="is" <?php selected( 'is', $search['comparison'] ); ?>><?php esc_html_e( 'is', 'wpforms' ); ?></option>
			<option value="is_not" <?php selected( 'is_not', $search['comparison'] ); ?>><?php esc_html_e( 'is not', 'wpforms' ); ?></option>
		</select>
		<input type="text" name="search[term]" class="wpforms-search-box-term" value="<?php echo esc_attr( $search['term'] ); ?>">

		<?php
	}

	/**
	 * Load scripts.
	 *
	 * @since 1.5.5
	 */
	public function scripts() {

		if ( ! $this->export->is_tools_export_page() ) {
			return;
		}

		$min = wpforms_get_min_suffix();

		/*
		 *  Styles.
		 */

		wp_enqueue_style(
			'wpforms-flatpickr',
			WPFORMS_PLUGIN_URL . 'assets/css/flatpickr.min.css',
			array(),
			'4.5.5'
		);

		/*
		 *  Scripts.
		 */

		wp_enqueue_script(
			'wpforms-flatpickr',
			WPFORMS_PLUGIN_URL . 'assets/js/flatpickr.min.js',
			array( 'jquery' ),
			'4.5.5',
			true
		);

		wp_enqueue_script(
			'wpforms-tools-entries-export',
			WPFORMS_PLUGIN_URL . "pro/assets/js/admin/tools-entries-export{$min}.js",
			array( 'jquery', 'wpforms-flatpickr' ),
			WPFORMS_VERSION,
			true
		);

		wp_localize_script(
			'wpforms-tools-entries-export',
			'wpforms_tools_entries_export',
			$this->export->get_localized_data()
		);
	}

	/**
	 * Get checked property according to value and array of values.
	 * Only for checkboxes.
	 *
	 * @since 1.5.5
	 *
	 * @param string $val     Value.
	 * @param array  $arr     Array of values.
	 * @param string $default ' checked' OR ''.
	 *
	 * @return string
	 */
	public function get_checked_property( $val, $arr, $default = ' checked' ) {

		$checked = ' checked' !== $default ? '' : $default;
		if ( empty( $arr ) || ! is_array( $arr ) ) {
			return $checked;
		}
		$checked = ' checked';
		if ( ! in_array( $val, $arr, true ) ) {
			$checked = '';
		}

		return $checked;
	}
}
