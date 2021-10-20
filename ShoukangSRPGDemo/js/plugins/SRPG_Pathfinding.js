//=============================================================================
//SRPG_MoveMethod.js
//=============================================================================
/*:
 * @plugindesc Adjusts pathfinding algorithm for determining where units should move when no valid target. Requires SRPG_AIControl.js and SRPG_RangeControl.js
 * @author Boomy 
 * 
 * @param Movement AI
 * @desc Default method for choosing where to move if no target is in range. Include JITTER_X to add movement variance
 * @default "NEARESTFOE"
 * 
 * @param Max Distance
 * @desc If no path found within X steps, then fallback movement AI occurs
 * @type number
 * @min 10
 * @default 100
 * 
 * @param AI Loop Cycles
 * @desc How many times AI will loop when attempting to find a path; set low to avoid lag spikes 
 * @type number
 * @min 100
 * @default 1000
 *  
 * @param Fallback Pathfinding
 * @desc If no valid path found, move closer to nearest target. Works with pathfinding movement AI only (eg. NEARESTFOE)
 * @type boolean
 * @on Yes
 * @off No
 * @default true
 * 
 * @param Fallback Movement AI
 * @desc If no valid targets, use fallback movement AI. Best set to "STAND"/"AIMLESS" (which never fail) or false
 * @default false
 * 
 * @param Default Region ID
 * @desc Set unregioned tiles to default region ID for pathfinding purposes. Set to false to ignore unregioned tiles.
 * @default false
 * 
 * @param ShouKang Move Cost Method
 * @desc If true, a unit can move if enough moveCost to COMPLETE movement; default method is enough moveCost to REACH the tile
 * @default false
 * 
 * @help
 * This plugin is a work in progress!
 * Credits to: Dopan, Dr. Q, Greg Trowbridge, Traverse, SoulPour777
 *
 * Change Log
 * 24/9/20 - First Release
 * 30/9/20 - Rewrote srpgAICommand function to directly use pathfinding function to reduce lag and optimise pathfinding solutions
 * 1/10/20 - Update with addition of "face target and move towards it" default movement added if no path can be found to targets
 * 6/10/20 - Added support for regions as well as improve AI pathfinding. Added jitter variable to make movements less predictabl
 * 17/3/21 - Fixed id:0 for events as well as added support for srpgThroughTag (thanks Shoukang)
 * 18/3/21 - Added limited support for terrain (units will still pick the shortest route regardless of terrain restrictions)
 * 31/3/21 - Added compatability to ShouKang's implementation of unit movement with variable terrain passability
 *
 * What does this script do?
 * This script changes the pathfinding of units controlled by the computer (mainly enemy AI) when no targets are in range
 * For example: At the start of battle, usually enemy and player units are separated by a distance greater than their srpgMove range
 * The default SRPG movement AI is simply to face the closest target and move in that direction
 * This works on open big maps but fails when there is even a bit of map complexity such as a maze or walls
 * This script fixes it by changing the "face the closest target and move in that direction" algorithm and replaces it with a 
 * "Find the shortest path to the target and move along this path". This allows computer AI to navigate around walls, trees and
 * other obstacles such that they will always reach the target (provided the target is reachable) 
 *
 * Instructions on use:
 * Requires Doctor_Q's SRPG_AICOntrol.js (decision making AI) and SRPG_Rangecontrol.js (targetting AI) scripts 
 * Place under all SRPG and Yanfly scripts 
 * Plug and play. Make sure to set events that are obstacles with the <type: object> event tag so pathfinding is accurate
 * Otherwise pathfinding will assume these objects are "passable" and potentially select the wrong route.
 * Actor/Enemy/Class tags can be used to change default movement AI of specific units and plugin parameters can change default movement AI used globally
 *
 * Flow of pathfinding is as follows:
 * 1. Target within range - Use available skills (movement AI in this script is not used)
 * 2. Targets exist but not in range - Use movement AI 
 * 2B. If best path results in landing on an occupied space, recalculate best path
 * 3. Targets exist but no path available - Use fallback movement AI or fallback pathfinding 
 * 4. No targets exist - Use fallback movement AI if set; otherwise no movement
 * 
 * Tag Usage (Actor/Enemy and Class):
 * <movementAI: X Y> X is a string and represents the primary movement AI, Y can be a modifier (jitter)
 * X can be one of the following (if multiple are included, the priority is based off the list below with highest priority given to the higher placed movement method)
 * STAND - Unit stands still (unless applicable target within range)
 * AIMLESS - Units moves to a random space within its move range. If no space is free then it will stand still
 * NEARESTFOE - Units move to nearest target on the opposing team.
 * NEARESTFRIEND - Units move to nearest target on the same team.
 * FARTHESTFOE - Units move to the farthest target on the opposing team. Not too useful as once the unit gets closer, the farthest foe will no longer be the farthest foe.
 * FARTHESTFRIEND - Units move to the farthest  target on the same team. Not too useful as once the unit gets closer, the farthest friend will no longer be the farthest friend.
 * RANDOMFOE - Units move towards a random target on the opposing team. This changes every turn and will result in eratic behaviour if opposing team's units are spread out.
 * RANDOMFRIEND - Units move  towards a random target on the same team. This changes every turn and will result in eratic behaviour if the same team's units are spread out 
 * CURRENTREGION - Units will move randomly but only within the current region that is is. This can be altered by attacks/effects that move units 
 * REGION_X - Units will move towards nearest tile of region X if they are not in region X, otherwise they will follow CURRENTREGION movement algorithm.
 * ADJACENTREGION - Units will to a region +/- 1 of the current one. If they cannot find an adjacent region within range, they will follow CURRENT REGION movement algorithm. 
 * DIFFERENTREGION - Units will move to any square randomly with a different region to current. If they cannot find any valid options, RANDOM movement algorithm will be followed. 
 * POINT_X_Y - Units will move towards map coordinates X, Y. If they are at X,Y then STAND movement algorithm will be followed [NOT IMPLEMENTED YET]
 * AREA_X_Y_Z - Units will move towards map coordinates X, Y. If they are within Z tiles of X,Y then RANDOM movement algorithm will be followed [NOT IMPLEMENTED YET]
 * 
 * Other tags that can be included in movementAI:
 * JITTER_X - Unit moves X tiles randomly from "best route". Adds randomness to movement whilst still approaching targets. Default is 0 jitter; max jitter is srpgMove - 1.
 *
 * Current restrictions include:
 * - Treats tiles with limited passability as impassable (this can cause the path finding algorithm to fail when it comes to narrow cliffs)
 *
 */
