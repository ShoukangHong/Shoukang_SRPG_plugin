//=============================================================================
// SRPG_RemainingMove.js
//-----------------------------------------------------------------------------
// Free to use and edit   version 1.00
//=============================================================================
/*:
 * @plugindesc 
 * Allow units to move with remaining move point and set additional move with actor/class/enemy note tag.
 * @author Shoukang
 *
 * @help
 *
 * New actor/class/enemy note tag:
 * <addActionTimes: formula> With this note tag the actor can move again when it has remaining move, you can use a formula
 * as the damage formula to determine additional action time.
 * For example: a.level/10 (decimal will be ignored)
 * ======================================================================================================================
 * Compatibility:
 * Not compatible with SRPG_MoveAfterAction.
 * place it somewhere below SRPG_RangeControl, SRPG_ModifiedMoveTable and SRPG_TerrainEffect(basically every plugin that overwrites Game_CharacterBase.prototype.makeMoveTable);
 */

(function() {

    Game_Temp.prototype.setUsedMovePoint = function(val){
        this._ump = val;
    };

    Game_Temp.prototype.usedMovePoint = function(){
        return this._ump || 0;
    };

    Object.defineProperty(Game_BattlerBase.prototype, 'ump', {
        get: function() { return this._ump || 0},
        set:function(val) { this._ump = val },
        configurable: true
    });

    var _Game_Battler_SRPGActionTimesSet = Game_Battler.prototype.SRPGActionTimesSet;
    Game_Battler.prototype.SRPGActionTimesSet = function() {
        _Game_Battler_SRPGActionTimesSet.call(this);
        var formula = '0';
        var a = this;
        if (this.isActor()){
            if (this.actor().meta.addActionTimes){
                formula = this.actor().meta.addActionTimes;
            } else if (this.currentClass().meta.addActionTimes){
                formula = this.currentClass().meta.addActionTimes;
            }
        } else if (this.isEnemy() && this.enemy().meta.addActionTimes){
            formula = this.enemy().meta.addActionTimes;
        }
        this._SRPGActionTimes += Math.floor(eval(formula));
    };

    var _Game_Battler_onTurnEnd = Game_Battler.prototype.onTurnEnd;
    Game_Battler.prototype.onTurnEnd = function() {
        this.ump = 0;
        _Game_Battler_onTurnEnd.call(this);
    };

    var _Game_Event_srpgMoveRouteForce = Game_Event.prototype.srpgMoveRouteForce;
    Game_Event.prototype.srpgMoveRouteForce = function(array) {
        var battlerArray = $gameSystem.EventToUnit(this.eventId());
        var x = this.posX();
        var y = this.posY();
        var originalMove = $gameTemp.MoveTable(x, y)[0];
        // get the end position by route
        for (var i = 0; i < array.length; i++){
            x = $gameMap.roundXWithDirection(x, array[i]);
            y = $gameMap.roundYWithDirection(y, array[i]);
        }
        $gameTemp.setUsedMovePoint(originalMove - $gameTemp.MoveTable(x, y)[0]); //store the battler's ump into temporay memory
        _Game_Event_srpgMoveRouteForce.call(this, array);
    };

    var _Game_CharacterBase_makeMoveTable = Game_CharacterBase.prototype.makeMoveTable;
    Game_CharacterBase.prototype.makeMoveTable = function(x, y, move, unused, tag) {
        var battler = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1];
        move = Math.max(battler.srpgMove() - battler.ump, 0);
        _Game_CharacterBase_makeMoveTable.call(this, x, y, move, unused, tag);
    }

    var _Scene_Map_srpgAfterAction = Scene_Map.prototype.srpgAfterAction;
    Scene_Map.prototype.srpgAfterAction = function(){
        var currentEvent = $gameTemp.activeEvent();
        var battler = $gameSystem.EventToUnit(currentEvent.eventId())[1];
        battler.ump = battler.ump + $gameTemp.usedMovePoint();
        $gameTemp.setUsedMovePoint(0);
        _Scene_Map_srpgAfterAction.call(this);
    };

    var _Scene_Map_commandWait = Scene_Map.prototype.commandWait
    Scene_Map.prototype.commandWait = function() {
        var battler = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1];
        battler.useSRPGActionTimes(999);
        _Scene_Map_commandWait.call(this);
    };

})();
