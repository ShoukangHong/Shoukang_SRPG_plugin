.//=============================================================================
// SRPG_ShowAoERange.js
//-----------------------------------------------------------------------------
//Free to use and edit     v.1.04 Fix bug for range 0 skills
// Complexity change from O(m^2 * r^2 * a^2 * 4^3) to O((m + r)^2 * a^2 * 4^2), much faster!
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
 * @type boolean
 * @default false
 *
 * @help
 * The original attack range only shows the enemy/actor's default skill range, which doesn't provide
 * enough information for players to avoid AoEs and other skills.
 * This plugin will show attack and AoE Range of all available skills in actor's turn.
 * Tiles within attack range will be colored red, tiles not within attack range but within AoE range
 * will be colored differently.
 * ====================================================================================================
 * v.1.05 Fix bug for attack skill id, fix a bug for range 0 AoE show range.
 * v.1.04 Fix bug for range 0 skills
 * v.1.03 Improved algorithm, no it's much faster!
 * Complexity change from O(m^2 * r^2 * a^2 * 4^3) to O((m + r)^2 * a^2 * 4^2) !
 * v 1.02 add range of default srpg attack skill. Support loop map.
 * v 1.01 now it will check skill stype, seal, etc.
 * v 1.00 first release!
 * ====================================================================================================
 * Compatibility:
 * Please put this plugin below SRPG_RangeControl.
 */
(function () {
	var parameters = PluginManager.parameters('SRPG_ShowAoERange');
	var _AoEColor = parameters['AoE Color'] || "MediumVioletRed";
	var _showActorAoE = !!eval(parameters['show actor AoE']) || false;
	var _noDirectionShape = {
		circle : true,
		square : true,
		cross : true,
		plus : true,
		star : true,
		checker : true
	}
//In actor phase, show range and AoE range of all skills
	var _shoukangSrpgMakeMoveTable = Game_System.prototype.srpgMakeMoveTable;
	Game_System.prototype.srpgMakeMoveTable = function(event) {
		if (!$gameMap.isEventRunning() && ($gameSystem.isBattlePhase() === 'actor_phase' &&
		$gameSystem.isSubBattlePhase() === 'normal' || $gameSystem.isBattlePhase() === 'battle_prepare')){
			var user = $gameSystem.EventToUnit(event.eventId())[1];
		  $gameTemp.makeSearchedAoETable();
			$gameTemp.clearMoveTable();
			event.makeMoveTable(event.posX(), event.posY(), user.srpgMove(), null, user.srpgThroughTag());
			user.skills().forEach(function(item){//all skills
				if (item.id === 1){
					item = $dataSkills[user.attackSkillId()];
				}
				if (!user.srpgCanShowRange(item)) return;//if not useable don't show
				var range = user.srpgSkillRange(item);
				var areaRange = Number(item.meta.srpgAreaRange) || 0;
				var minRange = Number(item.meta.srpgAreaMinRange) || 0;
				var shape = item.meta.srpgAreaType || 'circle';
				var canDrawAoE = event.canDrawAoE(areaRange);

				$gameTemp.moveList().some(function(pos) {//all reachable tiles
					var x = pos[0];
					var y = pos[1];
					if (!$gameMap.isOccupied(x, y)) {
						if (canDrawAoE) event.makeAoETable(x, y, range, null, item, areaRange, minRange, shape, user);//if skill is AoE use this function
						else event.makeRangeTable(x, y, range, null, x, y, item);
					}
					return item.meta.notUseAfterMove // if cannot move before attacking,return after processed the origin.
				});
			});
			$gameTemp.convertRangeList($gameMap.width(), $gameMap.height());
			$gameTemp.pushRangeListToMoveList();
		} else{
			_shoukangSrpgMakeMoveTable.call(this, event);
		} 
	};

//for each tile in attack range, make AoE Table
	Game_CharacterBase.prototype.makeAoETable = function(x, y, range, unused, skill, areaRange, areaminRange, shape, user) {
		if (!skill || !user) return;
		var minRange = user.srpgSkillMinRange(skill);
		var width = $gameMap.width();
		var height = $gameMap.height();
		var edges = [[x, y, range, [0], []]];
		if (minRange <= 0 && $gameTemp.RangeTable(x, y)[0] < 0) {
			if ($gameTemp.MoveTable(x, y)[0] < 0) $gameTemp.pushRangeList([x, y, true]);
			$gameTemp.setRangeTable(x, y, range, [0]);
		}
		if (range == 0) return $gameTemp.setAoETable(x, y, areaRange, areaminRange, shape, d, skill, range, [0]);
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
					$gameTemp.setAoETable(dx, dy, areaRange, areaminRange, shape, d, skill, drange, route);
				}
			}
		}
	};

