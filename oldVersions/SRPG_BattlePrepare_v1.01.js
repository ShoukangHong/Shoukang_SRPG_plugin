//=============================================================================
// SRPG_BattlePrepare.js
//-----------------------------------------------------------------------------
// free to use and edit     v1.01 fixed some small bugs and changed the parameter description
// replace the file name with SRPG_BattlePrepareto use
//=============================================================================
/*:
 * @plugindesc Add battle Prepare phase at the beginning of SRPG battle.
 * @author Shoukang
 *
 * @param disable remove
 * @desc disable remove actor command
 * @type boolean
 * @default false
 *
 * @param textPrepareEvent
 * @desc Name of Prepare Event. Used in SRPG menu window.
 * @default Prepare
 *
 * @param textFinishPrepare
 * @desc Name of Finish Prepare. Used in SRPG menu window.
 * @default Ready
 *
 * @param textExchange
 * @desc Name of Exchange position. Used in SRPG menu window.
 * @default Exchange
 *
 * @param textRemove
 * @desc Name of Remove actor. Used in SRPG menu window.
 * @default Remove
 *
 * @help
 *
 * This plugin allows you to prepare before battle. You can change equipment, see enemy's status, remove or add actors,
 * and switch actor positions in battle Prepare phase.
 * Only events with <type:actor><id:0> are moveable. AutoBattle units are also not moveable.
 * The new flow is: battleStart---Prepare---actorturn---.......
 * ========================================================================================================================
 * event note:
 * <type:afterPrepare>  # start this event when Prepare is finished.
 * <type:prepare>       # start this event when you trigger prepare command in main menu. You can use this event to open shop or do other things you want.
 *==========================================================================================================================
 * PluginCommand
 * DisableSRPGPrepare       Disable battle Prepare
 * EnableSRPGPrepare        Enable battle Prepare
 *==========================================================================================================================
 * v1.01 fixed some small bugs and changed the parameter description.
 * v 1.00 first release!
 * =========================================================================================================================
 * Compatibility:
 * This plugin made some big changes to SRPG_Core, put it above all the SRPG plugins except SRPG_Core!
 */
