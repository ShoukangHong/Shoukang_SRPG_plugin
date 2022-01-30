//=============================================================================
// SRPG_AIControlPlus.js
//-----------------------------------------------------------------------------
// Free to use and edit    version 1.00 First release!
//=============================================================================
/*:
 * @plugindesc advanced AI targeting!
 * @author Shoukang
 *
 * @param rating Formula
 * @desc Default formula to modify the score by rating action.
 * set to 1 to make battler always behave the same way.
 * @default Math.pow(1.25, rating + 4 * random - 2)
 *
 * @param target Formula
 * @desc Default formula for target evaluation.
 * @default 10
 *
 * @param counter Formula
 * @desc Default formula for counter evaluation. If a target can't counter it will return 0. 
 * subtract this value.
 * @default 2
 *
 * @param direction Modifier Front
 * @desc Default modifier for skills without direction effect.
 * @default 1
 *
 * @param direction Modifier Side
 * @desc Modifier for side attack. Useable variabls: side_hit, side_eva, side_dmg (set in SRPG_directionalMode)
 * @default 1
 * 
 * @param direction Modifier Back
 * @desc Modifier for back attack. Useable variabls: back_hit, back_eva, back_dmg (set in SRPG_directionalMode)
 * @default 1
 *
 * @param position Modifier
 * @desc Default formula for position evaluation. should be a list: [x formula , p formula]
 * @default [1, df]
 *
 * @param random Level
 * @type number
 * @min 0
 * @max 25
 * @desc Default formula to make action random. Set to 0 will make battler always behave the same.
 * @default 0
 *
 * @param use Seeded Random
 * @type boolean
 * @desc seeded random allows battler to behave the same way after you save & load.(damage and critical, or anyformula with Math.random will be different)
 * @default false
 *
 * @param position Searching Level
 * @type number
 * @min 0
 * @max 10
 * @desc limit the amout of ai position search, this search will always use seeded random.
 * set to 10 to search all possible moves, which can be slow in extreme cases.
 * @default 10
 *
 * @param with AgiAttackPlus
 * @desc Set true if you use SRPG_AgiAttackPlus. This will make damage estimation for ai target count agi attack times.
 * @default false
 *
 * @help
 * This plugin is designed for advanced AI behavior. It is designed for my game so It depends on many of my plugins and is
 * not easy to use. Some coding knowledge is also needed.
 * This plugin the AI target formula described in SRPG_AIControl and makes a new one. With proper setup, it can make AI units
 * behave smart.
 * This plugin also changes the skill searching method. Rather than stop searching once a picked skill has bestscore > 0, this plugin force
 * AI battlers to search for all skills, all target positions, and all moves positions that can reach the target position. It will then
 * then pick the combination with the highest score.
 *
 * The Evaluation of each choice is seperated into 3 steps:
 * step1Score = baseScore + sum of (aiTarget * aiDirection - aiCounter);
 * This step evaluates the score of using a skill, if step1Score <= 0, the skill of this choice is considered as having negative effect.
 * Therefore, even if the final score is > 0 and it's the best choice, the battler will just move to the position without using skills.
 * BaseScore is mainly used for cell target Skills.
 *
 * step2Score = (step1Score + aiPos[1]) * aiPos[0];
 * this step modifies the step1Score with position score. AI pos 0 is designed to evaluate position based on terrain and surrounding environments
 * and Ai pos 1 is for the inner value of the position(for example a unitEvent that need to be triggered)
 *
 * finalScore = step2Score * aiRating * randomLevelFormula;
 * this step makes the skill choice more random.
 * baceSocre is mainly used for cell targets, as cell target skills may not have targets. For AoE summon skills having targets will reduce the
 * summoned units, so you can set a positive base score and a negative target score.
 *
 * If a target can't counter, counter formula will always return 0.
 * If the final score <= 0 it will be ignored. If no choice has positive score the moveMethod plugin will determine the move.
 * For each skill, aiRating Formula will be executed previously to get a value and then apply that same value to all the choices of the action.
 * This design aims at simulating the original ai rating effect. However, random numbers created by randomLevel will be different for each choice.
 * ===========================================================================================================================
 * Usable functions(functions is in the form of f.xxx(...)) and variables
 * *rating formula*
 * a : user, use a.randomLevel() can get the random level of the user if needed, this also applies to the following formula.
 * rating : the rating of the skill, for actors it will return 5 by default.
 * random : a random number(seeded) between 0-1.
 *
 * *base score formula*
 * a : user
 *
 * *target Formula*
 * a : user
 * b : target
 * dmg : estimated attack damage, this damage already considers attack time and damage overflow.
 * time: attack time.
 * hit : the probability to hit the target. It considers user hit and target eva. If you change the default hit rule by another plugin, this will not return the right value.
 * cri : the probability to do critical attack.
 *
 * *counter Formula*
 * a : user
 * b : target
 * dmg : estimated counter attack damage, this damage already considers attack time and damage overflow.
 * time : counter attack time.
 * hit : gives the probability to hit the user. If you change the default hit rule by another plugin, this will not return the right value.
 * cri : the probability to do critical counter attack.
 *
 * *position Formula* (Note: For fast computation, all distance are straight distance(|x1-x2| + |y1-y2|), not move distance.)
 * a : user
 * x : position x of the chosen tile.
 * y : position y of the chosen tile.
 * dist : distance from the original position.
 * df : if the chosen tile is damage floor, return -1, otherwise return 0.
 * rg : region id of the chosen tile.
 * tr : terrain tag of the chosen tile.
 * f.nrd(regionId): nearest region distance, if such region doesn't exist, return 100
 * f.ntd('type') : nearest type distance, type can be 'friend', 'foe' (will be converted to 'enemy' or 'friend' depending on user type), 'unitEvent', 'object', etc. if such type doesn't exist, return 100
 * f.nfd('flag') : Nearest flag distance. use with <aiFlag:XXX> event note tag, if such flag doesn't exist, return 100.
 * f.ntw(type, maxDist) : Nearby type weight, weight = 1 + sum of (Math.max(1 + 1/maxDist - eventDistance/maxDist), 0), eventDistance is the distance from valid event to the chosen tile.
 * f.nfw(type, maxDist) : Nearby flag weight, same as above. You can use f.ntw to evaluate the friend and opponent impact of each tile.
 * f.mtd('type') : most type distance, type can be 'friend', 'foe' (will be converted to 'enemy' or 'friend' depending on user type), 'unitEvent', 'object', etc. if such yype doesn't exist, return 100.
 * f.mfd('flag') : most flag distance, use with <aiFlag:XXX> event note tag, if such flag doesn't exist, return 100.
 * f.isf('flag') : is flag of the chosen tile. If is the flag return 1, otherwise return 0.
 * ===========================================================================================================================
 * Script calls:
 * this.setTargetScoreFormula(eventId, 'formula');
 * this.setCounterScoreFormula (eventId, 'formula');
 * this.setPosModifierFormula(eventId, '[formula1, formula2]');
 * this.setRandomLevel(eventId, randomLevel);
 * this.setTargetScoreFormula(eventId, 'formula');
 *
 * $gameSystem.setRandomLevel(randomLevel); set the defualt random level, can be used to control game difficulty.
 * $gameSystem.setSearchLevel(searchLevel); set the defualt search level, can be used to control game difficulty.
 * $gameSystem.refreshSeed();               make a new random seed.
 * $gameSystem.generateRandom();            generate a seeded random number.
 * 
 *
 * a.randomLevel(); get the random level of the battler a, only usable in formulas.
 *  ===========================================================================================================================
 * Skill, class, actor, enemy Note tags: (priority: skill > class > actor > enemy)
 * <aiBase: formula>    (only useable in skill note tag)
 * <aiTarget: formula>    
 * <aiCounter: formula> (not usable in skill note tag)
 * <aiPos: formula>     (not usable in skill note tag)
 * <aiRandom: level>    (not usable in skill note tag)
 * ===========================================================================================================================
 * Compatibility:
 * Needs SRPG_rangeControl, SRPG_AIControl, SRPG_AoE, SRPG_PositionEffects, SRPG_MoveMethod, Place it below all of them.
 * My suggestion is to use the same setup as my demo. Otherwise, I'm not sure what might break it.(Not fully tested yet)
 * ===========================================================================================================================
 * V 1.00 first release!
 *
 */
