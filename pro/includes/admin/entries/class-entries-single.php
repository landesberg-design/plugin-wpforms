<?php
/**
 * Display information about a single form entry.
 *
 * Previously list and single views were contained in a single class,
 * however were separated in v1.3.9.
 *
 * @since 1.3.9
 */
class WPForms_Entries_Single {

	/**
	 * Hold admin alerts.
	 *
	 * @since 1.1.6
	 *
	 * @var array
	 */
	public $alerts = array();

	/**
	 * Abort. Bail on proceeding to process the page.
	 *
	 * @since 1.1.6
	 * @var bool
	 */
	public $abort = false;

	/**
	 * Form object.
	 *
	 * @since 1.1.6
	 * @var object
	 */
	public $form;

	/**
	 * Entry object.
	 *
	 * @since 1.1.6
	 * @var object
	 */
	public $entry;

	/**
	 * Primary class constructor.
	 *
	 * @since 1.3.9
	 */
	public function __construct() {

		// Maybe load entries page.
		add_action( 'admin_init', array( $this, 'init' ) );
	}

	/**
	 * Determine if the user is viewing the single entry page, if so, party on.
	 *
	 * @since 1.3.9
	 */
	public function init() {

		$entry_id = isset( $_GET['entry_id'] ) ? absint( wp_unslash( $_GET['entry_id'] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification

		if ( ! \wpforms_current_user_can( 'view_entry_single', $entry_id ) ) {
			return;
		}

		// Check page and view.
		$page = ! empty( $_GET['page'] ) ? sanitize_key( $_GET['page'] ) : '';
		$view = ! empty( $_GET['view'] ) ? sanitize_key( $_GET['view'] ) : '';

		if ( 'wpforms-entries' === $page && 'details' === $view ) {

			// Entry processing and setup.
			add_action( 'wpforms_entries_init', array( $this, 'process_star' ), 8, 1 );
			add_action( 'wpforms_entries_init', array( $this, 'process_unread' ), 8, 1 );
			add_action( 'wpforms_entries_init', array( $this, 'process_note_delete' ), 8, 1 );
			add_action( 'wpforms_entries_init', array( $this, 'process_note_add' ), 8, 1 );
			add_action( 'wpforms_entries_init', array( $this, 'process_notifications' ), 15, 1 );
			add_action( 'wpforms_entries_init', array( $this, 'setup' ), 10, 1 );

			do_action( 'wpforms_entries_init', 'details' );

			// Output. Entry content and metaboxes.
			add_action( 'wpforms_admin_page', array( $this, 'details' ) );
			add_action( 'wpforms_entry_details_content', array( $this, 'details_fields' ), 10, 2 );
			add_action( 'wpforms_entry_details_content', array( $this, 'details_notes' ), 10, 2 );
			add_action( 'wpforms_entry_details_content', array( $this, 'details_log' ), 40, 2 );
			add_action( 'wpforms_entry_details_content', array( $this, 'details_debug' ), 50, 2 );
			add_action( 'wpforms_entry_details_sidebar', array( $this, 'details_meta' ), 10, 2 );
			add_action( 'wpforms_entry_details_sidebar', array( $this, 'details_payment' ), 15, 2 );
			add_action( 'wpforms_entry_details_sidebar', array( $this, 'details_actions' ), 20, 2 );
			add_action( 'wpforms_entry_details_sidebar', array( $this, 'details_related' ), 20, 2 );

			// Remove Screen Options tab from admin area header.
			add_filter( 'screen_options_show_screen', '__return_false' );

			// Enqueues.
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueues' ) );
		}
	}

	/**
	 * Enqueue assets.
	 *
	 * @since 1.3.9
	 */
	public function enqueues() {

		wp_enqueue_media();

		// Hook for addons.
		do_action( 'wpforms_entries_enqueue', 'details', $this );
	}

	/**
	 * Watch for and run single entry exports.
	 *
	 * @since 1.1.6
	 */
	public function process_export() {
		// Check for run switch.
		if ( empty( $_GET['export'] ) || ! is_numeric( $_GET['export'] ) ) {
			return;
		}

		_deprecated_function( __CLASS__ . '::' . __METHOD__, '1.5.5 of WPForms plugin', 'WPForms\Pro\Admin\Export\Export class' );

		// Security check
		if ( empty( $_GET['_wpnonce'] ) || ! wp_verify_nonce( $_GET['_wpnonce'], 'wpforms_entry_details_export' ) ) {
			return;
		}
		require_once WPFORMS_PLUGIN_DIR . 'pro/includes/admin/entries/class-entries-export.php';
		$export = new WPForms_Entries_Export();
		$export->entry_type = absint( $_GET['export'] );
		$export->export();
	}

	/**
	 * Watch for and run starring/unstarring entry.
	 *
	 * @since 1.1.6
	 * @since 1.5.7 Added creation entry note for Entry Star action.
	 *
	 * @todo Convert to AJAX
	 */
	public function process_star() {

		// Security check.
		if ( empty( $_GET['_wpnonce'] ) || ! wp_verify_nonce( $_GET['_wpnonce'], 'wpforms_entry_details_star' ) ) {
			return;
		}

		$redirect_url = '';

		// Check for starring.
		if ( ! empty( $_GET['entry_id'] ) && ! empty( $_GET['action'] ) && 'star' === $_GET['action'] ) {

			wpforms()->entry->update(
				absint( $_GET['entry_id'] ),
				array(
					'starred' => '1',
				)
			);

			if ( ! empty( $_GET['form'] ) ) {
				wpforms()->entry_meta->add(
					array(
						'entry_id' => absint( $_GET['entry_id'] ),
						'form_id'  => absint( $_GET['form'] ),
						'user_id'  => get_current_user_id(),
						'type'     => 'log',
						'data'     => wpautop( sprintf( '<em>%s</em>', esc_html__( 'Entry starred.', 'wpforms' ) ) ),
					),
					'entry_meta'
				);

				$redirect_url = remove_query_arg( 'form' );
			}

			$this->alerts[] = array(
				'type'    => 'success',
				'message' => esc_html__( 'This entry has been starred.', 'wpforms' ),
				'dismiss' => true,
			);
		}

		// Check for unstarring.
		if ( ! empty( $_GET['entry_id'] ) && ! empty( $_GET['action'] ) && 'unstar' === $_GET['action'] ) {

			wpforms()->entry->update(
				absint( $_GET['entry_id'] ),
				array(
					'starred' => '0',
				)
			);

			if ( ! empty( $_GET['form'] ) ) {
				wpforms()->entry_meta->add(
					array(
						'entry_id' => absint( $_GET['entry_id'] ),
						'form_id'  => absint( $_GET['form'] ),
						'user_id'  => get_current_user_id(),
						'type'     => 'log',
						'data'     => wpautop( sprintf( '<em>%s</em>', esc_html__( 'Entry unstarred.', 'wpforms' ) ) ),
					),
					'entry_meta'
				);

				$redirect_url = remove_query_arg( 'form' );
			}

			$this->alerts[] = array(
				'type'    => 'success',
				'message' => esc_html__( 'This entry has been unstarred.', 'wpforms' ),
				'dismiss' => true,
			);
		}

		// Clean URL before the next page refresh - stop create a new note.
		if ( ! empty( $redirect_url ) ) {
			wp_safe_redirect( $redirect_url );
			exit;
		}
	}

	/**
	 * Watch for and run entry unread toggle.
	 *
	 * @todo Convert to AJAX.
	 *
	 * @since 1.1.6
	 */
	public function process_unread() {

		// Security check.
		if ( empty( $_GET['_wpnonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ), 'wpforms_entry_details_unread' ) ) {
			return;
		}

		// Check for run switch.
		if ( empty( $_GET['entry_id'] ) || empty( $_GET['action'] ) || 'unread' !== $_GET['action'] ) {
			return;
		}

		$entry_id = absint( $_GET['entry_id'] );

		// Capability check.
		if ( ! \wpforms_current_user_can( 'view_entry_single', $entry_id ) ) {
			return;
		}

		$is_success = wpforms()->entry->update(
			$entry_id,
			array(
				'viewed' => '0',
			)
		);

		if ( ! $is_success ) {
			return;
		}

		if ( ! empty( $_GET['form'] ) ) {
			wpforms()->entry_meta->add(
				array(
					'entry_id' => $entry_id,
					'form_id'  => absint( $_GET['form'] ),
					'user_id'  => get_current_user_id(),
					'type'     => 'log',
					'data'     => wpautop( sprintf( '<em>%s</em>', esc_html__( 'Entry unread.', 'wpforms' ) ) ),
				),
				'entry_meta'
			);
		}

		$this->alerts[] = array(
			'type'    => 'success',
			'message' => esc_html__( 'This entry has been marked unread.', 'wpforms' ),
			'dismiss' => true,
		);
	}

	/**
	 * Watch for and run entry note deletion.
	 *
	 * @todo Convert to AJAX.
	 *
	 * @since 1.1.6
	 */
	public function process_note_delete() {

		// Security check.
		if ( empty( $_GET['_wpnonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ), 'wpforms_entry_details_deletenote' ) ) {
			return;
		}

		if ( empty( $_GET['note_id'] ) || empty( $_GET['entry_id'] ) ) {
			return;
		}

		if ( empty( $_GET['action'] ) || 'delete_note' !== $_GET['action'] ) {
			return;
		}

		$note_id  = absint( $_GET['note_id'] );
		$entry_id = absint( $_GET['entry_id'] );

		// Capability check.
		if ( ! \wpforms_current_user_can( 'edit_entry_single', $entry_id ) ) {
			return;
		}

		$deleted = wpforms()->entry_meta->delete( $note_id );

		if ( ! $deleted ) {
			return;
		}

		$this->alerts[] = array(
			'type'    => 'success',
			'message' => esc_html__( 'Note deleted.', 'wpforms' ),
			'dismiss' => true,
		);
	}

	/**
	 * Watch for and run creating entry notes.
	 *
	 * @todo Convert to AJAX
	 *
	 * @since 1.1.6
	 */
	public function process_note_add() {

		// Check for post trigger and required vars.
		if ( empty( $_POST['wpforms_add_note'] ) || empty( $_POST['entry_id'] ) || empty( $_POST['form_id'] ) ) {
			return;
		}

		// Security check.
		if ( empty( $_POST['_wpnonce'] ) || ! wp_verify_nonce( $_POST['_wpnonce'], 'wpforms_entry_details_addnote' ) ) {
			return;
		}

		// Bail if note has no content.
		if ( empty( $_POST['entry_note'] ) ) {
			return;
		}

		wpforms()->entry_meta->add(
			array(
				'entry_id' => absint( $_POST['entry_id'] ),
				'form_id'  => absint( $_POST['form_id'] ),
				'user_id'  => get_current_user_id(),
				'type'     => 'note',
				'data'     => wpautop( wp_kses_post( wp_unslash( $_POST['entry_note'] ) ) ),
			),
			'entry_meta'
		);

		$this->alerts[] = array(
			'type'    => 'success',
			'message' => esc_html__( 'Note added.', 'wpforms' ),
			'dismiss' => true,
		);
	}

	/**
	 * Watch for and run single entry notifications.
	 *
	 * @since 1.1.6
	 */
	public function process_notifications() {

		// Check for run switch.
		if ( empty( $_GET['action'] ) || 'notifications' !== $_GET['action'] ) {
			return;
		}

		// Security check.
		if ( empty( $_GET['_wpnonce'] ) || ! wp_verify_nonce( $_GET['_wpnonce'], 'wpforms_entry_details_notifications' ) ) {
			return;
		}

		// Check for existing errors.
		if ( $this->abort || empty( $this->entry ) || empty( $this->form ) ) {
			return;
		}

		$fields    = wpforms_decode( $this->entry->fields );
		$form_data = wpforms_decode( $this->form->post_content );

		wpforms()->process->entry_email( $fields, array(), $form_data, $this->entry->entry_id );

		$this->alerts[] = array(
			'type'    => 'success',
			'message' => esc_html__( 'Notifications were resent!', 'wpforms' ),
			'dismiss' => true,
		);
	}

	/**
	 * Setup entry details data.
	 *
	 * This function does the error checking and variable setup.
	 *
	 * @since 1.1.6
	 */
	public function setup() {

		// No entry ID was provided, error.
		if ( empty( $_GET['entry_id'] ) ) {
			$this->alerts[] = array(
				'type'    => 'error',
				'message' => esc_html__( 'Invalid entry ID.', 'wpforms' ),
				'abort'   => true,
			);
			return;
		}

		// Find the entry.
		$entry = wpforms()->entry->get( absint( $_GET['entry_id'] ) );

		// No entry was found, error.
		if ( ! $entry || empty( $entry ) ) {
			$this->alerts[] = array(
				'type'    => 'error',
				'message' => esc_html__( 'Entry not found.', 'wpforms' ),
				'abort'   => true,
			);
			return;
		}

		// Find the form information.
		$form = wpforms()->form->get( $entry->form_id, array( 'cap' => 'view_entries_form_single' ) );

		// No form was found, error.
		if ( ! $form || empty( $form ) ) {
			$this->alerts[] = array(
				'type'    => 'error',
				'message' => esc_html__( 'Form not found.', 'wpforms' ),
				'abort'   => true,
			);
			return;
		}

		// Form details.
		$form_data      = wpforms_decode( $form->post_content );
		$form->form_url = add_query_arg(
			array(
				'page'    => 'wpforms-entries',
				'view'    => 'list',
				'form_id' => absint( $form_data['id'] ),
			),
			admin_url( 'admin.php' )
		);

		// Define other entry details.
		$entry->entry_next       = wpforms()->entry->get_next( $entry->entry_id, $form_data['id'] );
		$entry->entry_next_url   = ! empty( $entry->entry_next ) ? add_query_arg( array( 'page' => 'wpforms-entries', 'view' => 'details', 'entry_id' => absint( $entry->entry_next->entry_id ) ), admin_url( 'admin.php' ) ) : '#';
		$entry->entry_next_class = ! empty( $entry->entry_next ) ? '' : 'inactive';
		$entry->entry_prev       = wpforms()->entry->get_prev( $entry->entry_id, $form_data['id'] );
		$entry->entry_prev_url   = ! empty( $entry->entry_prev ) ? add_query_arg( array( 'page' => 'wpforms-entries', 'view' => 'details', 'entry_id' => absint( $entry->entry_prev->entry_id ) ), admin_url( 'admin.php' ) ) : '#';
		$entry->entry_prev_class = ! empty( $entry->entry_prev ) ? '' : 'inactive';
		$entry->entry_prev_count = wpforms()->entry->get_prev_count( $entry->entry_id, $form_data['id'] );
		$entry->entry_count      = wpforms()->entry->get_entries( array( 'form_id' => $form_data['id'] ), true );

		$entry->entry_notes = wpforms()->entry_meta->get_meta(
			array(
				'entry_id' => $entry->entry_id,
				'type'     => 'note',
			)
		);
		$entry->entry_logs  = wpforms()->entry_meta->get_meta(
			array(
				'entry_id' => $entry->entry_id,
				'type'     => 'log',
			)
		);

		// Check for other entries by this user.
		if ( ! empty( $entry->user_id ) || ! empty( $entry->user_uuid ) ) {
			$args = array(
				'form_id'   => $form_data['id'],
				'user_id'   => ! empty( $entry->user_id ) ? $entry->user_id : '',
				'user_uuid' => ! empty( $entry->user_uuid ) ? $entry->user_uuid : '',
			);
			$related = wpforms()->entry->get_entries( $args );
			foreach ( $related as $key => $r ) {
				if ( $r->entry_id == $entry->entry_id ) {
					unset( $related[ $key ] );
				}
			}
			$entry->entry_related = $related;
		}

		// Make public.
		$this->entry = $entry;
		$this->form  = $form;

		// Lastly, mark entry as read if needed.
		if ( '1' !== $entry->viewed && empty( $_GET['action'] ) ) {
			$is_success = wpforms()->entry->update(
				$entry->entry_id,
				array(
					'viewed' => '1',
				)
			);
		}

		if ( ! empty( $is_success ) ) {
			wpforms()->entry_meta->add(
				array(
					'entry_id' => $entry->entry_id,
					'form_id'  => $form_data['id'],
					'user_id'  => get_current_user_id(),
					'type'     => 'log',
					'data'     => wpautop( sprintf( '<em>%s</em>', esc_html__( 'Entry read.', 'wpforms' ) ) ),
				),
				'entry_meta'
			);

			$this->entry->viewed     = '1';
			$this->entry->entry_logs = wpforms()->entry_meta->get_meta(
				array(
					'entry_id' => $entry->entry_id,
					'type'     => 'log',
				)
			);
		}

		do_action( 'wpforms_entry_details_init', $this );
	}

	/**
	 * Entry Details page.
	 *
	 * @since 1.0.0
	 */
	public function details() {

		// Check for blocking errors to display.
		$this->display_alerts( 'error', true );

		if ( $this->abort ) {
			return;
		}

		$entry     = $this->entry;
		$form_data = wpforms_decode( $this->form->post_content );
		 ?>

		<div id="wpforms-entries-single" class="wrap wpforms-admin-wrap">

			<h1 class="page-title">

				<?php esc_html_e( 'View Entry', 'wpforms' ); ?>

				<a href="<?php echo esc_url( $this->form->form_url ); ?>" class="add-new-h2 wpforms-btn-orange"><?php esc_html_e( 'Back to All Entries', 'wpforms' ); ?></a>

				<div class="wpforms-entry-navigation">
					<span class="wpforms-entry-navigation-text">
						<?php
						printf(
							/* translators: %1$s - current number of entry; %2$s - total number of entries. */
							esc_html__( 'Entry %1$s of %2$s', 'wpforms' ),
							$entry->entry_prev_count + 1,
							$entry->entry_count
						);
						?>
					</span>
					<span class="wpforms-entry-navigation-buttons">
						<a href="<?php echo esc_url( $entry->entry_prev_url ); ?>" title="<?php esc_attr_e( 'Previous form entry', 'wpforms' ); ?>" id="wpforms-entry-prev-link" class="add-new-h2 wpforms-btn-grey <?php echo $entry->entry_prev_class; ?>">
							<span class="dashicons dashicons-arrow-left-alt2"></span>
						</a>

						<span class="wpforms-entry-current" title="<?php esc_attr_e( 'Current form entry', 'wpforms' ); ?>"><?php echo $entry->entry_prev_count + 1; ?></span>

						<a href="<?php echo esc_url( $entry->entry_next_url ); ?>" title="<?php esc_attr_e( 'Next form entry', 'wpforms' ); ?>" id="wpforms-entry-next-link" class=" add-new-h2 wpforms-btn-grey <?php echo $entry->entry_next_class; ?>">
							<span class="dashicons dashicons-arrow-right-alt2"></span>
						</a>
					</span>
				</div>

			</h1>

			<?php $this->display_alerts(); ?>

			<div class="wpforms-admin-content">

				<div id="poststuff">

					<div id="post-body" class="metabox-holder columns-2">

						<!-- Left column -->
						<div id="post-body-content" style="position: relative;">
							<?php do_action( 'wpforms_entry_details_content', $entry, $form_data, $this ); ?>
						</div>

						<!-- Right column -->
						<div id="postbox-container-1" class="postbox-container">
							<?php do_action( 'wpforms_entry_details_sidebar', $entry, $form_data, $this ); ?>
						</div>

					</div>

				</div>

			</div>

		</div>
		<?php
	}

	/**
	 * Entry fields metabox.
	 *
	 * @since 1.1.5
	 * @param object $entry     Submitted entry values.
	 * @param array  $form_data Form data and settings.
	 */
	public function details_fields( $entry, $form_data ) {

		$hide_empty = isset( $_COOKIE['wpforms_entry_hide_empty'] ) && 'true' === $_COOKIE['wpforms_entry_hide_empty'] ;
		?>
		<!-- Entry Fields metabox -->
		<div id="wpforms-entry-fields" class="postbox">

			<h2 class="hndle">
				<?php echo '1' == $entry->starred ? '<span class="dashicons dashicons-star-filled"></span>' : ''; ?>
				<span><?php echo esc_html( $form_data['settings']['form_title'] ); ?></span>
				<a href="#" class="wpforms-empty-field-toggle">
					<?php echo $hide_empty ? esc_html__( 'Show Empty Fields', 'wpforms' ) : esc_html__( 'Hide Empty Fields', 'wpforms' ); ?>
				</a>
			</h2>

			<div class="inside">

				<?php
				$fields = apply_filters( 'wpforms_entry_single_data', wpforms_decode( $entry->fields ), $entry, $form_data );

				if ( empty( $fields ) ) {

					// Whoops, no fields! This shouldn't happen under normal use cases.
					echo '<p class="no-fields">' . esc_html__( 'This entry does not have any fields', 'wpforms' ) . '</p>';

				} else {

					// Display the fields and their values
					foreach ( $fields as $key => $field ) {

						// We can't display the field of unknown type.
						if ( empty( $field['type'] ) ) {
							continue;
						}

						$field_value  = isset( $field['value'] ) ? $field['value'] : '';
						$field_value  = apply_filters( 'wpforms_html_field_value', wp_strip_all_tags( $field_value ), $field, $form_data, 'entry-single' );
						$field_class  = sanitize_html_class( 'wpforms-field-' . $field['type'] );
						$field_class .= wpforms_is_empty_string( $field_value ) ? ' empty' : '';
						$field_style  = $hide_empty && empty( $field_value ) ? 'display:none;' : '';

						echo '<div class="wpforms-entry-field ' . $field_class . '" style="' . $field_style . '">';

							// Field name
							echo '<p class="wpforms-entry-field-name">';
								/* translators: %d - field ID. */
								echo ! empty( $field['name'] ) ? wp_strip_all_tags( $field['name'] ) : sprintf( esc_html__( 'Field ID #%d', 'wpforms' ), absint( $field['id'] ) );
							echo '</p>';

							// Field value
							echo '<p class="wpforms-entry-field-value">';
								echo ! wpforms_is_empty_string( $field_value ) ? nl2br( make_clickable( $field_value ) ) : esc_html__( 'Empty', 'wpforms' );
							echo '</p>';

						echo '</div>';
					}
				}
				 ?>

			</div>

		</div>
		<?php
	}

	/**
	 * Entry notes metabox.
	 *
	 * @since 1.1.6
	 *
	 * @param object $entry     Submitted entry values.
	 * @param array  $form_data Form data and settings.
	 */
	public function details_notes( $entry, $form_data ) {

		$action_url = add_query_arg(
			array(
				'page'     => 'wpforms-entries',
				'view'     => 'details',
				'entry_id' => absint( $entry->entry_id ),
			),
			admin_url( 'admin.php' )
		);
		?>
		<!-- Entry Notes metabox -->
		<div id="wpforms-entry-notes" class="postbox">

			<h2 class="hndle">
				<span><?php esc_html_e( 'Notes', 'wpforms' ); ?></span>
			</h2>

			<div class="inside">

				<?php if ( \wpforms_current_user_can( 'edit_entries_form_single', $form_data['id'] ) ) : ?>

					<div class="wpforms-entry-notes-new">

						<a href="#" class="button add"><?php esc_html_e( 'Add Note', 'wpforms' ); ?></a>

						<form action="<?php echo esc_url( $action_url ); ?>" method="post">
							<?php
							$args = array(
								'media_buttons' => false,
								'editor_height' => 50,
								'teeny'         => true,
							);
							wp_editor( '', 'entry_note', $args );
							wp_nonce_field( 'wpforms_entry_details_addnote' );
							?>
							<input type="hidden" name="entry_id" value="<?php echo absint( $entry->entry_id ); ?>">
							<input type="hidden" name="form_id" value="<?php echo absint( $form_data['id'] ); ?>">
							<div class="btns">
								<input type="submit" name="wpforms_add_note" class="save button-primary alignright" value="<?php esc_attr_e( 'Add Note', 'wpforms' ); ?>">
								<a href="#" class="cancel button-secondary alignleft"><?php esc_html_e( 'Cancel', 'wpforms' ); ?></a>
							</div>
						</form>

					</div>
				<?php endif; ?>

				<?php
				if ( empty( $entry->entry_notes ) ) {
					echo '<p class="no-notes">' . esc_html__( 'No notes.', 'wpforms' ) . '</p>';
				} else {
					echo '<div class="wpforms-entry-notes-list">';
					$count = 1;
					foreach ( $entry->entry_notes as $note ) {
						$user        = get_userdata( $note->user_id );
						$user_name   = ! empty( $user->display_name ) ? $user->display_name : $user->user_login;
						$user_url    = add_query_arg(
							array(
								'user_id' => absint( $user->ID ),
							),
							admin_url( 'user-edit.php' )
						);
						$date_format = sprintf( '%s %s', get_option( 'date_format' ), get_option( 'time_format' ) );
						$date        = date_i18n( $date_format, strtotime( $note->date ) + ( get_option( 'gmt_offset' ) * 3600 ) );
						$class       = 0 === $count % 2 ? 'even' : 'odd';

						if ( \wpforms_current_user_can( 'edit_entries_form_single', $form_data['id'] ) ) {

							$delete_url = wp_nonce_url(
								add_query_arg(
									array(
										'page'     => 'wpforms-entries',
										'view'     => 'details',
										'entry_id' => absint( $entry->entry_id ),
										'note_id'  => absint( $note->id ),
										'action'   => 'delete_note',
									),
									admin_url( 'admin.php' )
								),
								'wpforms_entry_details_deletenote'
							);
						}
						?>
						<div class="wpforms-entry-notes-single <?php echo esc_attr( $class ); ?>">
							<div class="wpforms-entry-notes-byline">
								<?php
								printf(
									/* translators: %1$s - user link; %2$s - date. */
									esc_html__( 'Added by %1$s on %2$s', 'wpforms' ),
									'<a href="' . esc_url( $user_url ) . '" class="note-user">' . esc_html( $user_name ) . '</a>',
									esc_html( $date )
								);
								?>
								<?php if ( ! empty( $delete_url ) ) : ?>
									<span class="sep">|</span>
									<a href="<?php echo esc_url( $delete_url ); ?>" class="note-delete">
										<?php echo esc_html( _x( 'Delete', 'Entry: note', 'wpforms' ) ); ?>
									</a>
								<?php endif; ?>
							</div>
							<?php echo wp_kses_post( wp_unslash( $note->data ) ); ?>
						</div>
						<?php
						$count++;
					}
					echo '</div>';
				}
				?>

			</div>

		</div>
		<?php
	}

	/**
	 * Entry log metabox.
	 *
	 * @since 1.5.7
	 *
	 * @param object $entry     Submitted entry values.
	 * @param array  $form_data Form data and settings.
	 */
	public function details_log( $entry, $form_data ) {

		?>
		<!-- Entry Logs metabox -->
		<div id="wpforms-entry-logs" class="postbox">

			<h2 class="hndle">
				<span><?php esc_html_e( 'Log', 'wpforms' ); ?></span>
			</h2>

			<div class="inside">

				<?php
				if ( empty( $entry->entry_logs ) ) {
					echo '<p class="no-logs">' . esc_html__( 'No logs.', 'wpforms' ) . '</p>';
				} else {
					echo '<div class="wpforms-entry-logs-list">';
					$count = 1;
					foreach ( $entry->entry_logs as $log ) {
						$user        = get_userdata( $log->user_id );
						$user_name   = ! empty( $user->display_name ) ? $user->display_name : $user->user_login;
						$user_url    = add_query_arg(
							array(
								'user_id' => absint( $user->ID ),
							),
							admin_url( 'user-edit.php' )
						);
						$date_format = sprintf( '%s %s', get_option( 'date_format' ), get_option( 'time_format' ) );
						$date        = date_i18n( $date_format, strtotime( $log->date ) + ( get_option( 'gmt_offset' ) * 3600 ) );
						$class       = 0 === $count % 2 ? 'even' : 'odd';
						?>

						<div class="wpforms-entry-logs-single <?php echo esc_attr( $class ); ?>">
							<div class="wpforms-entry-logs-byline">
								<?php
								printf(
									/* translators: %1$s - user link; %2$s - date. */
									esc_html__( 'Added by %1$s on %2$s', 'wpforms' ),
									'<a href="' . esc_url( $user_url ) . '" class="log-user">' . esc_html( $user_name ) . '</a>',
									esc_html( $date )
								);
								?>
							</div>
							<?php echo wp_kses_post( wp_unslash( $log->data ) ); ?>
						</div>
						<?php
						$count++;
					}
					echo '</div>';
				}
				?>

			</div>

		</div>
		<?php
	}

	/**
	 * Entry debug metabox. Hidden by default obviously.
	 *
	 * @since 1.1.6
	 *
	 * @param object $entry     Submitted entry values.
	 * @param array  $form_data Form data and settings.
	 */
	public function details_debug( $entry, $form_data ) {

		if ( ! wpforms_debug() ) {
			return;
		}

		?>
		<!-- Entry Debug metabox -->
		<div id="wpforms-entry-debug" class="postbox">

			<h2 class="hndle">
				<span><?php esc_html_e( 'Debug Information', 'wpforms' ); ?></span>
			</h2>

			<div class="inside">

				<?php wpforms_debug_data( $entry ); ?>
				<?php wpforms_debug_data( $form_data ); ?>

			</div>

		</div>
		<?php
	}

	/**
	 * Entry Meta Details metabox.
	 *
	 * @since 1.1.5
	 *
	 * @param object $entry     Entry data.
	 * @param array  $form_data Form data.
	 */
	public function details_meta( $entry, $form_data ) {

		$datetime_format = get_option( 'date_format' ) . ' @ ' . get_option( 'time_format' );
		$datetime_offset = get_option( 'gmt_offset' ) * 3600;

		?>
		<!-- Entry Details metabox -->
		<div id="wpforms-entry-details" class="postbox">

			<h2 class="hndle">
				<span><?php esc_html_e( 'Entry Details', 'wpforms' ); ?></span>
			</h2>

			<div class="inside">

				<div class="wpforms-entry-details-meta">

					<p class="wpforms-entry-id">
						<span class="dashicons dashicons-admin-network"></span>
						<?php
						printf(
							/* translators: %s - entry ID. */
							esc_html__( 'Entry ID: %s', 'wpforms' ),
							'<strong>' . absint( $entry->entry_id ) . '</strong>'
						);
						?>

					</p>

					<?php
					if ( ! empty( $entry->post_id ) && is_object( get_post( $entry->post_id ) ) ) :
						$entry_post_id  = absint( $entry->post_id );
						$entry_post_obj = get_post_type_object( get_post_type( $entry_post_id ) );

						if ( $entry_post_obj instanceof \WP_Post_Type ) {
							?>
							<p class="wpforms-entry-postid">
								<span class="dashicons dashicons-edit"></span>
								<?php
								printf( /* translators: %1$s - post type name; %2$s - post type ID. */
									esc_html__( '%1$s ID: %2$s', 'wpforms' ),
									esc_html( $entry_post_obj->labels->singular_name ),
									'<strong><a href="' . esc_url( get_edit_post_link( $entry_post_id ) ) . '" target="_blank">' . $entry_post_id . '</a></strong>' // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
								);
								?>
							</p>
						<?php } ?>
					<?php endif; ?>

					<p class="wpforms-entry-date">
						<span class="dashicons dashicons-calendar"></span>
						<?php esc_html_e( 'Submitted:', 'wpforms' ); ?>
						<strong class="date-time"><?php echo esc_html( date_i18n( $datetime_format, strtotime( $entry->date ) + $datetime_offset ) ); ?></strong>
					</p>

					<?php if ( '0000-00-00 00:00:00' !== $entry->date_modified ) : ?>
						<p class="wpforms-entry-modified">
							<span class="dashicons dashicons-calendar-alt"></span>
							<?php esc_html_e( 'Modified:', 'wpforms' ); ?>
							<strong class="date-time"><?php echo esc_html( date_i18n( $datetime_format, strtotime( $entry->date_modified ) + $datetime_offset ) ); ?></strong>
						</p>
					<?php endif; ?>

					<?php if ( ! empty( $entry->user_id ) && 0 !== (int) $entry->user_id ) : ?>
						<p class="wpforms-entry-user">
							<span class="dashicons dashicons-admin-users"></span>
							<?php
							esc_html_e( 'User:', 'wpforms' );
							$user      = get_userdata( $entry->user_id );
							$user_name = esc_html( ! empty( $user->display_name ) ? $user->display_name : $user->user_login );
							$user_url  = add_query_arg(
								array(
									'user_id' => absint( $user->ID ),
								),
								admin_url( 'user-edit.php' )
							);
							?>
							<strong><a href="<?php echo esc_url( $user_url ); ?>"><?php echo esc_html( $user_name ); ?></a></strong>
						</p>
					<?php endif; ?>

					<?php if ( ! empty( $entry->ip_address ) ) : ?>
						<p class="wpforms-entry-ip">
							<span class="dashicons dashicons-location"></span>
							<?php esc_html_e( 'User IP:', 'wpforms' ); ?>
							<strong><?php echo esc_html( $entry->ip_address ); ?></strong>
						</p>
					<?php endif; ?>

					<?php if ( apply_filters( 'wpforms_entry_details_sidebar_details_status', false, $entry, $form_data ) ) : ?>
						<p class="wpforms-entry-status">
							<span class="dashicons dashicons-category"></span>
							<?php esc_html_e( 'Status:', 'wpforms' ); ?>
							<strong><?php echo ! empty( $entry->status ) ? esc_html( ucwords( sanitize_text_field( $entry->status ) ) ) : esc_html__( 'Completed', 'wpforms' ); ?></strong>
						</p>
					<?php endif; ?>

					<?php do_action( 'wpforms_entry_details_sidebar_details', $entry, $form_data ); ?>

				</div>

				<div id="major-publishing-actions">

					<?php
						do_action( 'wpforms_entry_details_sidebar_details_action',  $entry, $form_data );
					?>

					<?php if ( wpforms_current_user_can( 'delete_entries_form_single', $form_data['id'] ) ) : ?>
						<div id="delete-action">
							<?php
							$delete_link = wp_nonce_url(
								add_query_arg(
									array(
										'view'     => 'list',
										'action'   => 'delete',
										'form_id'  => $form_data['id'],
										'entry_id' => $entry->entry_id,
									)
								),
								'bulk-entries'
							);
							?>
							<a class="submitdelete deletion" href="<?php echo esc_url( $delete_link ); ?>">
								<?php esc_html_e( 'Delete Entry', 'wpforms' ); ?>
							</a>
						</div>
					<?php endif; ?>

					<div class="clear"></div>
				</div>

			</div>

		</div>
		<?php
	}

	/**
	 * Entry Payment Details metabox.
	 *
	 * @since 1.2.6
	 *
	 * @param object $entry     Submitted entry values.
	 * @param array  $form_data Form data and settings.
	 */
	public function details_payment( $entry, $form_data ) {

		if ( empty( $entry->type ) || 'payment' !== $entry->type ) {
			return;
		}

		$entry_meta   = json_decode( $entry->meta, true );
		$status       = ! empty( $entry->status ) ? $entry->status : esc_html__( 'Unknown', 'wpforms' );
		$currency     = ! empty( $entry_meta['payment_currency'] ) ? $entry_meta['payment_currency'] : wpforms_setting( 'currency', 'USD' );
		$total        = isset( $entry_meta['payment_total'] ) ? wpforms_format_amount( wpforms_sanitize_amount( $entry_meta['payment_total'], $currency ), true, $currency ) : '-';
		$total        = apply_filters( 'wpforms_entry_details_payment_total', $total, $entry_meta, $entry, $form_data );
		$note         = ! empty( $entry_meta['payment_note'] ) ? esc_html( $entry_meta['payment_note'] ) : '';
		$gateway      = apply_filters( 'wpforms_entry_details_payment_gateway', '-', $entry_meta, $entry, $form_data );
		$transaction  = apply_filters( 'wpforms_entry_details_payment_transaction', '-', $entry_meta, $entry, $form_data );
		$subscription = apply_filters( 'wpforms_entry_details_payment_subscription', '', $entry_meta, $entry, $form_data );
		$customer     = apply_filters( 'wpforms_entry_details_payment_customer', '', $entry_meta, $entry, $form_data );
		$mode         = ! empty( $entry_meta['payment_mode'] ) && 'test' === $entry_meta['payment_mode'] ? 'test' : 'production';

		switch ( $entry_meta['payment_type'] ) {
			case 'stripe':
				$gateway = esc_html__( 'Stripe', 'wpforms' );
				if ( ! empty( $entry_meta['payment_transaction'] ) ) {
					$transaction = sprintf( '<a href="https://dashboard.stripe.com/payments/%s" target="_blank" rel="noopener noreferrer">%s</a>', $entry_meta['payment_transaction'], $entry_meta['payment_transaction'] );
				}
				if ( ! empty( $entry_meta['payment_subscription'] ) ) {
					$subscription = sprintf( '<a href="https://dashboard.stripe.com/subscriptions/%s" target="_blank" rel="noopener noreferrer">%s</a>', $entry_meta['payment_subscription'], $entry_meta['payment_subscription'] );
				}
				if ( ! empty( $entry_meta['payment_customer'] ) ) {
					$customer = sprintf( '<a href="https://dashboard.stripe.com/customers/%s" target="_blank" rel="noopener noreferrer">%s</a>', $entry_meta['payment_customer'], $entry_meta['payment_customer'] );
				}
				if ( ! empty( $entry_meta['payment_period'] ) ) {
					$total .= ' <span style="font-weight:400; color:#999; display:inline-block;margin-left:4px;"><i class="fa fa-refresh" aria-hidden="true"></i> ' . $entry_meta['payment_period'] . '</span>';
				}
				break;
			case 'paypal_standard':
				$gateway = esc_html__( 'PayPal Standard', 'wpforms' );
				if ( ! empty( $entry_meta['payment_transaction'] ) ) {
					$type = 'production' === $mode ? '' : 'sandbox.';
					$transaction = sprintf( '<a href="https://www.%spaypal.com/webscr?cmd=_history-details-from-hub&id=%s" target="_blank" rel="noopener noreferrer">%s</a>', $type, $entry_meta['payment_transaction'], $entry_meta['payment_transaction'] );
				}
				break;
		}
		?>

		<!-- Entry Payment details metabox -->
		<div id="wpforms-entry-payment" class="postbox">

			<h2 class="hndle">
				<span><?php esc_html_e( 'Payment Details', 'wpforms' ); ?></span>
			</h2>

			<div class="inside">

				<div class="wpforms-entry-payment-meta">

					<p class="wpforms-entry-payment-status">
						<?php
						printf(
							/* translators: %s - entry payment status. */
							esc_html__( 'Status: %s', 'wpforms' ),
							'<strong>' . esc_html( ucwords( $status ) ) . '</strong>'
						);
						?>
					</p>

					<p class="wpforms-entry-payment-total">
						<?php
						printf(
							/* translators: %s - entry payment total. */
							esc_html__( 'Total: %s', 'wpforms' ),
							'<strong>' . wp_kses_post( $total ) . '</strong>'
						);
						?>
					</p>

					<p class="wpforms-entry-payment-gateway">
						<?php
						printf(
							/* translators: %s - entry payment gateway. */
							esc_html__( 'Gateway: %s', 'wpforms' ),
							'<strong>' . wp_kses_post( $gateway ) . '</strong>'
						);
						if ( 'test' === $mode ) {
							printf( ' (%s)', esc_html( _x( 'Test', 'Gateway mode', 'wpforms' ) ) );
						}
						?>
					</p>

					<p class="wpforms-entry-payment-transaction">
						<?php
						printf(
							/* translators: %s - entry payment transaction. */
							esc_html__( 'Transaction ID: %s', 'wpforms' ),
							'<strong>' . wp_kses_post( $transaction ) . '</strong>'
						);
						?>
					</p>

					<?php if ( ! empty( $subscription ) ) : ?>
					<p class="wpforms-entry-payment-subscription">
						<?php
						printf(
							/* translators: %s - entry payment subscription. */
							esc_html__( 'Subscription ID: %s', 'wpforms' ),
							'<strong>' . wp_kses_post( $subscription ) . '</strong>'
						);
						?>
					</p>
					<?php endif; ?>

					<?php if ( ! empty( $customer ) ) : ?>
					<p class="wpforms-entry-payment-customer">
						<?php
						printf(
							/* translators: %s - entry payment customer. */
							esc_html__( 'Customer ID: %s', 'wpforms' ),
							'<strong>' . wp_kses_post( $customer ) . '</strong>'
						);
						?>
					</p>
					<?php endif; ?>

					<?php if ( ! empty( $note ) ) : ?>
						<p class="wpforms-entry-payment-note">
							<?php echo esc_html__( 'Note:', 'wpforms' ) . '<br>' . esc_html( $note ); ?>
						</p>
					<?php endif; ?>

					<?php do_action( 'wpforms_entry_payment_sidebar_actions', $entry, $form_data ); ?>

				</div>

			</div>

		</div>
		<?php
	}

	/**
	 * Entry Actions metabox.
	 *
	 * @since 1.1.5
	 *
	 * @param object $entry     Submitted entry values.
	 * @param array  $form_data Form data and settings.
	 */
	public function details_actions( $entry, $form_data ) {

		$entry->starred  = (string) $entry->starred;
		$entry->entry_id = (int) $entry->entry_id;

		$base = add_query_arg(
			array(
				'page'     => 'wpforms-entries',
				'view'     => 'details',
				'entry_id' => $entry->entry_id,
			),
			admin_url( 'admin.php' )
		);

		// Print Entry URL.
		$print_url = add_query_arg(
			array(
				'page'     => 'wpforms-entries',
				'view'     => 'print',
				'entry_id' => $entry->entry_id,
			),
			admin_url( 'admin.php' )
		);

		// Export Entry URL.
		$export_url = wp_nonce_url(
			add_query_arg(
				array(
					'page'     => 'wpforms-tools',
					'view'     => 'export',
					'action'   => 'wpforms_tools_single_entry_export_download',
					'form'     => (int) $form_data['id'],
					'entry_id' => $entry->entry_id,
				),
				admin_url( 'admin.php' )
			),
			'wpforms-tools-single-entry-export-nonce',
			'nonce'
		);

		// Resend Entry Notifications URL.
		$notifications_url = wp_nonce_url(
			add_query_arg(
				array(
					'action' => 'notifications',
				),
				$base
			),
			'wpforms_entry_details_notifications'
		);

		// Star Entry URL.
		$star_url  = wp_nonce_url(
			add_query_arg(
				array(
					'action' => '1' === $entry->starred ? 'unstar' : 'star',
					'form'   => absint( $form_data['id'] ),
				),
				$base
			),
			'wpforms_entry_details_star'
		);
		$star_icon = '1' === $entry->starred ? 'dashicons-star-empty' : 'dashicons-star-filled';
		$star_text = '1' === $entry->starred ? esc_html__( 'Unstar', 'wpforms' ) : esc_html__( 'Star', 'wpforms' );

		// Unread URL.
		$unread_url = wp_nonce_url(
			add_query_arg(
				array(
					'action' => 'unread',
					'form'   => (int) $form_data['id'],
				),
				$base
			),
			'wpforms_entry_details_unread'
		);

		$action_links = array();

		$action_links['print']         = array(
			'url'    => $print_url,
			'target' => 'blank',
			'icon'   => 'dashicons-media-text',
			'label'  => esc_html__( 'Print', 'wpforms' ),
		);
		$action_links['export']        = array(
			'url'   => $export_url,
			'icon'  => 'dashicons-migrate',
			'label' => esc_html__( 'Export (CSV)', 'wpforms' ),
		);
		$action_links['notifications'] = array(
			'url'   => $notifications_url,
			'icon'  => 'dashicons-email-alt',
			'label' => esc_html__( 'Resend Notifications', 'wpforms' ),
		);
		if ( '1' === (string) $entry->viewed ) {
			$action_links['read'] = array(
				'url'   => $unread_url,
				'icon'  => 'dashicons-hidden',
				'label' => esc_html__( 'Mark Unread', 'wpforms' ),
			);
		}
		$action_links['star'] = array(
			'url'   => $star_url,
			'icon'  => $star_icon,
			'label' => $star_text,
		);

		$action_links = apply_filters( 'wpforms_entry_details_sidebar_actions_link', $action_links, $entry, $form_data );
		?>

		<!-- Entry Actions metabox -->
		<div id="wpforms-entry-actions" class="postbox">

			<h2 class="hndle">
				<span><?php esc_html_e( 'Actions', 'wpforms' ); ?></span>
			</h2>

			<div class="inside">

				<div class="wpforms-entry-actions-meta">

					<?php
					foreach ( $action_links as $slug => $link ) {
						$window = ! empty( $link['target'] ) ? 'target="_blank" rel="noopener noreferrer"' : '';
						printf( '<p class="wpforms-entry-%s">', esc_attr( $slug ) );
							printf( '<a href="%s" %s>', esc_url( $link['url'] ), $window );
								printf( '<span class="dashicons %s"></span>', esc_attr( $link['icon'] ) );
								echo esc_html( $link['label'] );
							echo '</a>';
						echo '</p>';
					}

					do_action( 'wpforms_entry_details_sidebar_actions', $entry, $form_data );
					?>

				</div>

			</div>

		</div>
		<?php
	}

	/**
	 * Entry Related Entries metabox.
	 *
	 * @since 1.3.3
	 *
	 * @param object $entry     Submitted entry values.
	 * @param array  $form_data Form data and settings.
	 */
	public function details_related( $entry, $form_data ) {

		// Only display if we have related entries
		if ( empty( $entry->entry_related ) ) {
			return;
		}
		?>

		<!-- Entry Actions metabox -->
		<div id="wpforms-entry-related" class="postbox">

			<h2 class="hndle">
				<span><?php esc_html_e( 'Related Entries', 'wpforms' ); ?></span>
			</h2>

			<div class="inside">

				<p><?php esc_html_e( 'The user who created this entry also submitted the entries below.', 'wpforms' ); ?></p>

				<ul>
				<?php
				foreach ( $entry->entry_related as $related ) {
					$url = add_query_arg(
						array(
							'page'     => 'wpforms-entries',
							'view'     => 'details',
							'entry_id' => absint( $related->entry_id ),
						),
						admin_url( 'admin.php' )
					);
					echo '<li>';
						echo '<a href="' . esc_url( $url ) . '">' . date_i18n( esc_html__( 'M j, Y @ g:ia' ), strtotime( $related->date ) + ( get_option( 'gmt_offset' ) * 3600 ) ) . '</a> ';
						echo 'abandoned' === $related->status ? esc_html__( '(Abandoned)' ) : '';
					echo '</li>';
				}
				?>
				</ul>

			</div>

		</div>

		<?php
	}

	/**
	 * Display admin notices and errors.
	 *
	 * @since 1.1.6
	 *
	 * @todo Refactor or eliminate this
	 *
	 * @param string $display
	 * @param bool $wrap
	 */
	function display_alerts( $display = '', $wrap = false ) {

		if ( empty( $this->alerts ) ) {
			return;

		} else {

			if ( empty( $display ) ) {
				$display = array( 'error', 'info', 'warning', 'success' );
			} else {
				$display = (array) $display;
			}

			foreach ( $this->alerts as $alert ) {

				$type = ! empty( $alert['type'] ) ? $alert['type'] : 'info';

				if ( in_array( $type, $display, true ) ) {
					$class  = 'notice-' . $type;
					$class .= ! empty( $alert['dismiss'] ) ? ' is-dismissible' : '';
					$output = '<div class="notice ' . $class . '"><p>' . $alert['message'] . '</p></div>';
					if ( $wrap ) {
						echo '<div class="wrap">' . $output . '</div>';
					} else {
						echo $output;
					}
					if ( ! empty( $alert['abort'] ) ) {
						$this->abort = true;
						break;
					}
				}
			}
		}
	}
}

new WPForms_Entries_Single;