(function () {
	var parameters = PluginManager.parameters('SRPG_BattlePrepare');
	var _disableRemove = !!eval(parameters['disable remove']);
	var _textPrepareEvent = parameters['textPrepareEvent']|| 'Prepare';
	var _textFinishPrepare = parameters['textFinishPrepare']|| 'Ready';
	var _textExchange = parameters['textExchange']|| 'Exchange';
	var _textRemove = parameters['textRemove']|| 'Remove';

//paramerters from core plugin
	var coreParameters = PluginManager.parameters('SRPG_core');
	var _srpgBattleSwitchID = Number(coreParameters['srpgBattleSwitchID'] || 1);
	var _srpgBestSearchRouteSize = Number(coreParameters['srpgBestSearchRouteSize'] || 20);
	var _textSrpgTurnEnd = coreParameters['textSrpgTurnEnd'] || 'ターン終了';
	var _textSrpgAutoBattle = coreParameters['textSrpgAutoBattle'] || 'オート戦闘';
	var _turnVarID = Number(coreParameters['turnVarID'] || 3);
	var _existActorVarID = Number(coreParameters['existActorVarID'] || 1);
	var _srpgAutoBattleStateId = Number(coreParameters['srpgAutoBattleStateId'] || 14);
	
//add battle_prepare phase, prepare_command subphase and exchange_position subphase.
	var _SRPG_Game_Player_startMapEvent = Game_Player.prototype.startMapEvent
	Game_Player.prototype.startMapEvent = function(x, y, triggers, normal) {
		if ($gameSystem.isSRPGMode() == true && !$gameMap.isEventRunning() && $gameSystem.isBattlePhase() === 'battle_prepare'){
			if ($gameSystem.isSubBattlePhase() === 'normal' && triggers[0] === 0) {
				$gameMap.eventsXy(x, y).forEach(function(event) {
					if (event.isType() === 'actor' && Number(event.event().meta.id) === 0 && !event.isErased()) {
						var battlerArray = $gameSystem.EventToUnit(event.eventId());
						if (!battlerArray[1].isAutoBattle()){
							SoundManager.playOk();
							$gameTemp.setActiveEvent(event);
							$gameSystem.setSrpgPrepareWindowNeedRefresh(battlerArray);
							$gameSystem.setSubBattlePhase('prepare_command');
						} else SoundManager.playBuzzer();
						return;
					} else if (event.isType() === 'enemy') {
						SoundManager.playOk();
						$gameTemp.setResetMoveList(true);
						$gameTemp.setActiveEvent(event);
						$gameSystem.srpgMakeMoveTable(event);
						var battlerArray = $gameSystem.EventToUnit(event.eventId());
						$gameSystem.setSrpgStatusWindowNeedRefresh(battlerArray);
						$gameSystem.setSubBattlePhase('status_window');
						return;
					} else if (event.isType() === 'playerEvent') {
						if (event.pageIndex() >= 0) event.start();
						return;
					} else if (event.event().meta.type === 'actor' && event.isErased() && $gameParty.remainingActorList().length > 0){ //if there's remaining actor add actor.
						SoundManager.playOk();
						var actorId = $gameParty.remainingActorList()[0];
						var oldValue = $gameVariables.value(_existActorVarID);
						$gameVariables.setValue(_existActorVarID, oldValue + 1);
						event.appear();
						$gameMap.changeActor(event.eventId(), actorId);
					} else SoundManager.playBuzzer();
				});
			} else if ($gameSystem.isSubBattlePhase() === 'exchange_position' && triggers[0] === 0){
				$gameMap.eventsXy(x, y).forEach(function(event) {
					if (event.event().meta.type === 'actor') {
						if (Number(event.event().meta.id) === 0 && event.eventId() !== $gameTemp.activeEvent().eventId()) {
							var battlerArray = $gameSystem.EventToUnit(event.eventId());
							if (battlerArray && battlerArray[1] && battlerArray[1].isAutoBattle()){
								SoundManager.playBuzzer();
							} else{
								SoundManager.playOk();
								$gameTemp.clearMoveTable();
								$gameTemp.activeEvent().swap(event); //exchange event position;
								$gameTemp.clearActiveEvent();
								$gameSystem.setSubBattlePhase('normal');
								$gameTemp.setResetMoveList(true);
								$gameSystem.srpgMakePrepareTable();
							}   
							return;
						} else SoundManager.playBuzzer();
					}
				});
			}
		} else _SRPG_Game_Player_startMapEvent.call(this, x, y, triggers, normal)
	};
//don't move the player when prepare command is open
	var _SRPG_Game_Player_canMove = Game_Player.prototype.canMove;
	Game_Player.prototype.canMove = function() {
		if ($gameSystem.isSRPGMode() == true && $gameSystem.isSubBattlePhase() === 'prepare_command') {
			return false;
		} else return _SRPG_Game_Player_canMove.call(this);
	};

//drag the origingal updatecallmenu method here so I can rewrite, I can't find any better way.
	Scene_Map.prototype.updateCallMenu = function() {
		if (this.isMenuEnabled()) {
			if (this.isMenuCalled()) {
				this.menuCalling = true;
			}
			if (this.menuCalling && !$gamePlayer.isMoving()) {
				this.callMenu();
			}
		} else {
			this.menuCalling = false;
		}
	};

//This part is too complicated, I copy and add my conditions
	var _SRPG_SceneMap_updateCallMenu = Scene_Map.prototype.updateCallMenu;
	Scene_Map.prototype.updateCallMenu = function() {
		if ($gameSystem.isSRPGMode() && $gameSystem.isSubBattlePhase() === 'invoke_action') {
			this.menuCalling = false;
			return;
		}
		if ($gameSystem.isSRPGMode() == true) {
			if ($gameSystem.srpgWaitMoving() == true ||
				$gameTemp.isAutoMoveDestinationValid() == true ||
				$gameSystem.isSubBattlePhase() === 'status_window' ||
				$gameSystem.isSubBattlePhase() === 'actor_command_window' ||
				$gameSystem.isSubBattlePhase() === 'battle_window' ||
				$gameSystem.isSubBattlePhase() === 'prepare_command' ||//shoukang add new condition: $gameSystem.isSubBattlePhase() === 'prepare_command'
				($gameSystem.isBattlePhase() != 'actor_phase' &&
				$gameSystem.isBattlePhase() != 'battle_prepare')) {//shoukang add new condition: $gameSystem.isBattlePhase() != 'battle_prepare'
				this.menuCalling = false;
				return;
			}
			if ($gameSystem.isSubBattlePhase() === 'actor_move') {
				if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
					SoundManager.playCancel();
					$gameSystem.setSubBattlePhase('normal');
					$gameSystem.clearSrpgActorCommandStatusWindowNeedRefresh();
					$gameParty.clearSrpgBattleActors();
					$gameTemp.clearActiveEvent();
					$gameTemp.clearMoveTable();
				}
			} else if ($gameSystem.isSubBattlePhase() === 'actor_target') {
				if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
					SoundManager.playCancel();
					var event = $gameTemp.activeEvent();
					var battlerArray = $gameSystem.EventToUnit(event.eventId());
					$gameTemp.clearMoveTable();
					$gameTemp.initialMoveTable($gameTemp.originalPos()[0], $gameTemp.originalPos()[1], battlerArray[1].srpgMove());
					event.makeMoveTable($gameTemp.originalPos()[0], $gameTemp.originalPos()[1], battlerArray[1].srpgMove(), [0], battlerArray[1].srpgThroughTag());
					var list = $gameTemp.moveList();
					for (var i = 0; i < list.length; i++) {
						var pos = list[i];
						var flag = $gameSystem.areTheyNoUnits(pos[0], pos[1], '');
						if (flag == true && _srpgBestSearchRouteSize > 0) event.makeRangeTable(pos[0], pos[1], battlerArray[1].srpgWeaponRange(), [0], pos[0], pos[1], $dataSkills[battlerArray[1].attackSkillId()]);
					}
					$gameTemp.pushRangeListToMoveList();
					$gameTemp.setResetMoveList(true);
					$gameSystem.setSrpgActorCommandWindowNeedRefresh(battlerArray);
					$gameSystem.setSubBattlePhase('actor_command_window');
				}
			} else if ($gameSystem.isSubBattlePhase() === 'exchange_position'){ //shoukang add exchange position condition
				if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
					SoundManager.playCancel();
					$gameSystem.clearSrpgPrepareWindowNeedRefresh();
					$gameSystem.setSubBattlePhase('normal');
					$gameTemp._MoveList = [];
					$gameTemp.setResetMoveList(true);
					$gameTemp.clearActiveEvent();
					$gameTemp.clearMoveTable();
					$gameSystem.srpgMakePrepareTable();
				}
			}
			 else {
				_SRPG_SceneMap_updateCallMenu.call(this);
			}
		} else {
			_SRPG_SceneMap_updateCallMenu.call(this);
		}
	};

