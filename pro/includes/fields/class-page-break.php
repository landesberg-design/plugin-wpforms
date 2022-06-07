<?php

/**
 * Pagebreak field.
 *
 * @since 1.0.0
 */
class WPForms_Field_Page_Break extends WPForms_Field {

	/**
	 * Pages information.
	 *
	 * @since 1.3.7
	 *
	 * @var array|bool
	 */
	protected $pagebreak;

	/**
	 * Primary class constructor.
	 *
	 * @since 1.0.0
	 */
	public function init() {

		// Define field type information.
		$this->name  = esc_html__( 'Page Break', 'wpforms' );
		$this->type  = 'pagebreak';
		$this->icon  = 'fa-files-o';
		$this->order = 140;
		$this->group = 'fancy';

		$this->hooks();
	}

	/**
	 * Hooks.
	 *
	 * @since 1.7.1
	 */
	private function hooks() {

		add_filter( 'wpforms_field_preview_class', [ $this, 'preview_field_class' ], 10, 2 );
		add_filter( 'wpforms_field_new_class', [ $this, 'preview_field_class' ], 10, 2 );
		add_filter( 'wpforms_frontend_form_data', [ $this, 'maybe_sort_fields' ], PHP_INT_MAX );
		add_action( 'wpforms_frontend_output', [ $this, 'display_page_indicator' ], 9, 5 );
		add_action( 'wpforms_display_fields_before', [ $this, 'display_fields_before' ], 20, 2 );
		add_action( 'wpforms_display_fields_after', [ $this, 'display_fields_after' ], 5, 2 );
		add_action( 'wpforms_display_field_after', [ $this, 'display_field_after' ], 20, 2 );
		add_filter( "wpforms_pro_admin_entries_edit_is_field_displayable_{$this->type}", '__return_false' );
	}

	/**
	 * Sort fields to make sure that bottom page break elements are in their place.
	 * Need to correctly display existing forms with wrong page-break bottom element positioning.
	 *
	 * @since 1.6.0.2
	 *
	 * @param array $form_data Form data.
	 *
	 * @return array Form data.
	 */
	public function maybe_sort_fields( $form_data ) {

		if ( empty( $form_data['fields'] ) ) {
			return $form_data;
		};

		$bottom = [];
		$fields = $form_data['fields'];

		foreach ( $fields as $id => $field ) {
			// Process only pagebreak fields.
			if ( $field['type'] !== 'pagebreak' ) {
				continue;
			}
			if ( empty( $field['position'] ) ) {
				continue;
			}

			if ( $field['position'] === 'bottom' ) {
				$bottom = $field;
				unset( $fields[ $id ] );
			}
		}

		if ( ! empty( $bottom ) ) {
			$form_data['fields'] = $fields + [ $bottom['id'] => $bottom ];
		}

		return $form_data;
	}

	/**
	 * Add class to the builder field preview.
	 *
	 * @since 1.2.0
	 *
	 * @param string $css
	 * @param array $field
	 *
	 * @return string
	 */
	public function preview_field_class( $css, $field ) {

		if ( 'pagebreak' === $field['type'] ) {
			if ( ! empty( $field['position'] ) && 'top' === $field['position'] ) {
				$css .= ' wpforms-field-stick wpforms-pagebreak-top';
			} elseif ( ! empty( $field['position'] ) && 'bottom' === $field['position'] ) {
				$css .= ' wpforms-field-stick wpforms-pagebreak-bottom';
			} else {
				$css .= ' wpforms-pagebreak-normal';
			}
		}

		return $css;
	}

