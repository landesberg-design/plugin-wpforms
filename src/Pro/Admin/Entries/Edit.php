<?php

namespace WPForms\Pro\Admin\Entries;

use WPForms\Pro\Forms\Fields\Base\EntriesEdit;

/**
 * Single entry edit function.
 *
 * @since 1.6.0
 */
class Edit {

	/**
	 * Abort. Bail on proceeding to process the page.
	 *
	 * @since 1.6.0
	 *
	 * @var bool
	 */
	public $abort = false;

	/**
	 * Form object.
	 *
	 * @since 1.6.0
	 *
	 * @var \WP_Post
	 */
	public $form;

	/**
	 * Form ID.
	 *
	 * @since 1.6.0
	 *
	 * @var integer
	 */
	public $form_id;

	/**
	 * Decoded Form Data.
	 *
	 * @since 1.6.0
	 *
	 * @var array
	 */
	public $form_data;

	/**
	 * Entry object.
	 *
	 * @since 1.6.0
	 *
	 * @var object
	 */
	public $entry;

	/**
	 * Entry ID.
	 *
	 * @since 1.6.0
	 * @var integer
	 */
	public $entry_id;

	/**
	 * Decoded Entry Fields array.
	 *
	 * @since 1.6.0
	 *
	 * @var array
	 */
	public $entry_fields;

	/**
	 * Processing Fields array.
	 *
	 * @since 1.6.0
	 *
	 * @var array
	 */
	public $fields;

	/**
	 * Modified datetime holder.
	 *
	 * @since 1.6.0
	 *
	 * @var string
	 */
	public $date_modified;

	/**
	 * Processing errors.
	 *
	 * @since 1.6.0
	 *
	 * @var array
	 */
	public $errors;