//update prepare command window
	var _SRPG_MB_SceneMap_update = Scene_Map.prototype.update;
	Scene_Map.prototype.update = function() {
		_SRPG_MB_SceneMap_update.call(this);
		if ($gameSystem.isSRPGMode() && $gameSystem.isBattlePhase() === 'battle_prepare') {
			if ($gameTemp.moveList().length === 0) $gameSystem.srpgMakePrepareTable();
			var flag = $gameSystem.srpgPrepareWindowNeedRefresh();
			if (flag && flag[0]) {
				if (!this._mapSrpgPrepareWindow.isOpen() && !this._mapSrpgPrepareWindow.isOpening()) {
					this._mapSrpgPrepareWindow.setup(flag[1][1]);
				}
			} else {
				if (this._mapSrpgPrepareWindow.isOpen() && !this._mapSrpgPrepareWindow.isClosing()) {
					this._mapSrpgPrepareWindow.close();
				}
			}
		}
	};
//Rewrite startSRPG to run srpgStartBattlePrepare instead of actor turn when SRPG battle start
	Game_System.prototype.startSRPG = function() {
		this._SRPGMode = true;
		$gameSwitches.setValue(_srpgBattleSwitchID, true);
		this._isBattlePhase = 'initialize';
		this._isSubBattlePhase = 'initialize';
		$gamePlayer.refresh();
		$gameTemp.clearActiveEvent();
		this.clearData(); //データの初期化
		this.setAllEventType(); //イベントタイプの設定
		this.setSrpgActors(); //アクターデータの作成
		this.setSrpgEnemys(); //エネミーデータの作成
		$gameMap.setEventImages();   // ユニットデータに合わせてイベントのグラフィックを変更する
		this.runBattleStartEvent(); // ゲーム開始時の自動イベントを実行する
		$gameVariables.setValue(_turnVarID, 1); //ターン数を初期化する
		$gameSystem.resetSearchedItemList(); //探索済み座標を初期化する
		this.clearSrpgPrepareWindowNeedRefresh();//shoukang initialize
		if (this.isPrepareEnabled()) this.srpgStartBattlePrepare();//shoukang start Prepare if enabled
		else this.srpgStartActorTurn();//アクターターンを開始する
	};

	Game_System.prototype.srpgStartBattlePrepare = function() {
		$gameSystem.srpgMakePrepareTable();//make prepare table
		this.setBattlePhase('battle_prepare');
		this.setSubBattlePhase('normal');
	};