(function() {
  'use strict'
  var directionParameters = PluginManager.parameters('SRPG_DirectionMod');
  if (directionParameters){
    var side_hit = Number(directionParameters['SideAttack_Mod:HIT']);
    var side_eva = Number(directionParameters['SideAttack_Mod:EVA']);
    var side_dmg = Number(directionParameters['SideAttack_Mod:DMG']);
    var back_hit = Number(directionParameters['BackAttack_Mod:HIT']);
    var back_eva = Number(directionParameters['BackAttack_Mod:EVA']);
    var back_dmg = Number(directionParameters['BackAttack_Mod:DMG']);
  }

  var parameters = PluginManager.parameters('SRPG_AIControlPlus');
  var _aiRating = parameters['rating Formula'] || 'Math.pow(1.25, rating + 4 * random - 2)';
  var _aiTarget = parameters['target Formula'] || '10';
  var _aiCounter = parameters['counter Formula'] || '2';
  var _aiFront = parameters['direction Modifier Front'] || 1;
  var _aiSide = eval(parameters['direction Modifier Side']) || 1;
  var _aiBack = eval(parameters['direction Modifier Back']) || 1;
  var _aiPos = parameters['position Modifier'] || '[1, df]';
  var _aiRandom = parameters['random Level'] || 0;
  var _seededRandom = !!eval(parameters['use Seeded Random']);
  var _searchLevel = Number(parameters['position Searching Level'] || 10);
  var _withAgiAttackPlus = !!eval(parameters['with AgiAttackPlus']);

  Game_Interpreter.prototype.setTargetScoreFormula = function(eventId, formula){
    var battleArray = $gameSystem.EventToUnit(eventId);
    if (battleArray && battleArray[1]){
      battleArray[1].setTargetScoreFormula(formula);
    }
  };

  Game_Interpreter.prototype.setCounterScoreFormula = function(eventId, formula){
    var battleArray = $gameSystem.EventToUnit(eventId);
    if (battleArray && battleArray[1]){
      battleArray[1].setCounterScoreFormula(formula);
    }
  };

  Game_Interpreter.prototype.setPosModifierFormula = function(eventId, formula){
    var battleArray = $gameSystem.EventToUnit(eventId);
    if (battleArray && battleArray[1]){
      battleArray[1].setPosModifierFormula(formula);
    }
  };

  Game_Interpreter.prototype.setRandomLevel = function(eventId, formula){
    var battleArray = $gameSystem.EventToUnit(eventId);
    if (battleArray && battleArray[1]){
      battleArray[1].setRandomLevel(formula);
    }
  };

  Game_System.prototype.setRandomLevel = function(level){
    this._randomLevel = level;
  };

  Game_System.prototype.setSearchLevel = function(level){
    this._searchLevel = level;
  };

  Game_System.prototype.randomLevel = function(){
    if (this._randomLevel || this._randomLevel === 0) return this._randomLevel
    return _aiRandom;
  };

  Game_System.prototype.seachLevel = function(){
    return this._searchLevel || _searchLevel;
  };

  var _SRPG_Game_System_initialize = Game_System.prototype.initialize;
  Game_System.prototype.initialize = function() {
      _SRPG_Game_System_initialize.call(this);
      this._searchLevel = _searchLevel;
      this._randomLevel = _aiRandom;
      this._seeds = [Math.round(Math.random() * 4294967295), Math.round(Math.random() * 4294967295),
       Math.round(Math.random() * 4294967295), Math.round(Math.random() * 4294967295)];
  };

  Game_System.prototype.seededRandomGenerator = function(){
    if (!this._seeds){
      this._seeds = [Math.round(Math.random() * 4294967295), Math.round(Math.random() * 4294967295),
       Math.round(Math.random() * 4294967295), Math.round(Math.random() * 4294967295)];
    }
    return this.generateRandom.bind(this);
  };

  Game_System.prototype.refreshSeed = function(){
    for (var i = 0; i < this._seeds.length; i++){
      this._seeds[i] = Math.round(Math.random() * 4294967295);
    }
  };

  //a sfc32 random generator I grabed from stackoverflow.
  Game_System.prototype.generateRandom = function(){
    this._seeds[1] >>>= 0; this._seeds[2] >>>= 0; this._seeds[3] >>>= 0; this._seeds[4] >>>= 0; 
    var t = (this._seeds[1] + this._seeds[2]) | 0;
    this._seeds[1] = this._seeds[2] ^ this._seeds[2] >>> 9;
    this._seeds[2] = this._seeds[3] + (this._seeds[3] << 3) | 0;
    this._seeds[3] = (this._seeds[3] << 21 | this._seeds[3] >>> 11);
    this._seeds[4] = this._seeds[4] + 1 | 0;
    t = t + this._seeds[4] | 0;
    this._seeds[3] = this._seeds[3] + t | 0;
    return (t >>> 0) / 4294967296;
  };

  Game_Temp.prototype.makeRangeTableOnMoveList = function(event, user, item){
    var minRange = user.srpgSkillMinRange(item);
    if (item.meta.notUseAfterMove) { // cannot move before attacking
      var x = event.posX();
      var y = event.posY();
      event.makeRangeTable(x, y, user.srpgSkillRange(item), null, x, y, item);
    } else { // can move
      $gameTemp.moveList().forEach(function(pos) {
        var x = pos[0];
        var y = pos[1];
        if (!$gameMap.isOccupied(x, y)) {
          event.makeRangeTable(x, y, user.srpgSkillRange(item), null, x, y, item);
          if (minRange <= 0 && $gameTemp.RangeTable(x, y)[0] >= 0) $gameTemp.addRangeMoveTable(x, y, x, y);//fix a bug for not searching moves
        }
      });
    }
  };

  Game_Temp.prototype.clearRangeTable = function() {
      this._RangeTable = [];
      this._RangeList = [];
      for (var i = 0; i < $dataMap.width; i++) {
        var vartical = [];
        for (var j = 0; j < $dataMap.height; j++) {
          vartical[j] = [-1, []];
        }
        this._RangeTable[i] = vartical;
      }
    this._RangeMoveTable = [];
    for (var i = 0; i < $dataMap.width; i++) {
      var col = [];
      for (var j = 0; j < $dataMap.height; j++) {
        col[j] = [];
      }
      this._RangeMoveTable[i] = col;
    }
  };

  Game_Temp.prototype.monteCarloGetRangeMoveTable = function(x, y) {
    if (_searchLevel >= 10) return this._RangeMoveTable[x][y];
    var randomGenerator = $gameSystem.seededRandomGenerator();
    var len = Math.max(this._RangeMoveTable[x][y].length, 1);
    var probability = Math.sqrt(len * _searchLevel) / len;
    var list = this._RangeMoveTable[x][y].filter(function(){
      return randomGenerator() < probability;
    });
    return list;
  };

  Game_Temp.prototype.setUpAoETargets = function(event, user, action, targetPos, userPos) {
    this.showArea(targetPos.x, targetPos.y, targetPos.dir);
    var tempx = event._x;
    var tempy = event._y;
    event._x = userPos.x;
    event._y = userPos.y;
    this.selectArea(user, action);
    event._x = tempx;
    event._y = tempy;   //fix a bug when battler select area before move
    if (this.areaTargets().length <= 0){ //celltarget?
      this.addAreaTarget({
        item: action.item(),
        event: event
      });
    }
    $gameTemp.setTargetEvent($gameTemp.areaTargets().shift().event);
  }

  Scene_Map.prototype.srpgAICommand = function() {
    var event = $gameTemp.activeEvent();
    var user = $gameSystem.EventToUnit(event.eventId())[1];
    var aiMoveMode = event.aiMove();
    if (!user) return false;

    if (aiMoveMode && !user.keepStanding()) user.setBattleMode(aiMoveMode);

    if (user.isSkipAttackMode()){
      $gameSystem.srpgMakeMoveTable(event);
      this.srpgAIPosition(user, event, user.action(0));
      return true;
    }
    var bestChoice = this.makeBestChoice(event, user);
    if (bestChoice.moveOnly && !user.keepStanding()){
      $gameTemp.setAIPos({x: bestChoice.pos.x, y: bestChoice.pos.y});
      return true;
    }

    user.setAction(0, bestChoice.action);

    // set up targets
    if (bestChoice.targetPos) { //is AoE
      $gameTemp.setAITargetPos(bestChoice.targetPos);
      $gameTemp.setUpAoETargets(event, user, bestChoice.action, bestChoice.targetPos, bestChoice.pos);
    } else {
      $gameTemp.setTargetEvent(bestChoice.targetEvent || event);
    }

    $gameTemp.setAIPos(bestChoice.pos);
    $gameTemp.reserveOriginalPos(event.posX(), event.posY());//make auto battle unit able to use notuseaftermove skills
    var target = $gameSystem.EventToUnit($gameTemp.targetEvent().eventId())[1];
    // standing units skip their turn entirely
    if (user.battleMode() === 'stand') {
      if (user.keepStanding(target)) {
        $gameTemp.clearMoveTable();
        user.onAllActionsEnd();
        $gameTemp.clearAreaTargets();
        $gameTemp.clearArea();
        return false;
      } else if (aiMoveMode) {
        user.setBattleMode(aiMoveMode);
      } else {
        user.setBattleMode('normal');
      }
    }
    if ($gameTemp.AIPos()) {
      $gameSystem.srpgMakeMoveTable(event);
    } else {
      // decide movement, if not decided by target
      this.srpgAIPosition(user, event, user.action(0));
    }
    return true;
  };

  Scene_Map.prototype.makeBestChoice = function(event, user) {
    // var targetTotal = 0; some code to measure performance
    // var rangeTableTotal = 0;
    // var ta;
    // var tb;
    $gameTemp.clearMoveTable();
    event.makeMoveTable(event.posX(), event.posY(), user.srpgMove(), null, user.srpgThroughTag());
    var bestChoice = user.initBestChoice();
    var counterScoreList = event.createCounterScoreList();
    var posModifierTable = event.createPosModifierTable();
    var randomLevel = user.randomLevel();
    user.makeActionList().forEach(function(action){
      user.setAction(0, action);
      // ta = performance.now();
      $gameTemp.makeRangeTableOnMoveList(event, user, action.item());
      var targetPosList = $gameTemp.moveList().concat($gameTemp.rangeList());
      // tb = performance.now();
      // rangeTableTotal += tb-ta;
      $gameTemp.clearAIPos();
      $gameTemp.clearAITargetPos();
      // ta = performance.now();
      this.srpgAITarget(user, event, user.action(0), counterScoreList, targetPosList, posModifierTable, randomLevel);
      // tb = performance.now();
      // targetTotal += tb-ta;
      $gameTemp.clearRangeTable();
    }, this);
    // var tb = performance.now();
    // console.log('RangeTable took ' + rangeTableTotal + ' ms.');
    // console.log('AI targeting took ' + targetTotal + ' ms.');
    return bestChoice;
  };

  Scene_Map.prototype.srpgAITarget = function(user, event, action, counterScoreList, targetPosList, posModifierTable, randomLevel) {
    var isAoE = (action.area() > 0);
    // notetag to ignore priority targets
    if (action.item().meta.aiIgnoreAiming || user.confusionLevel() > 0) {
      $gameTemp.setSrpgPriorityTarget(null);
    } else this.srpgPriorityTarget(user);
    var r = action.area();
    var mr = action.minArea();
    var t = action.areaType();
    var isDirectionalAoE = isAoE && ['', 'line', 'cone', 'split', 'arc', 'side', 'tee'].contains(t);
    var targetEvent = event;// set the default target event as user in case the skill is cell target.
    var ratingModifier = event.createRatingModifier(action);
    var validTargetEvents = event.getValidTargetEvents(action);
    var targetScoreList = event.createTargetScoreList(action, validTargetEvents);
    var baseScore = action.baseScore(user);
    var randomGenerator = _seededRandom ? $gameSystem.seededRandomGenerator() : Math.random;
    targetPosList.forEach(function (targetPos) {
      //if (!targetPos) return;
      var tx = targetPos[0];
      var ty = targetPos[1];
      var userPosList = $gameTemp.monteCarloGetRangeMoveTable(tx, ty);
      var targetEventsInPosExcludeUser = [];
      if (!isDirectionalAoE){
        targetEventsInPosExcludeUser = validTargetEvents.filter(function(event2){
          return event2 !== event && (event2.pos(tx, ty) || event2.inArea(tx, ty, r, mr, t, 5));
        });
      }
      for (var i = 0; i < userPosList.length; i++) {
        var pos = userPosList[i];
        var priority = false;
        var d = isDirectionalAoE ? $gameMap.dirBetween(pos.x, pos.y, tx, ty) : 5;
        var targetEventsInPosConsiderUser = targetEventsInPosExcludeUser;
        if (isDirectionalAoE){
          targetEventsInPosConsiderUser = validTargetEvents.filter(function(event2){
            return event2 !== event && (event2.pos(tx, ty) || event2.inArea(tx, ty, r, mr, t, d));
          });
        }
        if (action.isForFriend() && ((pos.x === tx && pos.y === ty) || $gameMap.inArea(pos.x-tx, pos.y-ty, r, mr, t, d))){
          targetEventsInPosConsiderUser = targetEventsInPosConsiderUser.concat([event]);
        }
        //sum up target score
        var score = targetEventsInPosConsiderUser.reduce(function(value, event2) {//event2 is targetevent, however the variable name is used.
          var singleScore = event.calcSingleTargetScore(action, pos, event2, targetScoreList, counterScoreList);
          value += singleScore;
          if (singleScore > 0){
            targetEvent = event2;
            if (event2 === $gameTemp.isSrpgPriorityTarget()) priority = true;
          }
          return value;
        }, baseScore);
        //modify score with position modifier.
        var moveOnly = score <= 0 ? true : false;
        score += posModifierTable[pos.x][pos.y][1];
        score *= posModifierTable[pos.x][pos.y][0] * ratingModifier * (1 + randomLevel * (0.5 - randomGenerator()) * 0.1);
        // update the best Choice
        user.updateBestChoice(priority, score, pos, action, moveOnly, isAoE, targetEvent, tx, ty, d);
      }
    }, this);
  };

  Game_CharacterBase.prototype.calcSingleTargetScore = function(action, pos, targetEvent, targetScorelist, counterScoreList){
    var attackInfo = targetScorelist[targetEvent.eventId()];
    var target = attackInfo.target
    var score = attackInfo.score;
    var directionModifier = this.createDirectionModifier(targetEvent, pos, action);
    var counterScore = counterScoreList[targetEvent.eventId()];
    score = score * directionModifier;
    if (counterScore > 0 && !action.item().meta.srpgUncounterable && 
      targetEvent.inCounterRange(pos.x, pos.y) && attackInfo.singleDmg < target.hp){
      score -= counterScore;
    }
    return score;
  };

  Game_CharacterBase.prototype.createRatingModifier = function(action){
    var a = $gameSystem.EventToUnit(this.eventId())[1];
    var rating = action.rating(a);
    var random = $gameSystem.generateRandom();
    return eval(_aiRating);
  };

  Game_CharacterBase.prototype.createTargetScoreList = function(action, targetEvents) {
    var user = $gameSystem.EventToUnit(this.eventId())[1];
    var targetScores = [];
    var targetFormula = user.targetScoreFormula(action.item());
    var supportFunctions = {
    //  dmg : action.srpgPredictionDamageWithAgi.bind(action),
    //  time : user.getAgiAttackTime.bind(user),
    //  hit : action.srpgPredictionHitRate.bind(action)
    };

    targetEvents.forEach(function (event){
      targetScores[event.eventId()] = event.targetScore(user, action, targetFormula, supportFunctions);
    });
    return targetScores;
  };

  Game_CharacterBase.prototype.targetScore = function(user, action, targetFormula, f) {
    // initial scoring
    var target = $gameSystem.EventToUnit(this.eventId())[1];
    var score = action.item().meta.aiIgnoreAiming ? 1 : target.tgr;
    //score *= (action.isForOpponent() ? action.aiOpponentRate() : action.aiFriendRate());
    // it's already 0, it can't be anything else
    if (score == 0) return 0;
    // stats and switches
    var s = $gameSwitches._data;
    var v = $gameVariables._data;
    var a = user;
    var b = target;
    var item = action.item();
    var dmg = action.srpgPredictionDamageWithAgi(b);
    var time = a.getAgiAttackTime(b) + 1;
    var hit = action.srpgPredictionHitRate(b);
    var cri = action.itemCri(b);
    score *= eval(targetFormula);
    return {
      score: score,
      singleDmg: dmg/time,
      target: b
    };
  };

  Game_CharacterBase.prototype.createCounterScoreList = function() {
    var user = $gameSystem.EventToUnit(this.eventId())[1];
    var action = new Game_Action(user);
    action.setSkill(user.attackSkillId());
    var targetEvents = this.getValidTargetEvents(action);
    var counterScores = [];
    var counterFormula = user.counterScoreFormula(action.item());
    for (var i = i; i < $gameMap.events().length; i++){
      counterScores[i] = 0;
    }

    targetEvents.forEach(function (event){
      counterScores[event.eventId()] = event.counterScore(user, counterFormula);
    });
    return counterScores;
  };

  Game_CharacterBase.prototype.counterScore = function(user, counterFormula) {
    // initial scoring
    var target = $gameSystem.EventToUnit(this.eventId())[1];
    if (target.isActor() == user.isActor() || !target.srpgWeaponCounter() ||
     target.isRestricted() || !target.meetsSkillConditions($dataSkills[target.attackSkillId()])){
      return 0;
    }
    var a = user;
    var b = target;
    var action = new Game_Action(target);
    action.setSkill(target.attackSkillId());
    var dmg = action.srpgPredictionDamageWithAgi(a);
    var time = b.getAgiAttackTime(a)+ 1;
    var hit = action.srpgPredictionHitRate(a);
    var cri = action.itemCri(a);
    return eval(counterFormula);
  };

  Game_CharacterBase.prototype.createDirectionModifier = function(targetEvent, pos,action){
    if (directionParameters && eval(action.item().meta.srpgDirection)){
      var _x = pos.x;
      var _y = pos.y;
      var _d = (targetEvent != this) ? this.dirTo(_x, _y) : this.direction();
      var front = this.direction() == _d ? true : false;
      var back = this.direction() == 10-_d ? true : false;
      if (front){
        return 1
      } else if (back){
        return back_dmg
      } else { //side
        return side_dmg
      }
    } else return 1; //no direction
  };

  Game_CharacterBase.prototype.createPosModifierTable = function() {
    var posModifierTable = [];
    var user = $gameSystem.EventToUnit(this.eventId())[1];
    var posModifierFormula = user.posModifierFormula();
    var supportFunctions = {
      nrd : this.choiceNearestRegionDist.bind(this),
      ntd : this.choiceNearestTypeDist.bind(this),
      nfd : this.choiceNearestFlagDist.bind(this),
      ntw : this.choiceNearbyTypeWeight.bind(this),
      nfw : this.choiceNearbyFlagWeight.bind(this),
      mtd : this.choiceMostTypeDist.bind(this),
      mfd : this.choiceMostFlagDist.bind(this),
      isf  : this.choiceIsFlag.bind(this)
    }
      for (var x = 0; x < $dataMap.width; x++) {
        var vartical = [];
        for (var y = 0; y < $dataMap.height; y++) {
          vartical[y] = this.createPosModifier(user, x, y, posModifierFormula, supportFunctions);
        }
        posModifierTable[x] = vartical;
      }
      return posModifierTable;
  };

  //f.nrd : this.choiceNearestRegionDist, id
  //f.ntd : this.choiceNearestTypeDist, type
  //f.nfd : this.choiceNearestFlagDist, flag
  //f.mtd : this.choiceMostTypeDist, type
  //f.mfd : this.choiceMostFlagDist, flag
  Game_CharacterBase.prototype.createPosModifier = function(user, x, y, posModifierFormula, f){
    if ($gameTemp.MoveTable(x, y)[0] < 0) return [1, 0];
    this.choiceX = x;
    this.choiceY = y;
    var a = user;
    var dist = this.distTo(x, y);
    var df = $gameMap.isDamageFloor(x, y) ? -1 : 0;
    var rg = $gameMap.regionId(x, y) || 0;
    var tr = $gameMap.terrainTag(x, y) || 0;
    return eval(posModifierFormula);
  };

  Game_CharacterBase.prototype.choiceNearestRegionDist = function(id){ //will not consider region out of reach!
    var minDist = 100;
    $gameTemp.moveList().forEach(function(pos){
      var region = $gameMap.regionId(pos[0], pos[1]) || 0;
      if (region === id){
        minDist = Math.min(minDist, $gameMap.distTo(pos[0], pos[1], this.choiceX, this.choiceY));
      }
    }, this);
    return minDist;
  };

  Game_CharacterBase.prototype.choiceNearestTypeDist = function(type){
    if (type == 'friend') type = (this.isType() == 'actor' ? 'actor' : 'enemy');
    if (type == 'foe') type = (this.isType() == 'enemy' ? 'actor' : 'enemy');
    var minDist = 100;
    $gameMap.events().forEach(function(event) {
      if (!event.isErased() && event !== this && event.isType() === type){
        minDist = Math.min(minDist, event.distTo(this.choiceX, this.choiceY));
      }
    }, this);
    return minDist;
  };

  Game_CharacterBase.prototype.choiceNearbyTypeWeight = function(type, maxDist){
    if (type == 'friend') type = (this.isType() == 'actor' ? 'actor' : 'enemy');
    if (type == 'foe') type = (this.isType() == 'enemy' ? 'actor' : 'enemy');
    var weight = 1;
    var interval = 1/maxDist;
    $gameMap.events().forEach(function(event) {
      if (!event.isErased() && event !== this && event.isType() === type){
        weight += Math.max(1 + interval - interval * event.distTo(this.choiceX, this.choiceY), 0);
      }
    }, this);
    return weight;
  };

  Game_CharacterBase.prototype.choiceMostTypeDist = function(type){
    if (type == 'friend') type = (this.isType() == 'actor' ? 'actor' : 'enemy');
    if (type == 'foe') type = (this.isType() == 'enemy' ? 'actor' : 'enemy');
    var user = $gameSystem.EventToUnit(this.eventId())[1];
    var minDist = 100;
    var events = $gameMap.events().filter(function(event) {
      if (!event.isErased() && event !== this && event.isType() === type){
        return true;
      }
    }, this);
    if (events.length <= 0) return minDist;
    var maxClusters = $gameTemp.getMaxClusters(events, user.srpgMove());
    for (var i = 0; i < maxClusters.length; i++){
      var sumX = 0;
      var sumY = 0;
      for (var j = 0; j < maxClusters[i].length; j++){
        sumX += maxClusters[i][j].posX();
        sumY += maxClusters[i][j].posY();
      }
      var dist = $gameMap.distTo(this.choiceX, this.choiceY, Math.round(sumX / maxClusters[i].length), Math.round(sumY / maxClusters[i].length));
      if (dist < minDist) minDist = dist;
    }
    return minDist;
  };

  Game_CharacterBase.prototype.choiceNearestFlagDist = function(flag){
    var minDist = 100;
    $gameMap.events().forEach(function(event) {
      if (!event.isErased() && event !== this && event.aiFlag() === flag){
        minDist = Math.min(minDist, event.distTo(this.choiceX, this.choiceY));
      }
    }, this);
    return minDist;
  };

  Game_CharacterBase.prototype.choiceNearbyFlagWeight = function(flag, maxDist){
    var weight = 1;
    var interval = 1/maxDist;
    $gameMap.events().forEach(function(event) {
      if (!event.isErased() && event !== this && event.aiFlag() === flag){
        weight += Math.max(1 + interval - interval * event.distTo(this.choiceX, this.choiceY), 0);
      }
    }, this);
    return weight;
  };

  Game_CharacterBase.prototype.choiceMostFlagDist = function(flag){
    var user = $gameSystem.EventToUnit(this.eventId())[1];
    var minDist = 100;
    var events = $gameMap.events().filter(function(event) {
      if (!event.isErased() && event !== this && event.aiFlag() === flag){
        return true;
      }
    }, this);
    if (events.length <= 0) return minDist;
    var maxClusters = $gameTemp.getMaxClusters(events, user.srpgMove());
    for (var i = 0; i < maxClusters.length; i++){
      var sumX = 0;
      var sumY = 0;
      for (var j = 0; j < maxClusters[i].length; j++){
        sumX += maxClusters[i][j].posX();
        sumY += maxClusters[i][j].posY();
      }
      var dist = $gameMap.distTo(this.choiceX, this.choiceY, Math.round(sumX / maxClusters[i].length), Math.round(sumY / maxClusters[i].length));
      if (dist < minDist) minDist = dist;
    }
    return minDist;
  };

  Game_CharacterBase.prototype.choiceIsFlag = function(flag){
    var result = $gameMap.events().some(function(event) {
      if (!event.isErased() && event !== this && event.aiFlag() === flag){
        return event.pos(this.choiceX, this.choiceY);
      }
    }, this);
    if (result) return 1;
    return 0;
  };

  Game_CharacterBase.prototype.getValidTargetEvents = function(action) {
    var user = $gameSystem.EventToUnit(this.eventId())[1];
    return $gameMap.events().filter(function(event) {
      return event.isValidTargetEvent(user, action);
    });
  };

  Game_CharacterBase.prototype.isValidTargetEvent = function(user, action){
    if (this.isErased()) return false;
    var targetAry = $gameSystem.EventToUnit(this.eventId());
    if (!targetAry) return false;
    var target = targetAry[1];
    if (target.isDead()) return false;
    if (target.priorityTag('aiIgnore') && target != user) return false;
    if (action.item().meta.anyTarget) return true;
    if (user.confusionLevel() != 2) {
      if ((target.isActor() == user.isActor()) == (user.confusionLevel() < 3)) {
        if (action.isForOpponent()) return false;
      } else {
        if (action.isForFriend()) return false;
      }
    }
    if (action.isForUser() && action.isForOne()) return target === user;
    return true;
  };
  
  Game_CharacterBase.prototype.inCounterRange = function(x, y) {
    var battler = $gameSystem.EventToUnit(this.eventId())[1]; //this is the target, which do counter attack
    var skill = $dataSkills[battler.attackSkillId()];
    return battler.inSkillRange(this.posX(), this.posY(), x, y, this, skill);
  };

  Game_Battler.prototype.targetScoreFormula = function(item){
    var aiTarget = _aiTarget;
    if (item.meta.aiTarget) {
      aiTarget = item.meta.aiTarget;
    } else if (this._aiTarget){
      aiTarget = this._aiTarget;
    } else if (this.isActor() && this.currentClass().meta.aiTarget) {
      aiTarget = this.currentClass().meta.aiTarget;
    } else if (this.isActor() && this.actor().meta.aiTarget) {
      aiTarget = this.actor().meta.aiTarget;
    } else if (this.isEnemy() && this.enemy().meta.aiTarget) {
      aiTarget = this.enemy().meta.aiTarget;
    }
    return aiTarget;
  };

  Game_Battler.prototype.counterScoreFormula = function(item){
    var aiCounter = _aiCounter;
    if (this._aiCounter){
      return this._aiCounter;
    } if (this.isActor() && this.currentClass().meta.aiCounter) {
      aiCounter = this.currentClass().meta.aiCounter;
    } else if (this.isActor() && this.actor().meta.aiCounter) {
      aiCounter = this.actor().meta.aiCounter;
    } else if (this.isEnemy() && this.enemy().meta.aiCounter) {
      aiCounter = this.enemy().meta.aiCounter;
    }
    return aiCounter;
  };

  Game_Battler.prototype.posModifierFormula = function(){
    var aiPos = _aiPos;
    if (this._aiPos){
      aiPos = this._aiPos;
    } else if (this.isActor() && this.currentClass().meta.aiPos) {
      aiPos = this.currentClass().meta.aiPos;
    } else if (this.isActor() && this.actor().meta.aiPos) {
      aiPos = this.actor().meta.aiPos;
    } else if (this.isEnemy() && this.enemy().meta.aiPos) {
      aiPos = this.enemy().meta.aiPos;
    }
    return aiPos;
  };

  Game_Battler.prototype.randomLevel = function(){
    var aiRandom = $gameSystem.randomLevel();
    if (this._aiRandom){
      aiRandom = this._aiRandom;
    } else if (this.isActor() && this.currentClass().meta.aiRandom) {
      aiRandom = this.currentClass().meta.aiRandom;
    } else if (this.isActor() && this.actor().meta.aiRandom) {
      aiRandom = this.actor().meta.aiRandom;
    } else if (this.isEnemy() && this.enemy().meta.aiRandom) {
      aiRandom = this.enemy().meta.aiRandom;
    }
    return Number(aiRandom);
  };

  Game_Battler.prototype.setTargetScoreFormula = function(formula){
    this._aiTarget = formula;
  };

  Game_Battler.prototype.setCounterScoreFormula = function(formula){
    this._aiCounter = formula;
  };

  Game_Battler.prototype.setPosModifierFormula = function(formula){
    this._aiPos = formula;
  };

  Game_Battler.prototype.setRandomLevel = function(formula){
    this._aiRandom = formula;
  };

  Game_Battler.prototype.initBestChoice = function() {
    this._bestChoice = {
      score: 0,
      priority: false,
      targetEvent: null,
      targetPos: null,
      pos: null,
      action : new Game_Action(this),
      moveOnly : false
    };
    return this._bestChoice;
  };

  Game_Battler.prototype.updateBestChoice = function(priority, score, pos, action, moveOnly, isAoE, targetEvent, tx, ty, d) {
    if ((priority && !this._bestChoice.priority) || (score > this._bestChoice.score && priority == this._bestChoice.priority)) {
      this._bestChoice.score = score;
      this._bestChoice.priority = priority;
      this._bestChoice.pos = pos;
      this._bestChoice.action = action;
      this._bestChoice.moveOnly = moveOnly;
      if (isAoE){
        this._bestChoice.targetEvent = undefined;
        this._bestChoice.targetPos = {x: tx, y: ty, dir: d};
      } else{
        this._bestChoice.targetEvent = targetEvent;
        this._bestChoice.targetPos = undefined;
      }
    }
  };

  Game_Battler.prototype.bestChoice = function() {
    return this._bestChoice;
  };

  Game_Battler.prototype.keepStanding = function(target) {
    if (target && target.isActor() !== this.isActor()){//target is opponent.
      return false;
    }
    return this.battleMode() === 'stand' && this.hpRate() >= 1.0 && !this.isConfused();
  };

  Game_Battler.prototype.inSkillRange = function(ux, uy, tx, ty, userEvent, skill) {
    var dist = $gameMap.distTo(ux, uy, tx, ty);
    var range = this.srpgSkillRange(skill);
    return (range >= dist && this.srpgSkillMinRange(skill) <= dist) ||
    (skill.meta.specialRange && userEvent.srpgRangeExtention(ux, uy, tx, ty, skill, range));
  };


  if (!_withAgiAttackPlus){
    Game_Battler.prototype.getAgiAttackTime = function(target){
       return 0;
    }
  };

  Game_Enemy.prototype.makeActionList = function() {
    var actionList = [];
    this.enemy().actions.forEach(function(action) {
        if (action.skillId == 1) {
            action.skillId = this.attackSkillId();
        }
      if (this.isActionValid(action)){
        var gameAction = new Game_Action(this);
        gameAction.setSkill(action.skillId);
        actionList.push(gameAction);
      };
    }, this);
    return actionList;
  };

  Game_Enemy.prototype.usableSkills = function() {
    var skillList = [];
    this.makeActionList().forEach(function(action) {
      skillList.push(action.item());
    }, this);
    return skillList;
  };

  Game_Action.prototype.srpgPredictionDamageWithAgi = function(target) {
    var user = this.subject();
    var score = (this.srpgPredictionDamage(target)) * (1 + user.getAgiAttackTime(target));
    score = this.isForFriend() ? - score : score
    if (this.isHpRecover()) {
        score = Math.min(score, target.mhp - target.hp);
    } else if (this.isHpEffect() && this.isDamage()){
      score = Math.min(score, target.hp);
    } else if (this.isMpRecover()) {
        score = Math.min(score, target.mmp - target.mp);
    } else if(this.isMpEffect() && this.isDamage()){
      score = Math.min(score, target.mp);
    }
    return score;
  };

  Game_Action.prototype.srpgPredictionItemEffect = function(target, effect) {
      switch (effect.code) {
      case Game_Action.EFFECT_RECOVER_HP:
          var max = target.mhp - target.hp;
          var value = (target.mhp * effect.value1 + effect.value2) * target.rec;
          if (this.isItem()) {
              value = Math.floor(value *this.subject().pha);
          }
          return Math.min(max, value);
      case Game_Action.EFFECT_RECOVER_MP:
          var max = target.mmp - target.mp;
          var value = (target.mmp * effect.value1 + effect.value2) * target.rec;
          if (this.isItem()) {
              value = Math.floor(value * this.subject().pha);
          }
          return Math.min(max, value);
      case Game_Action.EFFECT_GAIN_TP:
          var max = target.maxTp() - target.tp;
          var value = Math.floor(effect.value1);
          return Math.min(max, value);
      }
      return 0;
  };

  //The original hit formula looks so stupid! If you change the hit formula with other plugins please change this.
  Game_Action.prototype.srpgPredictionHitRate = function(target){
    var hit = this.itemHit(target);
    var eva = this.itemEva(target);
    return Math.max(0, Math.min(hit * ( 1 - eva), 1))
  }


  Game_Action.prototype.baseScore = function(user) {
    var item = this.item();
    var a = user || this.subject();
    if (!item || !item.meta.aiBase) return 0;
    return eval(item.meta.aiBase);
  };

  Game_Action.prototype.rating = function(user) {
    var user = user || this.subject();
    var skillId = this.item().id;
    var rating = 5;
    if (user.isEnemy()){
      var actions = user.enemy().actions;
      actions.some(function(action) {
        if (action.skillId == skillId){
          rating = action.rating;
          return true;
        } 
      });
    }
    return rating;
  };

  //the original set subject and subject makes no sense.
  var _Game_Action_setSubject = Game_Action.prototype.setSubject;
  Game_Action.prototype.setSubject = function(subject) {
      _Game_Action_setSubject.call(this, subject);
      this._subject = subject;
  };

  var _Game_Action_subject = Game_Action.prototype.subject;
  Game_Action.prototype.subject = function() {
    return this._subject;
  };

})();
// demo ai pos formulas...
// swo <aiPos:[(1/(0.75 + 0.25 * f.ntd('foe'))) * (f.ntd('foe') < 6 ? (1 + 0.05 * ([2,3].contains(tr) ? tr*tr : 0)) * Math.min((f.ntw('friend',5)+3)/(f.ntw('foe',5)+2), 1.5): 1),
// (a.mhp/(a.hp + 1)) * Math.max(Math.min(0.75*a.mhp - a.hp, a.hp,0.2*a.mhp),0) * (f.isf('enemyFort') + f.isf('actorFort') + (f.ntd('foe') < 6 ? (f.ntd('foe')-1)/10:0)) + (f.isf('actorFort') + f.isf('enemyFort') * 0.25 * Math.max(5 - f.ntd('foe'), 0))*0.18*a.mhp]>

