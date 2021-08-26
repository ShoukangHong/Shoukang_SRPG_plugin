//=============================================================================
//SRPG_AgiAttackControl.js
//=============================================================================
/*:
 * @plugindesc More control over the Agiattack rule, support AoE agi Attack
 * @author Shoukang
 * 
 * @param agi attack formula
 * @desc The equation to determine agi attack times
 * @default dif >= 4 ? 1 : 0;
 *
 * @param agi attack max time
 * @desc the maximum agi attack time
 * @type number
 * @default 2
 *
 * @param agi attack no cost
 * @desc agi attack won't cost any tp or mp
 * @type boolean
 * @default false
 *
 * @help 
 * ===================================================================================================
 * Compatibility:
 * Map battle need SRPG_AoEAnimation(updated on 8/26/21), and place this plugin below it.
 * Scene battle should work regradless.
 * this plugin will make agiAttackplus parameter in core useless.
 * ===================================================================================================
 * The following values can be used for agi attack formula:
 * a    :fast unit in the battle
 * b    :slow unit in the battle
 * dif  :a.agi - b.agi
 * a simple guidance to understand the default formular meaning:
 * dif >= 4        ?        1 : 0
 * is dif >= 4 ? if yes do 1 agiAttack, if no do 0 agiAttack.
 * you can even make something like dif >= 4 ? (dif >= 8 ? 2:1) : 0;
 * therefore it will further check (dif >= 8 ? 2:1) if dif >= 4.
 * You can also use (dif/b.agi) * 2, dif > Math.randomInt(100) ? 1:0, etc.
 * if result is a float number like 3.1415... only the integer part will be taken into account.
 * ===================================================================================================
 * v 1.00 first release
 */
(function () {
    'use strict'
    //=================================================================================================
    //Plugin Parameters
    //=================================================================================================
    var parameters = PluginManager.parameters('SRPG_AgiAttackControl');
    var _formula = parameters['agi attack formula'] || 'dif >= 4 ? 1 : 0';
    var _max = Number(parameters['agi attack max time'] || 2);
    var _noCost = !!eval(parameters['agi attack no cost']);

    //map battle logiv
    Scene_Map.prototype.srpgAgiAttackPlus = function(user, target, reaction, actFirst, targetEvents){
        this.srpgAddMapSkill(reaction, target, user, false);//action, user, target, addToFront
        var firstBattler = user.agi >= target.agi ? user : target;
        var secondBattler = user.agi >= target.agi ? target : user;
        if (firstBattler.canAgiAttack()) {
        	var agiTime = firstBattler.getAgiAttackTime(secondBattler);
        	var agiAction = _noCost ? firstBattler.action(0).createNoCostAction() : firstBattler.action(0);
            for (var i = 0; i < agiTime; i++) {
                if (target == $gameSystem.EventToUnit(targetEvents[0].eventId())[1] && firstBattler == user){
                     this.addAoESkillToAgiList(agiAction, firstBattler, targetEvents);
                } else if (firstBattler == target) {
                    this.addSkillToAgiList(agiAction, firstBattler, secondBattler);
                }
            }
        }
    }

    Game_Battler.prototype.getAgiAttackTime = function(target){
        var dif = this.agi - target.agi;
        var count = Math.floor(eval(_formula))
        return Math.min(count, _max)
    }

    var _BattleManager_makeActionOrders = BattleManager.makeActionOrders;
    BattleManager.makeActionOrders = function() {
        if ($gameSystem.isSRPGMode()){
        	var battlers = $gameParty.members().concat($gameTroop.members());
        	var agiBattlers = [];
		    battlers.forEach(function(battler) {battler.makeSpeed();});
		    //active event timing is 0, targets timing is 1, so actor will stay at [0]
            battlers.sort(function(a, b) {return a.srpgActionTiming() - b.srpgActionTiming();});
            var user = battlers[0];
            for (var i = 1; i < battlers.length; i++){
	            var target = battlers[i];
		        var firstBattler = user.agi >= target.agi ? user : target;
		        var secondBattler = user.agi >= target.agi ? target : user;
		        if (firstBattler.canAgiAttack()) {
		        	var agiTime = firstBattler.getAgiAttackTime(secondBattler);
		        	var agiAction = firstBattler.action(0);
		            if (firstBattler == user && i == 1 && agiTime > 0){
		            	firstBattler.reserveSameAction(agiTime, agiBattlers);
		            } else if (firstBattler == target && agiTime > 0) {
		                firstBattler.reserveSameAction(agiTime, agiBattlers);
		            }
		        }
            }
            this._actionBattlers = battlers.concat(agiBattlers)
        } else _BattleManager_makeActionOrders.call(this);
    }

    Game_Battler.prototype.reserveSameAction = function(num, agiBattlers) {
    	this._reserveAction = [];
        var action = _noCost ? this._actions[0].createAoENoCostAction() : this._actions[0];
    	for (var i = 0; i < num; i++){
	        this._reserveAction.push(action);
	        agiBattlers.push(this);
    	}
    };

    Game_Battler.prototype.addSameAction = function() {
        if (!this.currentAction() && this._reserveAction && this._reserveAction.length > 0) {
            this._actions.push(this._reserveAction.pop());
            var targets = this._actions[0].makeTargets();
            if (targets.length == 0) this._actions = [];
        }
    };

    var _SRPG_BattleManager_endTurn = BattleManager.endTurn;
    BattleManager.endTurn = function() {
        if ($gameSystem.isSRPGMode() == true) this.clearRemainingActions();
        _SRPG_BattleManager_endTurn.call(this);
    };

    BattleManager.clearRemainingActions = function() {
    	for (var i = 0; i < this._actionBattlers.length; i++){
    		this._actionBattlers[i].clearReserveAction();
    	}
        this._actionBattlers = [];
    };

    Game_Battler.prototype.clearReserveAction = function(){
        this._reserveAction = [];
    }

    Game_Battler.prototype.canAgiAttack = function(){
        return this.currentAction() && this.currentAction().canAgiAttack();
    }

    Game_Action.prototype.canAgiAttack = function(){
        return this.isForOpponent() && this.item() && !this.item().meta.doubleAction;
    }

    Game_Action.prototype.createNoCostAction = function(){
        var action = this.createAoERepeatedAction();
        action.setHideAnimation(undefined);
        return action;
    }

})();