	/**
	 * This displays if the form contains pagebreaks and is configured to show
	 * a page indicator in the top pagebreak settings.
	 *
	 * This function was moved from class-frontend.php in v1.3.7.
	 *
	 * @since 1.2.1
	 *
	 * @param array $form_data Form data and settings.
	 */
	public function display_page_indicator( $form_data ) {

		$top = ! empty( wpforms()->frontend->pages['top'] ) ? wpforms()->frontend->pages['top'] : false;

		if ( empty( $top['indicator'] ) ) {
			return;
		}

		$pagebreak = array(
			'indicator' => sanitize_html_class( $top['indicator'] ),
			'color'     => wpforms_sanitize_hex_color( $top['indicator_color'] ),
			'pages'     => array_merge( array( wpforms()->frontend->pages['top'] ), wpforms()->frontend->pages['pages'] ),
			'scroll'    => empty( $top['scroll_disabled'] ),
		);
		$p         = 1;

		printf(
			'<div class="wpforms-page-indicator %s" data-indicator="%s" data-indicator-color="%s" data-scroll="%d">',
			esc_attr( $pagebreak['indicator'] ),
			esc_attr( $pagebreak['indicator'] ),
			esc_attr( $pagebreak['color'] ),
			(int) $pagebreak['scroll']
		);

		if ( 'circles' === $pagebreak['indicator'] ) {

			// Circles theme.
			foreach ( $pagebreak['pages'] as $page ) {
				$is_first         = $p === 1;
				$class            = $is_first ? 'active' : '';
				$background_color = ! empty( $pagebreak['color'] ) ? $pagebreak['color'] : '';

				printf(
					'<div class="wpforms-page-indicator-page %s wpforms-page-indicator-page-%d">',
					sanitize_html_class( $class ),
					absint( $p )
				);
				printf(
					'<span class="wpforms-page-indicator-page-number"%s>%d</span>',
					$is_first && ! empty( $background_color ) ? ' style="background-color:' . sanitize_hex_color( $background_color ) . '"' : '',
					absint( $p )
				);
				if ( ! empty( $page['title'] ) ) {
					printf( '<span class="wpforms-page-indicator-page-title">%s<span>', esc_html( $page['title'] ) );
				}
				echo '</div>';
				$p ++;
			}
		} elseif ( 'connector' === $pagebreak['indicator'] ) {

			// Connector theme.
			foreach ( $pagebreak['pages'] as $page ) {
				$is_first = $p === 1;
				$class    = $is_first ? 'active ' : '';
				$color    = ! empty( $pagebreak['color'] ) ? $pagebreak['color'] : '';
				$width    = 100 / ( count( $pagebreak['pages'] ) ) . '%';

				printf(
					'<div class="wpforms-page-indicator-page %s wpforms-page-indicator-page-%d" style="width:%s;">',
					sanitize_html_class( $class ),
					absint( $p ),
					esc_attr( $width )
				);
				printf(
					'<span class="wpforms-page-indicator-page-number"%s>%d',
					$is_first && ! empty( $color ) ? ' style="background-color:' . sanitize_hex_color( $color ) . '"' : '',
					absint( $p )
				);
				printf(
					'<span class="wpforms-page-indicator-page-triangle"%s></span></span>',
					$is_first && ! empty( $color ) ? ' style="border-top-color:' . sanitize_hex_color( $color ) . '"' : ''
				);
				if ( ! empty( $page['title'] ) ) {
					printf( '<span class="wpforms-page-indicator-page-title">%s<span>', esc_html( $page['title'] ) );
				}
				echo '</div>';
				$p ++;
			}
		} elseif ( 'progress' === $pagebreak['indicator'] ) {

			// Progress theme.
			$p1               = ! empty( $pagebreak['pages'][0]['title'] ) ? $pagebreak['pages'][0]['title'] : '';
			$width            = 100 / count( $pagebreak['pages'] ) . '%';
			$names            = [];
			$background_color = ! empty( $pagebreak['color'] ) ? $pagebreak['color'] : '';

			foreach ( $pagebreak['pages'] as $page ) {
				if ( ! empty( $page['title'] ) ) {
					$names[ sprintf( 'page-%d-title', $p ) ] = $page['title'];
				}
				$p ++;
			}
			printf(
				'<span class="wpforms-page-indicator-page-title" %s>%s</span>',
				wpforms_html_attributes( '', [], $names ),
				esc_html( $p1 )
			);
			printf(
				'<span class="wpforms-page-indicator-page-title-sep" %s> - </span>',
				empty( $p1 ) ? 'style="display:none;"' : ''
			);
			printf( /* translators: %1$s - current step in multi-page form; %2$d - total number of pages. */
				'<span class="wpforms-page-indicator-steps">' . esc_html__( 'Step %1$s of %2$d', 'wpforms' ) . '</span>',
				'<span class="wpforms-page-indicator-steps-current">1</span>',
				count( $pagebreak['pages'] )
			);

			printf(
				'<div class="wpforms-page-indicator-page-progress-wrap"><div class="wpforms-page-indicator-page-progress" style="width:%s;%s"></div></div>',
				esc_attr( $width ),
				! empty( $background_color ) ? 'background-color:' . sanitize_hex_color( $background_color ) : ''
			);
		}

		do_action( 'wpforms_pagebreak_indicator', $pagebreak, $form_data );

		echo '</div>';
	}

