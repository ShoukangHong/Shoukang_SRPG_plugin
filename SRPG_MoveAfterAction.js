//=============================================================================
// SRPG_remainingMove.js
//-----------------------------------------------------------------------------
// Free to use and edit   v1.00 first Release!
//=============================================================================
/*:
 * @plugindesc 
 * Allow units to move if they have remaining move points after action.
 * @author Shoukang
 *
 * @help
 * actor/class/weapon/armor note tag:
 * <MoveAfterAction>    with this note tag the actor can move again when it has remaining move.
 * Enemy units and auto battle actors can not move after action, because they don't know how to use it.
 * ==========================================================================================================================
 * version 1.00 first release!
 * ===========================================================================================================================
 * Compatibility:
 * Place this plugin below the other SRPG plugins.
 * ===========================================================================================================================
 */

(function() {
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
		if (this.actor().meta.MoveAfterAction) return true;
		if (this.currentClass().meta.MoveAfterAction) return true;
		var equipments = this.equips();
		for (var i = 0; i < equipments.length; i++){
			if (equipments[i] && equipments[i].meta.MoveAfterAction) return true;
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
		if (currentBattler.srpgTurnEnd() && !currentBattler.isSrpgAfterActionMove() && 
			currentBattler.SrpgRemainingMove() && !$gameTemp.isTurnEndFlag()){
			currentBattler.setSrpgAfterActionMove(true);
			currentBattler.setSrpgTurnEnd(false);
			$gameTemp.setAutoMoveDestinationValid(true);
			$gameTemp.setAutoMoveDestination(oriX, oriY);
		} else if ($gameTemp.isTurnEndFlag()) currentBattler.setSrpgRemainingMove(0);
	};

	var shoukang_Scene_Map_isSrpgActorTurnEnd = Scene_Map.prototype.isSrpgActorTurnEnd;
	Scene_Map.prototype.isSrpgActorTurnEnd = function() {//the true/false here is confusing......true is not turn end, false is turn end
		var result = $gameMap.events().some(function(event) {
			var battlerArray = $gameSystem.EventToUnit(event._eventId);
			if (battlerArray && battlerArray[0] === 'actor' && !event.isErased() && !battlerArray[1].isRestricted()) {
				if (battlerArray[1].SrpgRemainingMove()) return true;
			}
		});
		if (result === true) return true;
		return shoukang_Scene_Map_isSrpgActorTurnEnd.call(this);
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
		if ($gameSystem.isSRPGMode() == true && $gameTemp.activeEvent() && $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1].isSrpgAfterActionMove()) {
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
