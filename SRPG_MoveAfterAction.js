//=============================================================================
// SRPG_MoveAfterAction.js
//-----------------------------------------------------------------------------
// Free to use and edit   version 1.04 fix bug for after action move when actor is defeated.
//=============================================================================
/*:
 * @plugindesc 
 * Allow units to move if they have remaining move points after action.
 * @author Shoukang
 *
 * @param auto select actor
 * @desc if the actor can do move after action, auto select the actor
 * @type boolean
 * @default true
 *
 * @help
 * actor/class/weapon/armor/state note tag:
 * <MoveAfterAction>    with this note tag the actor can move again when it has remaining move.
 * Enemy units and auto battle actors can not move after action, because they don't know how to use it.
 * ==========================================================================================================================
 * version 1.04 fix bug for after action move when actor is defeated.
 * version 1.03 fix bug for not clearing movetile after action
 * version 1.02 fix bug for auto battle, can auto select actor if the actor can do move after action
 * version 1.01 enable state notetags
 * version 1.00 first release!
 * ===========================================================================================================================
 * Compatibility:
 * Place this plugin below the other SRPG plugins.
 * ===========================================================================================================================
 */

(function() {
    var params = PluginManager.parameters('SRPG_MoveAfterAction');
    var _autoSelect = !!eval(params['auto select actor']);

    var coreParameters = PluginManager.parameters('SRPG_core');
    var _srpgAutoBattleStateId = Number(coreParameters['srpgAutoBattleStateId'] || 14);
    var shoukang_Game_BattlerBase_initMembers = Game_BattlerBase.prototype.initMembers;
    Game_BattlerBase.prototype.initMembers = function() {
        shoukang_Game_BattlerBase_initMembers.call(this);
        this._SrpgRemainingMove = 0;
        this._isSrpgAfterActionMove = false;
    };

    Game_BattlerBase.prototype.isSrpgAfterActionMove = function() {
        if (this.SRPGActionTimes() <= 1) return this._isSrpgAfterActionMove;//in case someone use add action time skills
        return false;
    };

    Game_BattlerBase.prototype.setSrpgAfterActionMove = function(val) {
        this._isSrpgAfterActionMove = val;
    };

    Game_BattlerBase.prototype.SrpgRemainingMove = function() {
        return this._SrpgRemainingMove;
    };

    Game_BattlerBase.prototype.setSrpgRemainingMove = function(val) {
        this._SrpgRemainingMove = val;
    };
//store remaining move after move route force
    var shoukang_Game_Event_srpgMoveRouteForce = Game_Event.prototype.srpgMoveRouteForce;
    Game_Event.prototype.srpgMoveRouteForce = function(array) {
        var battlerArray = $gameSystem.EventToUnit(this.eventId());
        if (!battlerArray[1].isAutoBattle() && battlerArray[1].canMoveAfterAction() && !battlerArray[1].isSrpgAfterActionMove()){
            var x = this.posX();
            var y = this.posY();
            for (var i = 0; i < array.length; i++){
                x = $gameMap.roundXWithDirection(x, array[i]);
                y = $gameMap.roundYWithDirection(y, array[i]);
            }
            battlerArray[1].setSrpgRemainingMove($gameTemp.MoveTable(x, y)[0]);//
        }
        shoukang_Game_Event_srpgMoveRouteForce.call(this, array);
    };
//check actor, class and equipments.
    Game_Actor.prototype.canMoveAfterAction = function(type) {
        if (this.srpgTurnEnd() || this.isDead()) return false;
        if (_srpgAutoBattleStateId && this.isStateAffected(_srpgAutoBattleStateId)) return false
        if (this.actor().meta.MoveAfterAction) return true;
        if (this.currentClass().meta.MoveAfterAction) return true;
        var equipments = this.equips();
        for (var i = 0; i < equipments.length; i++){
            if (equipments[i] && equipments[i].meta.MoveAfterAction) return true;
        } 
        var states = this.states();
        for (var i = 0; i < states.length; i++){
            if (states[i] && states[i].meta.MoveAfterAction) return true;
        }
        return false;
    };

    Game_Enemy.prototype.canMoveAfterAction = function(type) {
//        if (this.enemy().meta.MoveAfterAction) return true;
        return false;
    };
// if actor has remaining move and can do after move action, let the actor do after move action.
    var shoukang_Scene_Map_srpgAfterAction = Scene_Map.prototype.srpgAfterAction;
    Scene_Map.prototype.srpgAfterAction = function() {
        var currentEvent = $gameTemp.activeEvent();
        var currentBattler = $gameSystem.EventToUnit(currentEvent.eventId())[1];
        var oriX = $gameTemp.activeEvent().posX();
        var oriY = $gameTemp.activeEvent().posY();
        shoukang_Scene_Map_srpgAfterAction.call(this);
        if (currentBattler.isAlive() && currentBattler.srpgTurnEnd() && !currentBattler.isSrpgAfterActionMove() && 
            currentBattler.SrpgRemainingMove() && !$gameTemp.isTurnEndFlag() &&
            $gameSystem.isBattlePhase() !== 'auto_actor_phase'){
            currentBattler.setSrpgAfterActionMove(true);
            currentBattler.setSrpgTurnEnd(false);
            $gameTemp.setAutoMoveDestinationValid(true);
            $gameTemp.setAutoMoveDestination(oriX, oriY);
            if (_autoSelect){
                $gameMap._flagInvokeActionStart = false;
                $gameTemp.setActiveEvent(currentEvent);
                $gameSystem.srpgMakeMoveTable(currentEvent);
                var battlerArray = $gameSystem.EventToUnit(currentEvent.eventId());
                $gameParty.pushSrpgBattleActors(battlerArray[1]);
                $gameTemp.reserveOriginalPos($gameTemp.activeEvent().posX(), $gameTemp.activeEvent().posY());
                $gameSystem.setSrpgActorCommandStatusWindowNeedRefresh(battlerArray);
                $gameTemp.setResetMoveList(true);
                $gameSystem.setSubBattlePhase('actor_move');
            }
        } else if ($gameTemp.isTurnEndFlag()) currentBattler.setSrpgRemainingMove(0);
    };

    var shoukang_Scene_Menu_commandAutoBattle = Scene_Menu.prototype.commandAutoBattle
    Scene_Menu.prototype.commandAutoBattle = function() {
        shoukang_Scene_Menu_commandAutoBattle.call(this)
        $gameMap.events().forEach(function(event) {
            var battlerArray = $gameSystem.EventToUnit(event._eventId);
            if (battlerArray && battlerArray[0] === 'actor' && battlerArray[1].isSrpgAfterActionMove()) {
                battlerArray[1].setSrpgTurnEnd(true);
                battlerArray[1].setSrpgAfterActionMove(false)
                battlerArray[1].setSrpgRemainingMove(0)
            }
        });
    };

    var shoukang_Scene_Map_isSrpgActorTurnEnd = Scene_Map.prototype.isSrpgActorTurnEnd;
    Scene_Map.prototype.isSrpgActorTurnEnd = function() {//the true/false here is confusing......true is not turn end, false is turn end
        var result = $gameMap.events().some(function(event) {
            var battlerArray = $gameSystem.EventToUnit(event._eventId);
            if (battlerArray && battlerArray[0] === 'actor' && !event.isErased() && !battlerArray[1].isRestricted()) {
                if (battlerArray[1].SrpgRemainingMove() && battlerArray[1].isSrpgAfterActionMove()) return true;
            }
        });
        if (result === true) return true;
        return shoukang_Scene_Map_isSrpgActorTurnEnd.call(this);
    };

    var shoukang_Game_System_clearData = Game_System.prototype.clearData;
    Game_System.prototype.clearData = function() {
        $gameTemp.clearMoveTable();
        $gameTemp.setResetMoveList(true);
        shoukang_Game_System_clearData.call(this);
    };

//reset values on turn end.
    var shoukang_Game_Battler_onTurnEnd = Game_Battler.prototype.onTurnEnd;
    Game_Battler.prototype.onTurnEnd = function() {
        if ($gameSystem.isSRPGMode() == true) {
            this.setSrpgRemainingMove(0);
            this.setSrpgAfterActionMove(false);
        }
        shoukang_Game_Battler_onTurnEnd.call(this);
    };
//only show wait command when after action move.
    var shoukang_Window_ActorCommand_makeCommandList = Window_ActorCommand.prototype.makeCommandList;
    Window_ActorCommand.prototype.makeCommandList = function() {
        if ($gameSystem.isSRPGMode() == true && this._actor && this._actor.isSrpgAfterActionMove()) {
                this.addWaitCommand();
        } else {
            shoukang_Window_ActorCommand_makeCommandList.call(this);
        }
    };  
//only enable move again when waiting on unit event.
    var shoukang_Scene_Map_commandWait = Scene_Map.prototype.commandWait
    Scene_Map.prototype.commandWait = function() {
        var battler = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1];
        var flag = $gameMap.eventsXy($gameTemp.activeEvent().posX(), $gameTemp.activeEvent().posY()).some(function(event) {
            if (event.isType() === 'unitEvent' && event.pageIndex() >= 0) return true;
        });
        if (!flag || battler.isSrpgAfterActionMove()){
            battler.setSrpgRemainingMove(0);
            battler.setSrpgAfterActionMove(false);
        } 
        shoukang_Scene_Map_commandWait.call(this);
    };
//replace move with remaining move when after action move.
    var shoukang_Game_CharacterBase_makeMoveTable = Game_CharacterBase.prototype.makeMoveTable;
    Game_CharacterBase.prototype.makeMoveTable = function(x, y, move, unused, tag) {
        var battler = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1];
        if (battler.isSrpgAfterActionMove()) move = battler.SrpgRemainingMove();
        shoukang_Game_CharacterBase_makeMoveTable.call(this, x, y, move, unused, tag);
    }
//don't show range table for after action move.
    var shoukang_Game_CharacterBase_makeRangeTable = Game_CharacterBase.prototype.makeRangeTable;
    Game_CharacterBase.prototype.makeRangeTable = function(x, y, range, unused, oriX, oriY, skill) {
        if ($gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1].isSrpgAfterActionMove()) return;
        shoukang_Game_CharacterBase_makeRangeTable.call(this, x, y, range, unused, oriX, oriY, skill);
    };

    if (Game_CharacterBase.prototype.makeAoETable){
        var shoukang_Game_CharacterBase_makeAoETable = Game_CharacterBase.prototype.makeAoETable;
        Game_CharacterBase.prototype.makeAoETable = function(x, y, range, unused, skill, areaRange, areaminRange, shape, user) {
            if ($gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1].isSrpgAfterActionMove()) return;
            shoukang_Game_CharacterBase_makeAoETable.call(this, x, y, range, unused, skill, areaRange, areaminRange, shape, user)
        };
    };

})();