// gen <aiPos:[(1/(0.7 + 0.3 * f.ntd('foe'))) * (f.ntd('foe') < 6 ? (1 + 0.06 * ([2,3].contains(tr) ? tr*tr : 0)) * Math.min((f.ntw('friend',5)+3)/(f.ntw('foe',5)+2), 1.3) : 1),
// (a.mhp/(a.hp + 1)) *Math.max(Math.min(0.7*a.mhp - a.hp, a.hp,0.2*a.mhp),0)  * (f.isf('enemyFort') + f.isf('actorFort') + (f.ntd('foe') < 6 ? (f.ntd('foe')-1)/10:0)) + (f.isf('actorFort') + f.isf('enemyFort') * 0.3 * Math.max(5 - f.ntd('foe'), 0))*0.2*a.mhp]>

// arc <aiPos:[(f.ntd('foe') < 6 ? (1 + 0.05 * ([2,3].contains(tr) ? tr*tr : 0))*Math.min((f.ntw('friend',5)+2)/(f.ntw('foe',5)+1), 1.7):1)/(0.15 + 0.05 * f.ntd('foe') + 1/(f.ntd('foe') + 0.5)),
// (a.mhp/(a.hp + 1)) * Math.max(Math.min(0.8*a.mhp - a.hp, a.hp,0.2*a.mhp),0) * (f.isf('enemyFort') + f.isf('actorFort') + (f.ntd('foe') < 6 ? (f.ntd('foe')-1)/10:0)) + (f.isf('actorFort') + f.isf('enemyFort') * 0.25 * Math.max(5 - f.ntd('foe'), 0))*0.16*a.mhp]>

