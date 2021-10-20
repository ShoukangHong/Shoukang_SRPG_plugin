//=============================================================================
//SRPG_ExpControl.js
// Simple plugin to allows User to control exp for each skill.
//=============================================================================
/*:
 * @plugindesc Simple plugin to allows User to control exp for each skill. Only work in SRPG mode
 * @author Shoukang
 *
 * @help
 * This plugin provides no plugin parameters
 * ===================================================================================================
 * Compatibility:
 * Place it below SRPG_AoEAnimation if you use.
 * ===================================================================================================
 * Skill note tag:
 * <srpgExp: x> set the exp to certain value, can also be a formula.
 * values you can use for the formula:
 * a       the actor, same as damage formula
 * dif     the exp difference from this level exp to next level exp.
 * ===================================================================================================
 * v 1.01 add note tag
 * v 1.00 First Release
 */
(function () {
    //=================================================================================================
    //Plugin Parameters
    //=================================================================================================
    var parameters = PluginManager.parameters('SRPG_ExpControl');

    var _useItem = Game_Battler.prototype.useItem;
    Game_Battler.prototype.useItem = function(item) {
        if ($gameSystem.isSRPGMode() && this.isActor() && DataManager.isSkill(item) &&
            item.meta.srpgExp) {
            var a = this;
            var dif = this.nextLevelExp() - this.currentLevelExp();
            $gameTroop.setSrpgExp(eval(item.meta.srpgExp))
        }
        _useItem.call(this, item);
    };

    var _SRPG_Game_Troop_expTotal = Game_Troop.prototype.expTotal;
    Game_Troop.prototype.expTotal = function() {
        if ($gameSystem.isSRPGMode() == true && this._srpgExp !== undefined) {
            //console.log(this._srpgExp)
            return Math.round(this._srpgExp);
        } else return _SRPG_Game_Troop_expTotal.call(this);
    };

    Game_Troop.prototype.setSrpgExp = function(exp) {
        this._srpgExp = exp;
    };

    Game_Troop.prototype.clearSrpgExp = function() {
        this._srpgExp = undefined;
    };

    var _srpgAfterAction = Scene_Map.prototype.srpgAfterAction;
    Scene_Map.prototype.srpgAfterAction = function() {
        if (this.srpgBattleFinished()){
            $gameTroop.clearSrpgExp();
        }
        _srpgAfterAction.call(this);
    };

    //check for whether AoE map battle is finished. Only useful when you have AoEAnimation plugin
    Scene_Map.prototype.srpgBattleFinished = function() {
        var livePartyMembers = $gameParty.battleMembers().filter(function(member) {
            return member.isAlive();
        });
        var activeType = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[0]
        return (!$gameTemp.areaTargets || $gameTemp.areaTargets().length <= 0) ||
        (activeType == 'enemy' && $gameTroop.isAllDead()) || livePartyMembers.length <= 0;
    }

})();