	/**
	 * Display frontend markup for the beginning of the first pagebreak.
	 *
	 * @since 1.3.7
	 *
	 * @param array $form_data Form data and settings.
	 */
	public function display_fields_before( $form_data ) {

		// Check if we have an opening pagebreak, if not then bail.
		$top = ! empty( wpforms()->frontend->pages['top'] ) ? wpforms()->frontend->pages['top'] : false;

		if ( ! $top ) {
			return;
		}

		$css = ! empty( $top['css'] ) ? $top['css'] : '';

		echo '<div class="wpforms-page wpforms-page-1 ' . wpforms_sanitize_classes( $css ) . '">';
	}

	/**
	 * Display frontend markup for the end of the last pagebreak.
	 *
	 * @since 1.3.7
	 *
	 * @param array $form_data Form data and settings.
	 */
	public function display_fields_after( $form_data ) {

		if ( empty( wpforms()->frontend->pages ) ) {
			return;
		}

		// If we don't have a bottom pagebreak, the form is pre-v1.2.1 and
		// this is for backwards compatibility.
		$bottom = ! empty( wpforms()->frontend->pages['bottom'] ) ? wpforms()->frontend->pages['top'] : false;

		if ( ! $bottom ) {

			$prev = ! empty( $form_data['settings']['pagebreak_prev'] ) ? $form_data['settings']['pagebreak_prev'] : esc_html__( 'Previous', 'wpforms' );

			echo '<div class="wpforms-field wpforms-field-pagebreak">';
				printf(
					'<button class="wpforms-page-button wpforms-page-prev" data-action="prev" data-page="%d" data-formid="%d">%s</button>',
					absint( wpforms()->frontend->pages['current'] + 1 ),
					absint( $form_data['id'] ),
					esc_html( $prev )
				);
			echo '</div>';
		}

		echo '</div>';
	}

	/**
	 * Display frontend markup to end current page and begin the next.
	 *
	 * @since 1.3.7
	 *
	 * @param array $field     Field data and settings.
	 * @param array $form_data Form data and settings.
	 */
	public function display_field_after( $field, $form_data ) {

		if ( 'pagebreak' !== $field['type'] ) {
			return;
		}

		$total   = wpforms()->frontend->pages['total'];
		$current = wpforms()->frontend->pages['current'];

		if ( ( empty( $field['position'] ) || 'top' !== $field['position'] ) && $current !== $total ) {

			$next = $current + 1;
			$last = $next === $total ? 'last' : '';
			$css  = ! empty( $field['css'] ) ? $field['css'] : '';

			printf(
				'</div><div class="wpforms-page wpforms-page-%s %s %s" style="display:none;">',
				absint( $next ),
				esc_html( $last ),
				wpforms_sanitize_classes( $css )
			);

			// Increase count for next page.
			wpforms()->frontend->pages['current'] ++;
		}
	}