// mag <aiPos:[(f.ntd('foe') < 6 ? (1 + 0.05 * ([2,3].contains(tr) ? tr*tr : 0))*Math.min((f.ntw('friend',5)+2)/(f.ntw('foe',5)+1), 2):1)/(0.05 + 0.05 * f.ntd('foe') + 1/(f.ntd('foe') + 0.5)),
// (a.mhp/(a.hp + 1)) * Math.max(Math.min(0.9*a.mhp - a.hp, a.hp,0.2*a.mhp),0) * (f.isf('enemyFort') + f.isf('actorFort') + (f.ntd('foe') < 6 ? (f.ntd('foe')-1)/10:0)) + (f.isf('actorFort') + f.isf('enemyFort') * 0.2 * Math.max(5 - f.ntd('foe'), 0))*0.16*a.mhp]>

// pre <aiPos:[(f.ntd('foe') < 6 ? (1 + 0.05 * ([2,3].contains(tr) ? tr*tr : 0))* Math.min((f.ntw('friend',5)+2)/(f.ntw('foe',5)+1), 3) : 1)/(0.05 * f.ntd('foe') + 1/(f.ntd('foe') + 0.5)),
// (a.mhp/(a.hp + 1)) * Math.max(Math.min(0.9*a.mhp - a.hp, a.hp,0.2*a.mhp),0) * (f.isf('enemyFort') + f.isf('actorFort') + (f.ntd('foe') < 6 ? (f.ntd('foe')-1)/10:0)) + (f.isf('actorFort') + f.isf('enemyFort') * 0.2 * Math.max(5 - f.ntd('foe'), 0))*0.16*a.mhp]>

