//=============================================================================
//SRPG_Summon.js
//=============================================================================
/*:
 * @plugindesc Allow you to summon/enemy/objects during SRPG battle. v 1.00
 * @author Shoukang
 *
 * @param Summon Map Id
 * @desc the map Id for summon events
 * @type number
 * @default 1
 *
 * @param summon appear Animation Id
 * @desc appear animation for wrap skill
 * @default 52
 *
 * @param summon disappear Animation Id
 * @desc disappear animation for wrap skill
 * @default 52
 *
 * @help
 *
 * This plugin allow you to summon events which are a copy of event from the summon map (the map with Summon Map Id).
 * You need to place all the type of events you want to summon in the summon map.
 *
 * Although summoning battlers just need an empty event to refer to, this mechanism could be very helpful for summoning
 * objects. You can even use this plugin to summon objects out of an SRPG battle!(summoned events will not be memorized)
 * 
 * You don't need any place holder event to summon. A new event will be created, which have the event id =
 * $gameMap.events().length (this is before the summon, after summon the length will of course increase by 1).
 *
 * By calling an common event in your skill effect, you can summon multiple same actors/enemies/objects, set their level,
 * their life span, etc. Please read the script calls for more information.
 *
 * ===================================================================================================
 * Compatibility:
 * Need Dr.Q's SRPG_PositionEffect plugin to use the <cellTarget> note tag so that you can target an empty cell.
 * However the enemy still won't know how to cast skill without a target.
 * ===================================================================================================
 * script calls:
 *
 * this.summon(type, summonId, battlerId, level, turn, x, y);
 *     type: can be 'actor', 'enemy', or 'object'.
 *     summonId: the id of the event that you are going to copy from the Summon Map.
 *     battlerId: the id of actor/enemy.
 *     level: the level of summoned actor, default is initial level of actor.
 *     turn: the life span of this event. After this number of turns the event will disappear. default is infinite.
 *     x: x position, default is $gamePlayer.posX();
 *     y: y position, default is $gamePlayer.posY();
 *
 *     If you want to use the default vaule of a parameter, or a parameter is not needed for your summon and
 *     you are not sure what to put, simply use undefined (do not add '') as a place holder.
 *
 *     For example, this.summon('actor', 1, 2, undefined, undefined, 5, 6); will summon actor 2 at postion (5, 6), 
 *     the event is a copy of event id 1 in the summon map.
 *     You can use var a = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1] to store the active battler as a
 *     variable a. Then you can use a.mat, a.level and other formulars to determine summoned batter level and summon turns.
 *     For example this.summon('actor', 1, 2, a.level, a.mat/10)
 *
 * $gameParty.existingMemberNumber();
 *     gives the number of alive party members, which doesn't take summoned actors into consideration.
 *     Can be used to check game end condition.
 * ===================================================================================================
 * v 1.00 First Release
 */

