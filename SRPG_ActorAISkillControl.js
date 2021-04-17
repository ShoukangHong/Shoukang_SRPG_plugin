//=============================================================================
// SRPG_ActorAISkillControl.js
//-----------------------------------------------------------------------------
// free to use and edit
//=============================================================================
/*:
 * @plugindesc SRPG_AIControl provides target selection method with a given skill, but actor's skill is picked randomly.This plugin gives you control on actor skill selection.
 * @author Shoukang
 *
 * @help
 * 
 * RMMV allows you to set enemy skill priority and skill conditions, which also work in SRPG mode. 
 * However, there are no such choices for actor units. Actor AI will randomly select a skill from the available
 * skill list. This plugin allows you to set skill priority and conditions for Actors in SRPG mode.
 * The difference of priority between a skill and the highest priority skill will affect the possibility of using
 * a skill. if difference >= 3, 0 possibility. if difference = 1, 1/3 possibility, if difference = 2, 
 * 2/3 possibility(compared to the highest priority skill, it's the same as the enemy skill's setting).
 *
 * skill notetags:
 * <AIpriority:x> x is the priority of the skill. If don't write this a skill's priority is 5. This number can be negative or positive.
 * <AISkillCondition>    Only use this skill when it meets condition. If don't write this a skill always meets condition.
 * code                  The code will be put in if (...) brackets.
 * </AISkillCondition> 
 * You can use these values in a formula
 * s[n]         value of switch n
 * v[n]         value of variable n
 * a            user of the skill
 * for example, the following code means only use this skill when user's hp is not full.
 * <AISkillCondition>
 * a.hp < a.mhp
 * </AISkillCondition>
 *==========================================================================================================================
 * Future plan: check actor notetages and class notetags. 
 * Enable target condition check in formula.(This is hard though, because this stage is before move, target can be anyone in range)
 * =========================================================================================================================
 * Compatibility
 * Anywhere below SRPG_Core
 */
(function () {
    var parameters = PluginManager.parameters('SRPG_ActorAISkillControl');

	Game_Action.prototype.AIpriority = function() {
		return Number(this.item().meta.AIpriority) || 5;
	};

	Game_Action.prototype.AISkillCondition = function() {
		var notedata = this.item().note.split(/[\r\n]+/);
		var flag = false;
		var code = "";
		for (var i = 0; i < notedata.length; i++){
			if (notedata[i].match(/<\/AISkillCondition>/i)) return code;
			if (flag) code = code + "\n" + notedata[i];
			if (notedata[i].match(/<AISkillCondition>/i)) flag = true;
		}
		return false;
	};

	Game_Actor.prototype.makeAutoBattleActions = function() {
		if ($gameSystem.isSRPGMode() == true) {
			for (var i = 0; i < this.numActions(); i++) {
				var a = this;
				var topPriority = - 100;
				var list = this.makeActionList().filter(function(item){
					if (item.item().meta.AISkillCondition){
						var s = $gameSwitches._data;
						var v = $gameVariables._data;
						if (eval(item.AISkillCondition()) === false){
							return false;
						}
					}
					topPriority = Math.max(topPriority, item.AIpriority());
					return true;
				});
				var finallist = list.filter(function(item){
					return topPriority - item.AIpriority() < 3;
				});
				this.setAction(i, this.selectAction(finallist, topPriority - 3));
			}
			this.setActionState('waiting');
		} else {
            return _SRPG_Game_Actor_makeAutoBattleActions.call(this);
        }
	};

	Game_Actor.prototype.selectAction = function(actionList, ratingZero) {
	    var sum = actionList.reduce(function(r, item) {
	        return r + item.AIpriority() - ratingZero;
	    }, 0);

	    if (sum > 0) {
	        var value = Math.randomInt(sum);
	        for (var i = 0; i < actionList.length; i++) {
	            var action = actionList[i];
	            value -= action.AIpriority() - ratingZero;
	            if (value < 0) {
	                return action;
	            }
	        }
	    } else {
	        return null;//this will report error with pathfinding plugin!
	    }
	};
})();