// demo actor ai pos formulas that you can try
// swo <aiPos:[(1/(0.75 + 0.25 * f.ntd('foe'))) * (f.ntd('foe') < 6 ? (1 + 0.05 * ([2,3].contains(tr) ? tr*tr : 0)) * Math.min((f.ntw('friend',5)+3)/(f.ntw('foe',5)+2), 1.5): 1),
// (a.mhp/(a.hp + 1)) * Math.max(Math.min(0.75*a.mhp - a.hp, a.hp,0.2*a.mhp),0) * (f.isf('enemyFort') + f.isf('actorFort') + (f.ntd('foe') < 6 ? (f.ntd('foe')-1)/10:0)) + (f.isf('enemyFort') + f.isf('actorFort') * 0.25 * Math.max(5 - f.ntd('foe'), 0))*0.18*a.mhp]>

// gen <aiPos:[(1/(0.7 + 0.3 * f.ntd('foe'))) * (f.ntd('foe') < 6 ? (1 + 0.06 * ([2,3].contains(tr) ? tr*tr : 0)) * Math.min((f.ntw('friend',5)+3)/(f.ntw('foe',5)+2), 1.3) : 1),
// (a.mhp/(a.hp + 1)) *Math.max(Math.min(0.7*a.mhp - a.hp, a.hp,0.2*a.mhp),0)  * (f.isf('enemyFort') + f.isf('actorFort') + (f.ntd('foe') < 6 ? (f.ntd('foe')-1)/10:0)) + (f.isf('enemyFort') + f.isf('actorFort') * 0.3 * Math.max(5 - f.ntd('foe'), 0))*0.2*a.mhp]>

