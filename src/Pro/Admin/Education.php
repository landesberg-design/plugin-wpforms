<?php

namespace WPForms\Pro\Admin;

/**
 * WPForms admin pages changes and enhancements to educate Basic/Plus users on what is
 * available in WPForms Pro.
 *
 * @since 1.5.6
 */
class Education {

	/**
	 * License level slug.
	 *
	 * @since 1.5.6
	 *
	 * @var string
	 */
	public $license;

	/**
	 * WPForms admin page slug.
	 *
	 * @since 1.5.6
	 *
	 * @var string
	 */
	public $page;

	/**
	 * Constructor.
	 *
	 * @since 1.5.6
	 */
	public function __construct() {

		$this->hooks();
	}

	/**
	 * Hooks.
	 *
	 * @since 1.5.6
	 */
	public function hooks() {

		// Only proceed for the forms overview or entries page.
		if ( ! \wpforms_is_admin_page() && ! \wp_doing_ajax() ) {
			return;
		}

		if ( ! \apply_filters( 'wpforms_pro_admin_education', true ) ) {
			return;
		}

		// Load license level.
		$this->license = \wpforms_get_license_type();

		// Admin page slug.
		$this->page = str_replace( 'wpforms-', '', filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING ) );

		\add_action( 'admin_init', array( $this, 'dyk_init' ) );
	}

	/**
	 * "Did You Know?" Admin Product Education init.
	 *
	 * @since 1.5.6
	 */
	public function dyk_init() {

		// Only proceed for the forms overview or entries pages.
		if ( ! in_array( $this->page, array( 'overview', 'entries' ), true ) ) {
			return;
		}

		// Init only for `basic` & `plus` licenses.
		if ( ! in_array( $this->license, array( 'basic', 'plus' ), true ) ) {
			return;
		}

		\add_action( 'admin_enqueue_scripts', array( $this, 'enqueues' ) );
		\add_action( 'wpforms_admin_' . $this->page . '_after_rows', array( $this, 'dyk_display' ) );
		\add_action( 'wp_ajax_wpforms_dyk_dismiss', array( $this, 'dyk_ajax_dismiss' ) );
	}

	/**
	 * "Did You Know?" messages.
	 *
	 * @since 1.5.6
	 */
	public function dyk_messages() {

		return array(
			array(
				'desc' => esc_html__( 'You can capture email addresses from partial form entries to get more leads. Abandoned cart emails have an average open rate of 45%!', 'wpforms' ),
				'more' => 'https://wpforms.com/addons/form-abandonment-addon/',
				'item' => 1,
			),
			array(
				'desc' => esc_html__( 'You can easily integrate your forms with 1,500+ useful apps by using WPForms + Zapier.', 'wpforms' ),
				'more' => 'https://wpforms.com/addons/zapier-addon/',
				'item' => 2,
			),
			array(
				'desc' => esc_html__( 'You can integrate your forms to automatically send entries to your most used apps. Perfect for users of Salesforce, Slack, Trello, and 1,500+ others.', 'wpforms' ),
				'more' => 'https://wpforms.com/addons/zapier-addon/',
				'item' => 3,
			),
			array(
				'desc' => esc_html__( 'You can make distraction-free and custom landing pages in WPForms! Perfect for getting more leads.', 'wpforms' ),
				'more' => 'https://wpforms.com/addons/form-pages-addon/',
				'item' => 4,
			),
			array(
				'desc' => esc_html__( 'You can build and customize your own professional-looking landing page. A great alternative to Google Forms!', 'wpforms' ),
				'more' => 'https://wpforms.com/how-to-create-a-dedicated-form-landing-page-in-wordpress/',
				'item' => 5,
			),
			array(
				'desc' => esc_html__( 'You don’t have to build your forms from scratch. The Form Templates Pack addon gives you access to 150+ additional templates.', 'wpforms' ),
				'more' => 'https://wpforms.com/demo/',
				'item' => 6,
			),
			array(
				'desc' => esc_html__( 'You can password-protect your forms. Perfect for collecting reviews or success stories from customers!', 'wpforms' ),
				'more' => 'https://wpforms.com/how-to-password-protect-wordpress-forms-step-by-step/',
				'item' => 7,
			),
			array(
				'desc' => esc_html__( 'You can automatically close a form at a specific date and time. Great for applications!', 'wpforms' ),
				'more' => 'https://wpforms.com/docs/how-to-install-and-use-the-form-locker-addon-in-wpforms/',
				'item' => 8,
			),
			array(
				'desc' => esc_html__( 'You can generate more fresh content for your website for free by accepting guest blog posts.', 'wpforms' ),
				'more' => 'https://wpforms.com/docs/how-to-install-and-use-the-post-submissions-addon-in-wpforms/',
				'item' => 9,
			),
			array(
				'desc' => esc_html__( 'You can easily add a field to your forms that let users draw their signature then saves it as an image with their entry.', 'wpforms' ),
				'more' => 'https://wpforms.com/docs/how-to-install-and-use-the-signature-addon-in-wpforms/',
				'item' => 10,
			),
			array(
				'desc' => esc_html__( 'You can set up your forms to let your site visitors pick which payment method they want to use.', 'wpforms' ),
				'more' => 'https://wpforms.com/docs/how-to-allow-users-to-choose-a-payment-method-on-your-form/',
				'item' => 11,
			),
			array(
				'desc' => esc_html__( 'You can increase your revenue by accepting recurring payments on your forms.', 'wpforms' ),
				'more' => 'https://wpforms.com/how-to-accept-recurring-payments-on-your-wordpress-forms/',
				'item' => 12,
			),
			array(
				'desc' => esc_html__( 'For added insight into your customers, you can collect your user\'s city, state, and country behind-the-scenes with Geolocation!', 'wpforms' ),
				'more' => 'https://wpforms.com/docs/how-to-install-and-use-the-geolocation-addon-with-wpforms/',
				'item' => 13,
			),
			array(
				'desc' => esc_html__( 'You can let people automatically register as users on your WordPress site. Perfect for things like accepting guest blog posts!', 'wpforms' ),
				'more' => 'https://wpforms.com/how-to-create-a-user-registration-form-in-wordpress/',
				'item' => 14,
			),
			array(
				'desc' => esc_html__( 'You can limit one form submission per person to avoid duplicate entries. Perfect for applications and giveaway!', 'wpforms' ),
				'more' => 'https://wpforms.com/how-to-limit-the-number-of-wordpress-form-entries/',
				'item' => 15,
			),
			array(
				'desc' => esc_html__( 'You can use NPS Surveys to learn about your visitors. A tactic used by some of the biggest brands around!', 'wpforms' ),
				'more' => 'https://wpforms.com/how-to-create-a-net-promoter-score-nps-survey-in-wordpress/',
				'item' => 16,
			),
			array(
				'desc' => esc_html__( 'If you\'re planning an event, you can create an RSVP form to stay organized and get higher response rates!', 'wpforms' ),
				'more' => 'https://wpforms.com/how-to-create-an-rsvp-form-in-wordpress/',
				'item' => 17,
			),
			array(
				'desc' => esc_html__( 'With the Offline Forms addon, you can save data entered into your forms even if the user loses their internet connection.', 'wpforms' ),
				'more' => 'https://wpforms.com/docs/how-to-install-and-set-up-the-offline-forms-addon/',
				'item' => 18,
			),
			array(
				'desc' => esc_html__( 'You can accept PayPal on your website — a great way to increase your revenue.', 'wpforms' ),
				'more' => 'https://wpforms.com/addons/paypal-standard-addon/',
				'item' => 19,
			),
			array(
				'desc' => esc_html__( 'You can easily take payments by credit card on your website using the Stripe addon.', 'wpforms' ),
				'more' => 'https://wpforms.com/addons/stripe-addon/',
				'item' => 20,
			),
			array(
				'desc' => esc_html__( 'You can make money selling digital downloads on your site by using Stripe or PayPal.', 'wpforms' ),
				'more' => 'https://wpforms.com/the-simplest-way-to-sell-digital-products-on-your-wordpress-site/',
				'item' => 21,
			),
			array(
				'desc' => esc_html__( 'You can create a simple order form on your site to sell services or products online.', 'wpforms' ),
				'more' => 'https://wpforms.com/how-to-create-a-simple-order-form-in-wordpress/',
				'item' => 22,
			),
			array(
				'desc' => esc_html__( 'You can create surveys or polls and see interactive visual reports of your user\'s answers.', 'wpforms' ),
				'more' => 'https://wpforms.com/addons/surveys-and-polls-addon/',
				'item' => 23,
			),
			array(
				'desc' => esc_html__( 'You can add a customer feedback form to your site. Try automatically emailing it out after a sale!', 'wpforms' ),
				'more' => 'https://wpforms.com/how-to-add-a-customer-feedback-form-to-your-wordpress-site/',
				'item' => 24,
			),
			array(
				'desc' => esc_html__( 'You can add a Likert rating scale to your WordPress forms. Great for measuring your customer’s experience with your business!', 'wpforms' ),
				'more' => 'https://wpforms.com/how-to-add-a-likert-scale-to-your-wordpress-forms-step-by-step/',
				'item' => 25,
			),
			array(
				'desc' => esc_html__( 'You can easily add a poll to your site! Helpful for making business decisions based on your audience\'s needs.', 'wpforms' ),
				'more' => 'https://wpforms.com/how-to-create-a-poll-form-in-wordpress-step-by-step/',
				'item' => 26,
			),
			array(
				'desc' => esc_html__( 'You can create a customer cancellation survey to find out what you can do to improve.', 'wpforms' ),
				'more' => 'https://wpforms.com/how-to-create-a-customer-cancellation-survey-in-wordpress/',
				'item' => 27,
			),
			array(
				'desc' => esc_html__( 'WPForms is a great alternative to SurveyMonkey! You can create your first survey or poll today.', 'wpforms' ),
				'more' => 'https://wpforms.com/surveymonkey-alternative-wpforms-vs-surveymonkey-compared-pros-and-cons/',
				'item' => 28,
			),
			array(
				'desc' => esc_html__( 'You can make your forms interactive and easier to complete. A great way to get more leads!', 'wpforms' ),
				'more' => 'https://wpforms.com/addons/conversational-forms-addon/',
				'item' => 29,
			),
			array(
				'desc' => esc_html__( 'You can easily display survey results graphically. Great for presentations!', 'wpforms' ),
				'more' => 'https://wpforms.com/display-survey-results/',
				'item' => 30,
			),
			array(
				'desc' => esc_html__( 'You can make your forms feel like a one-on-one conversation and boost conversion rates.', 'wpforms' ),
				'more' => 'https://wpforms.com/addons/conversational-forms-addon/',
				'item' => 31,
			),
			array(
				'desc' => esc_html__( 'You can put a pre-built job application form on your website. Perfect if you’re looking for new employees!', 'wpforms' ),
				'more' => 'https://wpforms.com/how-to-create-a-job-application-form-in-wordpress/',
				'item' => 32,
			),
			array(
				'desc' => esc_html__( 'You can automatically send form entries to your Google Calendar. Perfect for appointments!', 'wpforms' ),
				'more' => 'https://wpforms.com/how-to-send-wpforms-entries-to-google-calendar/',
				'item' => 33,
			),
			array(
				'desc' => esc_html__( 'You can automatically send uploaded files from your form entries to Dropbox for safekeeping and organization!', 'wpforms' ),
				'more' => 'https://wpforms.com/how-to-create-a-simple-dropbox-upload-form-in-wordpress/',
				'item' => 34,
			),
			array(
				'desc' => esc_html__( 'When a user submits an uploaded file to your form, it can upload automatically to your Google Drive for better organization!', 'wpforms' ),
				'more' => 'https://wpforms.com/how-to-create-a-wordpress-google-drive-upload-form/',
				'item' => 35,
			),
			array(
				'desc' => esc_html__( 'You can get notified via text when someone completes your form! Great for closing deals faster.', 'wpforms' ),
				'more' => 'https://wpforms.com/how-to-get-an-sms-text-message-from-your-wordpress-form/',
				'item' => 36,
			),
			array(
				'desc' => esc_html__( 'Save time on invoicing! You can automatically add customers to Quickbooks after they complete a form.', 'wpforms' ),
				'more' => 'https://wpforms.com/how-to-automatically-add-a-quickbooks-customer-from-your-wordpress-forms-2/',
				'item' => 37,
			),
			array(
				'desc' => esc_html__( 'You can let users upload videos to your YouTube channel. Perfect for collecting testimonials!', 'wpforms' ),
				'more' => 'https://wpforms.com/allow-users-to-upload-videos-to-youtube-from-wordpress/',
				'item' => 38,
			),
			array(
				'desc' => esc_html__( 'You can automatically save submitted form info in a free Google Sheets spreadsheet. Great for keeping track of your entries!', 'wpforms' ),
				'more' => 'https://wpforms.com/save-contacts-from-wordpress-form-to-google-sheet/',
				'item' => 39,
			),
		);
	}

	/**
	 * "Did You Know?" random message.
	 *
	 * @since 1.5.6
	 */
	public function dyk_message_rnd() {

		$messages = $this->dyk_messages();

		return $messages[ array_rand( $messages ) ];
	}

	/**
	 * "Did You Know?" display message.
	 *
	 * @since 1.5.6
	 *
	 * @param \WP_List_Table $wp_list_table Instance of WP_List_Table.
	 */
	public function dyk_display( $wp_list_table ) {

		$dyk_message  = $this->dyk_message_rnd();
		$column_info  = $wp_list_table->get_column_info();
		$current_user = \wp_get_current_user();
		$dismissed    = \get_user_meta( $current_user->ID, 'wpforms_dismissed', true );
		$learn_more   = '';

		// Check if not dismissed.
		if ( ! empty( $dismissed[ 'dyk-' . $this->page ] ) ) {
			return;
		}

		// Check if next page exists.
		if ( $wp_list_table->get_pagination_arg( 'total_pages' ) <= $wp_list_table->get_pagenum() ) {
			return;
		}

		$translations = array(
			'upgrade_to_pro' => __( 'Upgrade to Pro', 'wpforms' ),
			'dismiss_title'  => __( 'Dismiss this message.', 'wpforms' ),
			'did_you_know'   => __( 'Did You Know?', 'wpforms' ),
			'learn_more'     => __( 'Learn More', 'wpforms' ),
		);

		if ( ! empty( $dyk_message['more'] ) ) {
			$dyk_message['more'] = \add_query_arg(
				array(
					'utm_source'   => 'WordPress',
					'utm_medium'   => 'DYK ' . ucfirst( $this->page ),
					'utm_campaign' => 'plugin',
					'utm_content'  => $dyk_message['item'],
				),
				$dyk_message['more']
			);

			$learn_more = '<a href="' . \esc_url( $dyk_message['more'] ) . '" target="_blank" rel="noopener noreferrer" class="learn-more">' . \esc_html( $translations['learn_more'] ) . '</a>';
		}

		printf(
			'<tr class="wpforms-dyk">
				<td colspan="%d">
					<div class="wpforms-dyk-fbox">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512" class="wpforms-dyk-bulb" title="%s"><path d="M176 0C73.05 0-.12 83.54 0 176.24c.06 44.28 16.5 84.67 43.56 115.54C69.21 321.03 93.85 368.68 96 384l.06 75.18c0 3.15.94 6.22 2.68 8.84l24.51 36.84c2.97 4.46 7.97 7.14 13.32 7.14h78.85c5.36 0 10.36-2.68 13.32-7.14l24.51-36.84c1.74-2.62 2.67-5.7 2.68-8.84L256 384c2.26-15.72 26.99-63.19 52.44-92.22C335.55 260.85 352 220.37 352 176 352 78.8 273.2 0 176 0zm47.94 454.31L206.85 480h-61.71l-17.09-25.69-.01-6.31h95.9v6.31zm.04-38.31h-95.97l-.07-32h96.08l-.04 32zm60.4-145.32c-13.99 15.96-36.33 48.1-50.58 81.31H118.21c-14.26-33.22-36.59-65.35-50.58-81.31C44.5 244.3 32.13 210.85 32.05 176 31.87 99.01 92.43 32 176 32c79.4 0 144 64.6 144 144 0 34.85-12.65 68.48-35.62 94.68zM176 64c-61.75 0-112 50.25-112 112 0 8.84 7.16 16 16 16s16-7.16 16-16c0-44.11 35.88-80 80-80 8.84 0 16-7.16 16-16s-7.16-16-16-16z"/></svg>
						<div class="wpforms-dyk-message"><b>%s</b><br>%s</div>
						<div class="wpforms-dyk-buttons">
							%s
							<a href="https://wpforms.com/pricing/?utm_source=WordPress&amp;utm_medium=DYK%%20%s&amp;utm_campaign=plugin&amp;utm_content=%d" target="_blank" rel="noopener noreferrer" class="wpforms-btn wpforms-btn-md wpforms-btn-light-grey">%s</a>
							<button type="button" class="dismiss" title="%s" data-page="%s"/>
						</div>
					</div>
				</td>
			</tr>',
			count( $column_info[0] ),
			\esc_attr( $translations['did_you_know'] ),
			\esc_html( $translations['did_you_know'] ),
			\esc_html( $dyk_message['desc'] ),
			$learn_more,  // phpcs:ignore
			esc_attr( ucfirst( $this->page ) ),
			(int) $dyk_message['item'],
			\esc_html( $translations['upgrade_to_pro'] ),
			\esc_attr( $translations['dismiss_title'] ),
			\esc_attr( $this->page )
		);
	}

	/**
	 * Ajax handler for dissmissing DYK notices.
	 *
	 * @since 1.5.6
	 */
	public function dyk_ajax_dismiss() {

		// Run a security check.
		\check_ajax_referer( 'wpforms-admin', 'nonce' );

		// Check for permissions.
		if ( ! \wpforms_current_user_can() ) {
			\wp_send_json_error(
				array(
					'error' => \esc_html__( 'You do not have permission to perform this action.', 'wpforms' ),
				)
			);
		}

		$current_user = \wp_get_current_user();
		$dismissed    = \get_user_meta( $current_user->ID, 'wpforms_dismissed', true );

		if ( empty( $dismissed ) ) {
			$dismissed = array();
		}

		$dismissed[ 'dyk-' . $this->page ] = time();

		\update_user_meta( $current_user->ID, 'wpforms_dismissed', $dismissed );
		\wp_send_json_success();
	}

	/**
	 * Load enqueues.
	 *
	 * @since 1.5.6
	 */
	public function enqueues() {

		$min = \wpforms_get_min_suffix();

		\wp_enqueue_script(
			'wpforms-admin-education',
			\WPFORMS_PLUGIN_URL . "pro/assets/js/admin/education{$min}.js",
			array( 'jquery' ),
			\WPFORMS_VERSION,
			false
		);
	}
}