(function () {
    var substrBegin = document.currentScript.src.lastIndexOf('/');
    var substrEnd = document.currentScript.src.indexOf('.js');
    var scriptName = document.currentScript.src.substring(substrBegin + 1, substrEnd);
    var parameters = PluginManager.parameters(scriptName);
    var _movementAI = parameters['Movement AI'] || 'nearestFoe';
    var _maxDistance = eval(parameters['Max Distance']) || 100;
    var _fallbackPathfinding = eval(parameters['Fallback Pathfinding']);
    var _fallbackMovementAI = eval(parameters['Fallback Movement AI']);
    var _loopLimit = parameters['AI Loop Cycles']; //How many loops to do before giving up on selecting a valid random tile 
	var _moveCostMethod = parameters['ShouKang Move Cost Method']; //If set to true, use ShouKang movement method when moving to tiles with terrainIds with movementCost > 1 
	console.log(_moveCostMethod);
    //var _defaultRegion = eval(parameters['Default Region ID']);
    //credit to Traverse of RPG Maker Central Forums for the above scriplet via SoulPour777 RPG Maker MV scripting tutorial video
    
	//Find the shortest path based on starting coordinates, target coordinates and the grid 
    Game_Map.prototype.findShortestPath = function (startCoordinates, grid) {
        var distanceFromLeft = startCoordinates[0];
        var distanceFromTop = startCoordinates[1];
        // Each "location" will store its coordinates
        // and the shortest path required to arrive there
        var location = {
            distanceFromTop: distanceFromTop,
            distanceFromLeft: distanceFromLeft,
            path: [],
            status: 'Start'
        };
        // Initialize the queue with the start location already inside
        var queue = [location];
	    // Loop through the grid searching for the goal
        while (queue.length > 0) {
            // Take the first location off the queue
            var currentLocation = queue.shift();
            var directions = ["Left", "Down", "Right", "Up"];
            for (dir in directions) {
                var newLocation = this.exploreInDirection(currentLocation, directions[dir], grid);
                if (newLocation.status === 'Goal') {
                    return newLocation.path;
                } else if (newLocation.status === 'Valid') {
                    queue.push(newLocation);
                }
            }
        }
        return false;
    };
	
    // This function will check a location's status
    // (a location is "valid" if it is on the grid, is not an "obstacle",
    // and has not yet been visited by our algorithm)
    // Returns "Valid", "Invalid", "Blocked", or "Goal"
    Game_Map.prototype.locationStatus = function (location, grid) {
		var dfl = location.distanceFromLeft;
        var dft = location.distanceFromTop;
        if (location.distanceFromLeft < 0 || location.distanceFromLeft >= $gameMap.width() || location.distanceFromTop < 0 || location.distanceFromTop >= $gameMap.height()) {
            // location is not on the grid--return false
			return 'Invalid';
        } else if (grid[dfl] == undefined) {
			return 'Invalid';
		} else if (grid[dfl][dft] === 'Goal') {
			return 'Goal';
        } else if (grid[dfl][dft] !== 'Empty') {
            // location is either an obstacle or has been visited
            return 'Blocked';
        } else {
            return 'Valid';
        }
    };
    // Explores the grid from the given location in the given direction
    Game_Map.prototype.exploreInDirection = function (currentLocation, direction, grid) {
        var newPath = currentLocation.path.slice();
        var dfl = currentLocation.distanceFromLeft;
        var dft = currentLocation.distanceFromTop;
        if (direction === 'Left') {
            dfl -= 1;
        } else if (direction === 'Down') {
            dft += 1;
        } else if (direction === 'Right') {
            dfl += 1;
        } else if (direction === 'Up') {
            dft -= 1;
        }
		newPath.push(direction);
		//Terrain movement calculation edit
		//for(var i = 0; i < $gameMap.srpgMoveCost(dfl, dft); i++) {
		//	newPath.push(direction);
		//}
        var newLocation = {
            distanceFromTop: dft,
            distanceFromLeft: dfl,
            path: newPath,
            status: 'Unknown'
        };
        newLocation.status = this.locationStatus(newLocation, grid);
        // If this new location is valid, mark it as 'Visited'
        if (newLocation.status === 'Valid') {
            grid[newLocation.distanceFromLeft][newLocation.distanceFromTop] = 'Visited';
        }
        return newLocation;
    };
    // Check tile passability (incorporates SRPG obstacles)
    Game_Map.prototype.checkTileValidity = function (x, y) {
        check = true;
        for (var i = 0; i < $gameMap.eventsXyNt(x, y).length; i++) {
            if ($gameMap.eventsXyNt(x, y)[i].isType() == "actor" || $gameMap.eventsXyNt(x, y)[i].isType() == "enemy") {
                check = false;
                break;
            }
        }
        return check;
    }
    //Convert a pathfinding array of directions to a target coordinate 
    Game_Map.prototype.pathToCoordinate = function (x, y, path, range, jitter, terrainId) {
        var nextX = x;
        var nextY = y;
        var lastValidX = x;
        var lastValidY = y;
        for (var i = 0; i < range && path.length > 0; i++) {
            if (path[0] == "Right") {
                nextX++;
                if (this.checkTileValidity(nextX, nextY) && (!_moveCostMethod || (i - 1 + $gameMap.srpgMoveCost(nextX, nextY) < range))) {
                    lastValidX = nextX;
                    lastValidY = nextY;
					i += $gameMap.srpgMoveCost(nextX, nextY) - 1;
                }
            } else if (path[0] == "Left") {
                nextX--;
                if (this.checkTileValidity(nextX, nextY) && (!_moveCostMethod || (i - 1 + $gameMap.srpgMoveCost(nextX, nextY) < range))) {
                    lastValidX = nextX;
                    lastValidY = nextY;
					i += $gameMap.srpgMoveCost(nextX, nextY) - 1;
                }
            } else if (path[0] == "Up") {
                nextY--;
                if (this.checkTileValidity(nextX, nextY) && (!_moveCostMethod || (i - 1 + $gameMap.srpgMoveCost(nextX, nextY) < range))) {
                    lastValidX = nextX;
                    lastValidY = nextY;
					i += $gameMap.srpgMoveCost(nextX, nextY) - 1;
                }
            } else if (path[0] == "Down") {
                nextY++;
                if (this.checkTileValidity(nextX, nextY) && (!_moveCostMethod || (i - 1 + $gameMap.srpgMoveCost(nextX, nextY) < range))) {
                    lastValidX = nextX;
                    lastValidY = nextY;
					i += $gameMap.srpgMoveCost(nextX, nextY) - 1;
                }
            }
            path.shift();
        }
        //Check if route can be optimised if best route cannot be taken 
        if (!(nextX == lastValidX && nextY == lastValidY)) {
            var pathDifference = $gameMap.pathTo(nextX, nextY, lastValidX, lastValidY, terrainId).length;
            if (pathDifference > 1) {
                //Cycle through all adjacent tiles next to optimal [X, Y] (nextX, nextY) and see if they are closer to optimal [X, Y] than default option of [lastValidX, lastValidY]
                for (var i = Math.max(0, nextX - pathDifference); i <= Math.min($gameMap.width(), nextX + pathDifference) && pathDifference > 1; i++) {
                    for (var j = Math.max(0, nextY - pathDifference); j <= Math.min($gameMap.height(), nextY + pathDifference) && pathDifference > 1; j++) {
                        //Check if square is reachable 
                        if ($gameMap.pathTo(x, y, i, j, terrainId).length <= range) {
                            //Check if square is valid as a destination
                            if (this.checkTileValidity(i, j)) {
                                //Check if this square is closer to our optimal [X, Y] than the current option
                                if ($gameMap.pathTo(nextX, nextY, i, j, terrainId).length < pathDifference) {
                                    //Set these coordinates as the new lastValidX and lastValidY values
                                    lastValidX = i;
                                    lastValidY = j;
                                    pathDifference = $gameMap.pathTo(nextX, nextY, i, j, terrainId).length;
                                }
                            }
                        }
                    }
                }
            }
        }
        //Add in jitter
        if (jitter !== false && jitter > 0) {
            var jitterArray = Array.from(Array(jitter * 2 + 1).keys());
            var limit = _loopLimit;
            while (limit > 0) {
                var randomX = jitterArray[Math.floor(Math.random() * jitterArray.length)] - jitter;
                var randomY = jitterArray[Math.floor(Math.random() * jitterArray.length)] - jitter;
                var currentPath = $gameMap.pathTo(x, y, lastValidX, lastValidY, terrainId);
                var path = $gameMap.pathTo(x, y, nextX + randomX, nextY + randomY, terrainId);
                if (path.length > 0 && path.length <= range && currentPath.length <= path.length && $gameMap.checkTileValidity(randomX, randomY)) {
                    lastValidX = nextX + randomX;
                    lastValidY = nextY + randomY;
                    break;
                }
                limit--;
                if (limit <= 0) {
                    console.log("Could not find valid solution within " + _loopLimit + " attempts");
                    break;
                }
            }
        }
        //Best location is not the same as current location, set it as the new destination
        if (!(lastValidX == x && lastValidY == y) && this.checkTileValidity(lastValidX, lastValidY)) {
            $gameTemp.setAIPos({
                x: lastValidX,
                y: lastValidY
            });
        }
    }
    //New function that creates a grid of the map; fills the grid with obstacles, target location and origin
    //The grid is used to find the shortest path from A to B, returns false if no path found
    Game_Map.prototype.pathTo = function (x1, y1, x2, y2, terrainId) {
		//Create associative array that represents the map 
        var width = $dataMap.width;
        var height = $dataMap.height;
        if (x1 >= width || y1 >= height || x2 >= width || y2 >= height || x1 < 0 || x2 < 0 || y1 < 0 || y2 < 0) {
            return false;
        } else {
            var grid = [];
            for (var i = 0; i < width; i++) {
                grid[i] = [];
                for (var j = 0; j < height; j++) {
                    grid[i][j] = 'Empty';
                }
            }
            //Set location of origin and target
            grid[x1][y1] = "Start";
		    grid[x2][y2] = "Goal";
            //Add obstacles
            for (var i = 0; i < $gameMap.width(); i++) {
                for (var j = 0; j < $gameMap.height(); j++) {
                    //If tile has limited passability, turn that tile into an obstacle IF terrainId == 0 or terrainTag above terrainId
                    if ($gameMap.checkLayeredTilesFlags(i, j, 0x0002) || $gameMap.checkLayeredTilesFlags(i, j, 0x0004) || $gameMap.checkLayeredTilesFlags(i, j, 0x0006) || $gameMap.checkLayeredTilesFlags(i, j, 0x0008)) {
                        if ($gameMap.terrainTag(i, j) == 0 || ($gameMap.terrainTag(i, j) > terrainId)) {
                            grid[i][j] = "Obstacle";
                        }
                    }
                    //If tile has an event on it, turn that tile into an obstacle
                    if ($gameMap.eventsXyNt(i, j)[0] !== undefined) {
                        //If event is tagged with an Object flag
                        if ($gameSystem.isSRPGMode() && $gameMap.eventsXyNt(i, j)[0]._srpgEventType == "object") {
                            grid[i][j] = "Obstacle";
                        }
                        //If event is on the same layer as the player 
                        if (!$gameSystem.isSRPGMode()) {
                            grid[i][j] = "Obstacle";
                        }
                    }
                }
            }
            return this.findShortestPath([x1, y1], grid);
        }
    };
    //Gets tile distance from x1, y1 to x2, y2 (ignores passability)
    Game_Map.prototype.distTo = function (x1, y1, x2, y2) {
        var dx = Math.abs(x1 - x2);
        var dy = Math.abs(y1 - y2);
        // account for looping maps
        if ($gameMap.isLoopHorizontal()) dx = Math.min(dx, $gameMap.width() - dx);
        if ($gameMap.isLoopVertical()) dy = Math.min(dy, $gameMap.height() - dy);
        return dx + dy;
    };
    // Decide a unit's action, target and movement
    Scene_Map.prototype.srpgAICommand = function () {
        var event = $gameTemp.activeEvent();
        var user = $gameSystem.EventToUnit(event.eventId())[1];
        if (!event || !user) return false;
        // Choose action and target
        var target = null;
        while (true) { // dangerous! limit loops to # of skills the user has?
            user.makeSrpgActions();
            $gameSystem.srpgMakeMoveTable(event);
            $gameTemp.clearAIPos();
            $gameTemp.clearAITargetPos();
            target = this.srpgAITarget(user, event, user.action(0));
            var item = user.currentAction().item();
            if (target || !item || $gameTemp.noTarget(item.id)) break;
            $gameTemp.setNoTarget(item.id);
        }
        $gameTemp.clearNoTarget();
        // Standing units skip their turn entirely
        var user = $gameSystem.EventToUnit(event.eventId())[1];
        if (user.battleMode() === 'stand') {
            if (user.hpRate() < 1.0 || (target && target.isType() != event.isType())) {
                user.setBattleMode('normal');
            } else {
                $gameTemp.clearMoveTable();
                user.onAllActionsEnd();
                return false;
            }
        }
        // Decide movement, if not decided by target
        if (!$gameTemp.AIPos()) {
            var movementAI = _movementAI;
            //Determine the type of movement this unit is to process
            //This checks actor and class tags and obtains movementAI tag
            //Note that event tag overrides class tag which overrides actor tag
            if (user.isActor() && user.event() !== undefined) {
                if (user.event().event().meta.movementAI !== undefined) {
                    movementAI = eval(user.event().event().meta.movementAI);
                }
            } else if (user.isActor() && user.currentClass().meta.movementAI) {
                movementAI = eval(user.currentClass().meta.movementAI);
            } else if (user.isActor() && user.actor().meta.movementAI) {
                movementAI = eval(user.actor().meta.movementAI);
            }
            //Checking enemies is a bit diff as there is a condition to check if the enemy has a class attached to it or not
            //If enemy has a class, then check if an AI Move tag is detected or not
            if (user.isEnemy() && user.event().event().meta.movementAI !== undefined) {
                movementAI = user.event().event().meta.movementAI;
            } else if (user.isEnemy() && user.enemy().classId !== undefined) {
                if (eval($dataClasses[user.enemy().classId].meta.movementAI) !== undefined) {
                    movementAI = eval($dataClasses[user.enemy().classId].meta.movementAI);
                } else {
                    if (user.isEnemy() && user.enemy().meta.movementAI) {
                        movementAI = eval(user.enemy().meta.movementAI);
                    }
                }
            } else if (user.isEnemy() && user.enemy().meta.movementAI) {
                movementAI = eval(user.enemy().meta.movementAI);
            }
            //Cycle through all movement options 
            this.srpgMovementAI(event.posX(), event.posY(), user, user.srpgMove(), movementAI, false, user.srpgThroughTag());
        }
        return true;
    };
    //Decide function to use based on movementAI tag
    Scene_Map.prototype.srpgMovementAI = function (x, y, user, range, AI, fallback, terrainId) {
        var movementAI = String(AI);
        //Set jitter parameters
        if (movementAI.includes("JITTER")) {
            var jitter = movementAI.split("JITTER_")[1].split(" ")[0];
        } else {
            var jitter = false;
        }
        //Movement options
        if (movementAI.includes("AIMLESS")) {
            this.randomPosition(x, y, range, terrainId);
        } else if (movementAI.includes("NEARESTFOE")) {
            this.proximityTarget(x, y, user, "NEAREST", "FOE", range, fallback, jitter, terrainId);
        } else if (movementAI.includes("NEARESTFRIEND")) {
            this.proximityTarget(x, y, user, "NEAREST", "FRIEND", range, fallback, jitter, terrainId);
        } else if (movementAI.includes("RANDOMFOE")) {
            this.proximityTarget(x, y, user, "RANDOM", "FOE", range, fallback, jitter, terrainId);
        } else if (movementAI.includes("RANDOMFRIEND")) {
            this.proximityTarget(x, y, user, "RANDOM", "FRIEND", range, fallback, jitter, terrainId);
        } else if (movementAI.includes("FARTHESTFOE")) {
            this.proximityTarget(x, y, user, "FARTHEST", "FOE", range, fallback, jitter, terrainId);
        } else if (movementAI.includes("FARTHESTFRIEND")) {
            this.proximityTarget(x, y, user, "FARTHEST", "FRIEND", range, fallback, jitter, terrainId);
        } else if (movementAI.includes("CURRENTREGION")) {
            this.regionMovement(x, y, "CURRENTREGION", range, fallback, jitter, terrainId);
        } else if (movementAI.includes("ADJACENTREGION")) {
            this.regionMovement(x, y, "ADJACENTREGION", range, fallback, jitter, terrainId);
        } else if (movementAI.includes("DIFFERENTREGION")) {
            this.regionMovement(x, y, "DIFFERENTREGION", range, fallback, jitter, terrainId);
        } else if (movementAI.includes("REGION_")) {
            this.regionMovement(x, y, (movementAI.split("REGION_")[1]).split(" ")[0], range, fallback, jitter, terrainId);
        }
    }
    // Choose random location
    Scene_Map.prototype.randomPosition = function (x, y, range, terrainId) {
        //x, y will be the coordinates of the user (origin)
        //range will be srpgMove
        var limit = _loopLimit;
        while (limit > 0) {
            var randomX = Math.floor(Math.random() * ($dataMap.width + 1));
            var randomY = Math.floor(Math.random() * ($dataMap.height + 1));
            var path = $gameMap.pathTo(x, y, randomX, randomY, terrainId);
            if (path.length > 0 && path.length <= range && $gameMap.checkTileValidity(randomX, randomY)) {
                $gameTemp.setAIPos({
                    x: randomX,
                    y: randomY
                });
                break;
            }
            limit--;
            if (limit <= 0) {
                console.log("Could not find valid solution within " + _loopLimit + " attempts");
                break;
            }
        }
    }
    // Movement based on Region 
    Scene_Map.prototype.regionMovement = function (x, y, targetRegion, range, fallback, jitter, terrainId) {
        //x, y will be the coordinates of the user (origin)
        //targetRegion indicates how movement will occur in relation to regions
        //range is range of the user (srpgMove)
        //Fallback is boolean; if set to true then it skips "finding position closes to target region" and calls upon the fallback movement AI routine
        var movementProcessed = false; //Set to true when a path to target is found and stops fallback pathfinding from occurring
        var path = []; //This array is used to store pathfinding route to a potential target
        var currentRegion = $gameMap.regionId(x, y);
        var possibleCoordinatesX = [];
        var possibleCoordinatesY = [];
        //Cycle through squares that user can move to (within srpgMove range) and check region values 
        for (var i = Math.max(0, x - range); i <= Math.min($gameMap.width(), x + range); i++) {
            for (var j = Math.max(0, y - range); j <= Math.min($gameMap.width(), y + range); j++) {
                if (Math.abs(i - x) + Math.abs(j - y) <= range) { //Square within range
                    if ($gameMap.checkTileValidity(i, j)) { //Square is valid to move on to
                        if ($gameMap.pathTo(x, y, i, j).length <= range) { //Square is within movement range (not just scope range)
                            if (targetRegion == "CURRENTREGION") { //Move to same region only
                                if (currentRegion == $gameMap.regionId(i, j)) {
                                    possibleCoordinatesX.push(i);
                                    possibleCoordinatesY.push(j);
                                }
                            } else if (!isNaN(targetRegion)) { //Move to X region if within range 
                                if ($gameMap.regionId(i, j) == targetRegion) {
                                    possibleCoordinatesX.push(i);
                                    possibleCoordinatesY.push(j);
                                }
                            } else if (targetRegion == "ADJACENTREGION") { //Move to X+1 or X-1 region if within range 
                                if (Math.abs($gameMap.regionId(i, j) - currentRegion) == 1) {
                                    possibleCoordinatesX.push(i);
                                    possibleCoordinatesY.push(j);
                                }
                            } else if (targetRegion == "DIFFERENTREGION") { //Move to different region if within range 
                                if (currentRegion != $gameMap.regionId(i, j)) {
                                    possibleCoordinatesX.push(i);
                                    possibleCoordinatesY.push(j);
                                }
                            }
                        }
                    }
                }
            }
        }
        //Check if any candidate locations were found
        if (possibleCoordinatesX.length > 0 && possibleCoordinatesX.length == possibleCoordinatesY.length) {
            //Pick a random coordinate to move to 
            var rand = Math.floor(Math.random() * possibleCoordinatesX.length);
            $gameTemp.setAIPos({
                x: possibleCoordinatesX[rand],
                y: possibleCoordinatesY[rand]
            });
        } else { //No candidates within range; determine next action
            if (targetRegion == "CURRENTREGION") { //Only space that is same region as user is current spot; no movement occurs
                while (possibleCoordinatesX.length > 0) {
                    var rand = Math.floor(Math.random() * possibleCoordinatesX.length);
                    if ($gameMap.regionId(possibleCoordinatesX[rand], possibleCoordinatesY[rand]) == currentRegion) {
                        $gameTemp.setAIPos({
                            x: possibleCoordinatesX[rand],
                            y: possibleCoordinatesY[rand]
                        });
                        break;
                    } else {
                        possibleCoordinatesX.splice(rand, 1);
                        possibleCoordinatesY.splice(rand, 1);
                    }
                }
            }
            if (targetRegion == "ADJACENTREGION" || targetRegion == "DIFFERENTREGION") { //All surrounding spaces are the not candidate regions; move randomly within same region
                var bestPath = $gameMap.pathTo(x, y, Math.floor(Math.random() * $gameMap.width()), Math.floor(Math.random() * $gameMap.height()), terrainId);
                $gameMap.pathToCoordinate(x, y, bestPath, range, false, terrainId);
            }
            if (!isNaN(targetRegion) && currentRegion != targetRegion) { //Move to region X; find other tiles with region X and move towards the
                //Find all tiles with region X
                var bestDist = $gameMap.width() * $gameMap.height();
                var bestPath;
                var bestX = x;
                var bestY = y;
                for (var i = 0; i < $gameMap.width(); i++) {
                    for (var j = 0; j < $gameMap.height(); j++) {
                        if ($gameMap.regionId(i, j) == targetRegion) {
                            bestPath = $gameMap.pathTo(x, y, i, j, terrainId);
                            if (bestPath.length < bestDist) {
                                bestX = i;
                                bestY = j;
                                bestDist = bestPath.length;
                            }
                        }
                    }
                }
                //Check if we got a solution or not
                if (!(bestX == x && bestY == y)) {
                    $gameMap.pathToCoordinate(x, y, bestPath, range, jitter, terrainId);
                } else { //No solution; move randomly
                    var bestPath = $gameMap.pathTo(x, y, Math.floor(Math.random() * $gameMap.width()), Math.floor(Math.random() * $gameMap.height()), terrainId);
                    $gameMap.pathToCoordinate(x, y, bestPath, range, false, terrainId);
                }
            }
        }
    }
    // Choose foe / friend based on proximity
    Scene_Map.prototype.proximityTarget = function (x, y, user, proximity, targetType, range, fallback, jitter, terrainId) {
        //x, y will be the coordinates of the user (origin)
        //proximity is a string and either "NEAREST", "RANDOM" or "FARTHEST"
        //user is mainly used to check user's confusion status
        //targetType is a string and will be either "FOE" or "FRIEND"
        //range will be srpgMove 
        //fallback is boolean; if set to true then it skips "finding valid targets"
        //jitter is variance in final position; jitter of 0 means user follows predetermined path with no variance; jitter of 1 means destination may deviate 1 square from optimal
        var movementProcessed = false; //Set to true when a path to target is found and stops fallback pathfinding from occurring
        var path = []; //This array is used to store pathfinding route to a potential target
        if (proximity == "FARTHEST") {
            var pathDistance = 0;
            var realDistance = 0;
        } else {
            var pathDistance = _maxDistance; //This variable represents to number of tile movements to a potential target dist
            var realDistance = _maxDistance; //This variable represents the distance in tiles to a potential target (ignoring passability)
        }
        var closestTarget; //This variable represents the closest target from the user
        var farthestTarget; //This variable represents the farthest target from the user
        var bestTarget; //This variable the best target (closest or farthest) to aim movement towards or away from
        var targetArray = []; //This array stores all potential targets 
        var bestPath = []; //This array stores the best pathfinding route to the best target
        var userTeam; //This variable represent's the user's team
        var targetTeam; //This variable represents the target team
        var userConfusionState = user.confusionLevel();
        //Determine user's team
        if (user.isActor()) {
            var userTeam = "actor";
        } else if (user.isEnemy()) {
            var userTeam = "enemy";
        }
        //Determine who the other target should be based on confusion
        //Confusion level of 0 = Normal 
        //Confusion level of 1 = Attack random enemy 
        //Confusion level of 2 = Attack random (enemy or ally)
        //Confusion level of 3 = Attack allies 
        if (user.confusionLevel() == 2) {
            if (Math.randomInt(2) === 0) {
                userConfusionState = 1;
            } else {
                userConfusionState = 3;
            }
        }
        if (userConfusionState == 3) {
            if (user.isActor()) {
                var userTeam = "enemy";
            } else if (user.isEnemy()) {
                var userTeam = "actor";
            }
        }
        //Define the other team
        var opposingTeam = (userTeam == "actor") ? "enemy" : "actor";
        //Determine which team to target 
        if (targetType.toUpperCase() == "FOE") {
            var targetTeam = opposingTeam;
        } else if (targetType.toUpperCase() == "FRIEND") {
            var targetTeam = userTeam;
        }
        //Count potential targets exist
        for (var i = 0; i < $gameMap._events.length; i++) {
            if ($gameMap._events[i] !== undefined) {
                if ($gameMap._events[i] !== null) {
                    if ($gameMap._events[i].isType() == targetTeam && !($gameMap._events[i].x == x && $gameMap._events[i].y == y)) {
                        //Check if event is targettable 
                        var targettable = true;
                        if ($gameSystem.EventToUnit(i)[1] !== undefined) {
                            if ($gameSystem.EventToUnit(i)[1] !== null) {
                                if ($gameSystem.EventToUnit(i)[1].isStateAffected(1) || $gameSystem.EventToUnit(i)[1].hp <= 0) {
                                    targettable = false;
                                }
                            } else {
                                targettable = false;
                            }
                        } else {
                            targettable = false;
                        }
                        //Event is targettable 
                        if (targettable) {
                            //Add this target to the target array
                            targetArray.push($gameMap._events[i]);
                            //Pathfind to the target
                            var path = $gameMap.pathTo(x, y, $gameMap._events[i].x, $gameMap._events[i].y, terrainId);
                            //If path to target is shortest than maxdistance or the previous event then replace the best target with this target
                            if (path.length < pathDistance && proximity == "NEAREST") {
                                pathDistance = path.length;
                                bestPath = path;
                                bestTarget = $gameMap._events[i]; //This stores event id of our target
                                //If path to target is longer than 0 or the previous event then replace the best target with this target
                            } else if (path.length > pathDistance && proximity == "FARTHEST") {
                                bestPath = path;
                                pathDistance = path.length;
                                bestTarget = $gameMap._events[i]; //This stores event id of our target
                            }
                            //Check actual distance from user to target
                            var dist = $gameMap.distTo(x, y, $gameMap._events[i].x, $gameMap._events[i].y);
                            //Save the event if its the closest target
                            if (dist < realDistance && proximity == "NEAREST") {
                                realDistance = dist;
                                potentialTarget = $gameMap._events[i];
                            }
                            //Otherwise save the event if its the farthest target
                            else if (dist > realDistance && proximity == "FARTHEST") {
                                realDistance = dist;
                                potentialTarget = $gameMap._events[i];
                            }
                        }
                    }
                }
            }
        }
        //Targets exist but are not reachable and fallback pathfinding is enabled
        if (targetArray.length > 0 && bestPath.length == 0) {
            if (_fallbackPathfinding) {
                if (((realDistance > 0 && proximity == "FARTHEST") || (realDistance > 1 && proximity == "NEAREST")) && realDistance < _maxDistance) {
                    //Cycle through the map 
                    for (var i = 0; i < $dataMap.width; i++) {
                        for (var j = 0; j < $dataMap.width; j++) {
                            //If this square has a valid path
                            var path = $gameMap.pathTo(x, y, i, j, terrainId);
                            if (path.length > 0) {
                                //If this square is closer to the target (or closer than current position)
                                if ($gameMap.distTo(i, j, potentialTarget.x, potentialTarget.y) < realDistance) {
                                    realDistance = $gameMap.distTo(i, j, potentialTarget.x, potentialTarget.y);
                                    bestPath = path;
                                }
                            }
                        }
                    }
                }
                //Check if we found a square that we can pathfind to and closer than our current position
                if (bestPath.length > 0) {
                    $gameMap.pathToCoordinate(x, y, bestPath, user.srpgMove(), jitter, terrainId);
                    movementProcessed = true;
                }
            } else if (_fallbackMovementAI !== false && !fallback) {
                this.srpgMovementAI(x, y, user, user.srpgMove(), _fallbackMovementAI, true);
                console.log("Fallback movement AI of " + _fallbackMovementAI + " initiated");
            }
        }
        //Targets exist and reachable, process pathfinding (applies for nearest and farthest algorithms)
        if (targetArray.length > 0 && bestPath.length > 0 && !movementProcessed) {
            $gameMap.pathToCoordinate(x, y, bestPath, user.srpgMove(), jitter, terrainId);
        }
        //Targets exist and reachable, process pathfinding (applies for random target selection)
        if (targetArray.length > 0 && bestPath.length == 0 && proximity == "RANDOM" && !movementProcessed) {
            var rand = Math.floor(Math.random() * targetArray.length);
            var bestPath = $gameMap.pathTo(x, y, targetArray[rand].x, targetArray[rand].y, terrainId);
            $gameMap.pathToCoordinate(x, y, bestPath, user.srpgMove(), jitter, terrainId);
        }
    }
    //Overwritten function that replaced default pathfinding when player is moved by mouse click
/*
    Game_Player.prototype.moveByInput = function() {
        if (!this.isMoving() && this.canMove()) {
            var direction = this.getInputDirection();
            var path = [];
            if (direction > 0) {
                $gameTemp.clearDestination();
                this.executeMove(direction);
            } else if ($gameTemp.isDestinationValid()) {
                var x = $gameTemp.destinationX();
                var y = $gameTemp.destinationY();
                var path = this.pathTo(x, y);
				var direction = this.findDirectionTo(x, y);
			}
            if (path.length > 0 && !(this.x == x && this.y == y)) {
                if (path[path.length - 1] == "Left") {
                    this.executeMove(6);
                } else if (path[path.length - 1] == "Right") {
                    this.executeMove(4);
                } else if (path[path.length - 1] == "Up") {
                    this.executeMove(2);
                } else if (path[path.length - 1] == "Down") {
                    this.executeMove(8);
                }
            } else if (!path && direction > 0 && _fallbackPathfinding) {
				this.executeMove(direction);
            } 
        }
    };
	*/
})();