	/**
	 * Field options panel inside the builder.
	 *
	 * @since 1.0.0
	 *
	 * @param array $field
	 */
	public function field_options( $field ) {

		$position       = ! empty( $field['position'] ) ? esc_attr( $field['position'] ) : '';
		$position_class = ! empty( $field['position'] ) ? 'wpforms-pagebreak-' . $position : '';

		// Hidden field indicating the position.
		$this->field_element( 'text', $field, array(
			'type'  => 'hidden',
			'slug'  => 'position',
			'value' => $position,
			'class' => 'position',
		) );

		/*
		 * Basic field options.
		 */

		// Options open markup.
		$this->field_option( 'basic-options', $field, array(
			'markup' => 'open',
			'class'  => $position_class,
		) );

		// Options specific to the top pagebreak.
		if ( 'top' === $position ) {

			// Indicator theme.
			$themes = array(
				'progress'  => esc_html__( 'Progress Bar', 'wpforms' ),
				'circles'   => esc_html__( 'Circles', 'wpforms' ),
				'connector' => esc_html__( 'Connector', 'wpforms' ),
				'none'      => esc_html__( 'None', 'wpforms' ),
			);
			$lbl    = $this->field_element(
				'label',
				$field,
				array(
					'slug'    => 'indicator',
					'value'   => esc_html__( 'Progress Indicator', 'wpforms' ),
					'tooltip' => esc_html__( 'Select theme for Page Indicator which is displayed at the top of the form.', 'wpforms' ),
				),
				false
			);
			$fld    = $this->field_element(
				'select',
				$field,
				array(
					'slug'    => 'indicator',
					'value'   => ! empty( $field['indicator'] ) ? esc_attr( $field['indicator'] ) : 'progress',
					'options' => apply_filters( 'wpforms_pagebreak_indicator_themes', $themes ),
				),
				false
			);
			$this->field_element( 'row', $field, array(
				'slug'    => 'indicator',
				'content' => $lbl . $fld,
			) );

			// Indicator color picker.
			$lbl = $this->field_element(
				'label',
				$field,
				array(
					'slug'    => 'indicator_color',
					'value'   => esc_html__( 'Page Indicator Color', 'wpforms' ),
					'tooltip' => esc_html__( 'Select the primary color for the Page Indicator theme.', 'wpforms' ),
				),
				false
			);
			$fld = $this->field_element(
				'text',
				$field,
				array(
					'slug'  => 'indicator_color',
					'value' => ! empty( $field['indicator_color'] ) ? esc_attr( $field['indicator_color'] ) : '#72b239',
					'class' => 'wpforms-color-picker',
				),
				false
			);
			$this->field_element( 'row', $field, array(
				'slug'    => 'indicator_color',
				'content' => $lbl . $fld,
				'class'   => 'color-picker-row',
			) );
		} // End if().

		// Page Title, don't display for bottom pagebreaks.
		if ( 'bottom' !== $position ) {
			$lbl = $this->field_element(
				'label',
				$field,
				array(
					'slug'    => 'title',
					'value'   => esc_html__( 'Page Title', 'wpforms' ),
					'tooltip' => esc_html__( 'Enter text for the page title.', 'wpforms' ),
				),
				false
			);
			$fld = $this->field_element(
				'text',
				$field,
				array(
					'slug'  => 'title',
					'value' => ! empty( $field['title'] ) ? esc_attr( $field['title'] ) : '',
				),
				false
			);
			$this->field_element( 'row', $field, array(
				'slug'    => 'title',
				'content' => $lbl . $fld,
			) );
		}

		// Next label.
		if ( empty( $position ) ) {
			$lbl = $this->field_element(
				'label',
				$field,
				array(
					'slug'    => 'next',
					'value'   => esc_html__( 'Next Label', 'wpforms' ),
					'tooltip' => esc_html__( 'Enter text for Next page navigation button.', 'wpforms' ),
				),
				false
			);
			$fld = $this->field_element(
				'text',
				$field,
				array(
					'slug'  => 'next',
					'value' => ! empty( $field['next'] ) ? esc_attr( $field['next'] ) : esc_html__( 'Next', 'wpforms' ),
				),
				false
			);
			$this->field_element( 'row', $field, array(
				'slug'    => 'next',
				'content' => $lbl . $fld,
			) );
		}

		// Options not available to top pagebreaks.
		if ( 'top' !== $position ) {

			// Previous button toggle.
			$fld = $this->field_element(
				'toggle',
				$field,
				[
					'slug'    => 'prev_toggle',
					// Backward compatibility for forms that were created before the toggle was added.
					'value'   => ! empty( $field['prev_toggle'] ) || ! empty( $field['prev'] ),
					'desc'    => esc_html__( 'Display Previous', 'wpforms' ),
					'tooltip' => esc_html__( 'Toggle displaying the Previous page navigation button.', 'wpforms' ),
				],
				false
			);

			$this->field_element(
				'row',
				$field,
				[
					'slug'    => 'prev_toggle',
					'content' => $fld,
				]
			);

			// Previous button label.
			$lbl = $this->field_element(
				'label',
				$field,
				array(
					'slug'    => 'prev',
					'value'   => esc_html__( 'Previous Label', 'wpforms' ),
					'tooltip' => esc_html__( 'Enter text for Previous page navigation button.', 'wpforms' ),
				),
				false
			);
			$fld = $this->field_element(
				'text',
				$field,
				array(
					'slug'  => 'prev',
					'value' => ! empty( $field['prev'] ) ? esc_attr( $field['prev'] ) : '',
				),
				false
			);
			$this->field_element( 'row', $field, array(
				'slug'    => 'prev',
				'content' => $lbl . $fld,
				'class'   => empty( $field['prev_toggle'] ) ? 'wpforms-hidden' : '',
			) );
		} // End if().

		// Options close markup.
		$this->field_option( 'basic-options', $field, array(
			'markup' => 'close',
		) );

		/*
		 * Advanced field options.
		 */

		// Advanced options are not available to bottom pagebreaks.
		if ( 'bottom' !== $position ) {

			// Options open markup.
			$this->field_option( 'advanced-options', $field, array(
				'markup' => 'open',
				'class'  => $position_class,
			) );

			// Navigation alignment, only available to the top.
			if ( 'top' === $position ) {
				$lbl = $this->field_element(
					'label',
					$field,
					array(
						'slug'    => 'nav_align',
						'value'   => esc_html__( 'Page Navigation Alignment', 'wpforms' ),
						'tooltip' => esc_html__( 'Select the alignment for the Next/Previous page navigation buttons', 'wpforms' ),
					),
					false
				);
				$fld = $this->field_element(
					'select', $field,
					array(
						'slug'    => 'nav_align',
						'value'   => ! empty( $field['nav_align'] ) ? esc_attr( $field['nav_align'] ) : '',
						'options' => array(
							'left'  => esc_html__( 'Left', 'wpforms' ),
							'right' => esc_html__( 'Right', 'wpforms' ),
							''      => esc_html__( 'Center', 'wpforms' ),
							'split' => esc_html__( 'Split', 'wpforms' ),
						),
					),
					false
				);
				$this->field_element( 'row', $field, array(
					'slug'    => 'nav_align',
					'content' => $lbl . $fld,
				) );

				// Scroll animation toggle.
				$fld = $this->field_element(
					'toggle',
					$field,
					[
						'slug'    => 'scroll_disabled',
						'value'   => ! empty( $field['scroll_disabled'] ),
						'desc'    => esc_html__( 'Disable Scroll Animation', 'wpforms' ),
						'tooltip' => esc_html__( 'By default, a user\'s view is pulled to the top of each form page. Set to ON to disable this animation.', 'wpforms' ),
					],
					false
				);

				$this->field_element(
					'row',
					$field,
					[
						'slug'    => 'scroll_disabled',
						'content' => $fld,
					]
				);
			}

			// Custom CSS classes.
			$this->field_option( 'css', $field );

			// Options close markup.
			$this->field_option( 'advanced-options', $field, array(
				'markup' => 'close',
			) );
		} // End if().
	}

