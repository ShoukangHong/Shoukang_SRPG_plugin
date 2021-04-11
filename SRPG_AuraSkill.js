//=============================================================================
// SRPG_AuraSkill.js
//-----------------------------------------------------------------------------
// Free to use and edit
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
 * <SRPGAuraState:x> this is the state of this Aura skill, replace x with state id.
 * <SRPGAuraTarget:xxx> This is the units that will be affected, xxx can be "friend" "foe" or "all" 
 * <SRPGAuraRange:x> The range of Aura, similar to AoE range.
 * <SRPGAuraShape:xxx> The shape of Aura, replace xxx with shapes defined in SRPR_AoE (Anisotropic shapes not supported)
 * Please note: don't put any space after ":" in these note tags. And no need to add "".
 * 
 * state note tag:
 * <SRPGAura> With this notetag a state will be will be removed once a unit is out of the Aura.
 * If you want the Aura to be effective after a unit leaves the Aura range don't use this tag.(currently have some problems and I don't want to fix,
 * unless someone needs this. To fix it I will need to refresh states after action and after turn too.)
 * 
 * Aura skills are completely passive, you can set the skills as not useable.
 * Passive states of related units will be refreshed everytime you open the SRPGstatuswindow, ActorCommandStatusWindow, 
 * prediction window and before battle. But it will not refresh when you open the "units" window. (because I'm lazy)
 * You can also assign Aura skills to enemies.
 * You may want to use some other plugins like ALOE_ItemSkillSortPriority to put a passive aura skill to the end of 
 * your skill list.
 * 
 * version 1.00 first release!
 *
 * This plugin needs SPPG_AoE to work.
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

	var shoukang_SrpgActorCommandStatus_refresh = Window_SrpgActorCommandStatus.prototype.refresh;//refresh aura when open SrpgActorCommandStatus window
	Window_SrpgActorCommandStatus.prototype.refresh = function() {
		if (this._battler) $gameTemp.refreshAura($gameTemp.activeEvent(), this._battler);
		shoukang_SrpgActorCommandStatus_refresh.call(this);
	};

	var shoukang_Scene_Map_eventBeforeBattle = Scene_Map.prototype.eventBeforeBattle
	Scene_Map.prototype.eventBeforeBattle = function() {
		$gameTemp.refreshAura($gameTemp.activeEvent(), $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1]);
		if ($gameTemp.targetEvent()) $gameTemp.refreshAura($gameTemp.targetEvent(), $gameSystem.EventToUnit($gameTemp.targetEvent().eventId())[1]);//refresh aura before battle
		shoukang_Scene_Map_eventBeforeBattle.call(this);
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
						if (type === 'friend' && unit[0] == thisevent.isType()){						
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