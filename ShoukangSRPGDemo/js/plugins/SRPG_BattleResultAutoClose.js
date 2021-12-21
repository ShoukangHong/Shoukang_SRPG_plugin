//=============================================================================
//SRPG_BattleResultAutoClose.js
// Simple plugin to allows User to control exp for each skill.
//=============================================================================
/*:
 * @plugindesc Simple plugin to close battle result window automatically in enemy phase.
 * @author NatePlays, Shoukang
 *
 * @param wait count
 * @desc The frame count it take to auto close the result window
 * @type number
 * @default 45
 *
 * @param actor phase auto close
 * @desc result window will auto close in actor phase
 * @type boolean
 * @default false
 *
 * @help
 * ===================================================================================================
 * Compatibility:
 * Place below Core plugin
 * ===================================================================================================
 * v 1.00 First Release
 */
(function () {
    var parameters = PluginManager.parameters('SRPG_BattleResultAutoClose');
    var _delayBattleEnd = Number(parameters['wait count'] || 45);
    var _actorPhaseClose = !!eval(parameters['actor phase auto close'] || false);

    var _WindowBattleResult_Update = Window_SrpgBattleResult.prototype.update;
    Window_SrpgBattleResult.prototype.update = function() {
        _WindowBattleResult_Update.call(this);
        this.updateWait();
        this.updateAutoClose();
    };

    Window_SrpgBattleResult.prototype.updateWait = function() {
        if (this.isOpen() && !this.isChangeExp()){
            this._waitCount--;
        } 
    };

    Window_SrpgBattleResult.prototype.updateAutoClose = function() {
        if (this.isOpen() && this._waitCount <= 0 && ($gameSystem.isBattlePhase() !== 'actor_phase' || _actorPhaseClose)) {
            $gameSystem.setSubBattlePhase('after_battle');
            if (!$gameSystem.useMapBattle()) BattleManager.endBattle(3);
            this._waitCount = _delayBattleEnd;
            this.close();
        }
    };

    var _Window_SrpgBattleResult_setRewards = Window_SrpgBattleResult.prototype.setRewards
    Window_SrpgBattleResult.prototype.setRewards = function(rewards) {
        _Window_SrpgBattleResult_setRewards.call(this, rewards)
        this._waitCount = _delayBattleEnd;
    };

})();