	/**
	 * Field preview inside the builder.
	 *
	 * @since 1.0.0
	 *
	 * @param array $field
	 */
	public function field_preview( $field ) {

		$nav_align  = 'wpforms-pagebreak-buttons-left';
		$prev       = ! empty( $field['prev'] ) ? $field['prev'] : esc_html__( 'Previous', 'wpforms' );
		$prev_class = empty( $field['prev'] ) && empty( $field['prev_toggle'] ) ? 'wpforms-hidden' : '';
		$next       = ! empty( $field['next'] ) ? $field['next'] : esc_html__( 'Next', 'wpforms' );
		$next_class = empty( $next ) ? 'wpforms-hidden' : '';
		$position   = ! empty( $field['position'] ) ? $field['position'] : 'normal';
		$title      = ! empty( $field['title'] ) ? '(' . $field['title'] . ')' : '';
		$label      = $position === 'top' ? esc_html__( 'First Page / Progress Indicator', 'wpforms' ) : '';
		$label      = $position === 'normal' && empty( $label ) ? esc_html__( 'Page Break', 'wpforms' ) : $label;

		if ( 'top' !== $position ) {
			if ( empty( $this->form_data ) ) {
				$this->form_data = wpforms()->form->get( $this->form_id, array(
					'content_only' => true,
				) );
			}

			if ( empty( $this->pagebreak ) ) {
				$this->pagebreak = wpforms_get_pagebreak_details( $this->form_data );
			}

			if ( ! empty( $this->pagebreak['top']['nav_align'] ) ) {
				$nav_align = 'wpforms-pagebreak-buttons-' . $this->pagebreak['top']['nav_align'];
			}

			echo '<div class="wpforms-pagebreak-buttons ' . sanitize_html_class( $nav_align ) . '">';
				printf(
					'<button class="wpforms-pagebreak-button wpforms-pagebreak-prev %s">%s</button>',
					sanitize_html_class( $prev_class ),
					esc_html( $prev )
				);

				if ( $position !== 'bottom' ) {
					printf(
						'<button class="wpforms-pagebreak-button wpforms-pagebreak-next %s">%s</button>',
						sanitize_html_class( $next_class ),
						esc_html( $next )
					);

					if ( $next_class !== 'wpforms-hidden' ) {

						/** This action is documented in includes/class-frontend.php. */
						do_action( 'wpforms_display_submit_after', $this->form_data );
					}
				}
			echo '</div>';
		}

		// Visual divider.
		echo '<div class="wpforms-pagebreak-divider">';
			if ( $position !== 'bottom' ) {
				printf(
					'<span class="pagebreak-label">%s <span class="wpforms-pagebreak-title">%s</span></span>',
					esc_html( $label ),
					esc_html( $title )
				);
			}
			echo '<span class="line"></span>';
		echo '</div>';
	}

