//====================================================================================================================
// SRPG_TerrainEffectWindow.js
//--------------------------------------------------------------------------------------------------------------------
// free to use and edit    V1.00 First Release
//====================================================================================================================
/*:
 * @plugindesc Add a terrain effect information window on the scene.
 * @author Shoukang
 *
 * @param width for each effect
 * @desc the width it takes to display each effect
 * @type number
 * @default 147
 *
 * @param max effects
 * @desc maximum effects that can be displayed, relates to the width of terrain effect window
 * @type number
 * @default 4
 *
 * @param min effects
 * @desc minimum effects that will be displayed, relates to the width of terrain effect window
 * @type number
 * @default 2
 *
 * @param text no effect
 * @desc when effects < minimun effects, fill the blank with this
 * @type string
 * @default --
 *
 * @param buff color
 * @desc color index for a buff terrain effect
 * @type number
 * @default 29
 *
 * @param debuff color
 * @desc color index for a debuff terrain effect
 * @type number
 * @default 18
 *
 * @help
 *
 * This plugin allows you to visualize the terrain effect from SRPG_TerrainEffect.
 * ==========================================================================================================================
 * Compatibility:
 * Need SRPG_TerrainEffect.
 * put below SRPG_TerrainEffect and SRPG_AoE.
 * =========================================================================================================================
 * v1.00 first release!
 */
