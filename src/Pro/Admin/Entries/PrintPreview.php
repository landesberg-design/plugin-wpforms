<?php

namespace WPForms\Pro\Admin\Entries;

/**
 * Print view for single form entries.
 *
 * @since 1.5.1
 */
class PrintPreview {

	/**
	 * Entry object.
	 *
	 * @since 1.5.1
	 *
	 * @var object
	 */
	public $entry;

	/**
	 * Form data.
	 *
	 * @since 1.5.1
	 *
	 * @var array
	 */
	public $form_data;

	/**
	 * Constructor.
	 *
	 * @since 1.5.1
	 */
	public function __construct() {

		$this->hooks();
	}

	/**
	 * Hooks.
	 *
	 * @since 1.5.1
	 */
	public function hooks() {

		\add_action( 'admin_init', array( $this, 'print_html' ), 1 );
	}

	/**
	 * Check if current page request meets requirements for entry print page.
	 *
	 * @since 1.5.1
	 *
	 * @return bool
	 */
	public function is_print_page() {

		// Only proceed for the form builder.
		if ( ! \wpforms_is_admin_page( 'entries', 'print' ) ) {
			return false;
		}

		// Check that entry ID was passed.
		if ( empty( $_GET['entry_id'] ) ) { //phpcs:ignore;
			return false;
		}

		$entry_id = \absint( $_GET['entry_id'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		// Check for user with correct capabilities.
		if ( ! \wpforms_current_user_can( 'view_entry_single', $entry_id ) ) {
			return false;
		}

		// Fetch the entry.
		$this->entry = \wpforms()->entry->get( $entry_id );

		// Check valid entry was found.
		if ( empty( $this->entry ) ) {
			return false;
		}

		// Fetch form details for the entry.
		$this->form_data = \wpforms()->form->get(
			$this->entry->form_id,
			array(
				'content_only' => true,
			)
		);

		// Check valid form was found.
		if ( empty( $this->form_data ) ) {
			return false;
		}

		// Everything passed, fetch entry notes.
		$this->entry->entry_notes = \wpforms()->entry_meta->get_meta(
			array(
				'entry_id' => $this->entry->entry_id,
				'type'     => 'note',
			)
		);

		// Add divider, HTML fields.
		\add_filter( 'wpforms_entry_single_data', [ $this, 'add_hidden_data' ], 10, 2 );

		return true;
	}

	/**
	 * Output HTML markup for the print preview page.
	 *
	 * @since 1.5.1
	 */
	public function print_html() {

		// Under normal circumstances this should never return false.
		if ( ! $this->is_print_page() ) {
			return;
		}

		$min = \wpforms_get_min_suffix();
		?>
		<!doctype html>
		<html>
		<head>
			<meta charset="<?php bloginfo( 'charset' ); ?>">
			<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
			<title>WPForms Print Preview - <?php echo ucfirst( \esc_html( \sanitize_text_field( $this->form_data['settings']['form_title'] ) ) ); ?> </title>
			<meta name="description" content="">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<meta name="robots" content="noindex,nofollow,noarchive">
			<link rel="stylesheet" href="<?php echo \esc_url( \WPFORMS_PLUGIN_URL ); // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedStylesheet ?>assets/css/font-awesome.min.css" type="text/css">
			<link rel="stylesheet" href="<?php echo \esc_url( \WPFORMS_PLUGIN_URL );// phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedStylesheet ?>assets/css/entry-print<?php echo \esc_attr( $min ); ?>.css" type="text/css">
			<script type="text/javascript" src="<?php echo \esc_url( \includes_url( 'js/utils.js' ) ); // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript ?>"></script>
			<script type="text/javascript" src="<?php echo \esc_url( \includes_url( 'js/jquery/jquery.js' ) );// phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript ?>"></script>
			<script type="text/javascript">
				jQuery( function( $ ){
					var showEmpty    = wpCookies.get( 'wpforms_entry_hide_empty' ) !== 'true';
					function toggle( $this, $elem = '', $additional = '' ) {
						$this.find('.switch').toggleClass('active');
						$( $elem ).toggleClass( $additional );
					}
					// Print page.
					$( document ).on( 'click', '.print', function( event ) {
						event.preventDefault();
						window.print();
					} );
					// Close page.
					$( document ).on( 'click', '.close-window', function( event ) {
						event.preventDefault();
						window.close();
					} );
					// Settings button toggle.
					$( document ).on('click', '.button-settings', function( event ) {
						event.preventDefault();
						$(this).find('i').toggleClass('active');
						$('.actions').toggleClass('active');
					});
					// Init empty fields.
					if (  showEmpty ) {
						$( '.field.empty' ).show();
						$( '.toggle-empty' ).find('.switch').addClass('active');
					} else {
						$( '.field.empty' ).hide();
						$( '.toggle-empty' ).find('.switch').removeClass('active');
					}
					// Toggle empty fields.
					$( document ).on( 'click', '.toggle-empty', function( event ) {
						event.preventDefault();
						if ( ! showEmpty ) {
							wpCookies.set( 'wpforms_entry_hide_empty', 'true', 2592000 );
							$( this ).find('.switch').addClass('active');
						} else {
							wpCookies.remove( 'wpforms_entry_hide_empty' );
							$( this ).find('.switch').removeClass('active');
						}
						$( '.field.empty' ).toggle();
						showEmpty = !showEmpty;
					} );
					// Toggle HTML fields.
					$( document ).on( 'click', '.toggle-html', function( event ) {
						event.preventDefault();
						toggle( $( this ),'.wpforms-field-html', 'wpforms-hidden');

					} );
					// Toggle section dividers.
					$( document ).on( 'click', '.toggle-dividers', function( event ) {
						event.preventDefault();
						toggle( $( this ),'.wpforms-field-divider, .wpforms-field-pagebreak', 'wpforms-hidden')
					});
					// Toggle notes.
					$( document ).on( 'click', '.toggle-notes', function( event ) {
						event.preventDefault();
						$( this ).find('.switch').toggleClass('active');
						$( '.notes, .notes-head' ).toggle();
					});
					// Toggle compact view.
					$( document ).on( 'click', '.toggle-view', function( event ) {
						event.preventDefault();
						toggle( $( this ), '#print', 'compact')
					} );
				} );
			</script>
			<?php \do_action( 'wpforms_pro_admin_entries_printpreview_print_html_head', $this->entry, $this->form_data ); ?>
		</head>
		<body class="wp-core-ui">
			<div class="wpforms-preview" id="print">
				<?php \do_action( 'wpforms_pro_admin_entries_printpreview_print_html_header_before', $this->entry, $this->form_data ); ?>
				<div class="page-title">
					<h1>
						<?php /* translators: %d - entry ID. */ ?>
						<?php echo \esc_html( \sanitize_text_field( $this->form_data['settings']['form_title'] ) ); ?> <span> - <?php printf( \esc_html__( 'Entry #%d', 'wpforms' ), \absint( $this->entry->entry_id ) ); ?></span>
					</h1>
					<div class="buttons">
						<a href="#" class="button button-settings" title="<?php \esc_html_e( 'Cog', 'wpforms' ); ?>"><i class="fa fa-cog" aria-hidden="true"></i></a>
						<a href="#" class="button button-close close-window" title="<?php \esc_html_e( 'Close', 'wpforms' ); ?>"><?php \esc_html_e( 'Close', 'wpforms' ); ?></a>
						<a href="#" class="button button-print print" title="<?php \esc_html_e( 'Print', 'wpforms' ); ?>"><?php \esc_html_e( 'Print', 'wpforms' ); ?></a>
					</div>
				</div>
				<div class="actions no-print">
					<div class="switch-container toggle-empty">
						<a href="#" title="<?php \esc_html_e( 'Empty fields', 'wpforms' ); ?>"><i class="switch"></i><span><?php \esc_html_e( 'Empty fields', 'wpforms' ); ?></span></a>
					</div>
					<div class="switch-container toggle-html">
						<a href="#" title="<?php \esc_html_e( 'HTML Fields', 'wpforms' ); ?>"><i class="switch"></i><span><?php echo esc_html__( 'HTML Fields', 'wpforms' ); ?></span></a>
					</div>
					<div class="switch-container toggle-dividers">
						<a href="#" title="<?php \esc_html_e( 'Section Dividers', 'wpforms' ); ?>"><i class="switch"></i><span><?php echo \esc_html__( 'Section Dividers', 'wpforms' ); ?></span></a>
					</div>
					<?php if ( ! empty( $this->entry->entry_notes ) ) : ?>
					<div class="switch-container toggle-notes">
						<a href="#" title="<?php \esc_html_e( 'Notes', 'wpforms' ); ?>"><i class="switch"></i><span><?php echo \esc_html__( 'Notes', 'wpforms' ); ?></span></a>
					</div>
					<?php endif; ?>
					<div class="switch-container toggle-view">
						<a href="#"><i class="switch" title="<?php \esc_html_e( 'Compact view', 'wpforms' ); ?>"></i><span><?php \esc_html_e( 'Compact view', 'wpforms' ); ?></span></a>
					</div>
				</div>
				<?php
				\do_action_deprecated(
					'wpforms_pro_admin_entries_printpreview_print_hrml_header_after',
					array( $this->entry, $this->form_data ),
					'1.5.5 of the WPForms plugin',
					'wpforms_pro_admin_entries_printpreview_print_html_header_after'
				);
				\do_action( 'wpforms_pro_admin_entries_printpreview_print_html_header_after', $this->entry, $this->form_data );
				$fields = \apply_filters( 'wpforms_entry_single_data', \wpforms_decode( $this->entry->fields ), $this->entry, $this->form_data );

				if ( empty( $fields ) ) {

					// Whoops, no fields! This shouldn't happen under normal use cases.
					echo '<p class="no-fields">' . \esc_html__( 'This entry does not have any fields', 'wpforms' ) . '</p>';

				} else {
					echo '<div class="fields">';
					// Display the fields and their values.
					foreach ( $fields as $key => $field ) {

						if ( ! isset( $field['id'] ) ) {
							continue;
						}

						$field_value  = isset( $field['value'] ) ? \apply_filters( 'wpforms_html_field_value', \wp_strip_all_tags( $field['value'] ), $field, $this->form_data, 'entry-single' ) : '';
						$field_class  = \sanitize_html_class( 'wpforms-field-' . $field['type'] );
						$field_class .= empty( $field_value ) ? ' empty' : '';
						$field_label  = isset( $field['name'] ) ? $field['name'] : '';

						if ( $field['type'] === 'divider' ) {
							$field_label = isset( $field['label'] ) && ! empty( $field['label'] ) ? $field['label'] : \esc_html__( 'Section Divider', 'wpforms' );
							$field_class = \sanitize_html_class( 'wpforms-field-' . $field['type'] ) . ' wpforms-hidden';
						}

						if ( $field['type'] === 'html' ) {
							$field_value = isset( $field['code'] ) ? $field['code'] : '';
							$field_class = \sanitize_html_class( 'wpforms-field-' . $field['type'] ) . ' wpforms-hidden';
						}
						?>
						<?php if ( $field['type'] === 'divider' ) : ?>
							<div class="field <?php echo \esc_attr( $field_class ); ?>">
								<div class="wpforms-pagebreak-divider">
									<p class="pagebreak-label"><?php echo \esc_html( \wp_strip_all_tags( $field_label ) ); ?></p>
									<span class="line"></span>
								</div>
							</div>
						<?php else : ?>
						<div class="field <?php echo \esc_attr( $field_class ); ?>">
							<p class="field-name">
								<?php
								/* translators: %d - field ID. */
								echo ! empty( $field_label ) ? \esc_html( \wp_strip_all_tags( $field_label ) ) : sprintf( \esc_html__( 'Field ID #%d', 'wpforms' ), \absint( $field['id'] ) );
								?>
							</p>
							<p class="field-value">
								<?php echo ! empty( $field_value ) ? nl2br( \make_clickable( $field_value ) ) : \esc_html__( 'Empty', 'wpforms' ); //phpcs:ignore?>
							</p>
						</div>
						<?php endif; ?>
						<?php
					}
					echo '</div>';
				}

				\do_action_deprecated(
					'wpforms_pro_admin_entries_printpreview_print_hrml_fields_after',
					array( $this->entry, $this->form_data ),
					'1.5.5 of the WPForms plugin',
					'wpforms_pro_admin_entries_printpreview_print_html_fields_after'
				);
				\do_action( 'wpforms_pro_admin_entries_printpreview_print_html_fields_after', $this->entry, $this->form_data );

				if ( ! empty( $this->entry->entry_notes ) ) {

					echo '<h2 class="notes-head">' . \esc_html__( 'Notes', 'wpforms' ) . '</h2>';
					echo '<div class="notes">';

					foreach ( $this->entry->entry_notes as $note ) {

						$user      = \get_userdata( $note->user_id );
						$user_name = ! empty( $user->display_name ) ? $user->display_name : $user->user_login;
						$date      = wpforms_datetime_format( $note->date, '', true );

						echo '<div class="note">';
							echo '<div class="note-byline">';
								printf( /* translators: %1$s - user name; %2$s - date */
									esc_html__( 'Added by %1$s on %2$s', 'wpforms' ),
									esc_html( $user_name ),
									esc_html( $date )
								);
							echo '</div>';
							echo '<div class="note-text">' . \wp_kses_post( $note->data ) . '</div>';
						echo '</div>';
					}
					echo '</div>';
				}

				\do_action_deprecated(
					'wpforms_pro_admin_entries_printpreview_print_hrml_notes_after',
					array( $this->entry, $this->form_data ),
					'1.5.5 of the WPForms plugin',
					'wpforms_pro_admin_entries_printpreview_print_html_notes_after'
				);
				\do_action( 'wpforms_pro_admin_entries_printpreview_print_html_notes_after', $this->entry, $this->form_data );
				?>
			</div>
			<p class="site"><a href="<?php echo \esc_url( \home_url() ); ?>"><?php echo \esc_html( \get_bloginfo( 'name' ) ); ?></a></p>
		</body>
		<?php
		exit();
	}

	/**
	 * Add HTML entries, dividers to entry.
	 *
	 * @since 1.6.7
	 *
	 * @param array  $fields Form fields.
	 * @param object $entry  Entry fields.
	 *
	 * @return array
	 */
	public function add_hidden_data( $fields, $entry ) {

		$form_data = wpforms()->form->get( $entry->form_id, [ 'content_only' => true ] );
		$settings  = ! empty( $form_data['fields'] ) ? $form_data['fields'] : '';

		if ( ! $settings ) {
			return $fields;
		}

		foreach ( $settings as $key => $setting ) {
			if ( ! in_array( $setting['type'], [ 'divider', 'html' ], true ) ) {
				$settings[ $key ] = $fields[ $key ];
			}
		}

		return $settings;
	}
}