	/**
	 * @inheritdoc
	 */
	public function is_dynamic_population_allowed( $properties, $field ) {

		return false;
	}

	/**
	 * @inheritdoc
	 */
	public function is_fallback_population_allowed( $properties, $field ) {

		return false;
	}

	/**
	 * Field display on the form front-end.
	 *
	 * @since 1.0.0
	 *
	 * @param array $field      Field data and settings.
	 * @param array $field_atts Field attributes.
	 * @param array $form_data  Form data and settings.
	 */
	public function field_display( $field, $field_atts, $form_data ) {

		// Top pagebreaks don't display.
		if ( ! empty( $field['position'] ) && 'top' === $field['position'] ) {
			return;
		}

		// Setup and sanitize the necessary data.

		/**
		 * Allow modifying page divider field before display.
		 *
		 * @since 1.0.0
		 *
		 * @param array $field      Field data and settings.
		 * @param array $field_atts Field attributes.
		 * @param array $form_data  Form data and settings.
		 */
		$filtered_field = apply_filters( 'wpforms_pagedivider_field_display', $field, $field_atts, $form_data );
		$field          = wpforms_list_intersect_key( (array) $filtered_field, $field );

		$total   = wpforms()->frontend->pages['total'];
		$current = wpforms()->frontend->pages['current'];
		$top     = wpforms()->frontend->pages['top'];
		$next    = ! empty( $field['next'] ) ? $field['next'] : '';
		$prev    = ! empty( $field['prev'] ) ? $field['prev'] : '';
		$align   = 'wpforms-pagebreak-center';

		if ( ! empty( $top['nav_align'] ) ) {
			$align = 'wpforms-pagebreak-' . $top['nav_align'];
		}

		echo '<div class="wpforms-clear ' . sanitize_html_class( $align ) . '">';

		if ( $current > 1 && ! empty( $prev ) ) {
			printf(
				'<button class="wpforms-page-button wpforms-page-prev" data-action="prev" data-page="%d" data-formid="%d" disabled>%s</button>',
				(int) $current,
				(int) $form_data['id'],
				esc_html( $prev )
			);
		}

		if ( $current < $total && ! empty( $next ) ) {
			printf(
				'<button class="wpforms-page-button wpforms-page-next" data-action="next" data-page="%d" data-formid="%d" disabled>%s</button>',
				(int) $current,
				(int) $form_data['id'],
				esc_html( $next )
			);

			/** This action is documented in includes/class-frontend.php. */
			do_action( 'wpforms_display_submit_after', $form_data );
		}
		echo '</div>';
	}

	/**
	 * Format field.
	 *
	 * @since 1.0.0
	 *
	 * @param int   $field_id     Field ID.
	 * @param array $field_submit Submitted field value.
	 * @param array $form_data    Form data and settings.
	 */
	public function format( $field_id, $field_submit, $form_data ) {
	}
}

new WPForms_Field_Page_Break();
