//=============================================================================
// MVP_Basic.js
//-----------------------------------------------------------------------------
// Copyright (c) 2020 MVP Contributor. All rights reserved.
// Released under the MIT license.
// http://opensource.org/licenses/mit-license.php
//=============================================================================
// Based on ChangeWindowTouchPolicy.js
// (C) 2015 Triacontane
// ----------------------------------------------------------------------------
// Version
// 1.1.3 2020/09/17 1.1.2の修正がBattleLayout-SaGa.jsに適用されない競合を修正
// 1.1.2 2020/09/16 マウスオーバーでスクロールの矢印が反応してしまう仕様を変更
// 1.1.1 2018/11/19 プラグインによって追加されたウィンドウの実装次第で挙動がおかしくなる現象を修正
// 1.1.0 2016/06/03 モバイルデバイスでウィンドウのカーソルを1回で決定できる機能を追加
// 1.0.0 2015/12/20 初版
// ----------------------------------------------------------------------------
// [Blog]   : https://triacontane.blogspot.jp/
// [Twitter]: https://twitter.com/triacontane/
// [GitHub] : https://github.com/triacontane/
//=============================================================================

/*:
 * @plugindesc Change Window Touch Policy
 * @author RyanBram
 *
 * @param ActionOutsideFrame
 * @desc ウィンドウの枠外をタッチした場合の動作を選択します。(ok or cancel or off)
 * @default cancel
 *
 * ----------------------------------------------------
 *
 * @param PointerType1
 * @desc スイッチ1がONになった場合のマウス形状です。
 * @default auto
 *
 * @param PointerSwitch1
 * @desc 形状タイプ1が有効になるスイッチ番号です。
 * @default 0
 *
 * @param PointerType2
 * @desc スイッチ2がONになった場合のマウス形状です。
 * @default auto
 *
 * @param PointerSwitch2
 * @desc 形状タイプ2が有効になるスイッチ番号です。
 * @default 0
 *
 * @param PointerType3
 * @desc スイッチ3がONになった場合のマウス形状です。
 * @default auto
 *
 * @param PointerSwitch3
 * @desc 形状タイプ3が有効になるスイッチ番号です。
 * @default 0
 *
 * @param PointerType4
 * @desc スイッチ4がONになった場合のマウス形状です。
 * @default auto
 *
 * @param PointerSwitch4
 * @desc 形状タイプ4が有効になるスイッチ番号です。
 * @default 0
 *
 * @param PointerType5
 * @desc スイッチ5がONになった場合のマウス形状です。
 * @default auto
 *
 * @param PointerSwitch5
 * @desc 形状タイプ5が有効になるスイッチ番号です。
 * @default 0
 *
 * @param DefaultType
 * @desc デフォルトのマウス形状です。
 * @default auto
 *
 * @param CustomImage1
 * @desc マウスポインタに使用する画像ファイル名(/img/system/)です。正方形の32*32程度の画像を用意してください。
 * @default
 * @require 1
 * @dir img/system/
 * @type file
 *
 * @param CustomImage2
 * @desc マウスポインタに使用する画像ファイル名(/img/system/)です。正方形の32*32程度の画像を用意してください。
 * @default
 * @require 1
 * @dir img/system/
 * @type file
 *
 * @param CustomImage3
 * @desc マウスポインタに使用する画像ファイル名(/img/system/)です。正方形の32*32程度の画像を用意してください。
 * @default
 * @require 1
 * @dir img/system/
 * @type file
 *
 * @param CustomImage4
 * @desc マウスポインタに使用する画像ファイル名(/img/system/)です。正方形の32*32程度の画像を用意してください。
 * @default
 * @require 1
 * @dir img/system/
 * @type file
 *
 * @param CustomImage5
 * @desc マウスポインタに使用する画像ファイル名(/img/system/)です。正方形の32*32程度の画像を用意してください。
 * @default
 * @require 1
 * @dir img/system/
 * @type file
 *
 * @param ErasePointer
 * @desc キーもしくはパッド入力によりポインタを一時的に消去します。マウスを動かすと再び出現します。
 * @default ON
 *
 * @param PointerPath
 * @desc カーソル用の独自画像を/system/以外に配置したい場合にパス名を指定してください。区切り文字[/]は不要。
 * @default /system
 *
 * @help ウィンドウをタッチもしくはクリックした場合の挙動を変更します。
 * 1. マウスオーバーで項目にフォーカス
 * 2. フォーカス状態で1回クリックすると項目決定
 * 3. ウィンドウの枠外をクリックした場合の動作(カスタマイズ可能)を追加
 *
 * このプラグインにはプラグインコマンドはありません。
 *
 * 利用規約：
 *  作者に無断で改変、再配布が可能で、利用形態（商用、18禁利用等）
 *  についても制限はありません。
 *  このプラグインはもうあなたのものです。
 *
 * Extends the shape and displayability of the mouse pointer.
 * It provides various shape changes according to switch conditions,
 * the use of a pointer to a self-portrait image, and the ability to
 * hide the image with some keypad input.
 *
 * The shape type of the pointer can be one of the following strings.
 * auto :
 * none :
 * default :
 * pointer :
 * crosshair :
 * move :
 * text :
 * wait :
 * help :
 * url1 : original1
 * url2 : original2
 * url3 : original3
 * url4 : original4
 * url5 : original5
 *
 * ※If you want to specify your own image, please set the image
 * file name as a parameter separately.
 * In addition to the file name, you need to set the extension. (e.g., icon.png)
 *
 * When using a proprietary image as a pointer, it has been reported that once the pointer
 * has been moved out of the screen and back in, the point display may not be correct.
 * If this happens, please install a countermeasure plugin based on the following article.
 *
 * http://tm.lucky-duet.com/viewtopic.php?f=23&t=9105
 *
 * If the image is not displayed even though the switch conditions are met,
 * the file path may be wrong or the
 * Either the specified image is not available as an icon, or it is highly likely.
 * The animation cursor (.ani) cannot be used.
 * Also, GIF files can be used but will not be animated.
 *
 * Multiple switches for shape change can be specified, and when
 * multiple conditions are met, the
 * The smaller number ("1" → "2" → "3"...) takes precedence over the smaller
 * number ("1" → "2" → "3"...).  ) has priority over the smaller number.
 *
 * In addition, when "Erase by key input" is enabled, you can use the key or pad
 * input to erase the data.
 * The pointer can be temporarily erased from the screen.
 * This is a specification to keep the pointer out of the way when the mouse is not used.
 * The pointer is displayed again when a mouse-related event occurs.
 *
 * There are no plugin commands in this plugin.
 *
 * This plugin is released under the MIT License.

 */
