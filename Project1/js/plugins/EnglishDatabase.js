//=============================================================================
// EnglishDatabase.js
// RPG Maker MV - Translate common Chinese default database content to English
//=============================================================================
/*:
 * @plugindesc Translates common RPG Maker MV Chinese default database names/messages to English at runtime.
 * @author OpenAI
 *
 * @help
 * Installation:
 * 1. Put EnglishDatabase.js in: js/plugins/
 * 2. Enable it in Plugin Manager.
 * 3. Put it BELOW EnglishUI_Fixed and other UI/language plugins.
 * 4. Test with New Game.
 *
 * What this plugin covers:
 * - Default actor names such as 霍尔德 -> Harold
 * - Common default class, skill, item, weapon, armor, state, and enemy names
 * - Common skill/battle database messages such as "%1的攻击！" -> "%1 attacks!"
 * - Common Chinese descriptions/messages where a safe exact replacement is known
 *
 * It does NOT machine-translate arbitrary custom text.
 * Your own dialogue, custom item names, custom descriptions, map names, etc.
 * still need to be translated manually unless they exactly match a mapping below.
 */

(function() {
    'use strict';

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    var _englishDatabaseApplied = false;

    DataManager.isDatabaseLoaded = function() {
        if (!_DataManager_isDatabaseLoaded.call(this)) {
            return false;
        }

        if (!_englishDatabaseApplied) {
            applyEnglishDatabase();
            _englishDatabaseApplied = true;
        }

        return true;
    };

    function replaceExact(value, map) {
        if (typeof value !== 'string') return value;
        return Object.prototype.hasOwnProperty.call(map, value) ? map[value] : value;
    }

    function replacePatterns(value) {
        if (typeof value !== 'string' || !value) return value;

        var s = value;

        // Common skill/action messages
        s = s.replace(/%1的攻击！/g, '%1 attacks!');
        s = s.replace(/%1进行攻击！/g, '%1 attacks!');
        s = s.replace(/%1防御了！/g, '%1 guards!');
        s = s.replace(/%1进行防御！/g, '%1 guards!');
        s = s.replace(/%1使用了%2！/g, '%1 uses %2!');
        s = s.replace(/%1发动了%2！/g, '%1 uses %2!');
        s = s.replace(/%1咏唱了%2！/g, '%1 casts %2!');
        s = s.replace(/%1逃跑了！/g, '%1 escaped!');
        s = s.replace(/%1什么也没有做！/g, '%1 does nothing!');

        // Skill database messages often use just "%1"
        s = s.replace(/%1的攻击/g, '%1 attacks');
        s = s.replace(/%1防御/g, '%1 guards');

        return s;
    }

    function translateArray(data, map) {
        if (!data) return;
        for (var i = 1; i < data.length; i++) {
            var obj = data[i];
            if (!obj) continue;

            if (obj.name !== undefined) {
                obj.name = replaceExact(obj.name, map);
            }
            if (obj.description !== undefined) {
                obj.description = replaceExact(obj.description, DESCRIPTION_MAP);
                obj.description = replacePatterns(obj.description);
            }

            // Skills and states can contain message fields
            if (obj.message1 !== undefined) obj.message1 = replacePatterns(obj.message1);
            if (obj.message2 !== undefined) obj.message2 = replacePatterns(obj.message2);
            if (obj.message3 !== undefined) obj.message3 = replacePatterns(obj.message3);
            if (obj.message4 !== undefined) obj.message4 = replacePatterns(obj.message4);
        }
    }

    var ACTOR_MAP = {
        '哈罗德': 'Harold',
        '霍尔德': 'Harold',
        '特蕾莎': 'Therese',
        '玛莎': 'Marsha',
        '露西乌斯': 'Lucius'
    };

    var CLASS_MAP = {
        '勇者': 'Hero',
        '战士': 'Warrior',
        '魔法师': 'Mage',
        '僧侣': 'Priest'
    };

    var SKILL_MAP = {
        '攻击': 'Attack',
        '防御': 'Guard',
        '连续攻击': 'Double Attack',
        '三连击': 'Triple Attack',
        '逃跑': 'Escape',
        '等待': 'Wait',
        '强力攻击': 'Power Attack',
        '治疗': 'Heal',
        '强力治疗': 'Greater Heal',
        '群体治疗': 'Group Heal',
        '复活': 'Revive',
        '火焰': 'Fire',
        '烈焰': 'Flame',
        '火球': 'Fireball',
        '冰冻': 'Ice',
        '暴风雪': 'Blizzard',
        '雷电': 'Thunder',
        '闪电': 'Lightning',
        '毒': 'Poison',
        '睡眠': 'Sleep',
        '沉默': 'Silence',
        '混乱': 'Confusion',
        '麻痹': 'Paralyze',
        '提升攻击': 'Attack Up',
        '提升防御': 'Defense Up'
    };

    var ITEM_MAP = {
        '药水': 'Potion',
        '高级药水': 'Hi-Potion',
        '超级药水': 'Mega Potion',
        '魔法药水': 'Magic Water',
        '解毒剂': 'Antidote',
        '解毒药': 'Antidote',
        '复活药': 'Revival Potion',
        '万能药': 'Panacea',
        '帐篷': 'Tent',
        '钥匙': 'Key'
    };

    var WEAPON_MAP = {
        '剑': 'Sword',
        '长剑': 'Long Sword',
        '铁剑': 'Iron Sword',
        '钢剑': 'Steel Sword',
        '斧': 'Axe',
        '战斧': 'Battle Axe',
        '枪': 'Spear',
        '弓': 'Bow',
        '短弓': 'Short Bow',
        '法杖': 'Staff',
        '魔杖': 'Magic Staff',
        '匕首': 'Dagger'
    };

    var ARMOR_MAP = {
        '盾': 'Shield',
        '木盾': 'Wooden Shield',
        '铁盾': 'Iron Shield',
        '帽子': 'Hat',
        '头盔': 'Helmet',
        '皮甲': 'Leather Armor',
        '锁子甲': 'Chain Mail',
        '铁甲': 'Iron Armor',
        '长袍': 'Robe',
        '戒指': 'Ring'
    };

    var STATE_MAP = {
        '死亡': 'Death',
        '中毒': 'Poison',
        '失明': 'Blind',
        '沉默': 'Silence',
        '愤怒': 'Rage',
        '混乱': 'Confusion',
        '魅惑': 'Fascination',
        '睡眠': 'Sleep',
        '麻痹': 'Paralysis',
        '眩晕': 'Stun',
        '防御': 'Guard'
    };

    var ENEMY_MAP = {
        '蝙蝠': 'Bat',
        '史莱姆': 'Slime',
        '黄蜂': 'Hornet',
        '蜘蛛': 'Spider',
        '老鼠': 'Rat',
        '兽人': 'Orc',
        '哥布林': 'Goblin',
        '骷髅': 'Skeleton',
        '幽灵': 'Ghost',
        '僵尸': 'Zombie',
        '食人魔': 'Ogre',
        '巨魔': 'Troll',
        '恶魔': 'Demon',
        '龙': 'Dragon'
    };

    var DESCRIPTION_MAP = {
        '恢复少量HP。': 'Restores a small amount of HP.',
        '恢复HP。': 'Restores HP.',
        '恢复大量HP。': 'Restores a large amount of HP.',
        '恢复少量MP。': 'Restores a small amount of MP.',
        '恢复MP。': 'Restores MP.',
        '解除中毒状态。': 'Cures Poison.',
        '使一名战斗不能的队友复活。': 'Revives one fallen ally.'
    };

    function applyEnglishDatabase() {
        // Actors
        if ($dataActors) {
            for (var i = 1; i < $dataActors.length; i++) {
                var actor = $dataActors[i];
                if (!actor) continue;
                actor.name = replaceExact(actor.name, ACTOR_MAP);
                actor.nickname = replacePatterns(actor.nickname);
                actor.profile = replacePatterns(actor.profile);
            }
        }

        // Classes
        translateArray($dataClasses, CLASS_MAP);

        // Skills
        translateArray($dataSkills, SKILL_MAP);

        // Items
        translateArray($dataItems, ITEM_MAP);

        // Weapons
        translateArray($dataWeapons, WEAPON_MAP);

        // Armors
        translateArray($dataArmors, ARMOR_MAP);

        // States
        translateArray($dataStates, STATE_MAP);

        // Enemies
        translateArray($dataEnemies, ENEMY_MAP);
    }

})();
