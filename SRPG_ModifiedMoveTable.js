//=============================================================================
// SRPG_ModifiedMoveTable.js
//-----------------------------------------------------------------------------
//Free to use and edit    v.1.01 add move cost notetag for Actor/enemy/class/equipments/states
//=============================================================================
/*:
 * @plugindesc This plugin provides control over movecost and modified the make move  
 * table function to provide a fire-emblem like move rule. (see help for detail)
 * @author Shoukang
 *
 * @help
 * Units with srpgThroughTag >= terrainTag will consider the movecost of that terrain as 1.
 * Units that have special note tags can have a different move cost on a terrain. See notetags below.
 * Move rule in SRPG_RangeControl allows a unit to step on the next tile if its remaining
 * move point is bigger than 0, which means a unit with 3 (or even 1) move points
 * can step on a tile which costs 4 move points. Then the unit has no remaining
 * movepoints and will stop there.
 * This plugin changes the rule so that a unit can step on the next tile only when 
 * its remaining move point is bigger than the move cost of that tile.
 * =================================================================================
 * new actor/enemy/class/equipments/states notetags:
 *
 * <srpgTerrainXCost: Y> replace X and Y with terrain tag and cost so that the terrainX will cost Y moves for the specific unit.
 * 
 * priority: states > equipments > actor/enemy > class
 * if there are multiple states/equipments that conflicts the final cost will be the last
 * equipment/state that have this notetag.
 * if srpgthroughtag >= terrain tag, these notetags will be ignored.
 * =================================================================================
 * Please put this plugin below SRPG_RangeControl.
 * v.1.01 add move cost notetag for Actor/enemy/class/equipments/states
 */

(function () {

//get a list that contain special move cost for each terrain. 
	Game_Enemy.prototype.getSpecialMoveCosts = function(){
		var costList = [];
		for (var terrain = 0; terrain < 8; terrain ++ ){
			costList.push(undefined);
			if(this.enemy().meta["srpgTerrain"+terrain+"Cost"]){
				costList[terrain] = Number(this.enemy().meta["srpgTerrain"+terrain+"Cost"]);
			}
		}
		return costList;
	}

	Game_Actor.prototype.getSpecialMoveCosts = function() {
		var costList = [];
		for (var terrain = 0; terrain < 8; terrain ++ ){
			costList.push(undefined);
			if (this.currentClass().meta.MoveAfterAction){
				costList[terrain] = Number(this.actor().meta["srpgTerrain"+terrain+"Cost"]);
			}

			if (this.actor().meta["srpgTerrain"+terrain+"Cost"]) {
				costList[terrain] = Number(this.actor().meta["srpgTerrain"+terrain+"Cost"]);
			}

			var items = this.equips().concat(this.states());
			for (var i = 0; i < items.length; i++){
				if (items[i] && items[i].meta["srpgTerrain"+terrain+"Cost"]){
					costList[terrain] = Number(items[i].meta["srpgTerrain"+terrain+"Cost"]);
				};
			}
		}
		return costList;
	};

	var shoukang_Game_Map_srpgMoveCost = Game_Map.prototype.srpgMoveCost
	Game_Map.prototype.srpgMoveCost = function(x, y, tag, special){
		if (tag && tag >= $gameMap.terrainTag(x, y)) return 1;
		var moveCost = shoukang_Game_Map_srpgMoveCost.call(this, x, y);
		if (special && special[$gameMap.terrainTag(x, y)] !== undefined){
			moveCost = special[$gameMap.terrainTag(x, y)];
		}
		return moveCost;
	}

//add a check for special.
    Game_CharacterBase.prototype.srpgMoveCanPass = function(x, y, d, tag, special) {
        var x2 = $gameMap.roundXWithDirection(x, d);
        var y2 = $gameMap.roundYWithDirection(y, d);
        if (!$gameMap.isValid(x2, y2)) {
            return false;
        }
        if (this.isSrpgCollidedWithEvents(x2, y2)) {
            return false;
        }
        if (this.isThrough()) {
            return true;
        }

        if (special && special[$gameMap.terrainTag(x2, y2)]){
        	return true;
        }

        if (special && special[$gameMap.terrainTag(x, y)] && $gameMap.isPassable(x2, y2, this.reverseDir(d))){
        	return true
        }

        if (($gameMap.terrainTag(x2, y2) > 0 && $gameMap.terrainTag(x2, y2) <= tag) ||
            ($gameMap.terrainTag(x, y) > 0 && $gameMap.terrainTag(x, y) <= tag &&
             $gameMap.isPassable(x2, y2, this.reverseDir(d)))) {
            return true;
        }
        if (!this.isMapPassable(x, y, d)) {
            return false;
        }
        return true;
    };

	Game_CharacterBase.prototype.makeMoveTable = function(x, y, move, unused, tag) {
		var edges = [];
		var user = $gameSystem.EventToUnit(this.eventId())[1];
		var specialMoveCost = user.getSpecialMoveCosts();
		//console.log(specialMoveCost)
		if (move > 0) edges = [[x, y, move, [0]]];
		$gameTemp.setMoveTable(x, y, move, [0]);
		$gameTemp.pushMoveList([x, y, false]);
		$gameMap.makeSrpgZoCTable(this.isType() == 'actor' ? 'enemy' : 'actor', this.throughZoC());

		while (edges.length > 0) {
			var cell = edges.shift();
			for (var d = 2; d < 10; d += 2) {
				if (!this.srpgMoveCanPass(cell[0], cell[1], d, tag, specialMoveCost)) continue;//shoukang edit: add a check for special move cost
				var dx = $gameMap.roundXWithDirection(cell[0], d);
				var dy = $gameMap.roundYWithDirection(cell[1], d);
				var movecost = $gameMap.srpgMoveCost(dx, dy, tag, specialMoveCost);
				if ($gameTemp.MoveTable(dx, dy)[0] >= 0 || (cell[2] - movecost) < 0) continue; //shoukang edit: if move < cost skip

				var dmove = cell[2] - movecost;
				var route = cell[3].concat(d);			
				$gameTemp.setMoveTable(dx, dy, dmove, route);
				$gameTemp.pushMoveList([dx, dy, false]);
				if (dmove > 0 && !$gameMap._zocTable[dx+','+dy]) {
					edges.push([dx, dy, dmove, route]);
					edges.sort(function (a, b) {return b[2] - a[2]});
				}
			}
		}
	}
})();
