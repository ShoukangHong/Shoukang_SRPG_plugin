//=============================================================================
//SRPG_AoEAnimation.js
// recent updates: fix a bug caused by max party member, fix the bug of sprite priority in battle.
// v 1.01 add 4 counter attack modes!
//=============================================================================
/*:
 * @plugindesc Allows AoE skills to show once when targetting multiple targets. Requires SRPG_AoE. This is a modified version by Shoukang
 * @author Boomy, Shoukang
 * 
 * @param standard X
 * @desc The center X position in battle scene, default Graphics.width / 2
 * @default Graphics.width / 2
 * 
 * @param standard Y
 * @desc The center Y position in battle scene, default Graphics.height / 2 + 48
 * @default Graphics.height / 2 + 48
 * 
 * @param x range
 * @desc x direction battler placement range in battle scene, default Graphics.width - 360
 * @default Graphics.width - 360
 *
 * @param y range
 * @desc y direction battler placement range in battle scene, default Graphics.height / 3.5
 * @default Graphics.height / 3.5
 * 
 * @param tilt
 * @desc parameter that tilt x direction placement to simulate a 3D view, default 0.2
 * @default 0.2
 *
 * @param allow surrounding
 * @desc if disabled skill user will never be surrounded by targets. See help for detail
 * @type boolean
 * @default true
 *
 * @param counterattack Mode
 * @desc what targets in the AoE can do counterattack
 * @type select
 * @option All targets
 * @value all
 * @option target in AoE center
 * @value center
 * @option first viable target
 * @value first
 * @option No AoE counter
 * @value false
 * @default all

 * @help
 * Credits to: Dopan, Dr. Q, Traverse, SoulPour777
 *
 * When an AoE spell is cast and more than 1 target is selected ($gameTemp.areaTargets), each target is added to a queue and then the game will execute each battle individually 1 on 1
 * This script will collect all targets and add them into one battle for a 1 vs many scenario
 * Works best with animations set to SCREEN though animations that target individuals still work (they just happened sequentially on the same battle field)
 *
 * Important Tips:
 * With this plugin, it's necessary to set skill target to all enemies/friends (or random 2, 3 ,4 ... enemies/friends) to make AoEs work properly.
 * If you allow surrounding and you use dynamic motion, actor sprite priority may become weird while casting skills, to avoid this, set the plugin parameter
 * 'usePriority' in dynamic motion to false.
 * Once you find anything weird, try to turn of this plugin and see if it happens again. This will help us identify which plugin causes the error.
 * ==================================================================================================
 * Positions battlers in Battle scene:
 * All battlers will be placed based on their relative positions. For example in this map position:
 * [ . T .]    Battle scene will look like: [ . T .]                     [ . T .]
 * [ T C T]    ========================>    [ T . U] when user is actor, [ U . T] when user is enemy.
 * [ . U .]                                 [ . T .]                     [ . T .]
 *
 * U: skill user, T: target, C; AoE center
 *
 * The battle scene will look like:
 * [ C T .]    Battle scene will look like: [ T . .]                     [ . . T]
 * [ T U .]    ========================>    [ . . U] when user is actor, [ U . .] when user is enemy.
 * [ . . .]                                 [ T . .]                     [ . . T]
 *
 * The placement will automatically adjust battlers' distance to make them reasonable.(within the defined x and y range)
 * ===================================================================================================
 * v 1.01 add counter attack mode!
 * ===================================================================================================
 * Compatibility:
 * Need SRPG_AoE, and place this plugin below it.
 */