	/**
	 * Determine if the user is viewing the entry edit page, if so, party on.
	 *
	 * @since 1.6.0
	 */
	public function init() {

		if ( $this->is_admin_entry_editing_ajax() ) {
			$entry_id = isset( $_POST['wpforms']['entry_id'] ) ? absint( wp_unslash( $_POST['wpforms']['entry_id'] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification
		} else {
			$entry_id = isset( $_GET['entry_id'] ) ? absint( wp_unslash( $_GET['entry_id'] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification
		}

		// Check permissions and other constraints.
		if ( ! is_admin() || ! wpforms_current_user_can( 'edit_entry_single', $entry_id ) ) {
			return;
		}

		$this->hooks();
	}

	/**
	 * Hooks.
	 *
	 * @since 1.6.0
	 */
	private function hooks() {

		if ( $this->is_admin_entry_editing_ajax() ) {

			remove_action( 'wp_ajax_wpforms_submit', [ wpforms()->process, 'ajax_submit' ] );
			// Submit action AJAX endpoint.
			add_action( 'wp_ajax_wpforms_submit', [ $this, 'ajax_submit' ] );

			return;
		}

		// Check view entry page.
		if ( wpforms_is_admin_page( 'entries', 'details' ) ) {

			add_action( 'wpforms_entry_details_sidebar_details_action', [ $this, 'display_edit_button' ], 10, 2 );

		}

		// Check edit entry page.
		if ( ! wpforms_is_admin_page( 'entries', 'edit' ) ) {

			return;
		}

		// Entry processing and setup.
		add_action( 'wpforms_entries_init', [ $this, 'setup' ], 10, 1 );

		do_action( 'wpforms_entries_init', 'edit' );

		// Instance of `\WPForms_Entries_Single` class.
		$entries_single = new \WPForms_Entries_Single();

		// Output. Entry edit page.
		add_action( 'wpforms_admin_page', [ $this, 'display_edit_page' ] );

		// Entry edit form.
		add_action( 'wpforms_pro_admin_entries_edit_content', [ $this, 'display_edit_form' ], 10, 2 );

		// Reuse Debug metabox from `\WPForms_Entries_Single` class.
		add_action( 'wpforms_pro_admin_entries_edit_content', [ $entries_single, 'details_debug' ], 50, 2 );

		// Update button.
		add_action( 'wpforms_entry_details_sidebar_details_action', [ $this, 'update_button' ], 10, 2 );

		// Reuse Details metabox from `\WPForms_Entries_Single` class.
		add_action( 'wpforms_pro_admin_entries_edit_sidebar', [ $entries_single, 'details_meta' ], 10, 2 );

		// Remove Screen Options tab from admin area header.
		add_filter( 'screen_options_show_screen', '__return_false' );

		// Enqueues.
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueues' ] );

		// Hook for add-ons.
		do_action( 'wpforms_pro_admin_entries_edit_init', $this );
	}

	/**
	 * Enqueue assets.
	 *
	 * @since 1.6.0
	 */
	public function enqueues() {

		if ( ! empty( $this->abort ) ) {
			return;
		}

		$this->enqueue_styles();
		$this->enqueue_scripts();

		if ( empty( $this->form_data['fields'] ) || ! is_array( $this->form_data['fields'] ) ) {
			return;
		}

		// Get a list of unique field types used in a form.
		$field_types = array_filter( wp_list_pluck( $this->form_data['fields'], 'type' ) );

		foreach ( $field_types as $field_type ) {
			$obj = $this->get_entries_edit_field_object( $field_type );
			$obj->enqueues();
		}
	}

	/**
	 * Enqueue styles.
	 *
	 * @since 1.6.0
	 */
	public function enqueue_styles() {

		wp_enqueue_media();

		$min = wpforms_get_min_suffix();

		// Frontend form base styles.
		wp_enqueue_style(
			'wpforms-base',
			WPFORMS_PLUGIN_URL . 'assets/css/wpforms-base.css',
			[],
			WPFORMS_VERSION
		);

		// Entry Edit styles.
		wp_enqueue_style(
			'wpforms-entry-edit',
			WPFORMS_PLUGIN_URL . "pro/assets/css/entry-edit{$min}.css",
			[],
			WPFORMS_VERSION
		);
	}

	/**
	 * Enqueue scripts.
	 *
	 * @since 1.6.0
	 */
	public function enqueue_scripts() {

		$min = wpforms_get_min_suffix();

		if ( wpforms_has_field_setting( 'input_mask', $this->form, true ) ) {
			// Load jQuery input mask library - https://github.com/RobinHerbots/jquery.inputmask.
			wp_enqueue_script(
				'wpforms-maskedinput',
				WPFORMS_PLUGIN_URL . 'assets/js/jquery.inputmask.bundle.min.js',
				[ 'jquery' ],
				'4.0.6',
				true
			);
		}

		// Load admin utils JS.
		wp_enqueue_script(
			'wpforms-admin-utils',
			WPFORMS_PLUGIN_URL . 'assets/js/admin-utils.js',
			[ 'jquery' ],
			WPFORMS_VERSION,
			true
		);

		// Load frontend base JS.
		wp_enqueue_script(
			'wpforms-frontend',
			WPFORMS_PLUGIN_URL . 'assets/js/wpforms.js',
			[ 'jquery' ],
			WPFORMS_VERSION,
			true
		);

		// Load admin JS.
		wp_enqueue_script(
			'wpforms-admin-edit-entry',
			WPFORMS_PLUGIN_URL . "pro/assets/js/admin/edit-entry{$min}.js",
			[ 'jquery' ],
			WPFORMS_VERSION,
			true
		);

		// Localize frontend strings.
		wp_localize_script(
			'wpforms-frontend',
			'wpforms_settings',
			wpforms()->frontend->get_strings()
		);

		// Localize edit entry strings.
		wp_localize_script(
			'wpforms-admin-edit-entry',
			'wpforms_admin_edit_entry',
			$this->get_localized_data()
		);
	}

	/**
	 * Get localized data.
	 *
	 * @since 1.6.0
	 */
	private function get_localized_data() {

		$data['strings'] = [
			'update'           => esc_html__( 'Update', 'wpforms' ),
			'success'          => esc_html__( 'Success', 'wpforms' ),
			'continue_editing' => esc_html__( 'Continue Editing', 'wpforms' ),
			'view_entry'       => esc_html__( 'View Entry', 'wpforms' ),
			'msg_saved'        => esc_html__( 'The entry was successfully saved.', 'wpforms' ),
		];

		// View Entry URL.
		$data['strings']['view_entry_url'] = add_query_arg(
			array(
				'page'     => 'wpforms-entries',
				'view'     => 'details',
				'entry_id' => $this->entry_id,
			),
			admin_url( 'admin.php' )
		);

		return $data;
	}

	/**
	 * Setup entry edit page data.
	 *
	 * This function does the error checking and variable setup.
	 *
	 * @since 1.6.0
	 */
	public function setup() {

		// No entry ID was provided, error.
		if ( empty( $_GET['entry_id'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			\WPForms_Admin_Notice::error( esc_html__( 'Invalid entry ID.', 'wpforms' ) );
			$this->abort = true;
			return;
		}

		// Find the entry.
		$entry = wpforms()->entry->get( (int) $_GET['entry_id'] ); // phpcs:ignore WordPress.Security.NonceVerification

		// No entry was found, error.
		if ( ! $entry || empty( $entry ) ) {
			\WPForms_Admin_Notice::error( esc_html__( 'Entry not found.', 'wpforms' ) );
			$this->abort = true;
			return;
		}

		// Find the form information.
		$form = wpforms()->form->get( $entry->form_id, [ 'cap' => 'edit_entries_form_single' ] );

		// No form was found, error.
		if ( ! $form || empty( $form ) ) {
			\WPForms_Admin_Notice::error( esc_html__( 'Form not found.', 'wpforms' ) );
			return;
		}

		// Form data.
		$form_data              = wpforms_decode( $form->post_content );
		$form->form_entries_url = add_query_arg(
			[
				'page'    => 'wpforms-entries',
				'view'    => 'list',
				'form_id' => absint( $form_data['id'] ),
			],
			admin_url( 'admin.php' )
		);

		// Make public.
		$this->entry        = $entry;
		$this->entry_id     = $entry->entry_id;
		$this->entry_fields = apply_filters( 'wpforms_entry_single_data', wpforms_decode( $entry->fields ), $entry, $form_data );
		$this->form         = $form;
		$this->form_data    = $form_data;

		// Lastly, mark entry as read if needed.
		if ( '1' !== $entry->viewed && empty( $_GET['action'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			$is_success = wpforms()->entry->update(
				$entry->entry_id,
				[
					'viewed' => '1',
				]
			);
		}

		if ( ! empty( $is_success ) ) {
			wpforms()->entry_meta->add(
				[
					'entry_id' => $entry->entry_id,
					'form_id'  => $form_data['id'],
					'user_id'  => get_current_user_id(),
					'type'     => 'log',
					'data'     => wpautop( sprintf( '<em>%s</em>', esc_html__( 'Entry read.', 'wpforms' ) ) ),
				],
				'entry_meta'
			);

			$this->entry->viewed     = '1';
			$this->entry->entry_logs = wpforms()->entry_meta->get_meta(
				[
					'entry_id' => $entry->entry_id,
					'type'     => 'log',
				]
			);
		}

		do_action( 'wpforms_pro_admin_entries_edit_setup', $this );
	}

	/**
	 * Edit button in Entry Details metabox on the single entry view page.
	 *
	 * @since 1.6.0
	 *
	 * @param object $entry     Submitted entry values.
	 * @param array  $form_data Form data and settings.
	 */
	public function display_edit_button( $entry, $form_data ) {

		if ( ! isset( $form_data['id'] ) || ! isset( $entry->entry_id ) ) {
			return;
		}

		if ( ! wpforms_current_user_can( 'edit_entries_form_single', $form_data['id'] ) ) {
			return;
		}

		// Edit Entry URL.
		$edit_url = add_query_arg(
			array(
				'page'     => 'wpforms-entries',
				'view'     => 'edit',
				'entry_id' => $entry->entry_id,
			),
			admin_url( 'admin.php' )
		);

		printf(
			'<div id="publishing-action">
				<a href="%s" class="button button-primary button-large">%s</a>
			</div>',
			esc_url( $edit_url ),
			esc_html__( 'Edit', 'wpforms' )
		);
	}

	/**
	 * Entry Edit page.
	 *
	 * @since 1.6.0
	 */
	public function display_edit_page() {

		if ( $this->abort ) {
			exit;
		}

		$entry     = $this->entry;
		$form_data = $this->form_data;
		$form_id   = ! empty( $form_data['id'] ) ? (int) $form_data['id'] : 0;

		$form_atts = [
			'id'    => 'wpforms-edit-entry-form',
			'class' => [ 'wpforms-form', 'wpforms-validate' ],
			'data'  => [
				'formid' => $form_id,
			],
			'atts'  => [
				'method'  => 'POST',
				'enctype' => 'multipart/form-data',
				'action'  => esc_url_raw( remove_query_arg( 'wpforms' ) ),
			],
		];
		?>

		<div id="wpforms-entries-single" class="wrap wpforms-admin-wrap">

			<h1 class="page-title">
				<?php esc_html_e( 'Edit Entry', 'wpforms' ); ?>
				<a href="<?php echo esc_url( $this->form->form_entries_url ); ?>" class="add-new-h2 wpforms-btn-orange"><?php esc_html_e( 'Back to All Entries', 'wpforms' ); ?></a>
			</h1>

			<div class="wpforms-admin-content">

				<div id="poststuff">

					<div id="post-body" class="metabox-holder columns-2">

						<?php
						printf( '<div class="wpforms-container wpforms-edit-entry-container" id="wpforms-%d">', (int) $form_id );
						echo '<form ' . wpforms_html_attributes( $form_atts['id'], $form_atts['class'], $form_atts['data'], $form_atts['atts'] ) . '>';
						?>

							<!-- Left column -->
							<div id="post-body-content" style="position: relative;">
								<?php do_action( 'wpforms_pro_admin_entries_edit_content', $entry, $form_data, $this ); ?>
							</div>

							<!-- Right column -->
							<div id="postbox-container-1" class="postbox-container">
								<?php do_action( 'wpforms_pro_admin_entries_edit_sidebar', $entry, $form_data, $this ); ?>
							</div>

						</form>
						</div>

					</div>

				</div>

			</div>

		</div>
		<?php
	}

	/**
	 * Edit entry form metabox.
	 *
	 * @since 1.6.0
	 *
	 * @param object $entry     Submitted entry values.
	 * @param array  $form_data Form data and settings.
	 */
	public function display_edit_form( $entry, $form_data ) {

		$hide_empty = isset( $_COOKIE['wpforms_entry_hide_empty'] ) && 'true' === $_COOKIE['wpforms_entry_hide_empty'];
		?>
		<!-- Edit Entry Form metabox -->
		<div id="wpforms-entry-fields" class="postbox">

			<h2 class="hndle">
				<?php echo '1' === (string) $entry->starred ? '<span class="dashicons dashicons-star-filled"></span>' : ''; ?>
				<span><?php echo esc_html( $form_data['settings']['form_title'] ); ?></span>
				<a href="#" class="wpforms-empty-field-toggle">
					<?php echo $hide_empty ? esc_html__( 'Show Empty Fields', 'wpforms' ) : esc_html__( 'Hide Empty Fields', 'wpforms' ); ?>
				</a>
			</h2>

			<div class="inside">

				<?php
				if ( empty( $this->entry_fields ) ) {

					// Whoops, no fields! This shouldn't happen under normal use cases.
					echo '<p class="no-fields">' . esc_html__( 'This entry does not have any fields', 'wpforms' ) . '</p>';

				} else {

					// Display the fields and their editable values.
					$this->display_edit_form_fields( $this->entry_fields, $form_data, $hide_empty );

				}
				?>

			</div>

		</div>
		<?php
	}

	/**
	 * Edit entry form fields.
	 *
	 * @since 1.6.0
	 *
	 * @param array $entry_fields Entry fields data.
	 * @param array $form_data    Form data and settings.
	 * @param bool  $hide_empty   Flag to hide empty fields.
	 */
	private function display_edit_form_fields( $entry_fields, $form_data, $hide_empty ) {

		$form_id = (int) $form_data['id'];

		echo '<input type="hidden" name="wpforms[id]" value="' . esc_attr( $form_id ) . '">';
		echo '<input type="hidden" name="wpforms[entry_id]" value="' . esc_attr( $this->entry->entry_id ) . '">';
		echo '<input type="hidden" name="nonce" value="' . esc_attr( wp_create_nonce( 'wpforms-entry-edit-' . $form_id . '-' . $this->entry->entry_id ) ) . '">';

		if ( empty( $form_data['fields'] ) || ! is_array( $form_data['fields'] ) ) {
			echo '<div class="wpforms-edit-entry-field empty">';
			$this->display_edit_form_field_no_fields();
			echo '</div>';

			return;
		}

		foreach ( $form_data['fields'] as $field_id => $field ) {
			$this->display_edit_form_field( $field_id, $field, $entry_fields, $form_data, $hide_empty );
		}
	}

	/**
	 * Edit entry form field.
	 *
	 * @since 1.6.0
	 *
	 * @param int   $field_id     Field id.
	 * @param array $field        Field data.
	 * @param array $entry_fields Entry fields data.
	 * @param array $form_data    Form data and settings.
	 * @param bool  $hide_empty   Flag to hide empty fields.
	 */
	private function display_edit_form_field( $field_id, $field, $entry_fields, $form_data, $hide_empty ) {

		$field_type = ! empty( $field['type'] ) ? $field['type'] : '';

		// Do not display some fields at all.
		if ( ! $this->is_field_can_be_displayed( $field_type ) ) {
			return;
		}

		$entry_field = ! empty( $entry_fields[ $field_id ] ) ? $entry_fields[ $field_id ] : $this->get_empty_entry_field_data( $field );

		$field_value = ! empty( $entry_field['value'] ) ? $entry_field['value'] : '';
		$field_value = apply_filters( 'wpforms_html_field_value', wp_strip_all_tags( $field_value ), $entry_field, $form_data, 'entry-single' );

		$field_class  = ! empty( $field['type'] ) ? sanitize_html_class( 'wpforms-edit-entry-field-' . $field['type'] ) : '';
		$field_class .= wpforms_is_empty_string( $field_value ) ? ' empty' : '';
		$field_class .= ! empty( $field['required'] ) ? ' wpforms-entry-field-required' : '';

		$field_style = $hide_empty && empty( $entry_field['value'] ) ? 'display:none;' : '';

		echo '<div class="wpforms-edit-entry-field ' . esc_attr( $field_class ) . '" style="' . esc_attr( $field_style ) . '">';

		// Field label.
		printf(
			'<p class="wpforms-entry-field-name">%s</p>',
			/* translators: %d - field ID. */
			! empty( $field['label'] ) ? esc_html( wp_strip_all_tags( $field['label'] ) ) : sprintf( esc_html__( 'Field ID #%d', 'wpforms' ), (int) $field_id )
		);

		// Add properties to the field.
		$field['properties'] = wpforms()->frontend->get_field_properties( $field, $form_data );

		// Field output.
		if ( apply_filters( 'wpforms_pro_admin_entries_edit_field_output_editable', $this->is_field_entries_editable( $field['type'] ), $field ) ) {
			$this->display_edit_form_field_editable( $entry_field, $field, $form_data );
		} else {
			$this->display_edit_form_field_non_editable( $field_value );
		}

		echo '</div>';
	}

	/**
	 * Edit entry editable form field.
	 *
	 * @since 1.6.0
	 *
	 * @param array $entry_field Entry field data.
	 * @param array $field       Field data.
	 * @param array $form_data   Form data and settings.
	 */
	private function display_edit_form_field_editable( $entry_field, $field, $form_data ) {

		wpforms()->frontend->field_container_open( $field, $form_data );

		$field_object = $this->get_entries_edit_field_object( $field['type'] );

		$field_object->field_display( $entry_field, $field, $form_data );

		echo '</div>';
	}

	/**
	 * Edit entry non-editable form field.
	 *
	 * @since 1.6.0
	 *
	 * @param string $field_value Field value.
	 */
	private function display_edit_form_field_non_editable( $field_value ) {

		echo '<p class="wpforms-entry-field-value">';
		echo ! wpforms_is_empty_string( $field_value ) ?
			nl2br( make_clickable( $field_value ) ) : // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			esc_html__( 'Empty', 'wpforms' );
		echo '</p>';
	}

	/**
	 * Display a message about no fields in a form.
	 *
	 * @since 1.6.0.2
	 */
	private function display_edit_form_field_no_fields() {

		echo '<p class="wpforms-entry-field-value">';

		if ( \wpforms_current_user_can( 'edit_form_single', $this->form_data['id'] ) ) {
			$edit_url = add_query_arg(
				array(
					'page'    => 'wpforms-builder',
					'view'    => 'fields',
					'form_id' => absint( $this->form_data['id'] ),
				),
				admin_url( 'admin.php' )
			);
			printf(
				wp_kses( /* translators: %s - form edit URL. */
					__( 'You don\'t have any fields in this form. <a href="%s">Add some!</a>', 'wpforms' ),
					[
						'a' => [
							'href' => [],
						],
					]
				),
				esc_url( $edit_url )
			);
		} else {
			esc_html_e( 'You don\'t have any fields in this form.', 'wpforms' );
		}

		echo '</p>';
	}

	/**
	 * Add Update Button to Entry Meta Details metabox actions.
	 *
	 * @since 1.6.0
	 *
	 * @param object $entry     Entry data.
	 * @param array  $form_data Form data.
	 */
	public function update_button( $entry, $form_data ) {

		printf(
			'<div id="publishing-action">
				<button class="button button-primary button-large wpforms-submit" id="wpforms-edit-entry-update">%s</button>
				<img src="%sassets/images/submit-spin.svg" class="wpforms-submit-spinner" style="display: none;">
			</div>',
			esc_html__( 'Update', 'wpforms' ),
			esc_url( WPFORMS_PLUGIN_URL )
		);
	}

	/**
	 * AJAX form submit.
	 *
	 * @since 1.6.0
	 */
	public function ajax_submit() {

		$this->form_id  = ! empty( $_POST['wpforms']['id'] ) ? (int) $_POST['wpforms']['id'] : 0;
		$this->entry_id = ! empty( $_POST['wpforms']['entry_id'] ) ? (int) $_POST['wpforms']['entry_id'] : 0;
		$this->errors   = [];

		if ( empty( $this->form_id ) ) {
			$this->errors['header'] = esc_html__( 'Invalid form.', 'wpforms' );
		}

		if ( empty( $this->entry_id ) ) {
			$this->errors['header'] = esc_html__( 'Invalid Entry.', 'wpforms' );
		}

		if ( empty( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['nonce'] ), 'wpforms-entry-edit-' . $this->form_id . '-' . $this->entry_id ) ) {
			$this->errors['header'] = esc_html__( 'You do not have permission to perform this action.', 'wpforms' );
		}

		if ( ! empty( $this->errors['header'] ) ) {
			$this->process_errors();
		}

		// Hook for add-ons.
		do_action( 'wpforms_pro_admin_entries_edit_submit_before_processing', $this->form_id, $this->entry_id );

		// Process the data.
		$this->process( stripslashes_deep( wp_unslash( $_POST['wpforms'] ) ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	}

	/**
	 * Process the form entry updating.
	 *
	 * @since 1.6.0
	 *
	 * @param array $entry Form submission raw data ($_POST).
	 */
	private function process( $entry ) {

		// Setup variables.
		$this->fields = [];
		$this->entry  = wpforms()->entry->get( $this->entry_id );
		$form_id      = $this->form_id;
		$this->form   = wpforms()->form->get( $this->form_id, [ 'cap' => 'edit_entries_form_single' ] );

		// Validate form is real.
		if ( ! $this->form ) {
			$this->errors['header'] = esc_html__( 'Invalid form.', 'wpforms' );
			$this->process_errors();
			return;
		}

		// Validate entry is real.
		if ( ! $this->entry ) {
			$this->errors['header'] = esc_html__( 'Invalid entry.', 'wpforms' );
			$this->process_errors();
			return;
		}

		// Formatted form data for hooks.
		$this->form_data = apply_filters( 'wpforms_pro_admin_entries_edit_process_before_form_data', wpforms_decode( $this->form->post_content ), $entry );

		$this->form_data['created'] = $this->form->post_date;

		// Existing entry fields data.
		$this->entry_fields = apply_filters( 'wpforms_pro_admin_entries_edit_existing_entry_fields', wpforms_decode( $this->entry->fields ), $this->entry, $this->form_data );

		// Pre-process/validate hooks and filter.
		// Data is not validated or cleaned yet so use with caution.
		$entry = apply_filters( 'wpforms_pro_admin_entries_edit_process_before_filter', $entry, $this->form_data );

		do_action( 'wpforms_pro_admin_entries_edit_process_before', $entry, $this->form_data );
		do_action( "wpforms_pro_admin_entries_edit_process_before_{$this->form_id}", $entry, $this->form_data );

		// Validate fields.
		$this->process_fields( $entry, 'validate' );

		// Validation errors.
		if ( ! empty( wpforms()->process->errors[ $form_id ] ) ) {
			$this->errors = wpforms()->process->errors[ $form_id ];
			if ( empty( $this->errors['header'] ) ) {
				$this->errors['header'] = esc_html__( 'Entry has not been saved, please see the fields errors.', 'wpforms' );
			}
			$this->process_errors();
			exit;
		}

		// Format fields.
		$this->process_fields( $entry, 'format' );

		// This hook is for internal purposes and should not be leveraged.
		do_action( 'wpforms_pro_admin_entries_edit_process_format_after', $this->form_data );

		// Entries edit process hooks/filter.
		$this->fields = apply_filters( 'wpforms_pro_admin_entries_edit_process_filter', wpforms()->process->fields, $entry, $this->form_data );

		do_action( 'wpforms_pro_admin_entries_edit_process', $this->fields, $entry, $this->form_data );
		do_action( "wpforms_pro_admin_entries_edit_process_{$form_id}", $this->fields, $entry, $this->form_data );

		$this->fields = apply_filters( 'wpforms_pro_admin_entries_edit_process_after_filter', $this->fields, $entry, $this->form_data );

		// Success - update data and send success.
		$this->process_update();
	}

	/**
	 * Process entry fields: validate or format.
	 *
	 * @since 1.6.0
	 *
	 * @param array  $entry  Submitted entry data.
	 * @param string $action Action to perform: `validate` or `format`.
	 */
	private function process_fields( $entry, $action = 'validate' ) {

		if ( empty( $this->form_data['fields'] ) ) {
			return;
		}

		$form_data = $this->form_data;

		$action = empty( $action ) ? 'validate' : $action;

		foreach ( (array) $form_data['fields']  as $field_properties ) {

			if ( ! $this->is_field_entries_editable( $field_properties['type'] ) ) {
				continue;
			}

			$field_id     = isset( $field_properties['id'] ) ? $field_properties['id'] : '0';
			$field_type   = ! empty( $field_properties['type'] ) ? $field_properties['type'] : '';
			$field_submit = isset( $entry['fields'][ $field_id ] ) ? $entry['fields'][ $field_id ] : '';
			$field_data   = ! empty( $this->entry_fields[ $field_id ] ) ? $this->entry_fields[ $field_id ] : $this->get_empty_entry_field_data( $field_properties );

			if ( $action === 'validate' ) {

				// Some fields can be `required` but have an empty value because the field is hidden by CL on the frontend.
				// For cases like this we should allow empty value even for the `required` fields.
				if (
					! empty( $form_data['fields'][ $field_id ]['required'] ) &&
					(
						! isset( $field_data['value'] ) ||
						(string) $field_data['value'] === ''
					)
				) {
					unset( $form_data['fields'][ $field_id ]['required'] );
				}
			}

			if ( $action === 'validate' || $action === 'format' ) {
				$this->get_entries_edit_field_object( $field_type )->$action( $field_id, $field_submit, $field_data, $form_data );
			}
		}
	}

	/**
	 * Update entry data.
	 *
	 * @since 1.6.0
	 */
	private function process_update() {

		// Update entry fields.
		$updated_fields = $this->process_update_fields_data();

		// Silently return success if no changes performed.
		if ( empty( $updated_fields ) ) {
			wp_send_json_success();
		}

		// Update entry.
		$entry_data = [
			'fields'        => wp_json_encode( $this->get_updated_entry_fields( $updated_fields ) ),
			'date_modified' => $this->date_modified,
		];
		wpforms()->entry->update( $this->entry_id, $entry_data, '', 'edit_entry', [ 'cap' => 'edit_entry_single' ] );

		// Add record to entry meta.
		wpforms()->entry_meta->add(
			[
				'entry_id' => (int) $this->entry_id,
				'form_id'  => (int) $this->form_data['id'],
				'user_id'  => get_current_user_id(),
				'type'     => 'log',
				'data'     => wpautop( sprintf( '<em>%s</em>', esc_html__( 'Entry edited.', 'wpforms' ) ) ),
			],
			'entry_meta'
		);

		$response = [
			'modified' => esc_html( date_i18n( get_option( 'date_format' ) . ' @ ' . get_option( 'time_format' ), strtotime( $this->date_modified ) + ( get_option( 'gmt_offset' ) * 3600 ) ) ),
		];

		do_action( 'wpforms_pro_admin_entries_edit_submit_completed', $this->form_data, $response, $updated_fields, $this->entry );

		wp_send_json_success( $response );
	}

	/**
	 * Update entry fields data.
	 *
	 * @since 1.6.0
	 *
	 * @return array Updated fields data.
	 */
	private function process_update_fields_data() {

		$updated_fields = [];

		if ( ! is_array( $this->fields ) ) {
			return $updated_fields;
		}

		// Get saved fields data from DB.
		$entry_fields_obj = wpforms()->entry_fields;
		$dbdata_result    = $entry_fields_obj->get_fields( [ 'entry_id' => $this->entry_id ] );
		$dbdata_fields    = [];
		if ( ! empty( $dbdata_result ) ) {
			$dbdata_fields = array_combine( wp_list_pluck( $dbdata_result, 'field_id' ), $dbdata_result );
			$dbdata_fields = array_map( 'get_object_vars', $dbdata_fields );
		}

		$this->date_modified = current_time( 'Y-m-d H:i:s' );

		foreach ( $this->fields as $field ) {
			$save_field          = apply_filters( 'wpforms_entry_save_fields', $field, $this->form_data, $this->entry_id );
			$field_id            = $save_field['id'];
			$field_type          = empty( $save_field['type'] ) ? '' : $save_field['type'];
			$save_field['value'] = empty( $save_field['value'] ) ? '' : (string) $save_field['value'];
			$dbdata_value_exist  = isset( $dbdata_fields[ $field_id ]['value'] );

			// Process the field only if value was changed or not existed in DB at all. Also check if field is editable.
			if (
				! $this->is_field_entries_editable( $field_type ) ||
				(
					$dbdata_value_exist &&
					isset( $save_field['value'] ) &&
					(string) $dbdata_fields[ $field_id ]['value'] === $save_field['value']
				)
			) {
				continue;
			}

			if ( $dbdata_value_exist ) {
				// Update field data in DB.
				$entry_fields_obj->update(
					(int) $dbdata_fields[ $field_id ]['id'],
					[
						'value' => $save_field['value'],
						'date'  => $this->date_modified,
					],
					'id',
					'edit_entry'
				);
			} else {
				// Add field data to DB.
				$entry_fields_obj->add(
					[
						'entry_id' => $this->entry_id,
						'form_id'  => (int) $this->form_data['id'],
						'field_id' => (int) $field_id,
						'value'    => $save_field['value'],
						'date'     => $this->date_modified,
					]
				);
			}
			$updated_fields[ $field_id ] = $field;
		}

		return $updated_fields;
	}

	/**
	 * Process validation errors.
	 *
	 * @since 1.6.0
	 */
	private function process_errors() {

		$errors = $this->errors;

		if ( empty( $errors ) ) {
			wp_send_json_error();
		}

		$fields       = isset( $this->form_data['fields'] ) ? $this->form_data['fields'] : [];
		$field_errors = array_intersect_key( $errors, $fields );

		$response = [];

		$response['errors']['general'] = ! empty( $errors['header'] ) ? wpautop( esc_html( $errors['header'] ) ) : '';
		$response['errors']['field']   = ! empty( $field_errors ) ? $field_errors : [];

		$response = apply_filters( 'wpforms_pro_admin_entries_edit_submit_errors_response', $response, $this->form_data );

		do_action( 'wpforms_pro_admin_entries_edit_submit_completed', $this->form_data, $response, [], $this->entry );

		wp_send_json_error( $response );
	}

	/**
	 * Get updated entry fields data.
	 * Combine existing entry fields with updated fields keeping the original fields order.
	 *
	 * @since 1.6.0
	 *
	 * @param array $updated_fields Updated fields data.
	 *
	 * @return array Updated entry fields data.
	 */
	private function get_updated_entry_fields( $updated_fields ) {

		if ( empty( $updated_fields ) ) {
			return $this->entry_fields;
		}

		$result_fields = [];
		$form_fields   = ! empty( $this->form_data['fields'] ) ? $this->form_data['fields'] : [];

		foreach ( $form_fields as $field_id => $field ) {
			$entry_field = isset( $this->entry_fields[ $field_id ] ) ?
							$this->entry_fields[ $field_id ] :
							$this->get_empty_entry_field_data( $field );

			$result_fields[ $field_id ] = isset( $updated_fields[ $field_id ] ) ? $updated_fields[ $field_id ] : $entry_field;
		}
		return $result_fields;
	}

	/**
	 * Get empty entry field data.
	 *
	 * @since 1.6.0
	 *
	 * @param array $field_properties Field properties.
	 *
	 * @return array Empty entry field data.
	 */
	public function get_empty_entry_field_data( $field_properties ) {

		return [
			'name'      => ! empty( $field_properties['label'] ) ? $field_properties['label'] : '',
			'value'     => '',
			'value_raw' => '',
			'id'        => ! empty( $field_properties['id'] ) ? $field_properties['id'] : '',
			'type'      => ! empty( $field_properties['type'] ) ? $field_properties['type'] : '',
		];
	}

	/**
	 * Check if the field can be displayed.
	 *
	 * @since 1.6.0
	 *
	 * @param string $type Field type.
	 *
	 * @return bool
	 */
	private function is_field_can_be_displayed( $type ) {

		$dont_display = [ 'divider', 'html', 'pagebreak' ];

		return ! empty( $type ) && ! in_array( $type, (array) apply_filters( 'wpforms_pro_admin_entries_edit_fields_dont_display', $dont_display ), true );
	}

	/**
	 * Check if the field entries are editable.
	 *
	 * @since 1.6.0
	 *
	 * @param string $type Field type.
	 *
	 * @return bool
	 */
	private function is_field_entries_editable( $type ) {

		$editable_types = [
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
			'url',
		];

		$editable = in_array( $type, $editable_types, true );

		return (bool) apply_filters( 'wpforms_pro_admin_entries_edit_field_editable', $editable, $type );
	}

	/**
	 * Get entry editing field object.
	 *
	 * @since 1.6.0
	 *
	 * @param string $type Field type.
	 *
	 * @return \WPForms\Pro\Forms\Fields\Base\EntriesEdit
	 */
	private function get_entries_edit_field_object( $type ) {

		// Runtime objects holder.
		static $objects = [];

		// Getting the class name.
		$class_name = implode( '', array_map( 'ucfirst', explode( '-', $type ) ) );
		$class_name = '\WPForms\Pro\Forms\Fields\\' . $class_name . '\EntriesEdit';

		// Init object if needed.
		if ( empty( $objects[ $type ] ) ) {
			$objects[ $type ] = class_exists( $class_name ) ? new $class_name() : new EntriesEdit( $type );
		}

		return apply_filters( "wpforms_pro_admin_entries_edit_field_object_{$type}", $objects[ $type ] );
	}

	/**
	 * Helper function to determine if it is admin entry editing ajax request.
	 *
	 * @since 1.6.0
	 *
	 * @return boolean
	 */
	public function is_admin_entry_editing_ajax() {

		if ( ! wp_doing_ajax() ) {
			return false;
		}

		$ref = wp_get_referer();

		if ( ! $ref ) {
			return false;
		}

		$query = wp_parse_url( $ref, PHP_URL_QUERY );
		wp_parse_str( $query, $query_vars );

		if (
			empty( $query_vars['page'] ) ||
			empty( $query_vars['view'] ) ||
			empty( $query_vars['entry_id'] )
		) {
			return false;
		}

		if (
			$query_vars['page'] !== 'wpforms-entries' ||
			$query_vars['view'] !== 'edit'
		) {
			return false;
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing
		if (
			empty( $_POST['wpforms']['entry_id'] ) ||
			empty( $_POST['action'] ) ||
			empty( $_POST['nonce'] )
		) {
			return false;
		}

		if ( $_POST['action'] !== 'wpforms_submit' ) {
			return false;
		}
		// phpcs:enable WordPress.Security.NonceVerification.Missing

		return true;
	}
}