/*:ja
 * @plugindesc ウィンドウタッチ仕様変更プラグイン
 * @author トリアコンタン
 *
 * @param 枠外タッチ動作
 * @desc ウィンドウの枠外をタッチした場合の動作を選択します。(決定 or キャンセル or なし)
 * @default キャンセル
 *
 * -----------------------------------------------------------------
 *
 * @param 形状タイプ1
 * @desc スイッチ1がONになった場合のマウス形状です。
 * @default auto
 * @type select
 * @option auto : 自動(初期値)
 * @value auto
 * @option none : 非表示
 * @value none
 * @option default : デフォルト
 * @value default
 * @option pointer : リンク
 * @value pointer
 * @option crosshair : 十字
 * @value crosshair
 * @option move : 移動
 * @value move
 * @option text : テキスト
 * @value text
 * @option wait : 処理中
 * @value wait
 * @option help : ヘルプ
 * @value help
 * @option url1 : 独自画像1(パラメータ参照)
 * @value url1
 * @option url2 : 独自画像2(パラメータ参照)
 * @value url2
 * @option url3 : 独自画像3(パラメータ参照)
 * @value url3
 * @option url4 : 独自画像4(パラメータ参照)
 * @value url4
 * @option url5 : 独自画像5(パラメータ参照)
 * @value url5
 *
 * @param スイッチ1
 * @desc 形状タイプ1が有効になるスイッチ番号です。
 * @default 0
 * @type switch
 *
 * @param 形状タイプ2
 * @desc スイッチ2がONになった場合のマウス形状です。
 * @default auto
 * @type select
 * @option auto : 自動(初期値)
 * @value auto
 * @option none : 非表示
 * @value none
 * @option default : デフォルト
 * @value default
 * @option pointer : リンク
 * @value pointer
 * @option crosshair : 十字
 * @value crosshair
 * @option move : 移動
 * @value move
 * @option text : テキスト
 * @value text
 * @option wait : 処理中
 * @value wait
 * @option help : ヘルプ
 * @value help
 * @option url1 : 独自画像1(パラメータ参照)
 * @value url1
 * @option url2 : 独自画像2(パラメータ参照)
 * @value url2
 * @option url3 : 独自画像3(パラメータ参照)
 * @value url3
 * @option url4 : 独自画像4(パラメータ参照)
 * @value url4
 * @option url5 : 独自画像5(パラメータ参照)
 * @value url5
 *
 * @param スイッチ2
 * @desc 形状タイプ2が有効になるスイッチ番号です。
 * @default 0
 * @type switch
 *
 * @param 形状タイプ3
 * @desc スイッチ3がONになった場合のマウス形状です。
 * @default auto
 * @type select
 * @option auto : 自動(初期値)
 * @value auto
 * @option none : 非表示
 * @value none
 * @option default : デフォルト
 * @value default
 * @option pointer : リンク
 * @value pointer
 * @option crosshair : 十字
 * @value crosshair
 * @option move : 移動
 * @value move
 * @option text : テキスト
 * @value text
 * @option wait : 処理中
 * @value wait
 * @option help : ヘルプ
 * @value help
 * @option url1 : 独自画像1(パラメータ参照)
 * @value url1
 * @option url2 : 独自画像2(パラメータ参照)
 * @value url2
 * @option url3 : 独自画像3(パラメータ参照)
 * @value url3
 * @option url4 : 独自画像4(パラメータ参照)
 * @value url4
 * @option url5 : 独自画像5(パラメータ参照)
 * @value url5
 *
 * @param スイッチ3
 * @desc 形状タイプ3が有効になるスイッチ番号です。
 * @default 0
 * @type switch
 *
 * @param 形状タイプ4
 * @desc スイッチ4がONになった場合のマウス形状です。
 * @default auto
 * @type select
 * @option auto : 自動(初期値)
 * @value auto
 * @option none : 非表示
 * @value none
 * @option default : デフォルト
 * @value default
 * @option pointer : リンク
 * @value pointer
 * @option crosshair : 十字
 * @value crosshair
 * @option move : 移動
 * @value move
 * @option text : テキスト
 * @value text
 * @option wait : 処理中
 * @value wait
 * @option help : ヘルプ
 * @value help
 * @option url1 : 独自画像1(パラメータ参照)
 * @value url1
 * @option url2 : 独自画像2(パラメータ参照)
 * @value url2
 * @option url3 : 独自画像3(パラメータ参照)
 * @value url3
 * @option url4 : 独自画像4(パラメータ参照)
 * @value url4
 * @option url5 : 独自画像5(パラメータ参照)
 * @value url5
 *
 * @param スイッチ4
 * @desc 形状タイプ4が有効になるスイッチ番号です。
 * @default 0
 * @type switch
 *
 * @param 形状タイプ5
 * @desc スイッチ5がONになった場合のマウス形状です。
 * @default auto
 * @type select
 * @option auto : 自動(初期値)
 * @value auto
 * @option none : 非表示
 * @value none
 * @option default : デフォルト
 * @value default
 * @option pointer : リンク
 * @value pointer
 * @option crosshair : 十字
 * @value crosshair
 * @option move : 移動
 * @value move
 * @option text : テキスト
 * @value text
 * @option wait : 処理中
 * @value wait
 * @option help : ヘルプ
 * @value help
 * @option url1 : 独自画像1(パラメータ参照)
 * @value url1
 * @option url2 : 独自画像2(パラメータ参照)
 * @value url2
 * @option url3 : 独自画像3(パラメータ参照)
 * @value url3
 * @option url4 : 独自画像4(パラメータ参照)
 * @value url4
 * @option url5 : 独自画像5(パラメータ参照)
 * @value url5
 *
 * @param スイッチ5
 * @desc 形状タイプ5が有効になるスイッチ番号です。
 * @default 0
 * @type switch
 *
 * @param デフォルト形状タイプ
 * @desc デフォルトのマウス形状です。
 * @default auto
 * @type select
 * @option auto : 自動(初期値)
 * @value auto
 * @option none : 非表示
 * @value none
 * @option default : デフォルト
 * @value default
 * @option pointer : リンク
 * @value pointer
 * @option crosshair : 十字
 * @value crosshair
 * @option move : 移動
 * @value move
 * @option text : テキスト
 * @value text
 * @option wait : 処理中
 * @value wait
 * @option help : ヘルプ
 * @value help
 * @option url1 : 独自画像1(パラメータ参照)
 * @value url1
 * @option url2 : 独自画像2(パラメータ参照)
 * @value url2
 * @option url3 : 独自画像3(パラメータ参照)
 * @value url3
 * @option url4 : 独自画像4(パラメータ参照)
 * @value url4
 * @option url5 : 独自画像5(パラメータ参照)
 * @value url5
 *
 * @param 独自画像1
 * @desc マウスポインタに使用する画像ファイル名(/img/picture/)です。正方形の32*32程度の画像を用意してください。
 * @default
 * @require 1
 * @dir img/pictures/
 * @type file
 *
 * @param 独自画像2
 * @desc マウスポインタに使用する画像ファイル名(/img/picture/)です。正方形の32*32程度の画像を用意してください。
 * @default
 * @require 1
 * @dir img/pictures/
 * @type file
 *
 * @param 独自画像3
 * @desc マウスポインタに使用する画像ファイル名(/img/picture/)です。正方形の32*32程度の画像を用意してください。
 * @default
 * @require 1
 * @dir img/pictures/
 * @type file
 *
 * @param 独自画像4
 * @desc マウスポインタに使用する画像ファイル名(/img/picture/)です。正方形の32*32程度の画像を用意してください。
 * @default
 * @require 1
 * @dir img/pictures/
 * @type file
 *
 * @param 独自画像5
 * @desc マウスポインタに使用する画像ファイル名(/img/picture/)です。正方形の32*32程度の画像を用意してください。
 * @default
 * @require 1
 * @dir img/pictures/
 * @type file
 *
 * @param キー入力で消去
 * @desc キーもしくはパッド入力によりポインタを一時的に消去します。マウスを動かすと再び出現します。
 * @default true
 * @type boolean
 *
 * @param ポインタファイルパス
 * @desc カーソル用の独自画像を/pictures/以外に配置したい場合にパス名を指定してください。区切り文字[/]は不要。
 * @default
 *
 * @help ウィンドウをタッチもしくはクリックした場合の挙動を変更します。
 * 1. マウスオーバーで項目にフォーカス
 * 2. フォーカス状態で1回クリックすると項目決定
 * 3. ウィンドウの枠外をクリックした場合の動作(カスタマイズ可能)を追加
 *
 * このプラグインにはプラグインコマンドはありません。
 *
 * 利用規約：
 *  作者に無断で改変、再配布が可能で、利用形態（商用、18禁利用等）
 *  についても制限はありません。
 *  このプラグインはもうあなたのものです。
 *
 * マウスポインタの形状や表示可否を拡張します。
 * スイッチ条件に応じた多彩な形状変化や、独自画像のポインタ利用
 * 何らかのキー・パッド入力で非表示化する機能を提供します。
 *
 * ポインタの形状タイプは以下の文字列を指定します。
 * auto : 自動(初期値)
 * none : 非表示
 * default : デフォルト
 * pointer : リンク
 * crosshair : 十字
 * move : 移動
 * text : テキスト
 * wait : 処理中
 * help : ヘルプ
 * url1 : 独自画像1(パラメータ参照)
 * url2 : 独自画像2(パラメータ参照)
 * url3 : 独自画像3(パラメータ参照)
 * url4 : 独自画像4(パラメータ参照)
 * url5 : 独自画像5(パラメータ参照)
 *
 * ※独自画像を指定する場合は、別途画像ファイル名をパラメータに設定してください。
 * ファイル名に加えて拡張子の設定が必要です。(例：icon.png)
 *
 * ポインタに独自画像を使う場合、一度ポインタを画面外に出して戻したときに
 * ポイントの表示がおかしくなる問題が報告されています。
 * 発生した場合は以下の記事に基づき対策プラグインの導入をお願いします。
 *
 * http://tm.lucky-duet.com/viewtopic.php?f=23&t=9105
 *
 * スイッチ条件を満たしたのに画像が表示されない場合は、ファイルパスが間違っているか
 * 指定した画像をアイコンとして利用できないかのどちらかの可能性が高いです。
 * アニメーションカーソル(.ani)は使用できません。
 * また、gifファイルは使用できますがアニメーションしません。
 *
 * 形状変化用のスイッチは複数指定可能で複数の条件を満たした場合は
 * より数字の小さい方（「1」→「2」→「3」...の順番）が優先されます。
 *
 * また、「キー入力で消去」を有効にするとキーもしくはパッド入力により
 * ポインタを一時的に画面から消去できます。
 * マウス主体の操作を行わない場合にポインタが邪魔にならないための仕様です。
 * マウス関連のイベントが発生すると再びポインタが表示されます。
 *
 * このプラグインにはプラグインコマンドはありません。
 *
 * 利用規約：
 *  作者に無断で改変、再配布が可能で、利用形態（商用、18禁利用等）
 *  についても制限はありません。
 *  このプラグインはもうあなたのものです。
 */