// arc <aiPos:[(f.ntd('foe') < 6 ? (1 + 0.05 * ([2,3].contains(tr) ? tr*tr : 0))*Math.min((f.ntw('friend',5)+2)/(f.ntw('foe',5)+1), 1.7):1)/(0.15 + 0.05 * f.ntd('foe') + 1/(f.ntd('foe') + 0.5)),
// (a.mhp/(a.hp + 1)) * Math.max(Math.min(0.8*a.mhp - a.hp, a.hp,0.2*a.mhp),0) * (f.isf('enemyFort') + f.isf('actorFort') + (f.ntd('foe') < 6 ? (f.ntd('foe')-1)/10:0)) + (f.isf('enemyFort') + f.isf('actorFort') * 0.25 * Math.max(5 - f.ntd('foe'), 0))*0.16*a.mhp]>

// mag <aiPos:[(f.ntd('foe') < 6 ? (1 + 0.05 * ([2,3].contains(tr) ? tr*tr : 0))*Math.min((f.ntw('friend',5)+2)/(f.ntw('foe',5)+1), 2):1)/(0.05 + 0.05 * f.ntd('foe') + 1/(f.ntd('foe') + 0.5)),
// (a.mhp/(a.hp + 1)) * Math.max(Math.min(0.9*a.mhp - a.hp, a.hp,0.2*a.mhp),0) * (f.isf('enemyFort') + f.isf('actorFort') + (f.ntd('foe') < 6 ? (f.ntd('foe')-1)/10:0)) + (f.isf('enemyFort') + f.isf('actorFort') * 0.2 * Math.max(5 - f.ntd('foe'), 0))*0.16*a.mhp]>

// pre <aiPos:[(f.ntd('foe') < 6 ? (1 + 0.05 * ([2,3].contains(tr) ? tr*tr : 0))* Math.min((f.ntw('friend',5)+2)/(f.ntw('foe',5)+1), 3) : 1)/(0.05 * f.ntd('foe') + 1/(f.ntd('foe') + 0.5)),
// (a.mhp/(a.hp + 1)) * Math.max(Math.min(0.9*a.mhp - a.hp, a.hp,0.2*a.mhp),0) * (f.isf('enemyFort') + f.isf('actorFort') + (f.ntd('foe') < 6 ? (f.ntd('foe')-1)/10:0)) + (f.isf('enemyFort') + f.isf('actorFort') * 0.2 * Math.max(5 - f.ntd('foe'), 0))*0.16*a.mhp]>
