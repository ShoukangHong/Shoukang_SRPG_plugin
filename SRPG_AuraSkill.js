//=============================================================================
// SRPG_AuraSkill.js
//-----------------------------------------------------------------------------
// Free to use and edit   v1.03
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
 * An aura skill will add a state automatically to valid units in Aura range.
 * Passive Aura skills can be created by skill notetags. It will assign the state to valid units within the Aura range.
 * skill note tags:
 * <SRPGAuraState:x>    this is the state of this Aura skill, replace x with state id.
 * <SRPGAuraTarget:xxx> This is the units that will be affected, xxx can be "friend" "foe" or "all" (no need to add "")
 * <SRPGAuraRange:x>    The range of Aura, similar to AoE range.
 * <SRPGAuraShape:xxx>  The shape of Aura, replace xxx with shapes defined in SRPR_AoE (Anisotropic shapes not supported)
 * <SRPGAuraMinRange:x> The minumum range of Aura, creats a hole. Default is 0.
 * You may also want to use state note tag <SRPGAura> (see below).
 * 
 * Active aura skill can be created by state notetags. You can actively use a skill to gain an "Aura state", as long as this Aura state
 * exist it will assign a (different) state to the valid units within the Aura range. (Credits to Boomy)
 * This also allows you to activate aura effects in other ways(add this aura state by script calls, or whatever else)
 * state note tags:
 * <SRPGAura>           With this notetag a state will be removed once a unit is out of the Aura.
 * If you want the Aura to be effective after a unit leaves the Aura range don't use this tag.
 *
 * <SRPGAuraState:x>    This is the state this "Aura state" will assign, replace x with state id.
 * <SRPGAuraTarget:xxx> These are the same as skill note tags.
 * <SRPGAuraRange:x>    
 * <SRPGAuraShape:xxx>  
 * <SRPGAuraMinRange:x>
 *
 * Aura states of related units will be refreshed everytime you open the SRPGstatuswindow, 
 * prediction window, menu window. It will also refresh when show movetable, before battle, after action, battle start and turn end.
 * You can also assign Aura skills to enemies.
 * You may want to use some other plugins like ALOE_ItemSkillSortPriority to put a passive aura skill to the end of 
 * your skill list.
 * 
 * version 1.00 first release!
 * version 1.01 refresh status when open main menu. fix some bugs.
 * version 1.02 refresh status when turn end.
 * version 1.03 add state note tags for active aura skills. Fix issues of states without <SRPGAura>
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
		this.contents.clear();
		if (!this._battler) return;
		$gameTemp.refreshAura($gameTemp.activeEvent());//refresh aura when open srpgstatus window
		if ($gameTemp.targetEvent()) $gameTemp.refreshAura($gameTemp.targetEvent());
		shoukang_SrpgStatus_refresh.call(this);
	};

	var shoukang_Game_System_srpgMakeMoveTable = Game_System.prototype.srpgMakeMoveTable;
	Game_System.prototype.srpgMakeMoveTable = function(event) {
		$gameTemp.refreshAura(event);
		shoukang_Game_System_srpgMakeMoveTable.call(this, event);
	}

	var shoukang_Scene_Map_eventAfterAction = Scene_Map.prototype.eventAfterAction;
	Scene_Map.prototype.eventAfterAction = function() {
		if ($gameTemp.areaTargets().length === 0) $gameTemp.refreshAura($gameTemp.activeEvent());    	
		shoukang_Scene_Map_eventAfterAction.call(this);
	};

	var shoukang_Game_System_runBattleStartEvent = Game_System.prototype.runBattleStartEvent;
	Game_System.prototype.runBattleStartEvent = function() {
		$gameMap.events().forEach(function(event) {
				if (event.isErased()) return;
				var unit = $gameSystem.EventToUnit(event.eventId());
				if (unit && (unit[0] === 'actor' || unit[0] === 'enemy')) $gameTemp.refreshAura(event);
		});
		shoukang_Game_System_runBattleStartEvent.call(this);
	};

	var shoukang_Scene_Map_eventBeforeBattle = Scene_Map.prototype.eventBeforeBattle;
	Scene_Map.prototype.eventBeforeBattle = function() {
		if ($gameTemp.shouldPayCost()){//this is used to avoid refreshing repeatedly when using AoE skills.
			$gameTemp.refreshAura($gameTemp.activeEvent());
			if ($gameTemp.targetEvent()) $gameTemp.refreshAura($gameTemp.targetEvent());//refresh aura before battle
			if ($gameTemp.areaTargets().length > 0){
				$gameTemp.areaTargets().forEach(function(target){
					$gameTemp.refreshAura(target.event);
				});
			}
		}
		shoukang_Scene_Map_eventBeforeBattle.call(this);
	};

	var shoukang_Game_System_srpgTurnEnd = Game_System.prototype.srpgTurnEnd;
	Game_System.prototype.srpgTurnEnd = function() {//shoukang turn end
		$gameMap.events().forEach(function(event) {
				if (event.isErased()) return;
				var unit = $gameSystem.EventToUnit(event.eventId());
				if (unit && (unit[0] === 'actor' || unit[0] === 'enemy')) $gameTemp.refreshAura(event);
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
				if (unit && unit[0] === 'actor') $gameTemp.refreshAura(event);
			});
		}
	};

	Game_Battler.prototype.clearAura = function() {
		var statelist = this.states();
		for (i = 0; i<statelist.length; i++){
			if (statelist[i].meta.SRPGAura) {
//                this.removeState(statelist[i].id);
				this._states.splice(i, 1);
			}
		}
	};

	Game_Temp.prototype.refreshAura = function(userevent) {
		var user = $gameSystem.EventToUnit(userevent.eventId())[1]
		user.clearAura();
		var x = userevent.posX();
		var y = userevent.posY();
		$gameMap.events().forEach(function (event) {//check all events
			var dx = x - event.posX();
			var dy = y - event.posY();
			if (event.isErased() || Math.abs(dx) > _maxRange || Math.abs(dy) > _maxRange) return;//if beyond maxrange return, just to save time.
			var unit = $gameSystem.EventToUnit(event.eventId());
			if (unit && (unit[0] === 'actor' || unit[0] === 'enemy')){
				unit[1].skills().forEach( function(item){//check all skills
					if ($gameTemp.isAuraStateValid(item, userevent.isType(), unit[0], dx, dy)) user.addState(Number(item.meta.SRPGAuraState));
				});
				unit[1].states().forEach(function(item){//check all states
					if ($gameTemp.isAuraStateValid(item, userevent.isType(), unit[0], dx, dy)) user.addState(Number(item.meta.SRPGAuraState));
				});
			}
		});
	};

	Game_Temp.prototype.isAuraStateValid = function(item, usertype, ownertype, dx, dy) {
		if (item.meta.SRPGAuraState){
			var type = item.meta.SRPGAuraTarget || _defaultTarget;
			var range = Number(item.meta.SRPGAuraRange) || _defaultRange;
			var shape = item.meta.SRPGAuraShape || _defaultShape;
			var minrange = Number(item.meta.SRPGAuraMinRange) || 0;
			if (!$gameMap.inArea(dx, dy, range, minrange, shape, 0)) return false;
			if (type === 'friend' && ownertype == usertype) return true;
			if (type === 'foe' && ownertype != usertype) return true;
			if (type === 'all') return true;
		}
		return false;
	};
	
	if (!Game_Enemy.prototype.skills) {
		Game_Enemy.prototype.skills = function() {
			var skills = []
			for (var i = 0; i < this.enemy().actions.length; ++i) {
				var skill = $dataSkills[this.enemy().actions[i].skillId];
				if (skill) skills.push(skill);
			}
			return skills;
		}
	};
})();
