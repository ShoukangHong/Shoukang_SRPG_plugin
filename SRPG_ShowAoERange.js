//=============================================================================
// SRPG_ShowAoERange.js
//-----------------------------------------------------------------------------
//Free to use and edit    v.101 support battleprepare plugin, check skill stype and seal
//=============================================================================
/*:
 * @plugindesc The original attack range only shows the enemy/actor's default skill range.
 * This plugin will show attack AND AoE Range of all available skills in actor turn.
 * @author Shoukang
 * 
 * @param AoE Color
 * @desc Set the color of AoE tile 
 * https://www.w3schools.com/cssref/css_colors.asp
 * @type string
 * @default MediumVioletRed
 *
 * @param show actor AoE
 * @desc Also show actor's AoE. If actor has tooooo much
 * skills it might look ugly and have lag spikes.
 * @type string
 * @default false
 *
 * @help
 * The original attack range only shows the enemy/actor's default skill range, which doesn't provide
 * enough information for players to avoid AoEs and other skills.
 * This plugin will show attack and AoE Range of all available skills in actor's turn.
 * Tiles within attack range will be colored red, tiles not within attack range but within AoE  range
 * will be colored differently.
 * Although SRPG doesn't need you to add default skill "attack"(Id:1), please add this skill to your       
 * actors(unless your actor can't use default attack) to allow this plugin to show its skill range.
 * ====================================================================================================
 * To do: add range of default srpg attack skill.
 * v 1.01 now it will check skill stype, seal, etc.
 * v 1.00 first release!
 * ====================================================================================================
 * Compatibility:
 * Please put this plugin below SRPG_RangeControl.
 */
