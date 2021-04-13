//=============================================================================
// SRPG_AuraSkill.js
//-----------------------------------------------------------------------------
// Free to use and edit   v1.02
//=============================================================================
/*:
 * @plugindesc This plugin allows you to create Aura skills for SRPG battle.
 * @author Shoukang
 * 
 * @param max range
 * @desc This is the max range for Aura detection, shape is square. This range should equal to your largest Aura range.
 * @type number
 * @min 1
 * @default 3
 *
 * @param default range
 * @desc If not specified this is the default range of an Aura.
 * @type number
 * @default 2
 *
 * @param default target
 * @desc Input "friend", "foe" or "all".
 * @type string
 * @default friend
 *
 * @param default shape
 * @desc If not specified this is the default shape of an Aura, refer to SRPG_AOE.
 * @type string
 * @default circle
 *
 * @help
 * This plugin provides several note tags for you to create Aura skills. 
 * An Aura skill will add a state automatically to valid units in Aura range.
 * skill note tags:
 * <SRPGAuraState:x>    this is the state of this Aura skill, replace x with state id.
 * <SRPGAuraTarget:xxx> This is the units that will be affected, xxx can be "friend" "foe" or "all" 
 * <SRPGAuraRange:x>    The range of Aura, similar to AoE range.
 * <SRPGAuraShape:xxx>  The shape of Aura, replace xxx with shapes defined in SRPR_AoE (Anisotropic shapes not supported)
 * Please note: don't put any space after ":" in these note tags. And no need to add "".
 * 
 * state note tag:
 * <SRPGAura>    With this notetag a state will be removed once a unit is out of the Aura.
 * If you want the Aura to be effective after a unit leaves the Aura range don't use this tag.
 * 
 * Aura skills are completely passive, you can set the skills as not useable.
 * Passive states of related units will be refreshed everytime you open the SRPGstatuswindow, 
 * prediction window, menu window. It will also refresh when show movetable, before battle and turn end.
 * You can also assign Aura skills to enemies.
 * You may want to use some other plugins like ALOE_ItemSkillSortPriority to put a passive aura skill to the end of 
 * your skill list.
 * 
 * version 1.00 first release!
 * version 1.01 refresh status when open main menu. fix some bugs.
 * version 1.02 refresh status when turn end, refresh only once for AoE skills.
 *
 * This plugin needs SPPG_AoE to work. Place this plugin below SRPG_ShowAoERange if you are using it.
 */
(function () {
	var parameters = PluginManager.parameters('SRPG_AuraSkill');
	var _maxRange = parameters['max range'] || 3;
	var _defaultRange = parameters['default range'] || 2;
	var _defaultTarget = parameters['default target'] || "friend";
	var _defaultShape = parameters['default shape'] || "circle";

	var shoukang_SrpgStatus_refresh = Window_SrpgStatus.prototype.refresh;
	Window_SrpgStatus.prototype.refresh = function() {
		if (this._battler) $gameTemp.refreshAura($gameTemp.activeEvent(), $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1]);//refresh aura when open srpgstatus window
		if ($gameTemp.targetEvent()) $gameTemp.refreshAura($gameTemp.targetEvent(), $gameSystem.EventToUnit($gameTemp.targetEvent().eventId())[1]);
		shoukang_SrpgStatus_refresh.call(this);
	};

	var shoukang_Game_System_srpgMakeMoveTable = Game_System.prototype.srpgMakeMoveTable;
	Game_System.prototype.srpgMakeMoveTable = function(event) {
		$gameTemp.refreshAura(event, $gameSystem.EventToUnit(event.eventId())[1]);
		shoukang_Game_System_srpgMakeMoveTable.call(this, event);
	}

	var shoukang_Scene_Map_eventBeforeBattle = Scene_Map.prototype.eventBeforeBattle;
	Scene_Map.prototype.eventBeforeBattle = function() {
		if ($gameTemp.shouldPayCost()){//this is used to avoid refreshing repeatedly when using AoE skills.
			$gameTemp.refreshAura($gameTemp.activeEvent(), $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1]);
			if ($gameTemp.targetEvent()) $gameTemp.refreshAura($gameTemp.targetEvent(), $gameSystem.EventToUnit($gameTemp.targetEvent().eventId())[1]);//refresh aura before battle
			if ($gameTemp.areaTargets().length > 0){
				$gameTemp.areaTargets().forEach(function(target){
					$gameTemp.refreshAura(target.event, $gameSystem.EventToUnit(target.event.eventId())[1]);
				})
			}
		}
		shoukang_Scene_Map_eventBeforeBattle.call(this);
	};

	var shoukang_Game_System_srpgTurnEnd = Game_System.prototype.srpgTurnEnd;
	Game_System.prototype.srpgTurnEnd = function() {//shoukang turn end
        $gameMap.events().forEach(function(event) {
				if (event.isErased()) return;
				var unit = $gameSystem.EventToUnit(event.eventId());
				if (unit && (unit[0] === 'actor' || unit[0] === 'enemy')) $gameTemp.refreshAura(event, unit[1]);
		});
		shoukang_Game_System_srpgTurnEnd.call(this);
    };

	var shoukang_Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
	Scene_Menu.prototype.createCommandWindow = function() {
		shoukang_Scene_Menu_createCommandWindow.call(this);
		if ($gameSystem.isSRPGMode() == true) {
			$gameMap.events().forEach(function (event){
				if (event.isErased()) return;
				var unit = $gameSystem.EventToUnit(event.eventId());
				if (unit && unit[0] === 'actor') $gameTemp.refreshAura(event, unit[1]);
			});
		}
	};

	Game_Battler.prototype.clearAura = function() {
		var statelist = this.states();
		for (i = 0; i<statelist.length; i++){
			if (statelist[i].meta.SRPGAura) {
//                this.removeState(statelist[i].id); not sure why this doesn't work
				this._states.splice(i, 1);
			}
		}
	};

	Game_Temp.prototype.refreshAura = function(thisevent, user) {
		user.clearAura();
		var x = thisevent.posX();
		var y = thisevent.posY();
		$gameMap.events().forEach(function (event) {//check all events
			var dx = x - event.posX();
			var dy = y - event.posY();
			if (event.isErased() || Math.abs(dx) > _maxRange || Math.abs(dy) > _maxRange) return;//if beyond maxrange return, just to save time.
			var unit = $gameSystem.EventToUnit(event.eventId());
			if (unit && (unit[0] === 'actor' || unit[0] === 'enemy')){
				unit[1].skills().forEach( function(item){//check all skills
					if (item.meta.SRPGAuraState){
						var stateId = item.meta.SRPGAuraState;
						var type = item.meta.SRPGAuraTarget || _defaultTarget;
						var range = item.meta.SRPGAuraRange || _defaultRange;
						var shape = item.meta.SRPGAuraShape || _defaultShape;
						var usertype = thisevent.isType();
						if (!$gameMap.inArea(dx, dy, range, 0, shape, 0)) return;
						if (type === 'friend' && unit[0] == usertype){
							user.addState(stateId);
						} else if (type === 'foe' && unit[0] != usertype){
							user.addState(stateId);
						} else if (type === 'all'){
							user.addState(stateId);
						}
					}
				});
			}
		});
		return;
	};
})();