(function () {
    //=================================================================================================
    //Plugin Parameters
    //=================================================================================================
    var parameters = PluginManager.parameters('SRPG_AoEAnimation');
    var _standardY = parameters['standard Y'] || 'Graphics.height / 2 + 48';
    var _standardX = parameters['standard X'] || 'Graphics.width / 2';
    var _xRange = parameters['x range'] || 'Graphics.width - 360';
    var _yRange = parameters['y range'] || 'Graphics.height / 3.5';
    var _tilt = Number(parameters['tilt']);
    var _surround = !!eval(parameters['allow surrounding']);
    var _counterMode = parameters['counterattack Mode'];

    var coreParameters = PluginManager.parameters('SRPG_core');
    var _srpgTroopID = Number(coreParameters['srpgTroopID'] || 1);
    var _srpgUseAgiAttackPlus = coreParameters['useAgiAttackPlus'] || 'true';
    var _srpgAgilityAffectsRatio = Number(coreParameters['srpgAgilityAffectsRatio'] || 2);
    var _existActorVarID = Number(coreParameters['existActorVarID'] || 1);
    var _existEnemyVarID = Number(coreParameters['existEnemyVarID'] || 2);

//============================================================================================
//Battler position in AoE(when there are areaTargets) scene battle 
//============================================================================================

    var _SRPG_Sprite_Actor_setActorHome = Sprite_Actor.prototype.setActorHome;
    Sprite_Actor.prototype.setActorHome = function (index) {
        if ($gameSystem.isSRPGMode() == true && !$gameSystem.useMapBattle() && $gameTemp.areaTargets().length > 0) {
            var param = $gameTemp._aoePositionParameters;
            var battler = this._battler;
            this.setHome(eval(_standardX) + (battler.aoeX - param.midX) * param.amplifyX,
                         eval(_standardY) + (battler.aoeY - param.midY) * param.amplifyY);
            this.moveToStartPosition();
        } else {
            _SRPG_Sprite_Actor_setActorHome.call(this, index);
        }
    };

    //Set enemy positions
    var _SRPG_Game_Troop_setup = Game_Troop.prototype.setup;
    Game_Troop.prototype.setup = function(troopId) {
        if ($gameSystem.isSRPGMode() == true && !$gameSystem.useMapBattle() && $gameTemp.areaTargets().length > 0) {
            this.clear();
            this._troopId = troopId;
            this._enemies = [];
            var param = $gameTemp._aoePositionParameters;
            for (var i = 0; i < this.SrpgBattleEnemys().length; i++) {
                var battler = this.SrpgBattleEnemys()[i];
                battler.setScreenXy(eval(_standardX) + (battler.aoeX - param.midX) * param.amplifyX,
                                    eval(_standardY) + (battler.aoeY - param.midY) * param.amplifyY);
                this._enemies.push(battler);
            }
            this.makeUniqueNames();
        } else {
            _SRPG_Game_Troop_setup.call(this, troopId);
        }
    };

// shoukang: complicated vector calculation to determine the battler placement parameters and relative position.
    Scene_Map.prototype.setBattlerPosition = function(){
        var activeEvent = $gameTemp.activeEvent();
        var allEvents = [activeEvent, $gameTemp.targetEvent()].concat($gameTemp.getAreaEvents());
        var vector =  this.createSrpgAoEVector();
        var vectorX = vector[0];
        var vectorY = vector[1];
        var vectorLen = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
        var minX = 0;
        var maxX = 0.5;
        var minY = -1.25;
        var maxY = 1.25;
        var targetMinX = 0.5;

        for (var i = 0; i < allEvents.length; i++){
            var battler = $gameSystem.EventToUnit(allEvents[i].eventId())[1];
            var posX = allEvents[i].posX() - activeEvent.posX();
            var posY = allEvents[i].posY() - activeEvent.posY();
            var projectionY = (vectorY * posX - vectorX * posY) / vectorLen;
            var projectionX = _tilt * projectionY + (vectorX * posX + vectorY * posY) / vectorLen; //0.2 * sin helps to make a better veiw.
            battler.setAoEScenePosition(projectionX, projectionY);
            if (i > 0) targetMinX = Math.min(projectionX, targetMinX);
            minX = Math.min(projectionX, minX);
            minY = Math.min(projectionY, minY);
            maxX = Math.max(projectionX, maxX);
            maxY = Math.max(projectionY, maxY);
        }

        if (!_surround && targetMinX < 0.5){
            minX -= Math.max((maxX - targetMinX) / 2, 0.5);
            $gameSystem.EventToUnit(activeEvent.eventId())[1].setAoEScenePosition(minX, 0);
        }
        var direction = $gameSystem.EventToUnit(activeEvent.eventId())[0] === 'actor' ? -1 : 1;
        var amplifyX = direction * eval(_xRange) / Math.max((maxX - minX), 2);
        var amplifyY = eval(_yRange) / (maxY - minY);
        $gameTemp.setAoEPositionParameters((minX + maxX) / 2, (minY + maxY) / 2, amplifyX, amplifyY);
    }

    Game_Battler.prototype.setAoEScenePosition = function(x, y){
        this.aoeX = x;
        this.aoeY = y;
    }

    Game_Temp.prototype.setAoEPositionParameters = function(midX, midY, amplifyX, amplifyY){
        this._aoePositionParameters = {
            midX : midX,
            midY : midY,
            amplifyX : amplifyX,
            amplifyY : amplifyY,
        }
    }

    Scene_Map.prototype.createSrpgAoEVector = function(){
        var activeEvent = $gameTemp.activeEvent();
        var vectorX = $gameTemp.areaX() - activeEvent.posX();
        var vectorY = $gameTemp.areaY() - activeEvent.posY();

        // if aoe center overlap with active event, use active event direction as vector.
        if (Math.abs(vectorX) + Math.abs(vectorY) === 0){
            var dir = activeEvent.direction();
            vectorX = $gameMap.roundXWithDirection(0, dir);
            vectorY = $gameMap.roundYWithDirection(0, dir);
        }
        return [vectorX, vectorY]
    }

//============================================================================================
//AoE animation Main logic
//============================================================================================

// shoukang rewrite to give a clearer logic
    Scene_Map.prototype.srpgBattleStart = function(userArray, targetArray){
        var action = userArray[1].action(0);
        if (action && action.item()) {
            var mapBattleTag = action.item().meta.mapBattle;
            if (mapBattleTag == 'true') $gameSystem.forceSRPGBattleMode('map');
            else if (mapBattleTag == 'false') $gameSystem.forceSRPGBattleMode('normal');
        }
        if (!$gameSystem.useMapBattle()) {
            this.processSceneBattle(userArray, targetArray);
        } else {
            this.processMapBattle(userArray, targetArray)
        }
    };

//helper function
    Scene_Map.prototype.pushSrpgBattler = function(type, battler){
        if (type === 'actor') $gameParty.pushSrpgBattleActors(battler);
        else if (type === 'enemy') {
            $gameTroop.pushSrpgBattleEnemys(battler);
            $gameTroop.pushMembers(battler);
        }
    }

//helper function
    Game_Temp.prototype.getAreaEvents = function() {
        events = []
        for (var i = 0; i < this._areaTargets.length; i ++ ) {
            if (this._areaTargets[i].event) events.push(this._areaTargets[i].event);
        }
        return events;
    };

//Scene Battle that take area targets into consideration
    Scene_Map.prototype.processSceneBattle = function(userArray, targetArray){  
        var userType = userArray[0];
        var user = userArray[1];
        var targetType = targetArray[0]
        var targetEvents = [$gameTemp.targetEvent()].concat($gameTemp.getAreaEvents());
        $gameParty.clearSrpgBattleActors();
        $gameTroop.clearSrpgBattleEnemys();
        $gameTroop._enemies = [];
        this.pushSrpgBattler(userType, user);
        if (userType === 'enemy') {
            user.action(0).setSrpgEnemySubject($gameTroop.members().length - 1);
        }

        if($gameTemp.areaTargets().length > 0) {
            this.setBattlerPosition();
        }

        for (var i = 0; i < targetEvents.length; i++) {
            var target = $gameSystem.EventToUnit(targetEvents[i].eventId())[1]
            if (user === target){
                user.action(0).setTarget(0);
            } else if (userType === targetType) {
                this.pushSrpgBattler(targetType, target);
                user.action(0).setTarget(1);
            } else {
                this.pushSrpgBattler(targetType, target);
                if (i === 0) user.action(0).setTarget(0);
            }
            if (!this.counterModeValid(targetEvents[i])) continue;
            if (userType !== targetType && target.canMove() && !user.currentAction().item().meta.srpgUncounterable) {
                target.srpgMakeNewActions();
                if (targetType === 'enemy') {
                    target.action(0).setSrpgEnemySubject($gameTroop.members().length - 1);
                }
                target.action(0).setAttack();
                var item = target.action(0).item();
                var distance = $gameSystem.unitDistance($gameTemp.activeEvent(), targetEvents[i]);
                //console.log(distance, target)
                target.setAoEDistance(distance);
                target.action(0).setTarget(0);
                target.setActionTiming(1);
                if (_counterMode === 'first' && target.canUse(item)) this._counterCount -= 1;
            }
        }

        user.setActionTiming(0);
        BattleManager.setup($dataTroops[_srpgTroopID] ? _srpgTroopID : 1, false, true);

        this.preBattleSetDirection();
        //行動回数追加スキルなら行動回数を追加する
        var addActionNum = Number(user.action(0).item().meta.addActionTimes);
        if (addActionNum && addActionNum > 0) {
            user.SRPGActionTimesAdd(addActionNum);
        }
        this._callSrpgBattle = true;
        this.eventBeforeBattle();
    }


//shoukang: slightly edited from _srpgBattleStart_MB for agi attack plus future improvement.
    Scene_Map.prototype.processMapBattle = function(userArray, targetArray){
        var user = userArray[1];
        var target = targetArray[1];
        var action = user.action(0);
        var reaction = null;
        // prepare action timing
        user.setActionTiming(0);
        if (user != target) target.setActionTiming(1);

        // pre-skill setup
        $gameSystem.clearSrpgStatusWindowNeedRefresh();
        $gameSystem.clearSrpgBattleWindowNeedRefresh();

        // make free actions work
        var addActionTimes = Number(action.item().meta.addActionTimes || 0);
        if (addActionTimes > 0) {
            user.SRPGActionTimesAdd(addActionTimes);
        }

        this.preBattleSetDirection();
        this.eventBeforeBattle();

        // set up the troop and the battle party
        $gameTroop.clearSrpgBattleEnemys();
        $gameTroop.clear();
        $gameParty.clearSrpgBattleActors();
        if (userArray[0] === 'enemy') $gameTroop.pushSrpgBattleEnemys(user);
        else $gameParty.pushSrpgBattleActors(user);
        if (targetArray[0] === 'enemy') $gameTroop.pushSrpgBattleEnemys(target);
        else $gameParty.pushSrpgBattleActors(target);
        BattleManager.setup(_srpgTroopID, false, true);
        action.setSubject(user);

        // queue the action
        this.srpgAddMapSkill(action, user, target);
        // queue up counterattack
        if (!this.counterModeValid($gameTemp.targetEvent())) return;
        if (userArray[0] !== targetArray[0] && target.canMove() && !action.item().meta.srpgUncounterable) {
            target.srpgMakeNewActions();
            reaction = target.action(0);
            reaction.setSubject(target);
            reaction.setAttack();
            //console.log(target.canUse(reaction.item()));
            if (_counterMode === 'first' && target.canUse(reaction.item())) this._counterCount -= 1;
            var actFirst = (reaction.speed() > action.speed());
            // move the agi attack plus here as it also need to check: userArray[0] !== targetArray[0] && target.canMove() && !action.item().meta.srpgUncounterable
            this.srpgAgiAttackPlus(user, target, reaction, actFirst);
        }
    }


// edit this function for Agiattack plus plugin
    Scene_Map.prototype.srpgAgiAttackPlus = function(user, target, reaction, actFirst){
        if (_srpgUseAgiAttackPlus == 'true') actFirst = false;
        this.srpgAddMapSkill(reaction, target, user, actFirst);
        if (_srpgUseAgiAttackPlus != 'true') return;

        if (user.agi >= target.agi) {
            var firstBattler = user;
            var secondBattler = target;
        } else {
            var firstBattler = target;
            var secondBattler = user;
        }
        if (!firstBattler.currentAction() || !firstBattler.currentAction().item()) {
            return;
        }
        if (firstBattler.currentAction().isForOpponent() &&
            !firstBattler.currentAction().item().meta.doubleAction) {
            var dif = firstBattler.agi - secondBattler.agi;
            var difMax = secondBattler.agi * _srpgAgilityAffectsRatio - secondBattler.agi;
            if (difMax == 0) {
                agilityRate = 100;
            } else {
                agilityRate = dif / difMax * 100;
            }
            if (agilityRate > Math.randomInt(100)) {
                var agiAction = firstBattler.action(0);
                this.srpgAddMapSkill(agiAction, firstBattler, secondBattler)
            }
        }
    }

    Scene_Map.prototype.counterModeValid = function(target){
        if (!$gameTemp._activeAoE) return true;
        if (_counterMode === 'center' && target.distTo($gameTemp.areaX(), $gameTemp.areaY()) !== 0) return false;
        if (_counterMode === 'false') return false;
        if (_counterMode === 'first' && this._counterCount <= 0) return false;
        return true;
    }

    var _Scene_Map_srpgInvokeAutoUnitAction = Scene_Map.prototype.srpgInvokeAutoUnitAction;
    Scene_Map.prototype.srpgInvokeAutoUnitAction = function() {
        this._counterCount = 1;
        _Scene_Map_srpgInvokeAutoUnitAction.call(this);
    }

    var _Scene_Map_commandBattleStart = Scene_Map.prototype.commandBattleStart
    Scene_Map.prototype.commandBattleStart = function() {
        this._counterCount = 1;
        _Scene_Map_commandBattleStart.call(this);
    }
//============================================================================================
//Override these functions to support AoEAnimation
//============================================================================================
    var _Spriteset_Battle_createActors = Spriteset_Battle.prototype.createActors
    Spriteset_Battle.prototype.createActors = function() {
        if ($gameSystem.isSRPGMode() && $gameTemp.areaTargets().length > 0){
            this._actorSprites = [];
            for (var i = 0; i < $gameParty.SrpgBattleActors().length; i++) {
                this._actorSprites[i] = new Sprite_Actor();
                this._battleField.addChild(this._actorSprites[i]);
            }          
        } else{
            _Spriteset_Battle_createActors.call(this);
        }
    };

    Game_Battler.prototype.setAoEDistance = function(val){
        this._AoEDistance = val;
    }

    Game_Battler.prototype.AoEDistance = function(){
        return this._AoEDistance;
    }

    Game_Battler.prototype.clearAoEDistance = function(){
        this._AoEDistance = undefined;
    }

    var _Game_Actor_srpgSkillMinRange = Game_Actor.prototype.srpgSkillMinRange
    Game_Actor.prototype.srpgSkillMinRange = function(skill) {
        var range = _Game_Actor_srpgSkillMinRange.call(this, skill);
        if (this.AoEDistance() !== undefined) return this.AoEDistance() >= range ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
        else return range;
    };

    var _Game_Enemy_srpgSkillMinRange = Game_Enemy.prototype.srpgSkillMinRange
    Game_Enemy.prototype.srpgSkillMinRange = function(skill) {
        var range = _Game_Enemy_srpgSkillMinRange.call(this, skill);
        if (this.AoEDistance() !== undefined) return this.AoEDistance() >= range ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
        else return range;
    };

    var _Game_Actor_srpgSkillRange = Game_Actor.prototype.srpgSkillRange
    Game_Actor.prototype.srpgSkillRange = function(skill) {
        var range = _Game_Actor_srpgSkillRange.call(this, skill);
        if (this.AoEDistance() !== undefined) return this.AoEDistance() > range ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
        else return range;
    };

    var _Game_Enemy_srpgSkillRange = Game_Enemy.prototype.srpgSkillRange
    Game_Enemy.prototype.srpgSkillRange = function(skill) {
        var range = _Game_Enemy_srpgSkillRange.call(this, skill);
        //console.log(this, range)
        if (this.AoEDistance() !== undefined) return this.AoEDistance() > range ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
        else return range;
    };

    var _Spriteset_Battle_createLowerLayer = Spriteset_Battle.prototype.createLowerLayer;
    Spriteset_Battle.prototype.createLowerLayer = function() {
        _Spriteset_Battle_createLowerLayer.call(this);
        this._battleField.removeChild(this._back1Sprite);
        this._battleField.removeChild(this._back2Sprite);
        this._battleField.children.sort(this.compareEnemySprite.bind(this));
        this._battleField.addChildAt(this._back2Sprite, 0);
        this._battleField.addChildAt(this._back1Sprite, 0);
    };
// shoukang rewrite to give a clearer logic
    Scene_Battle.prototype.createSprgBattleStatusWindow = function() {
        this._srpgBattleStatusWindowLeft = new Window_SrpgBattleStatus(0);
        this._srpgBattleStatusWindowRight = new Window_SrpgBattleStatus(1);
        this._srpgBattleStatusWindowLeft.openness = 0;
        this._srpgBattleStatusWindowRight.openness = 0;
        userArray = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId());
        targetArray = $gameSystem.EventToUnit($gameTemp.targetEvent().eventId());

        if (userArray[0] === 'actor') {
            this._srpgBattleStatusWindowRight.setBattler(userArray[1]);
            var targetWindow = this._srpgBattleStatusWindowLeft
        } else {
            this._srpgBattleStatusWindowLeft.setBattler(userArray[1]);
            var targetWindow = this._srpgBattleStatusWindowRight
        }
        if (userArray[1] !== targetArray[1]){
            targetWindow.setBattler(targetArray[1])
        }
        this.addWindow(this._srpgBattleStatusWindowLeft);
        this.addWindow(this._srpgBattleStatusWindowRight);
        BattleManager.setSrpgBattleStatusWindow(this._srpgBattleStatusWindowLeft, this._srpgBattleStatusWindowRight);
    };

    var _Scene_Map_srpgBattlerDeadAfterBattle = Scene_Map.prototype.srpgBattlerDeadAfterBattle;
    Scene_Map.prototype.srpgBattlerDeadAfterBattle = function() {
        if (!$gameSystem.useMapBattle()){
            var activeEvent = $gameTemp.activeEvent();
            var targetEvent = $gameTemp.targetEvent();
            var allEvents = [activeEvent, targetEvent].concat($gameTemp.getAreaEvents());
            $gameTemp.clearAreaTargets();

            for (var i in allEvents){
                var event = allEvents[i];
                var battler = $gameSystem.EventToUnit(event.eventId())[1];
                battler.clearAoEDistance();
                if ( i > 0 && event === activeEvent) continue; //active event occurs again, ignore
                battler.setActionTiming(-1);
                if (battler && battler.isDead() && !event.isErased()) {
                    event.erase();
                    var valueId = battler.isActor() ? _existActorVarID : _existEnemyVarID;
                    var oldValue = $gameVariables.value(valueId);
                    $gameVariables.setValue(valueId, oldValue - 1);
                }
            }
        } else _Scene_Map_srpgBattlerDeadAfterBattle.call(this);
    };

    // this is a single target version, it can be generalized to AoE targets so this is just for backup.
    // Scene_Map.prototype.processSceneBattle = function(userArray, targetArray){
    //     var userType = userArray[0];
    //     var user = userArray[1];
    //     var targetType = targetArray[0];
    //     var target = targetArray[1];
    //     $gameParty.clearSrpgBattleActors();
    //     $gameTroop.clearSrpgBattleEnemys();

    //     this.pushSrpgBattler(userType, user);
    //     if (userType === 'enemy') user.action(0).setSrpgEnemySubject(0);
    //     //console.log(user === target);
    //     if (user === target){
    //         user.action(0).setTarget(0);
    //     } else if (userType === targetType) {
    //         this.pushSrpgBattler(targetType, target);
    //         user.action(0).setTarget(1);
    //     } else {
    //         this.pushSrpgBattler(targetType, target);
    //         user.action(0).setTarget(0);            
    //     }

    //     user.setActionTiming(0);
    //     BattleManager.setup($dataTroops[_srpgTroopID] ? _srpgTroopID : 1, false, true);

    //     //対象の行動を設定
    //     if (userType !== targetType && target.canMove() && !user.currentAction().item().meta.srpgUncounterable) {
    //         target.srpgMakeNewActions();
    //         if (targetType === 'enemy') target.action(0).setSrpgEnemySubject(0);
    //         target.action(0).setAttack();
    //         target.action(0).setTarget(0);
    //         target.setActionTiming(1);
    //     }

    //     this.preBattleSetDirection();
    //     //行動回数追加スキルなら行動回数を追加する
    //     var addActionNum = Number(user.action(0).item().meta.addActionTimes);
    //     if (addActionNum && addActionNum > 0) {
    //         user.SRPGActionTimesAdd(addActionNum);
    //     }
    //     this._callSrpgBattle = true;
    //     this.eventBeforeBattle();
    // }

})();
