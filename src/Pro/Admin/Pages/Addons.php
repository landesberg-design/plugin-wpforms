<?php

namespace WPForms\Pro\Admin\Pages;

/**
 * Addons page for Pro.
 *
 * @since 1.6.7
 */
class Addons {

	/**
	 * Page slug.
	 *
	 * @since 1.6.7
	 *
	 * @type string
	 */
	const SLUG = 'addons';

	/**
	 * WPForms addons data.
	 *
	 * @since 1.6.7
	 *
	 * @var array
	 */
	public $addons;

	/**
	 * Determine if the plugin/addon installations are allowed.
	 *
	 * @since 1.6.7
	 *
	 * @var bool
	 */
	private $can_install;

	/**
	 * Determine if we need to refresh addons cache.
	 *
	 * @since 1.6.7
	 *
	 * @var bool
	 */
	private $refresh;

	/**
	 * Current license type.
	 *
	 * @since 1.6.7
	 *
	 * @var string|bool
	 */
	private $license_type;

	/**
	 * Class constructor.
	 *
	 * Please note, the constructor is only needed for backward compatibility.
	 *
	 * @since 1.6.7
	 */
	public function __construct() {

		// Maybe load addons page.
		add_action( 'admin_init', [ $this, 'init' ] );
	}

	/**
	 * Determine if the current class is allowed to load.
	 *
	 * @since 1.6.7
	 *
	 * @return bool
	 */
	public function allow_load() {

		return wpforms_is_admin_page( self::SLUG );
	}

	/**
	 * Init.
	 *
	 * @since 1.6.7
	 */
	public function init() {

		static $is_loaded = false;

		if ( ! $this->allow_load() || $is_loaded ) {
			return;
		}

		$this->can_install  = wpforms_can_install( 'addon' );
		$this->license_type = wpforms_get_license_type();

		$this->init_addons();

		$this->hooks();

		$is_loaded = true;
	}

	/**
	 * Hooks.
	 *
	 * @since 1.6.7
	 */
	public function hooks() {

		add_action( 'admin_enqueue_scripts', [ $this, 'enqueues' ] );
		add_action( 'admin_notices', [ $this, 'notices' ] );
		add_action( 'wpforms_admin_page', [ $this, 'output' ] );
	}

