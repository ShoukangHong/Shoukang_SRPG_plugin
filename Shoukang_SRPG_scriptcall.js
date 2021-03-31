//=============================================================================
// Shoukang_SRPG_scriptcall.js
//-----------------------------------------------------------------------------
// add script call in if(...)
//this.isUnitDetected(regionId,...rest)
//put regionId and all the eventId in rest part.
//=============================================================================
/*:
 * @plugindesc Basic plugin for load option
 * @author Shoukang
 *
 * @help
 * Basic plugin for load option
 *
 * @param sasa
 * @type String
 * @desc the name of loading
 * @default load
 */
(function () {
    var parameters = PluginManager.parameters('Shoukang_SRPG_scriptcall');
    var _sasa = String(parameters['sasa'] || true);

Game_Interpreter.prototype.shoukangcheckRegionId = function(regionId) {
    if (regionId == 0){
        return false;
    }
    var result = false;   
    $gameMap.events().forEach(function(event) {
        if (event.isType() === 'actor') {
            if ($gameMap.regionId(event.posX(), event.posY()) == regionId) {
                result = true;
            }
        }
    });
    return result;
};

    Game_Interpreter.prototype.isUnitDetected = function(regionId,...rest) {
        var result =false;
        if (this.shoukangcheckRegionId(regionId)){
            return true;
        }
        rest.every(function(eventId) {
//            var battlerArray = $gameSystem.EventToUnit(eventId);
            var event = $gameMap.event(eventId);
            var enemy = $gameSystem.EventToUnit(event.eventId())[1];
            enemy.setActionAttack();
            $gameTemp.setActiveEvent(event);
            $gameSystem.srpgMakeMoveTable(event);
            var canAttackTargets = SceneManager._scene.srpgMakeCanAttackTargets(enemy, 'actor'); //行動対象としうるユニットのリストを作成 mark
            $gameTemp.clearMoveTable();
            if (canAttackTargets.length > 0 || enemy.hpRate < 1.0) {
                result = true;
            }
            return !result;
//            if (battlerArray && (battlerArray[0] === 'actor' || battlerArray[0] === 'enemy')) {
//                if (battlerArray[1].battleMode() !== 'stand' || battlerArray[1].hpRate() < 1.0) {
//                    result = true;
//                }
//            }
        });
        return result;
    }

    Game_CharacterBase.prototype.checkAddEnemy = function(x, y) {
        var events = $gameMap.eventsXyNt(x, y);
        return events.some(function(event) {
            if ((event.isType() === 'actor' && $gameTemp.activeEvent().isType() === 'enemy') ||
                (event.isType() === 'enemy' && $gameTemp.activeEvent().isType() === 'actor') ||
                (event.isType() === 'object' && event.characterName() != '') && !event.isErased()) {
                return true;
            } else {
                return false;
            }
        });
    };
})();