//======================================================================================
//Change and add commands in main menu
//======================================================================================
	var _SRPG_SceneMenu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
	Scene_Menu.prototype.createCommandWindow = function() {
		_SRPG_SceneMenu_createCommandWindow.call(this);
		if ($gameSystem.isSRPGMode() == true) {
			this._commandWindow.setHandler('finish prepare',this.commandFinishPrepare.bind(this));
			this._commandWindow.setHandler('prepare',this.commandPrepareEvent.bind(this));
		}
	};

	var _SRPG_Window_MenuCommand_makeCommandList = Window_MenuCommand.prototype.makeCommandList;
	Window_MenuCommand.prototype.makeCommandList = function() {
		if ($gameSystem.isSRPGMode() == true && $gameSystem.isBattlePhase() == 'battle_prepare') {
			this.addFinishPrepareCommand();
			this.addPrepareEventCommand();
			if (this.needsCommand('equip')) this.addCommand(TextManager.equip, 'equip', true);
		}
		_SRPG_Window_MenuCommand_makeCommandList.call(this);
	};
//add command
	Window_MenuCommand.prototype.addFinishPrepareCommand = function() {
		this.addCommand(_textFinishPrepare, 'finish prepare', true);
	};

	Window_MenuCommand.prototype.addPrepareEventCommand = function() {
		var menuWindow = this;
		$gameMap.events().some(function(event) {
			if (event.isType() === 'prepare') menuWindow.addCommand(_textPrepareEvent, 'prepare', true);
		});
	};
//rewrite these functions to hide these commands in prepare phase
	Window_MenuCommand.prototype.addTurnEndCommand = function() {
		if ($gameSystem.isBattlePhase() != 'battle_prepare') this.addCommand(_textSrpgTurnEnd, 'turnEnd', true);
	};

	Window_MenuCommand.prototype.addAutoBattleCommand = function() {
		if ($gameSystem.isBattlePhase() != 'battle_prepare') this.addCommand(_textSrpgAutoBattle, 'autoBattle', true);
	};
//command effect
	Scene_Menu.prototype.commandFinishPrepare = function() {
		$gameSystem.clearSrpgAllActors();
		$gameMap.events().forEach(function(event) {
			if (event.isType() === 'afterPrepare') {
				if (event.pageIndex() >= 0) event.start();
				$gameTemp.pushSrpgEventList(event);
			}
			if (event.isType() === 'actor' && !event.isErased()) {
				var actor = $gameSystem.EventToUnit(event.eventId());
				if (actor[1]) $gameSystem.pushSrpgAllActors(event.eventId()); //refresh SrpgAllActors list
			} else if (event.isType() === 'actor' && event.isErased()) event.setType('');
		});
		$gameTemp.clearMoveTable();
		$gameSystem.setBattlePhase('actor_phase');
		$gameSystem.srpgStartActorTurn();
		SceneManager.pop();
	};

	Scene_Menu.prototype.commandPrepareEvent = function() {
		$gameMap.events().forEach(function(event) {
			if (event.isType() === 'prepare') {
				if (event.pageIndex() >= 0) event.start();
				$gameTemp.pushSrpgEventList(event);
			}
		});
		SceneManager.pop();
	};