(function(){
    var params = PluginManager.parameters('SRPG_TerrainEffectWindow');
    var _widthEach = Number(params['width for each effect'] || 147);
    var _max = Number(params['max effects'] || 2);
    var _min = Number(params['min effects'] || 0);
    var _noEffect = params['text no effect'] || '--';
    var _buffColor = Number(params['buff color'] || 29);
    var _debuffColor = Number(params['debuff color'] || 18);

    var parameters = PluginManager.parameters('SRPG_TerrainEffect');
    var paramModList = [];
    var xparamModList = [];
    var sparamModList = [];
    for (var tagId = 0; tagId < 8; tagId++) {
        paramModList[tagId] = [];
        xparamModList[tagId] = [];
        sparamModList[tagId] = [];
        paramModList[tagId][0] = 0;
        paramModList[tagId][1] = 0;
        paramModList[tagId][2] = Number(parameters['Tag_' + tagId + '_Mod:ATK'] || 0);
        paramModList[tagId][3] = Number(parameters['Tag_' + tagId + '_Mod:DEF'] || 0);
        paramModList[tagId][4] = Number(parameters['Tag_' + tagId + '_Mod:MAT'] || 0);
        paramModList[tagId][5] = Number(parameters['Tag_' + tagId + '_Mod:MDF'] || 0);
        paramModList[tagId][6] = Number(parameters['Tag_' + tagId + '_Mod:AGI'] || 0);
        paramModList[tagId][7] = Number(parameters['Tag_' + tagId + '_Mod:LUK'] || 0);
        xparamModList[tagId][0] = Number(parameters['Tag_' + tagId + '_Mod:HIT'] || 0.0);
        xparamModList[tagId][1] = Number(parameters['Tag_' + tagId + '_Mod:EVA'] || 0.0);
        xparamModList[tagId][2] = Number(parameters['Tag_' + tagId + '_Mod:CRI'] || 0.0);
        xparamModList[tagId][3] = Number(parameters['Tag_' + tagId + '_Mod:CEV'] || 0.0);
        xparamModList[tagId][4] = Number(parameters['Tag_' + tagId + '_Mod:MEV'] || 0.0);
        xparamModList[tagId][5] = Number(parameters['Tag_' + tagId + '_Mod:MRF'] || 0.0);
        xparamModList[tagId][6] = Number(parameters['Tag_' + tagId + '_Mod:CNT'] || 0.0);
        xparamModList[tagId][7] = Number(parameters['Tag_' + tagId + '_Mod:HRG'] || 0.0);
        xparamModList[tagId][8] = Number(parameters['Tag_' + tagId + '_Mod:MRG'] || 0.0);
        xparamModList[tagId][9] = Number(parameters['Tag_' + tagId + '_Mod:TRG'] || 0.0);
        sparamModList[tagId][0] = Number(parameters['Tag_' + tagId + '_Mod:TGR'] || 1.0);
        sparamModList[tagId][1] = Number(parameters['Tag_' + tagId + '_Mod:GRD'] || 1.0);
        sparamModList[tagId][2] = Number(parameters['Tag_' + tagId + '_Mod:REC'] || 1.0);
        sparamModList[tagId][3] = Number(parameters['Tag_' + tagId + '_Mod:PHA'] || 1.0);
        sparamModList[tagId][4] = Number(parameters['Tag_' + tagId + '_Mod:MCR'] || 1.0);
        sparamModList[tagId][5] = Number(parameters['Tag_' + tagId + '_Mod:TCR'] || 1.0);
        sparamModList[tagId][6] = Number(parameters['Tag_' + tagId + '_Mod:PDR'] || 1.0);
        sparamModList[tagId][7] = Number(parameters['Tag_' + tagId + '_Mod:MDR'] || 1.0);
        sparamModList[tagId][8] = Number(parameters['Tag_' + tagId + '_Mod:FDR'] || 1.0);
        sparamModList[tagId][9] = Number(parameters['Tag_' + tagId + '_Mod:EXR'] || 1.0);
    }
    var paramWordList = ['MHP', 'MMP', 'ATK', 'DEF', 'MAT', 'MDF', 'AGI', 'LUK'];
    var xparamWordList = ['HIT', 'EVA', 'CRI', 'CEV', 'MEV', 'MRF', 'CNT', 'HRG', 'MRG', 'TRG'];
    var sparamWordList = ['TGR', 'GRD', 'REC', 'PHA', 'MCR', 'TCR', 'PDR', 'MDR', 'FDR', 'EXR'];

    var _SRPG_SceneMap_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        this.createSrpgTerrainEffectWindow();
        _SRPG_SceneMap_createAllWindows.call(this);
    };

    Scene_Map.prototype.createSrpgTerrainEffectWindow = function() {
        this._mapSrpgTerrainEffectWindow = new Window_SrpgTerrainEffect(0, 0);
        this._mapSrpgTerrainEffectWindow.x = Graphics.boxWidth - this._mapSrpgTerrainEffectWindow.windowWidth();
        this._mapSrpgTerrainEffectWindow.y = 0;
        this._mapSrpgTerrainEffectWindow.openness = 0;
        this.addWindow(this._mapSrpgTerrainEffectWindow);
    };

    window.Window_SrpgTerrainEffect = function() {
        this.initialize.apply(this, arguments);
    }

    Window_SrpgTerrainEffect.prototype = Object.create(Window_Base.prototype);
    Window_SrpgTerrainEffect.prototype.constructor = Window_SrpgTerrainEffect;

    Window_SrpgTerrainEffect.prototype.initialize = function(x, y) {
        this._effectCount = 0;
        var width = this.windowWidth();
        var height = this.windowHeight();
        Window_Base.prototype.initialize.call(this, x, y, width, height);
        this.refresh();
    };

    Window_SrpgTerrainEffect.prototype.windowWidth = function() {
        //if (this._effectCount == 0) return 0;
        return _widthEach;
    };

    Window_SrpgTerrainEffect.prototype.windowHeight = function() {
        return this.fittingHeight(Math.min(Math.max(_min, this._effectCount), _max));
    };

    // Window_SrpgTerrainEffect.prototype.loadWindowskin = function() {
    //     this._windowskinName = _skin;
    //     this.windowskin = ImageManager.loadSystem(this._windowskinName);
    // };

    Window_SrpgTerrainEffect.prototype.refresh = function() {
        var tagId = $gameMap.terrainTag($gamePlayer.posX(), $gamePlayer.posY());
        this._effectCount = 0;
        var hasUnit = $gameTemp.activeEvent() && $gameSystem.EventToUnit($gameTemp.activeEvent().eventId());
        var unitData = undefined;
        if (hasUnit) {
            var unit = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1];
            if (unit.isActor()) unitData = unit.currentClass();
            if (unit.isEnemy()) unitData = unit.enemy();
        }
        if (this._tagId !== tagId || this._unitData !== unitData){
            this._tagId = tagId;
            this._unitData = unitData;
            this.contents.clear();
            this.updatePlacement();
            this.drawContents();
        }
    };

    Window_SrpgTerrainEffect.prototype.drawContents = function() {
        this._textCount = 0;
        if (this._effectCount !== 0){
            this.drawParamValue(paramModList, paramWordList);
            this.drawParamValue(xparamModList, xparamWordList);
            this.drawParamValue(sparamModList, sparamWordList);
        }
        this.resetTextColor();
        for (var i = this._textCount; i < _min; i++){
            this.drawText(_noEffect, 0, i * this.lineHeight(), _widthEach - 2 * this.standardPadding(), 'center');
        }
    };

    Window_SrpgTerrainEffect.prototype.updatePlacement = function() {
        this.countEffects();
        this.height = this.windowHeight();
        this.contents.resize(this.width - 2 * this.standardPadding(), this.height - 2 * this.standardPadding());          
    };

    Window_SrpgTerrainEffect.prototype.countEffects = function(){
        this._effectCount = 0;
        this.countParamValue(paramModList, paramWordList);
        this.countParamValue(xparamModList, xparamWordList);
        this.countParamValue(sparamModList, sparamWordList);        
    }

    Window_SrpgTerrainEffect.prototype.countParamValue = function(paramList, paramWordList){
        for (var i = 0; i < paramWordList.length; i++){
            if (this.getParamValue(paramList, paramWordList, i) != 0) this._effectCount += 1;
        }
    }

    Window_SrpgTerrainEffect.prototype.getParamValue = function(paramList, paramWordList, i) {
            var value = paramList[this._tagId][i];
            if (this._unitData){
                var paramPlus = Number(this._unitData.meta['srpgTE_Tag' + this._tagId + 'Mod' + paramWordList[i]] || 0);
                if (paramList == sparamModList && paramPlus == 0) paramPlus = 1;
                if (paramList === sparamModList) {
                    value *= paramPlus;
                } else value += paramPlus;
            }
            if (paramList === sparamModList) value -= 1;
            return value;
        }

    Window_SrpgTerrainEffect.prototype.drawParamValue = function(paramList, paramWordList) {
        for (var i = 0; i < paramWordList.length; i++){
            var value = this.getParamValue(paramList, paramWordList, i);
            if (value !== 0){
                var pd = this.textPadding();
                var wd = _widthEach - 2 * this.standardPadding();
                var sign = value > 0 ? '+' : '';
                var color = value > 0 ? _buffColor : _debuffColor;
                if (paramList === paramModList){
                    var info = sign + value;
                } else{
                    var info = sign + Math.round(100 * value) + '%';
                } 
                this.changeTextColor(this.systemColor());
                this.drawText(paramWordList[i], pd, this._textCount * this.lineHeight(), wd / 2 - pd, 'left')
                this.changeTextColor(this.textColor(color));
                this.drawText(info, wd / 2, this._textCount * this.lineHeight(), wd / 2 - pd, 'right');
                this._textCount += 1;
            }
        }
    };

    Game_System.prototype.setSrpgTerrainEffectWindowNeedRefresh = function() {
        this._SrpgTerrainEffectWindowRefreshFlag = true;
    };

    // ステータスウィンドウのリフレッシュフラグをクリアする
    Game_System.prototype.clearSrpgTerrainEffectWindowNeedRefresh = function() {
        this._SrpgTerrainEffectWindowRefreshFlag = false;
    };

    Game_System.prototype.srpgTerrainEffectWindowNeedRefresh = function() {
        return this._SrpgTerrainEffectWindowRefreshFlag;
    };

    var _SRPG_Game_Player_startMapEvent = Game_Player.prototype.startMapEvent;
    Game_Player.prototype.startMapEvent = function(x, y, triggers, normal) {
        _SRPG_Game_Player_startMapEvent.call(this, x, y, triggers, normal);
        if ($gameSystem.isSRPGMode()) $gameSystem.setSrpgTerrainEffectWindowNeedRefresh();
    }

    var _Game_System_setSubBattlePhase = Game_System.prototype.setSubBattlePhase
    Game_System.prototype.setSubBattlePhase = function(phase) {
        _Game_System_setSubBattlePhase.call(this, phase)
        if (phase == 'normal' || phase == 'status_window') this.setSrpgTerrainEffectWindowNeedRefresh();
    };

    var _SRPG_SceneMap_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _SRPG_SceneMap_update.call(this);
        if ($gameSystem.isSRPGMode()) {
            var tileWindow = this._mapSrpgTerrainEffectWindow;
            if ($gameSystem.isBattlePhase() !== 'actor_phase' || $gameMap.isEventRunning() ||
             ['invoke_action', 'battle_window'].contains($gameSystem.isSubBattlePhase())){
                tileWindow.close();
                return;
                //tileWindow.y = Graphics.boxHeight - tileWindow.windowHeight();
            }
            if ($gameSystem.srpgTerrainEffectWindowNeedRefresh()){
                tileWindow.refresh();
                $gameSystem.clearSrpgTerrainEffectWindowNeedRefresh();
            }
            if (tileWindow.isClosed()){
                tileWindow.open();
            }
        }

        if (!$gameSystem.srpgTerrainEffectWindowNeedRefresh() && !$gameSystem.isSRPGMode()){
            this._mapSrpgTerrainEffectWindow.close();
            $gameSystem.setSrpgTerrainEffectWindowNeedRefresh();
        }
    }

})();