(function () {
	var parameters = PluginManager.parameters('SRPG_ShowAoERange');
	var _AoEColor = parameters['AoE Color'] || "MediumVioletRed";
	var _showActorAoE = parameters['show actor AoE'] || "false";

//In actor phase, show range and AoE range of all skills
	var _shoukangsrpgMakeMoveTable = Game_System.prototype.srpgMakeMoveTable;
	Game_System.prototype.srpgMakeMoveTable = function(event) {
		if (!$gameMap.isEventRunning() && ($gameSystem.isBattlePhase() === 'actor_phase' && $gameSystem.isSubBattlePhase() === 'normal' || $gameSystem.isBattlePhase() === 'battle_prepare')){
			var user = $gameSystem.EventToUnit(event.eventId())[1];
			var item = null;
			var x = event.posX();
			var y = event.posY();
			var range = 0;
			$gameTemp.clearMoveTable();
			event.makeMoveTable(event.posX(), event.posY(), user.srpgMove(), null, user.srpgThroughTag());
			user.skills().forEach(function(item){//all skills
				if (event.isType() === 'actor'){
					if (!user.addedSkillTypes().includes(item.stypeId) && item.stypeId !== 0) return;
				}
				if (!(user.canPaySkillCost(item) && user.isSkillWtypeOk(item) && !user.isSkillSealed(item.id) && !user.isSkillTypeSealed(item.stypeId))) return;//if not useable don't show
				range = user.srpgSkillRange(item);
				var areaRange = 0;
				var minRange = null;
				var shape = null;
				if (item.meta.srpgAreaRange) {//check if it's an AoE skill
					areaRange = Number(item.meta.srpgAreaRange);
					minRange = Number(item.meta.srpgAreaMinRange) || 0;
					shape = item.meta.srpgAreaType || '';
				}
				if (item.meta.notUseAfterMove) { // cannot move before attacking
					if ((areaRange === 0 || (_showActorAoE === 'false' && event.isType() === 'actor'))) event.makeRangeTable(x, y, range, null, x, y, item);
					else event.makeAoETable(x, y, range, null, item, areaRange, minRange, shape, user);
					return;
				}
				$gameTemp.moveList().forEach(function(pos) {//all reachable tiles
					var x = pos[0];
					var y = pos[1];
					var occupied = $gameMap.events().some(function(otherEvent) {
						if (otherEvent === event || otherEvent.isErased() || !otherEvent.pos(x, y)) return false;
						if (otherEvent.isType() === 'enemy') return true;
						if (otherEvent.isType() === 'actor') return true;
						if (otherEvent.isType() === 'playerEvent') return true;
					});	
					if (!occupied) {
						if (areaRange === 0 || (_showActorAoE === 'false' && event.isType() === 'actor')) {
							event.makeRangeTable(x, y, range, null, x, y, item);
						} else {
							event.makeAoETable(x, y, range, null, item, areaRange, minRange, shape, user);//if skill is AoE use this function
						}
					}
				});
			});
			$gameTemp.convertRangeList($gameMap.width(), $gameMap.height());
			$gameTemp.pushRangeListToMoveList();
		} else _shoukangsrpgMakeMoveTable.call(this, event);
	};

//for each tile in attack range, make AoE Table
	Game_CharacterBase.prototype.makeAoETable = function(x, y, range, unused, skill, areaRange, areaminRange, shape, user) {
		if (!skill || !user) return;
		var minRange = user.srpgSkillMinRange(skill);
		var width = $gameMap.width();
		var height = $gameMap.height();
		var edges = [];
		if (range > 0) edges = [[x, y, range, [0], []]];
		else $gameTemp.setAoETable(x, y, areaRange, areaminRange, shape, d, width, height);
		if (minRange <= 0 && $gameTemp.RangeTable(x, y)[0] < 0) {
			if ($gameTemp.MoveTable(x, y)[0] < 0) $gameTemp.pushRangeList([x, y, true]);
			$gameTemp.setRangeTable(x, y, range, [0]);
		}
		$gameMap.makeSrpgLoSTable(this);
		for (var i = 0; i < edges.length; i++) {
			var cell = edges[i];
			var drange = cell[2] - 1;
			for (var d = 2; d < 10; d += 2) {
				if (cell[4][d] === 1) continue;
				if (!this.srpgRangeCanPass(cell[0], cell[1], d)) continue;
				var dx = $gameMap.roundXWithDirection(cell[0], d);
				var dy = $gameMap.roundYWithDirection(cell[1], d);
				var route = cell[3].concat(d);
				var forward = cell[4].slice(0);
				forward[10-d] = 1;
				if (drange > 0) edges.push([dx, dy, drange, route, forward]);
				if ($gameMap.distTo(x, y, dx, dy) >= minRange && this.srpgRangeExtention(dx, dy, x,	y, skill, range)) {
					if ($gameTemp.RangeTable(dx, dy)[0] < 0 || $gameTemp.RangeTable(dx, dy)[1] === 'A') {
						$gameTemp.setRangeTable(dx, dy, drange, route);
						if ($gameTemp.MoveTable(dx, dy)[0] < 0) {
							$gameTemp.pushRangeList([dx, dy, true]);
						}
					}
					$gameTemp.setAoETable(dx, dy, areaRange, areaminRange, shape, d, width, height);
				}
			}
		}
	};

//if AoE is in area set attack flag as 'A' (AoE)
	Game_Temp.prototype.setAoETable = function(dx, dy, aMax, aMin, shape, d, mapWidth, mapHeight) {
		var xlim = mapWidth - dx + aMax;
		var ylim = mapHeight - dy + aMax;
		var rlim = 1 + aMax * 2;
		for (var m = Math.max(0, aMax - dx); m < rlim && m < xlim; ++m) {
			for (var n = Math.max(0, aMax - dy); n < rlim && n < ylim; ++n) {
					var aoex = dx + m -aMax;
					var aoey = dy + n -aMax;
				if (this.RangeTable(aoex, aoey)[0] < 0 && $gameMap.inArea(m-aMax, n-aMax, aMax, aMin, shape, d)) this.setRangeTable(aoex, aoey, - 1, 'A');
			}
		}
	};
//make AoE range list according to Rangetable
	Game_Temp.prototype.convertRangeList = function(width, height){
		for (var i = 0; i < width; ++i){
			for (var j = 0; j < height; ++j){
				if (this.RangeTable(i, j)[1] === 'A') this.pushRangeList([i, j, 'A']);
			}
		}
	};

//fill AoE tiles with color
	Sprite_SrpgMoveTile.prototype.setThisMoveTile = function(x, y, attackFlag) {
		this._frameCount = 0;
		this._posX = x;
		this._posY = y;
		if (attackFlag === true) this.bitmap.fillAll('red');
		else if (attackFlag === false) this.bitmap.fillAll('blue');
		else if (attackFlag === 'A') this.bitmap.fillAll(_AoEColor);
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