//show all party members in prepare phase
	var _SRPG_Game_Party_members = Game_Party.prototype.members;
	Game_Party.prototype.members = function() {
		if ($gameSystem.isSRPGMode() == true && $gameSystem.isBattlePhase() === 'battle_prepare') {
			return this._actors.map(function(id) {
				return $gameActors.actor(id);
			});
		} else return _SRPG_Game_Party_members.call(this);
	};
//=====================================================================================================================
//Actor prepare window
//=====================================================================================================================
	var _SRPG_SceneMap_createAllWindows = Scene_Map.prototype.createAllWindows;
	Scene_Map.prototype.createAllWindows = function() {
		_SRPG_SceneMap_createAllWindows.call(this);
		this.createPrepareWindow();
	};

	Scene_Map.prototype.createPrepareWindow = function() {
		this._mapSrpgPrepareWindow = new Window_ActorCommand();
		this._mapSrpgPrepareWindow.x = Math.max(Graphics.boxWidth / 2 - this._mapSrpgPrepareWindow.windowWidth(), 0);
		this._mapSrpgPrepareWindow.y = Math.max(Graphics.boxHeight / 2 - this._mapSrpgPrepareWindow.windowHeight(), 0);
		this._mapSrpgPrepareWindow.setHandler('partymember',  this.commandPartyMember.bind(this));
		this._mapSrpgPrepareWindow.setHandler('exchange',  this.commandExchange.bind(this));
		this._mapSrpgPrepareWindow.setHandler('remove',  this.commandRemove.bind(this));
		this._mapSrpgPrepareWindow.setHandler('cancel', this.cancelPrepareCommand.bind(this));
		this.addWindow(this._mapSrpgPrepareWindow);
	};
//battle Prepare phase add these commands
	var _SRPG_Window_ActorCommand_makeCommandList = Window_ActorCommand.prototype.makeCommandList;
	Window_ActorCommand.prototype.makeCommandList = function() {
		if ($gameSystem.isSRPGMode() == true && $gameSystem.isBattlePhase() === 'battle_prepare') {
			if (this._actor) {
				this.addPartyMemberCommand();
				this.addExchangeCommand();
				this.addRemoveCommand();
			}
		} else _SRPG_Window_ActorCommand_makeCommandList.call(this);
	};
//add command
//add this command for each remaining actor, should open a new window to list remaining actors, but my coding skill is limited so I make this instead.
	Window_ActorCommand.prototype.addPartyMemberCommand = function() {
		var remainingactorlist = $gameParty.remainingActorList();
		for (var i = 0; i < remainingactorlist.length; i++){
			this.addCommand($gameActors.actor(remainingactorlist[i]).name(), 'partymember', true); 
		}
	};

	Window_ActorCommand.prototype.addExchangeCommand = function() {
		this.addCommand(_textExchange, 'exchange', true);
	};

	Window_ActorCommand.prototype.addRemoveCommand = function() {
		if (_disableRemove) return;
		if ($gameVariables.value(_existActorVarID) > 1) this.addCommand(_textRemove, 'remove', true);
		else this.addCommand(_textRemove, 'remove', false);
	};

	Window_ActorCommand.prototype.addCancelPrepareCommand = function() {
		this.addCommand('cancel', 'cancel', true);
	};