(function() {
    'use strict';
    var pluginName = 'MVP_MouseOperation';

    //=============================================================================
    // ローカル関数
    //  プラグインパラメータやプラグインコマンドパラメータの整形やチェックをします
    //=============================================================================
    var getParamString = function(paramNames) {
        var value = getParamOther(paramNames);
        return value == null ? '' : value;
    };

    var getParamNumber = function(paramNames, min, max) {
        var value = getParamOther(paramNames);
        if (arguments.length < 2) min = -Infinity;
        if (arguments.length < 3) max = Infinity;
        return (parseInt(value, 10) || 0).clamp(min, max);
    };

    var getParamBoolean = function(paramNames) {
        var value = getParamOther(paramNames);
        return (value || '').toUpperCase() === 'ON';
    };

    var getParamOther = function(paramNames) {
        if (!Array.isArray(paramNames)) paramNames = [paramNames];
        for (var i = 0; i < paramNames.length; i++) {
            var name = PluginManager.parameters(pluginName)[paramNames[i]];
            if (name) return name;
        }
        return null;
    };
    //=============================================================================
    // パラメータの取得と整形
    //=============================================================================
    var paramActionOutsideFrame = getParamString(['ActionOutsideFrame', '枠外タッチ動作']).toLowerCase();

    //=============================================================================
    // Window_Selectable
    //  タッチ周りの仕様を書き換えのため元の処理を上書き
    //=============================================================================
    var _Window_Selectable_processTouch = Window_Selectable.prototype.processTouch;
    Window_Selectable.prototype.processTouch = function() {
        if (this.maxItems() === 0) {
            _Window_Selectable_processTouch.apply(this, arguments);
            return;
        }
        if (this.isOpenAndActive()) {
            var triggered = TouchInput.isTriggered();
            if ((TouchInput.isMoved() || triggered) && this.isTouchedInsideFrame()) {
                if (!triggered && this.isTouchedBorder()) {
                    return;
                }
                this.onTouch(triggered);
            } else if (TouchInput.isCancelled()) {
                if (this.isCancelEnabled()) this.processCancel();
            } else if (TouchInput.isTriggered()) {
                switch (paramActionOutsideFrame) {
                    case '決定':
                    case 'ok':
                        if (this.isOkEnabled()) this.processOk();
                        break;
                    case 'キャンセル':
                    case 'cancel':
                        if (this.isCancelEnabled()) this.processCancel();
                        break;
                    case 'なし':
                    case 'off':
                        break;
                }
            }
        }
    };

    Window_Selectable.prototype.isTouchedBorder = function() {
        var x = this.canvasToLocalX(TouchInput.x);
        var y = this.canvasToLocalY(TouchInput.y);
        if (y < this.padding) {
            return true;
        } else if (y >= this.height - this.padding) {
            return true;
        } else if (x < this.padding) {
            return true;
        } else if (x >= this.width - this.padding) {
            return true;
        } else {
            return false;
        }
    };

    var _Window_Selectable_onTouch      = Window_Selectable.prototype.onTouch;
    Window_Selectable.prototype.onTouch = function(triggered) {
        if (this.isCursorMovable()) {
            var x        = this.canvasToLocalX(TouchInput.x);
            var y        = this.canvasToLocalY(TouchInput.y);
            var hitIndex = this.hitTest(x, y);
            this.select(hitIndex);
        }
        _Window_Selectable_onTouch.apply(this, arguments);
    };

    //=============================================================================
    // TouchInput
    //  ポインタ移動時にマウス位置の記録を常に行うように元の処理を上書き
    //=============================================================================
    TouchInput._onMouseMove = function(event) {
        var x = Graphics.pageToCanvasX(event.pageX);
        var y = Graphics.pageToCanvasY(event.pageY);
        this._onMove(x, y);
    };

// --------------------------------------------------------------------------------

    //=============================================================================
    // パラメータの取得と整形
    //=============================================================================
    var paramPointerTypes    = {};
    var paramPointerSwitches = {};
    for (var i = 1; i < 6; i++) {
        paramPointerTypes[i]    = getParamString(['PointerType' + i, '形状タイプ' + i]);
        paramPointerSwitches[i] = getParamNumber(['PointerSwitch' + i, 'スイッチ' + i]);
    }
    var paramCustomImages = {};
    for (var j = 1; j < 6; j++) {
        paramCustomImages[j] = getParamString(['CustomImage' + j, '独自画像' + j]);
    }
    var paramDefaultType  = getParamString(['DefaultType', 'デフォルト形状タイプ']);
    var paramErasePointer = getParamBoolean(['ErasePointer', 'キー入力で消去']);
    var paramPointerPath  = getParamString(['PointerPath', 'ポインタファイルパス']);

    //=============================================================================
    // SceneManager
    //  スイッチに応じてポインタの形状を変更します。
    //=============================================================================
    var _SceneManager_updateScene = SceneManager.updateScene;
    SceneManager.updateScene      = function() {
        _SceneManager_updateScene.apply(this, arguments);
        if (this._scene) this.updateMousePointer();
    };

    SceneManager.updateMousePointer = function() {
        var result = paramDefaultType;
        if ($gameSwitches) {
            Object.keys(paramPointerTypes).some(function(i) {
                var switchNumber = paramPointerSwitches[i];
                if (switchNumber && $gameSwitches.value(switchNumber)) {
                    result = paramPointerTypes[i];
                    return true;
                }
                return false;
            });
        }
        if (result) Graphics.setPointerType(result.toLowerCase());
    };

    //=============================================================================
    // Input
    //  何らかの入力でポインタを非表示にします。
    //=============================================================================
    var _Input_update = Input.update;
    Input.update      = function() {
        var oldDate = this.date;
        _Input_update.apply(this, arguments);
        if (paramErasePointer && this.date !== oldDate) {
            Graphics.setHiddenPointer(true);
        }
    };

    //=============================================================================
    // TouchInput
    //  マウスポインタの移動でポインタの表示を復元します。
    //=============================================================================
    var _TouchInput__onMouseMove = TouchInput._onMouseMove;
    TouchInput._onMouseMove      = function(event) {
        _TouchInput__onMouseMove.apply(this, arguments);
        if (paramErasePointer) Graphics.setHiddenPointer(false);
    };

    //=============================================================================
    // Graphics
    //  ポインタの形状を変更します。
    //=============================================================================
    Graphics._PointerType   = 'auto';
    Graphics._hiddenPointer = false;

    Graphics.setHiddenPointer = function(value) {
        this._hiddenPointer = !!value;
        this.updateMousePointer();
    };

    Graphics.setPointerType = function(type) {
        this._PointerType = null;
        Object.keys(paramCustomImages).forEach(function(index) {
            this._setPointerTypeCustom(type, index);
        }.bind(this));
        if (!this._PointerType) this._PointerType = type;
        this.updateMousePointer();
    };

    Graphics._setPointerTypeCustom = function(type, index) {
        if (type === 'url' + index && paramCustomImages[index]) {
            this._PointerType = 'url(img/' + (paramPointerPath || 'pictures') + '/' + paramCustomImages[index] + '.png), default';
        }
    };

    Graphics.updateMousePointer = function() {
        document.body.style.cursor = this._hiddenPointer ? 'none' : this._PointerType;
    };
})();

