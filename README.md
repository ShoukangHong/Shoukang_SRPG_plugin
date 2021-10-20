# Shoukang_SRPG_plugin
This is a collection of my SRPG plugins. It's based on the SRPG Engine (converter) which converts the RPG Maker MV to a turn-based Strategic RPG Engine. 
With my plugin, you can enjoy many new functional features including Battle preparation, move method, aura skills, advanced interactions, and more to build an SRPG game with more interesting strategies. I'm still actively improving them.

### Forum Link to the SRPG Engine and more plugins developed by others:

https://forums.rpgmakerweb.com/index.php?threads/srpg-engine-plugins-for-creating-turn-based-strategy-game.110366/

### Demo game is now available! Try it here:

https://shoukanghong.github.io/Shoukang_SRPG_plugin/ShoukangSRPGDemo/

## Battle Prepare
Add battle preparation phase at the beginning of SRPG battle. It allows you to change, remove, add battlers, and switch battler positions before the battle.
You can also view enemies, shop, and manage equipment before the battle.

![](https://github.com/ShoukangHong/Shoukang_SRPG_plugin/blob/main/Demos/demo%20battle%20prepare-2.gif)

## Advanced Interaction
Rather than simply wait on an event to trigger an event, this plugin allows you to trigger an event via interaction commands. The interaction commands automatically appear when there are interactable events.

![](https://github.com/ShoukangHong/Shoukang_SRPG_plugin/blob/main/Demos/demo%20adv%20interaction.gif)

This plugin also includes a build-in interaction type: wrap. You can not only use it with events but also use it as a skill.

![](https://github.com/ShoukangHong/Shoukang_SRPG_plugin/blob/main/Demos/demo%20adv%20interaction-wrap.gif)

## Terrain Effect Window
This plugin allows you to visualize the terrain effect from SRPG_TerrainEffect. When a battler is selected, its special terrain bonus will also show up.

![](https://github.com/ShoukangHong/Shoukang_SRPG_plugin/blob/main/Demos/demo%20terrain%20effect%20window.gif)

## AoE Animation
In the original SRPG Engine, each target is added to a queue and then the game will execute each battle individually 1 on 1. This script will collect all targets and add them into one battle for a 1 vs many scenarios. It works for both scene battle and map battle. 

After several updates now the function is more than just changing the animation. Counter attack sequence and distance, AoE Agi attack, AoE Exp distribution, and more issues are solved with this plugin. I'd rather call it AOE Battle Plus now.

![](https://github.com/ShoukangHong/Shoukang_SRPG_plugin/blob/main/Demos/demo%20AoE%20animation-map%20battle.gif)

In the scene battle, the placement of battlers is based on their position on the map and the direction of the active battler.

![](https://github.com/ShoukangHong/Shoukang_SRPG_plugin/blob/main/Demos/demo%20AoEAnimation.gif)
## Move Method
This plugin changes the pathfinding algorithm so it now takes obstacles and terrain cost into consideration. It has various built-in move modes. With some coding knowledge, you can choose different move modes in different conditions, and develop your own move AI.

![](https://github.com/ShoukangHong/Shoukang_SRPG_plugin/blob/main/Demos/demo%20move%20method.gif)

## Aura Skill
This plugin allows you to create Aura skills for SRPG battle. Once a unit walks into the aura range, a state will be added to the unit as the aura effect. You can have either passive aura skills that are always effective, or you can have active aura skills that need to be cast first.

![](https://github.com/ShoukangHong/Shoukang_SRPG_plugin/blob/main/Demos/demo%20aura%20skill.gif)

## Move After Action
A simple plugin that allows certain units to use the remaining move points after action.

![](https://github.com/ShoukangHong/Shoukang_SRPG_plugin/blob/main/Demos/move%20after%20action.gif)

## More:
There are functional plugins that are hard to show the idea with GIF demo. But they are also very useful! Give them a try!