//if AoE is in area set attack flag as 'AoE' (AoE)
	Game_Temp.prototype.setAoETable = function(dx, dy, aMax, aMin, shape, d, skill, drange, route) {
		if (this.isAoESearched(dx, dy, skill, d, shape)) return;
		$gameTemp.setAoESearched(dx, dy, skill, d, shape);
		if (this.RangeTable(dx, dy)[0] < 0 || this.RangeTable(dx, dy)[1] === 'AoE') {
			this.setRangeTable(dx, dy, drange, route);
			if (this.MoveTable(dx, dy)[0] < 0) {
				this.pushRangeList([dx, dy, true]);
			}
		}

		var width = $gameMap.width();
		var height = $gameMap.height();
		var rlim = 1 + aMax * 2;
		for (var m = 0; m < rlim; ++m) {
			for (var n =0; n < rlim; ++n) {
				var aoex = $gameMap.roundX(dx + m - aMax);
				var aoey = $gameMap.roundY(dy + n - aMax);
				if ($gameMap.isValid(aoex, aoey) && this.RangeTable(aoex, aoey)[0] < 0 && 
					$gameMap.inArea(m-aMax, n-aMax, aMax, aMin, shape, d)) {
					this.setRangeTable(aoex, aoey, - 1, 'AoE');
				}
			}
		}
	};

    Game_Temp.prototype.makeSearchedAoETable = function(){
    	this._searchedAoETable = [];
        for (var i = 0; i < $dataMap.width; i++) {
          var vartical = [];
          for (var j = 0; j < $dataMap.height; j++) {
            vartical[j] = [-1,-1,-1,-1];
          }
          this._searchedAoETable[i] = vartical;
        }
        //console.log(this._searchedAoETable)
    }

	Game_Temp.prototype.isAoESearched = function(dx, dy, skill, d, shape) {
		return this._searchedAoETable[dx][dy][d/2 - 1] === skill.id;
	};

	Game_Temp.prototype.setAoESearched = function(dx, dy, skill, d, shape) {
		var id = skill.id
		if (_noDirectionShape[shape]){
			this._searchedAoETable[dx][dy] = [id, id, id, id];
		} else {
			this._searchedAoETable[dx][dy][d/2 - 1] = id;
		}
	};

//make AoE range list according to Rangetable
	Game_Temp.prototype.convertRangeList = function(width, height){
		for (var i = 0; i < width; ++i){
			for (var j = 0; j < height; ++j){
				if (this.RangeTable(i, j)[1] === 'AoE') this.pushRangeList([i, j, 'AoE']);
			}
		}
	};

	Game_Actor.prototype.srpgCanShowRange = function(skill){
		//console.log(skill.id == this.attackSkillId(), this.addedSkillTypes().includes(skill.stypeId), skill.stypeId !== 0, Game_BattlerBase.prototype.srpgCanShowRange.call(this, skill))
		if (skill.id == this.attackSkillId() || (this.addedSkillTypes().includes(skill.stypeId) && skill.stypeId !== 0)){
			return Game_BattlerBase.prototype.srpgCanShowRange.call(this, skill);
		} else return false;
	};

	Game_BattlerBase.prototype.srpgCanShowRange = function(skill){
	    return (this.isSkillWtypeOk(skill) && this.canPaySkillCost(skill) &&
	            !this.isSkillSealed(skill.id) && !this.isSkillTypeSealed(skill.stypeId));
	};

	Game_Event.prototype.canDrawAoE = function(areaRange){
		return areaRange > 0 && (_showActorAoE === true || this.isType() == 'enemy')
	};

//fill AoE tiles with color
	Sprite_SrpgMoveTile.prototype.setThisMoveTile = function(x, y, attackFlag) {
		this._frameCount = 0;
		this._posX = x;
		this._posY = y;
		if (attackFlag === true) this.bitmap.fillAll('red');
		else if (attackFlag === false) this.bitmap.fillAll('blue');
		else if (attackFlag === 'AoE') this.bitmap.fillAll(_AoEColor);
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

	Game_Map.prototype.isOccupied = function(x, y){
		return $gameMap.events().some(function(otherEvent) {
			return otherEvent.pos(x, y) && otherEvent.eventId() !== $gameTemp.activeEvent().eventId() && !otherEvent.isThrough() &&
			 !otherEvent.isErased() && (['enemy', 'actor', 'playerEvent'].contains(otherEvent.isType()));
		});
	};

})();
