//=============================================================================
// SRPG_ModifiedMoveTable.js
//-----------------------------------------------------------------------------
//
//
//=============================================================================
/*:
 * @plugindesc This plugin allows fly unit to ignore movecost and modified the make move  
 * table function to provide a fire-emblem like move rule. (see help for detail)
 * @author Shoukang
 *
 * @help
 * Units with srpgThroughTag >= terrainTag will consider the movecost of that terrain as 1.
 * Move rule in SRPG_RangeControl allows a unit to step on the next tile if its remaining
 * move point is bigger than 0, which means a unit with 3 (or even 1) move points
 * can step on a tile which costs 4 move points. Then the unit has no remaining
 * movepoints and will stop there.
 * This plugin changes the rule so that a unit can step on the next tile only when 
 * its remaining move point is bigger than the move cost of that tile.
 *
 * Please put this plugin below SRPG_RangeControl.
 * If you use SRPG_Pathfinding, set its parameter: ShouKang Move Cost Method to true.
 */
(function () {
    var parameters = PluginManager.parameters('SRPG_ModifiedMoveTable');
    var shoukang_makeMoveTable = Game_CharacterBase.prototype.makeMoveTable;
	Game_CharacterBase.prototype.makeMoveTable = function(x, y, move, unused, tag, user) {
		var edges = [];
		if (move > 0) edges = [[x, y, move, [0]]];
		$gameTemp.setMoveTable(x, y, move, [0]);
		$gameTemp.pushMoveList([x, y, false]);
		$gameMap.makeSrpgZoCTable(this.isType() == 'actor' ? 'enemy' : 'actor', this.throughZoC());
		while (edges.length > 0) {
			var cell = edges.shift();
			for (var d = 2; d < 10; d += 2) {
				if (!this.srpgMoveCanPass(cell[0], cell[1], d, tag)) continue;
				    var dx = $gameMap.roundXWithDirection(cell[0], d);
				    var dy = $gameMap.roundYWithDirection(cell[1], d);
				    var movecost = 1;
				if(tag < $gameMap.terrainTag(dx, dy)){//shoukang edit: movecost cosiders units with srpgThroughTag
                    movecost = $gameMap.srpgMoveCost(dx, dy);
				}
				if ($gameTemp.MoveTable(dx, dy)[0] >= 0 || (cell[2] - movecost) < 0) continue; //shoukang edit: if move < cost skip
				    var dmove = cell[2] - movecost;
					var route = cell[3].concat(d);			
				    $gameTemp.setMoveTable(dx, dy, dmove, route);
				    $gameTemp.pushMoveList([dx, dy, false]);
				if (dmove > 0 && !$gameMap._zocTable[dx+','+dy]) {
					edges.push([dx, dy, dmove, route]);
					edges.sort(function (a, b) {
						return b[2] - a[2];
			        });
				}
			}
		}
	}
})();