(function () {
    //=================================================================================================
    //Plugin Parameters
    //=================================================================================================
    var parameters = PluginManager.parameters('SRPG_Summon');
    var _SummonMapId = Number(parameters['Summon Map Id']) || 1;
    var _appearAnimation = Number(parameters['summon appear Animation Id']) || 52;
    var _disappearAnimation = Number(parameters['summon disappear Animation Id']) || 52;

    var coreParameters = PluginManager.parameters('SRPG_core');
    var _existActorVarID = Number(coreParameters['existActorVarID'] || 1);
    var _existEnemyVarID = Number(coreParameters['existEnemyVarID'] || 2);

    //$dataSummon is the global variable that stores the summon Map data.
    DataManager.loadSummonData = function(mapId) {
        if (mapId > 0) {
            var filename = 'Map%1.json'.format(mapId.padZero(3));
            this._mapLoader = ResourceHandler.createLoader('data/' + filename, this.loadDataFile.bind(this, '$dataSummon', filename));
            this.loadDataFile('$dataSummon', filename);
        } else {
            this.makeEmptyMap();
        }
    };

    var _DataManager_onLoad = DataManager.onLoad
    DataManager.onLoad = function(object) {
        _DataManager_onLoad.call(this, object);
        if (object === $dataSummon) {
            this.extractMetadata(object);
            for (var i = 0; i < object.events.length; i++) {
                var data = object.events[i];
                if (data && data.note !== undefined) {
                    this.extractMetadata(data);
                }
            }
        }
    };

    //load the summon data while loading this plugin.
    DataManager.loadSummonData(_SummonMapId);

    //script call
    Game_Interpreter.prototype.summon = function(type, summonId, battlerId, level, turn, x, y){
        if (x === undefined) x = $gamePlayer.posX();
        if (y === undefined) y = $gamePlayer.posY();
        if (!$gameMap.isValid(x,y) || !$gameMap.positionIsOpen(x,y)) return;

        if (!turn) turn = Number.POSITIVE_INFINITY;
        if ($gameTemp.activeEvent() && $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())){
            var summoner = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1];
        } else {
            var summoner = null;
        }

        var eventId = $gameMap.nextEventId();
        var summonEvent = new Game_SummonEvent($gameMap.mapId(), eventId, summonId, summoner, turn, x, y);
        $gameMap.addEvent(summonEvent);
        if (type == 'actor'){
            this.addSummonActor(eventId, battlerId, level);
        } else if (type == 'enemy'){
            this.addSummonEnemy(eventId, battlerId);
        } else if (type == 'object'){
            summonEvent.setType('object');
        }

        if (SceneManager._scene instanceof Scene_Map){
            SceneManager._scene._spriteset.createCharacters();
        }
        summonEvent.requestAnimation(_appearAnimation);
    }

    Game_Interpreter.prototype.addSummonActor = function(eventId, actorId, level) {
        var actor_unit = new Game_Actor(actorId);
        var event = $gameMap.event(eventId);
        actor_unit.setSummoner(event.summoner());
        if (level){
            actor_unit.changeLevel(level, false);
            actor_unit.recoverAll();
        }
        actor_unit.initTp(); //TPを初期化
        var bitmap = ImageManager.loadFace(actor_unit.faceName()); //顔グラフィックをプリロードする
        $gameSystem.setEventToUnit(event.eventId(), 'actor', actor_unit);
        event.setType('actor');
        actor_unit.setBattleMode('normal');
        $gameMap.setEventImages();
        $gameSystem.pushSrpgAllActors(event.eventId());//add or not?
        var oldValue = $gameVariables.value(_existActorVarID);
        $gameVariables.setValue(_existActorVarID, oldValue + 1);
        return actor_unit;
    };

    Game_Interpreter.prototype.addSummonEnemy = function(eventId, enemyId) {
        var enemy_unit = new Game_Enemy(enemyId, 0, 0);
        var event = $gameMap.event(eventId);
        enemy_unit.setSummoner(event.summoner());
        enemy_unit.initTp(); //TPを初期化
        var faceName = enemy_unit.enemy().meta.faceName; //顔グラフィックをプリロードする
        if (faceName) {
            var bitmap = ImageManager.loadFace(faceName);
        } else if ($gameSystem.isSideView()) {
            var bitmap = ImageManager.loadSvEnemy(enemy_unit.battlerName(), enemy_unit.battlerHue());
        } else {
            var bitmap = ImageManager.loadEnemy(enemy_unit.battlerName(), enemy_unit.battlerHue());
        }
        $gameSystem.setEventToUnit(event.eventId(), 'enemy', enemy_unit);
        event.setType('enemy');
        enemy_unit.setBattleMode('normal');
        $gameMap.setEventImages();
        var oldValue = $gameVariables.value(_existEnemyVarID);
        $gameVariables.setValue(_existEnemyVarID, oldValue + 1);
        return true;
    };

    Game_System.prototype.EventToUnit = function(event_id) {
        var battlerArray = this._EventToUnit[event_id];
        if (!battlerArray) return;
        if ((typeof battlerArray[1]) === 'number') {
            var actor = $gameActors.actor(battlerArray[1]);
            return [battlerArray[0], actor]
        } else {
            return battlerArray;
        }
    };

    Game_System.prototype.updateEnemySummonedEvents = function(){
        $gameMap.events().forEach(function(event) {
            if (event instanceof Game_SummonEvent && !event.isErased()) {
                if (event.summoner() && event.summoner().isEnemy()) event.updateTurns();
            }
        });
    }

    Game_System.prototype.updateActorSummonedEvents = function(){
        $gameMap.events().forEach(function(event) {
            if (event instanceof Game_SummonEvent && !event.isErased()) {
                if (event.summoner() && event.summoner().isActor()) event.updateTurns();
            }
        });
    }

    var _Game_System_srpgStartActorTurn = Game_System.prototype.srpgStartActorTurn;
    Game_System.prototype.srpgStartActorTurn = function(){
        _Game_System_srpgStartActorTurn.call(this);
        this.updateActorSummonedEvents();
    }

    var _Game_System_srpgStartEnemyTurn = Game_System.prototype.srpgStartEnemyTurn;
    Game_System.prototype.srpgStartEnemyTurn = function(){
        _Game_System_srpgStartEnemyTurn.call(this);
        this.updateEnemySummonedEvents();
    }

    Game_System.prototype.refreshSrpgAllActors = function() {
        for (i = this._srpgAllActors.length-1; i >= 0; i--){
            var actor = $gameSystem.EventToUnit(this._srpgAllActors[i])[1];
            if (actor.isDead() && actor.isSummonedBattler()){
                this._srpgAllActors.splice(i, 1);
            }
        }
    };

    var _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
    Scene_Menu.prototype.createCommandWindow = function() {
        if ($gameSystem.isSRPGMode() == true) {
            $gameSystem.refreshSrpgAllActors();
        }
        _Scene_Menu_createCommandWindow.call(this);
    };

    Game_Party.prototype.existingMemberNumber = function() {
        var existingMembers = this.allmembers().filter(function(member) {
            return member.isAlive() && !member.isSummonedBattler();
        });
        return existingMembers.length
    }

    var _Game_Party_menuActor = Game_Party.prototype.menuActor
    Game_Party.prototype.menuActor = function() {
        if ($gameSystem.isSRPGMode() && this._menuActor){
            return this._menuActor;
        } else return _Game_Party_menuActor.call(this);
    };

    var _Game_Party_setMenuActor = Game_Party.prototype.setMenuActor
    Game_Party.prototype.setMenuActor = function(actor) {
        _Game_Party_setMenuActor.call(this, actor);
        if ($gameSystem.isSRPGMode()) this._menuActor = actor;
    };

    Game_Map.prototype.addEvent = function(event){
        this._events.push(event)
    }

    Game_Map.prototype.nextEventId = function(){
        return this._events.length;
    }

    Game_Battler.prototype.summoner = function(){
        return this._summoner;
    }

    Game_Battler.prototype.isSummonedBattler = function(){
        return this._summoner !== undefined;
    }

    Game_Battler.prototype.setSummoner = function(battler){
        this._summoner = battler;
    }

    var _Game_Actor_event = Game_Actor.prototype.event
    Game_Actor.prototype.event = function() {
        if (this.isSummonedBattler()){
            return Game_BattlerBase.prototype.event.call(this);
        } else return _Game_Actor_event.call(this);
    };

    Game_SummonEvent = function() {
        this.initialize.apply(this, arguments);
    }

    Game_SummonEvent.prototype = Object.create(Game_Event.prototype);
    Game_SummonEvent.prototype.constructor = Game_SummonEvent;

    Game_SummonEvent.prototype.initialize = function(mapId, eventId, summonEventId, summoner, turn, x, y) {
        Game_Character.prototype.initialize.call(this);
        this._mapId = mapId;
        this._eventId = eventId;
        this._summonEventId = summonEventId;
        this._summoner = summoner;
        this._turns = turn;
        this.locate(x, y);
        this.refresh();
    };

    Game_SummonEvent.prototype.event = function() {
        return $dataSummon.events[this._summonEventId];
    };

    Game_SummonEvent.prototype.summoner = function() {
        return this._summoner;
    };

    Game_SummonEvent.prototype.updateTurns = function() {
        this._turns -=1;
        if (this._turns <= 0){
            var battleArray = $gameSystem.EventToUnit(this.eventId())
            if (battleArray && battleArray[1] && battleArray[1].isAlive()){
                battleArray[1].addState(battleArray[1].deathStateId())
                if (battleArray[1].isActor()) {
                    var oldValue = $gameVariables.value(_existActorVarID);
                    $gameVariables.setValue(_existActorVarID, oldValue - 1);
                } else {
                    var oldValue = $gameVariables.value(_existEnemyVarID);
                    $gameVariables.setValue(_existEnemyVarID, oldValue - 1);
                }
            }
            this.requestAnimation(_disappearAnimation);
            this.erase();
        }
    };

})();