//command effect
	Scene_Map.prototype.commandPartyMember = function() {
		var remainingactorlist = $gameParty.remainingActorList();
		var i = this._mapSrpgPrepareWindow._index;//shoukang I think there is better ways to do this but I don't know what can I get except index.
		$gameMap.changeActor($gameTemp.activeEvent().eventId(), remainingactorlist[i]);
		$gameTemp.clearActiveEvent();
		$gameSystem.clearSrpgPrepareWindowNeedRefresh();
		$gameSystem.setSubBattlePhase('normal');
	};

	Scene_Map.prototype.commandExchange = function() {
		$gameTemp.pushMoveList([$gameTemp.activeEvent().posX(), $gameTemp.activeEvent().posY(), true]);
		$gameTemp.setResetMoveList(true);
		$gameSystem.setSubBattlePhase('exchange_position');
		$gameSystem.clearSrpgPrepareWindowNeedRefresh();
	};

	Scene_Map.prototype.commandRemove = function() {
		var oldValue = $gameVariables.value(_existActorVarID);
		var id = $gameTemp.activeEvent().eventId();
		$gameVariables.setValue(_existActorVarID, oldValue - 1);
		$gameTemp.clearActiveEvent();
		$gameMap.event(id).erase();
		$gameSystem._EventToUnit[id] = null;
		$gameMap.event(id).setType('');
		$gameSystem.clearSrpgPrepareWindowNeedRefresh();
		$gameSystem.setSubBattlePhase('normal');
	};

	Scene_Map.prototype.cancelPrepareCommand = function() {
		$gameSystem.setSubBattlePhase('normal');
		$gameTemp.clearActiveEvent();
		$gameSystem.clearSrpgPrepareWindowNeedRefresh();
	};

//add prepare command window refresh flag
	var _SRPG_Game_System_initialize = Game_System.prototype.initialize;
	Game_System.prototype.initialize = function() {
		_SRPG_Game_System_initialize.call(this);
		this._SrpgPrepareWindowRefreshFlag = [false, null];
		this._enablePrepare = true;
	};

	Game_System.prototype.srpgPrepareWindowNeedRefresh = function() {
		return this._SrpgPrepareWindowRefreshFlag;
	};

	Game_System.prototype.setSrpgPrepareWindowNeedRefresh = function(battlerArray) {
		this._SrpgPrepareWindowRefreshFlag = [true, battlerArray];
	};

	Game_System.prototype.clearSrpgPrepareWindowNeedRefresh = function() {
		this._SrpgPrepareWindowRefreshFlag = [false, null];
	};

//=================================================================================================
//plugin command
//=================================================================================================
	var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
	Game_Interpreter.prototype.pluginCommand = function(command, args) {
		_Game_Interpreter_pluginCommand.call(this, command, args);
		if (command === 'EnableSRPGPrepare') $gameSystem.setSRPGPrepare(true);
		if (command === 'DisableSRPGPrepare') $gameSystem.setSRPGPrepare(false);
	};

	Game_System.prototype.isPrepareEnabled = function() {
		if (this._enablePrepare === undefined) this._enablePrepare = true;
		return this._enablePrepare;
	};

	Game_System.prototype.setSRPGPrepare = function(value) {
		this._enablePrepare = value;
	};


//=================================================================================================
//used new functions
//=================================================================================================
//make the table of operatable actor tiles.
	Game_System.prototype.srpgMakePrepareTable = function() {
		$gameMap.events().forEach(function(event) {
			if (event.event().meta.type === 'actor' && Number(event.event().meta.id) === 0){
				var battlerArray = $gameSystem.EventToUnit(event.eventId());
				if (battlerArray && battlerArray[1] && battlerArray[1].isAutoBattle()) return;
				$gameTemp.pushMoveList([event.posX(), event.posY(), false]);    
			}
		});
	};
//get remaining actors in party
	Game_Party.prototype.remainingActorList = function(){
		var actorlist = [];
		$gameMap.events().forEach(function(event) {
			if (event.isType() === 'actor' && !event.isErased()) {
				var actor = $gameSystem.EventToUnit(event.eventId())
				if (actor[1]) actorlist.push(actor[1]._actorId);
			}
		});
		var list = [];
		for (var i = 0; i < this._actors.length; i++){
			if (!actorlist.includes(this._actors[i])) list.push(this._actors[i]);
		}
		return list.sort();
	}
//change actor, similar to add actor
	Game_Map.prototype.changeActor = function(eventId, actorId) {
		var actor_unit = $gameActors.actor(actorId);
		var event = this.event(eventId);
		if (actor_unit && event) {
			actor_unit.initTp(); 
			var bitmap = ImageManager.loadFace(actor_unit.faceName()); 
			$gameSystem.setEventToUnit(event.eventId(), 'actor', actor_unit.actorId());
			event.setType('actor');
			var xy = event.makeAppearPoint(event, event.posX(), event.posY(), actor_unit.srpgThroughTag());
			event.setPosition(xy[0], xy[1]);
			this.setEventImages();
		}
	};
})();
