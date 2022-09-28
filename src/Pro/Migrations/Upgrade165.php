<?php

namespace WPForms\Pro\Migrations;

use WPForms\Migrations\UpgradeBase;
use WPForms\Pro\Integrations\TranslationsPress\Translations;

/**
 * Class v1.6.5 upgrade for Pro.
 *
 * @since 1.7.5
 *
 * @noinspection PhpUnused
 */
class Upgrade165 extends UpgradeBase {

	/**
	 * Run upgrade.
	 *
	 * @since 1.7.5
	 *
	 * @return bool|null Upgrade result:
	 *                   true  - the upgrade completed successfully,
	 *                   false - in the case of failure,
	 *                   null  - upgrade started but not yet finished (background task).
	 */
	public function run() {

		if ( ! class_exists( Translations::class ) ) {
			return false;
		}

		$t15s = new Translations();

		if ( $t15s->allow_load() ) {
			$t15s->download_plugins_translations();
		}

		return true;
	}
}
