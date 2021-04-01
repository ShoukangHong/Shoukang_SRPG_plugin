//=============================================================================
// SRPG_PathfindingChange.js
//-----------------------------------------------------------------------------
//This plugin changes the pathfinding method of SRPG_Pathfinding, with enhanced compatibility                     
// to SRPG_Rangecontrol and better route search function.
//=============================================================================
/*:
 * @plugindesc This plugin provides an enhanced pathfinding method, the enemy will always find the path which takes least turns to reach the opponent. See help for details.
 * 
 * @author Shoukang
 * 
 * @param search range
 * @desc How many move points pathfingding AI can consume before stop, set low to to avoid lag spikes.
 * @type number
 * @min 10
 * @default 30
 *
 * @param use this fallback
 * @desc Use fallback move in this plugin instead of the original pathfing plugin.
 * @type boolean
 * @default true
 *
 * @help
 * The original pathfinding plugin doesn't take terrain cost into consideration when searching for the 
 * best path. So units will choose the most "straight" route rather than a curved route with a lower 
 * total tile cost.
 * This plugin doesn't choose the path with the shortest total move cost but chooses the path with the 
 * least turns. For example, if a unit has 4 move points, it takes 6 turns to reach y from x 
 * [x, 4, 1, 4, 1, 4, 1, y]. However, if there's another route [x, 2, 2, 2, 2, 2, 2, 2, 2, 2, y], which 
 * only takes 5 turns, the AI will choose the latter. despite the latter one has a higher totalmovecost.   .
 * Nonetheless, while choosing the path it will not consider friend unit positions or attack range, so  
 * the route is still not necessarily the fastest, but it should be good enough to use.
 *
 * This plugin is inspired by the make move table function in SRPG_RangeControl. Many parts are kept
 * same so it has high compatibility, but the move rule is based on SRPG_ModifiedMoveTable, so this
 * move table plugin is required. The only concern now is the Zoc table, which I'm not familiar with.
 * P.S., this plugin doesn't support looping maps(does anyone use looping maps for SRPG?).
 *
 * This plugin also provides a fallback choice, fallback will try its best to move near to the target.   
 * If you disable it then the SRPG_pathfinding will do the fallback.
 * 
 * Please put this plugin below SRPG_Pathfinding, and use my SRPG_ModifiedMoveTable.
 * 
 */
(function () {
    var parameters = PluginManager.parameters('SRPG_PathfindingChange');
    var maxMove = Number(parameters['search range']) || 30;
    var enableFallback = Boolean(parameters['use this fallback']) || true;


	Game_Map.prototype.convertRoute = function(arr) {
	    arr.forEach( function(a, b){
		    switch (a) {
		        case 2 :
					arr[b] = "Down";
					break;
		        case 4 :
					arr[b] = "Left";
					break;
				case 6 : 	  
					arr[b] = "Right";
					break;
				case 8 :	
					arr[b] = "Up";
					break;
		    }
	    });
	};

//overwrite the pathTo function
    Game_Map.prototype.pathTo = function(x, y, x2, y2, tag) {
		var event = $gameTemp.activeEvent();
		var move = $gameSystem.EventToUnit(event.eventId())[1].srpgMove();
		var edges = [];
		var movetable = [];
		var route = [];
		var fallback = [];
		var distance = Math.abs(x2-x) + Math.abs(y2-y);
		var mindist = distance;
		for (var i=0; i<$gameMap.width(); i++){//creat a 2D array for the map
			movetable[i] = [];
		}
		if (move > 0 && distance > 1) {
			edges = [[x, y, maxMove, []]];
		} else return [];
		movetable[x][y] = (maxMove, []);//store remaining move and route in movettable
		$gameMap.makeSrpgZoCTable(event.isType() == 'actor' ? 'enemy' : 'actor', event.throughZoC());// Shoukang: I'm not sure about zoc table because I'm not using it
		while (edges.length > 0) {
			var cell = edges.shift();
			for (var d = 2; d < 10; d += 2) {
				if (!event.srpgMoveCanPass(cell[0], cell[1], d, tag)) continue;
				var dx = $gameMap.roundXWithDirection(cell[0], d);
				var dy = $gameMap.roundYWithDirection(cell[1], d);
				var movecost = 1;
				if(tag < $gameMap.terrainTag(dx, dy)){
					movecost = $gameMap.srpgMoveCost(dx, dy);
				}          
				if (movetable[dx][dy] || (cell[2] - movecost) < 0) continue; //shoukang edit: if move < cost skip
				var dmove = Math.max(cell[2] - movecost, 0);
				var rmove = move - (maxMove - cell[2])%move;//calculate remaining move in one turn
				if (movecost > rmove){// take move turns into consideration
						dmove = dmove - rmove;
				}
					route = cell[3].concat(d);
					movetable[dx][dy] = (dmove, route);
					distance =  Math.abs(x2-dx) + Math.abs(y2-dy);
				if (distance <= 1){//reaches target, stop search
					$gameMap.convertRoute(route);
					route.push(0);//I added this just for the pathDifference in optimization part of SRPG_pathfinding.
					return route;
				}
				if (enableFallback && distance < mindist) {//store fallback route if enabled.
					mindist = distance;
					fallback = route;
				}
				if (dmove > 0 && !$gameMap._zocTable[dx+','+dy] ) {
					edges.push([dx, dy, dmove, route]);
					edges.sort(function (a, b) {//always do the next loop with highest dmove to ensure shortest path.
						return b[2] - a[2];
					});
				}
			}
		}
		$gameMap.convertRoute(fallback);//if no path find within maxMove, return fallback
		return fallback;
	};
})();