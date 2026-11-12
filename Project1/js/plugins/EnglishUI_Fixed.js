//=============================================================================
// EnglishUI_Fixed.js
// RPG Maker MV - Force default engine/UI terms to English
// Corrected command indices for RPG Maker MV TextManager
//=============================================================================
/*:
 * @plugindesc Forces RPG Maker MV default UI/system terms to English. Fixed command-index mapping.
 * @author OpenAI
 *
 * @help
 * Put this file in:
 *   js/plugins/EnglishUI_Fixed.js
 *
 * Enable "EnglishUI_Fixed" in Plugin Manager.
 * Disable the older EnglishUI plugin to avoid conflicts.
 *
 * This translates RPG Maker MV built-in/system terms only.
 * It does not translate custom database names, event dialogue, or text hard-coded
 * inside other plugins.
 */

(function() {
    'use strict';

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    var _englishUiApplied = false;

    DataManager.isDatabaseLoaded = function() {
        if (!_DataManager_isDatabaseLoaded.call(this)) {
            return false;
        }

        if (!_englishUiApplied && $dataSystem && $dataSystem.terms) {
            applyEnglishTerms();
            _englishUiApplied = true;
        }

        return true;
    };

    function applyEnglishTerms() {
        var terms = $dataSystem.terms;

        terms.basic = [
            'Level', 'Lv',
            'HP', 'HP',
            'MP', 'MP',
            'TP', 'TP',
            'EXP', 'EXP'
        ];

        terms.params = [
            'Max HP',
            'Max MP',
            'Attack',
            'Defense',
            'M. Attack',
            'M. Defense',
            'Agility',
            'Luck'
        ];

        // IMPORTANT:
        // RPG Maker MV has unused/reserved command slots at index 20 and 23.
        // TextManager.toTitle = 21
        // TextManager.cancel  = 22
        // TextManager.buy     = 24
        // TextManager.sell    = 25
        terms.commands = [
            'Fight',        // 0
            'Escape',       // 1
            'Attack',       // 2
            'Guard',        // 3
            'Item',         // 4
            'Skill',        // 5
            'Equip',        // 6
            'Status',       // 7
            'Formation',    // 8
            'Save',         // 9
            'Game End',     // 10
            'Options',      // 11
            'Weapon',       // 12
            'Armor',        // 13
            'Key Item',     // 14
            'Equip',        // 15
            'Optimize',     // 16
            'Clear',        // 17
            'New Game',     // 18
            'Continue',     // 19
            '',             // 20 reserved
            'To Title',     // 21
            'Cancel',       // 22
            '',             // 23 reserved
            'Buy',          // 24
            'Sell'          // 25
        ];

        var m = terms.messages || {};

        m.alwaysDash       = 'Always Dash';
        m.commandRemember  = 'Command Remember';
        m.bgmVolume        = 'BGM Volume';
        m.bgsVolume        = 'BGS Volume';
        m.meVolume         = 'ME Volume';
        m.seVolume         = 'SE Volume';

        m.possession       = 'Possession';
        m.expTotal         = 'Current %1';
        m.expNext          = 'To Next %1';
        m.saveMessage      = 'Save to which file?';
        m.loadMessage      = 'Load which file?';
        m.file             = 'File';

        m.partyName        = "%1's Party";
        m.emerge           = '%1 emerged!';
        m.preemptive       = '%1 got the upper hand!';
        m.surprise         = '%1 was surprised!';
        m.escapeStart      = '%1 has started to escape!';
        m.escapeFailure    = 'However, it was unable to escape!';

        m.victory          = '%1 was victorious!';
        m.defeat           = '%1 was defeated.';

        m.obtainExp        = '%1 %2 received!';
        m.obtainGold       = '%1\\G found!';
        m.obtainItem       = '%1 found!';
        m.levelUp          = '%1 is now %2 %3!';
        m.obtainSkill      = '%1 learned!';

        m.useItem          = '%1 uses %2!';

        m.criticalToEnemy  = 'An excellent hit!!';
        m.criticalToActor  = 'A painful blow!!';

        m.actorDamage      = '%1 took %2 damage!';
        m.actorRecovery    = '%1 recovered %2 %3!';
        m.actorGain        = '%1 gained %2 %3!';
        m.actorLoss        = '%1 lost %2 %3!';
        m.actorDrain       = '%1 was drained of %2 %3!';
        m.actorNoDamage    = '%1 took no damage!';
        m.actorNoHit       = 'Miss! %1 took no damage!';

        m.enemyDamage      = '%1 took %2 damage!';
        m.enemyRecovery    = '%1 recovered %2 %3!';
        m.enemyGain        = '%1 gained %2 %3!';
        m.enemyLoss        = '%1 lost %2 %3!';
        m.enemyDrain       = '%1 was drained of %2 %3!';
        m.enemyNoDamage    = '%1 took no damage!';
        m.enemyNoHit       = 'Miss! %1 took no damage!';

        m.evasion          = '%1 evaded the attack!';
        m.magicEvasion     = '%1 nullified the magic!';
        m.magicReflection  = '%1 reflected the magic!';
        m.counterAttack    = '%1 counterattacked!';
        m.substitute       = '%1 protected %2!';

        m.buffAdd          = "%1's %2 went up!";
        m.debuffAdd        = "%1's %2 went down!";
        m.buffRemove       = "%1's %2 returned to normal!";

        m.actionFailure    = 'There was no effect on %1!';

        terms.messages = m;
    }
})();