	/**
	 * Init addons data.
	 *
	 * @since 1.6.7
	 */
	public function init_addons() {

		$this->refresh = ! empty( $_GET['wpforms_refresh_addons'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		$this->addons = wpforms()->get( 'addons' )->get_all( $this->refresh );
	}

	/**
	 * Enqueue assets for the addons page.
	 *
	 * @since 1.6.7
	 */
	public function enqueues() {

		// JavaScript.
		wp_enqueue_script(
			'listjs',
			WPFORMS_PLUGIN_URL . 'assets/lib/list.min.js',
			[ 'jquery' ],
			'1.5.0'
		);
	}

	/**
	 * Build the output for the plugin addons page.
	 *
	 * @since 1.6.7
	 */
	public function output() {

		// The last attempt to obtain the addons data.
		if ( empty( $this->addons ) ) {
			$this->init_addons();
		}

		?>
		<div id="wpforms-admin-addons" class="wrap wpforms-admin-wrap">

			<h1 class="page-title">
				<?php esc_html_e( 'WPForms Addons', 'wpforms' ); ?>
				<a href="<?php echo esc_url_raw( add_query_arg( [ 'wpforms_refresh_addons' => '1' ] ) ); ?>" class="add-new-h2 wpforms-btn-orange">
					<?php esc_html_e( 'Refresh Addons', 'wpforms' ); ?>
				</a>
				<input type="search" placeholder="<?php esc_attr_e( 'Search Addons', 'wpforms' ); ?>" id="wpforms-admin-addons-search">
			</h1>

			<?php

			if ( empty( $this->addons ) ) {
				echo '</div>';

				return;
			}

			echo '<div class="wpforms-admin-content">';

				if ( ! empty( $this->license_type ) ) {

					if ( ! $this->refresh ) {
						echo '<p class="intro">' .
							sprintf(
								wp_kses(
									/* translators: %s - refresh addons page URL. */
									__( 'Improve your forms with our premium addons. Missing an addon that you think you should be able to see? Click the <a href="%s">Refresh Addons</a> button above.', 'wpforms' ),
									[
										'a' => [
											'href' => [],
										],
									]
								),
								esc_url_raw( add_query_arg( [ 'wpforms_refresh_addons' => '1' ] ) )
							) .
							'</p>';
					}

					echo '<h4 id="addons-heading" data-text="' . esc_attr__( 'Available Addons', 'wpforms' ) . '">' . esc_html__( 'Available Addons', 'wpforms' ) . '</h4>';
				}

				echo '<div id="wpforms-admin-addons-list">';

				$this->print_addons_list();

				echo '</div>';

			echo '</div>';

		echo '</div>';
	}

	/**
	 * Notices.
     *
     * @since 1.6.7
     */
	public function notices() {

		$errors = wpforms()->get( 'license' )->get_errors();

		if ( empty( $this->addons ) ) {
			\WPForms\Admin\Notice::error( esc_html__( 'There was an issue retrieving Addons for this site. Please click on the button above to refresh.', 'wpforms' ) );

			return;
		}

		if ( ! empty( $errors ) ) {
			\WPForms\Admin\Notice::error( esc_html__( 'In order to get access to Addons, you need to resolve your license key errors.', 'wpforms' ) );

			return;
		}

		if ( $this->refresh ) {
			\WPForms\Admin\Notice::success( esc_html__( 'Addons have successfully been refreshed.', 'wpforms' ) );
		}

		if ( empty( $this->license_type ) ) {
			\WPForms\Admin\Notice::error(
				sprintf(
					wp_kses( /* translators: %s - WPForms plugin settings URL. */
						__( 'To access addons please enter and activate your WPForms license key in the plugin <a href="%s">settings</a>.', 'wpforms' ),
						[
							'a' => [
								'href' => [],
							],
						]
					),
					esc_url_raw( add_query_arg( [ 'page' => 'wpforms-settings' ], admin_url( 'admin.php' ) ) )
				)
			);
		}
	}

	/**
	 * Print addons list.
     *
     * @since 1.6.7
     */
	private function print_addons_list() {

		$type = wpforms_get_license_type();

		if ( ! $type ) :

			$this->print_addons_grid( $this->addons, [ 'basic', 'plus', 'pro', 'agency' ] );

		elseif ( $type === 'basic' ) :

			$this->print_addons_grid( $this->addons, [ 'basic' ] );
			$this->print_unlock_features();
			$this->print_addons_grid( $this->addons, [ 'plus', 'pro', 'agency' ] );

		elseif ( $type === 'plus' ) :

			$this->print_addons_grid( $this->addons, [ 'basic', 'plus' ] );
			$this->print_unlock_features();
			$this->print_addons_grid( $this->addons, [ 'pro', 'agency' ] );

		elseif ( $type === 'pro' ) :

			$this->print_addons_grid( $this->addons, [ 'basic', 'plus', 'pro' ] );
			$this->print_unlock_features();
			$this->print_addons_grid( $this->addons, [ 'agency' ] );

		elseif ( in_array( $type, [ 'elite', 'agency', 'ultimate' ], true ) ) :

			$this->print_addons_grid( $this->addons, [ 'basic', 'plus', 'pro', 'agency' ] );

		endif;
	}

	/**
	 * Print unlock features message.
     *
     * @since 1.6.7
     */
	private function print_unlock_features() {

		echo '<div class="unlock-msg">';
			echo '<h4>' . esc_html__( 'Unlock More Features...', 'wpforms' ) . '</h4>';
			echo '<p>' .
				sprintf(
					wp_kses(
						/* translators: %s - WPForms.com Account page URL. */
						__( 'Want to get even more features? <a href="%s" target="_blank" rel="noopener noreferrer">Upgrade your WPForms account</a> and unlock the following extensions.', 'wpforms' ),
						[
							'a' => [
								'href'   => [],
								'target' => [],
								'rel'    => [],
							],
						]
					),
					esc_url( wpforms_utm_link( 'https://wpforms.com/account/', 'addons', 'Upgrade For More Addons' ) )
				) .
			'</p>';
		echo '</div>';
	}

	/**
	 * Render grid of addons.
	 *
     * @since 1.6.7
	 *
	 * @param array $addons    List of addons.
	 * @param array $type_show License type to show.
	 */
	public function print_addons_grid( $addons, $type_show ) {

		echo '<div class="list">';

		foreach ( $addons as $id => $addon ) {
			$addon = (array) $addon;

			if ( ! $this->is_allow_to_show( $addon['license'], $type_show ) ) {
				continue;
			}

			$this->print_addon( $addon );

			if ( ! empty( $this->addons[ $id ] ) ) {
				unset( $this->addons[ $id ] );
			}
		}

		echo '</div>';
	}

	/**
	 * Print addon.
	 *
	 * @since 1.6.7
	 *
	 * @param array $addon Addon information.
	 */
	private function print_addon( $addon ) {

		$addon = wpforms()->get( 'addons' )->get_addon( $addon['slug'] );
		$image = ! empty( $addon['icon'] ) ? $addon['icon'] : 'sullie.png';
		$url   = add_query_arg(
			[
				'utm_source'   => 'WordPress',
				'utm_campaign' => 'plugin',
				'utm_medium'   => 'addons',
				'utm_content'  => $addon['title'],
			],
			! empty( $addon['status'] ) && $addon['status'] === 'active' && $addon['plugin_allow'] ? $addon['doc_url'] : $addon['page_url']
		);

		if ( $addon['slug'] === 'wpforms-stripe' ) {
			$addon['recommended'] = true;
		}

		echo wpforms_render( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			'admin/addons-item',
			[
				'addon'        => $addon,
				'status_label' => $this->get_addon_status_label( $addon['status'] ),
				'image'        => WPFORMS_PLUGIN_URL . 'assets/images/' . $image,
				'url'          => $url,
				'button'       => $this->get_addon_button_html( $addon ),
				'recommended'  => isset( $addon['recommended'] ) ? $addon['recommended'] : false,
			],
			true
		);
	}

	/**
	 * Get addon button HTML.
	 *
	 * @since 1.6.7
	 *
	 * @param array $addon Prepared addon data.
 	 *
 	 * @return string
	 */
	private function get_addon_button_html( $addon ) {

		if ( $addon['action'] === 'upgrade' || $addon['action'] === 'license' || ! $addon['plugin_allow'] ) {
			return sprintf(
				'<a href="%1$s" target="_blank" rel="noopener noreferrer" class="wpforms-btn wpforms-btn-orange">%2$s</a>',
				add_query_arg(
					[
						'utm_content' => $addon['title'],
					],
					'https://wpforms.com/account/licenses/?utm_source=WordPress&utm_campaign=plugin&utm_medium=addons'
				),
				esc_html__( 'Upgrade Now', 'wpforms' )
			);
		}

		$html = '';

		switch ( $addon['status'] ) {
			case 'active':
				$html  = '<button class="status-' . esc_attr( $addon['status'] ) . '" data-plugin="' . esc_attr( $addon['path'] ) . '" data-type="addon">';
				$html .= '<i class="fa fa-toggle-on" aria-hidden="true"></i>';
				$html .= esc_html__( 'Deactivate', 'wpforms' );
				$html .= '</button>';
				break;

			case 'installed':
				$html  = '<button class="status-' . esc_attr( $addon['status'] ) . '" data-plugin="' . esc_attr( $addon['path'] ) . '" data-type="addon">';
				$html .= '<i class="fa fa-toggle-on fa-flip-horizontal" aria-hidden="true"></i>';
				$html .= esc_html__( 'Activate', 'wpforms' );
				$html .= '</button>';
				break;

			case 'missing':
				if ( ! $this->can_install ) {
					break;
				}
				$html  = '<button class="status-' . esc_attr( $addon['status'] ) . '" data-plugin="' . esc_url( $addon['url'] ) . '" data-type="addon">';
				$html .= '<i class="fa fa-cloud-download" aria-hidden="true"></i>';
				$html .= esc_html__( 'Install Addon', 'wpforms' );
				$html .= '</button>';
				break;
		}

		return $html;
	}

	/**
	 * Is allow to show.
	 *
	 * @since 1.6.7
	 *
	 * @param array $types     List of addon license types.
	 * @param array $type_show List of license types to show.
	 *
	 * @return bool
	 */
	private function is_allow_to_show( $types, $type_show ) {

		foreach ( $types as $type ) {
			if ( in_array( $type, $type_show, true ) ) {
				return true;
			}
		}

		return false;
	}

	/**
     * Get addon status label.
     *
     * @since 1.6.7
     *
	 * @param string $status Addon status.
	 *
	 * @return string
	 */
	private function get_addon_status_label( $status ) {

		$label = [
			'active'    => esc_html__( 'Active', 'wpforms' ),
			'installed' => esc_html__( 'Inactive', 'wpforms' ),
			'missing'   => esc_html__( 'Not Installed', 'wpforms' ),
		];

		return isset( $label[ $status ] ) ? $label[ $status ] : '';
	}
}
