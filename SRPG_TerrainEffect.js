/*:
@plugindesc SRPGコンバータMVに地形効果のルールを追加
@author アンチョビ

@param Tag_0_Name
@desc 地形タグ_0：名前（ゲーム内には反映されません）
@default ----
@param Tag_0_MovingCost
@desc 地形タグ_0：移動コスト（1未満には設定できません）
@default 1
@param Tag_0_Mod:ATK
@desc 地形タグ_0：攻撃力修正
@default 0
@param Tag_0_Mod:DEF
@desc 地形タグ_0：防御力修正
@default 0
@param Tag_0_Mod:MAT
@desc 地形タグ_0：魔法力修正
@default 0
@param Tag_0_Mod:MDF
@desc 地形タグ_0：魔法防御修正
@default 0
@param Tag_0_Mod:AGI
@desc 地形タグ_0：敏捷性修正
@default 0
@param Tag_0_Mod:LUK
@desc 地形タグ_0：運修正
@default 0
@param Tag_0_Mod:HIT
@desc 地形タグ_0：命中率修正
@default 0.0
@param Tag_0_Mod:EVA
@desc 地形タグ_0：回避率修正
@default 0.0
@param Tag_0_Mod:CRI
@desc 地形タグ_0：会心率修正
@default 0.0
@param Tag_0_Mod:CEV
@desc 地形タグ_0：会心回避率修正
@default 0.0
@param Tag_0_Mod:MEV
@desc 地形タグ_0：魔法回避率修正
@default 0.0
@param Tag_0_Mod:MRF
@desc 地形タグ_0：魔法反射率修正
@default 0.0
@param Tag_0_Mod:CNT
@desc 地形タグ_0：反撃率修正
@default 0.0
@param Tag_0_Mod:HRG
@desc 地形タグ_0：HP再生率修正
@default 0.0
@param Tag_0_Mod:MRG
@desc 地形タグ_0：MP再生率修正
@default 0.0
@param Tag_0_Mod:TRG
@desc 地形タグ_0：TP再生率修正
@default 0.0
@param Tag_0_Mod:TGR
@desc 地形タグ_0：狙われ率修正
@default 1.0
@param Tag_0_Mod:GRD
@desc 地形タグ_0：防御効果率修正
@default 1.0
@param Tag_0_Mod:REC
@desc 地形タグ_0：回復効果率修正
@default 1.0
@param Tag_0_Mod:PHA
@desc 地形タグ_0：薬の知識修正
@default 1.0
@param Tag_0_Mod:MCR
@desc 地形タグ_0：MP消費率修正
@default 1.0
@param Tag_0_Mod:TCR
@desc 地形タグ_0：TPチャージ率修正
@default 1.0
@param Tag_0_Mod:PDR
@desc 地形タグ_0：物理ダメージ率修正
@default 1.0
@param Tag_0_Mod:MDR
@desc 地形タグ_0：魔法ダメージ率修正
@default 1.0
@param Tag_0_Mod:FDR
@desc 地形タグ_0：床ダメージ率修正
@default 1.0
@param Tag_0_Mod:EXR
@desc 地形タグ_0：経験獲得率修正
@default 1.0

@param Tag_1_Name
@desc 地形タグ_1：名前（ゲーム内には反映されません）
@default ----
@param Tag_1_MovingCost
@desc 地形タグ_1：移動コスト（1未満には設定できません）
@default 1
@param Tag_1_Mod:ATK
@desc 地形タグ_1：攻撃力修正
@default 0
@param Tag_1_Mod:DEF
@desc 地形タグ_1：防御力修正
@default 0
@param Tag_1_Mod:MAT
@desc 地形タグ_1：魔法力修正
@default 0
@param Tag_1_Mod:MDF
@desc 地形タグ_1：魔法防御修正
@default 0
@param Tag_1_Mod:AGI
@desc 地形タグ_1：敏捷性修正
@default 0
@param Tag_1_Mod:LUK
@desc 地形タグ_1：運修正
@default 0
@param Tag_1_Mod:HIT
@desc 地形タグ_1：命中率修正
@default 0.0
@param Tag_1_Mod:EVA
@desc 地形タグ_1：回避率修正
@default 0.0
@param Tag_1_Mod:CRI
@desc 地形タグ_1：会心率修正
@default 0.0
@param Tag_1_Mod:CEV
@desc 地形タグ_1：会心回避率修正
@default 0.0
@param Tag_1_Mod:MEV
@desc 地形タグ_1：魔法回避率修正
@default 0.0
@param Tag_1_Mod:MRF
@desc 地形タグ_1：魔法反射率修正
@default 0.0
@param Tag_1_Mod:CNT
@desc 地形タグ_1：反撃率修正
@default 0.0
@param Tag_1_Mod:HRG
@desc 地形タグ_1：HP再生率修正
@default 0.0
@param Tag_1_Mod:MRG
@desc 地形タグ_1：MP再生率修正
@default 0.0
@param Tag_1_Mod:TRG
@desc 地形タグ_1：TP再生率修正
@default 0.0
@param Tag_1_Mod:TGR
@desc 地形タグ_1：狙われ率修正
@default 1.0
@param Tag_1_Mod:GRD
@desc 地形タグ_1：防御効果率修正
@default 1.0
@param Tag_1_Mod:REC
@desc 地形タグ_1：回復効果率修正
@default 1.0
@param Tag_1_Mod:PHA
@desc 地形タグ_1：薬の知識修正
@default 1.0
@param Tag_1_Mod:MCR
@desc 地形タグ_1：MP消費率修正
@default 1.0
@param Tag_1_Mod:TCR
@desc 地形タグ_1：TPチャージ率修正
@default 1.0
@param Tag_1_Mod:PDR
@desc 地形タグ_1：物理ダメージ率修正
@default 1.0
@param Tag_1_Mod:MDR
@desc 地形タグ_1：魔法ダメージ率修正
@default 1.0
@param Tag_1_Mod:FDR
@desc 地形タグ_1：床ダメージ率修正
@default 1.0
@param Tag_1_Mod:EXR
@desc 地形タグ_1：経験獲得率修正
@default 1.0

@param Tag_2_Name
@desc 地形タグ_2：名前（ゲーム内には反映されません）
@default ----
@param Tag_2_MovingCost
@desc 地形タグ_2：移動コスト（1未満には設定できません）
@default 1
@param Tag_2_Mod:ATK
@desc 地形タグ_2：攻撃力修正
@default 0
@param Tag_2_Mod:DEF
@desc 地形タグ_2：防御力修正
@default 0
@param Tag_2_Mod:MAT
@desc 地形タグ_2：魔法力修正
@default 0
@param Tag_2_Mod:MDF
@desc 地形タグ_2：魔法防御修正
@default 0
@param Tag_2_Mod:AGI
@desc 地形タグ_2：敏捷性修正
@default 0
@param Tag_2_Mod:LUK
@desc 地形タグ_2：運修正
@default 0
@param Tag_2_Mod:HIT
@desc 地形タグ_2：命中率修正
@default 0.0
@param Tag_2_Mod:EVA
@desc 地形タグ_2：回避率修正
@default 0.0
@param Tag_2_Mod:CRI
@desc 地形タグ_2：会心率修正
@default 0.0
@param Tag_2_Mod:CEV
@desc 地形タグ_2：会心回避率修正
@default 0.0
@param Tag_2_Mod:MEV
@desc 地形タグ_2：魔法回避率修正
@default 0.0
@param Tag_2_Mod:MRF
@desc 地形タグ_2：魔法反射率修正
@default 0.0
@param Tag_2_Mod:CNT
@desc 地形タグ_2：反撃率修正
@default 0.0
@param Tag_2_Mod:HRG
@desc 地形タグ_2：HP再生率修正
@default 0.0
@param Tag_2_Mod:MRG
@desc 地形タグ_2：MP再生率修正
@default 0.0
@param Tag_2_Mod:TRG
@desc 地形タグ_2：TP再生率修正
@default 0.0
@param Tag_2_Mod:TGR
@desc 地形タグ_2：狙われ率修正
@default 1.0
@param Tag_2_Mod:GRD
@desc 地形タグ_2：防御効果率修正
@default 1.0
@param Tag_2_Mod:REC
@desc 地形タグ_2：回復効果率修正
@default 1.0
@param Tag_2_Mod:PHA
@desc 地形タグ_2：薬の知識修正
@default 1.0
@param Tag_2_Mod:MCR
@desc 地形タグ_2：MP消費率修正
@default 1.0
@param Tag_2_Mod:TCR
@desc 地形タグ_2：TPチャージ率修正
@default 1.0
@param Tag_2_Mod:PDR
@desc 地形タグ_2：物理ダメージ率修正
@default 1.0
@param Tag_2_Mod:MDR
@desc 地形タグ_2：魔法ダメージ率修正
@default 1.0
@param Tag_2_Mod:FDR
@desc 地形タグ_2：床ダメージ率修正
@default 1.0
@param Tag_2_Mod:EXR
@desc 地形タグ_2：経験獲得率修正
@default 1.0

@param Tag_3_Name
@desc 地形タグ_3：名前（ゲーム内には反映されません）
@default ----
@param Tag_3_MovingCost
@desc 地形タグ_3：移動コスト（1未満には設定できません）
@default 1
@param Tag_3_Mod:ATK
@desc 地形タグ_3：攻撃力修正
@default 0
@param Tag_3_Mod:DEF
@desc 地形タグ_3：防御力修正
@default 0
@param Tag_3_Mod:MAT
@desc 地形タグ_3：魔法力修正
@default 0
@param Tag_3_Mod:MDF
@desc 地形タグ_3：魔法防御修正
@default 0
@param Tag_3_Mod:AGI
@desc 地形タグ_3：敏捷性修正
@default 0
@param Tag_3_Mod:LUK
@desc 地形タグ_3：運修正
@default 0
@param Tag_3_Mod:HIT
@desc 地形タグ_3：命中率修正
@default 0.0
@param Tag_3_Mod:EVA
@desc 地形タグ_3：回避率修正
@default 0.0
@param Tag_3_Mod:CRI
@desc 地形タグ_3：会心率修正
@default 0.0
@param Tag_3_Mod:CEV
@desc 地形タグ_3：会心回避率修正
@default 0.0
@param Tag_3_Mod:MEV
@desc 地形タグ_3：魔法回避率修正
@default 0.0
@param Tag_3_Mod:MRF
@desc 地形タグ_3：魔法反射率修正
@default 0.0
@param Tag_3_Mod:CNT
@desc 地形タグ_3：反撃率修正
@default 0.0
@param Tag_3_Mod:HRG
@desc 地形タグ_3：HP再生率修正
@default 0.0
@param Tag_3_Mod:MRG
@desc 地形タグ_3：MP再生率修正
@default 0.0
@param Tag_3_Mod:TRG
@desc 地形タグ_3：TP再生率修正
@default 0.0
@param Tag_3_Mod:TGR
@desc 地形タグ_3：狙われ率修正
@default 1.0
@param Tag_3_Mod:GRD
@desc 地形タグ_3：防御効果率修正
@default 1.0
@param Tag_3_Mod:REC
@desc 地形タグ_3：回復効果率修正
@default 1.0
@param Tag_3_Mod:PHA
@desc 地形タグ_3：薬の知識修正
@default 1.0
@param Tag_3_Mod:MCR
@desc 地形タグ_3：MP消費率修正
@default 1.0
@param Tag_3_Mod:TCR
@desc 地形タグ_3：TPチャージ率修正
@default 1.0
@param Tag_3_Mod:PDR
@desc 地形タグ_3：物理ダメージ率修正
@default 1.0
@param Tag_3_Mod:MDR
@desc 地形タグ_3：魔法ダメージ率修正
@default 1.0
@param Tag_3_Mod:FDR
@desc 地形タグ_3：床ダメージ率修正
@default 1.0
@param Tag_3_Mod:EXR
@desc 地形タグ_3：経験獲得率修正
@default 1.0

@param Tag_4_Name
@desc 地形タグ_4：名前（ゲーム内には反映されません）
@default ----
@param Tag_4_MovingCost
@desc 地形タグ_4：移動コスト（1未満には設定できません）
@default 1
@param Tag_4_Mod:ATK
@desc 地形タグ_4：攻撃力修正
@default 0
@param Tag_4_Mod:DEF
@desc 地形タグ_4：防御力修正
@default 0
@param Tag_4_Mod:MAT
@desc 地形タグ_4：魔法力修正
@default 0
@param Tag_4_Mod:MDF
@desc 地形タグ_4：魔法防御修正
@default 0
@param Tag_4_Mod:AGI
@desc 地形タグ_4：敏捷性修正
@default 0
@param Tag_4_Mod:LUK
@desc 地形タグ_4：運修正
@default 0
@param Tag_4_Mod:HIT
@desc 地形タグ_4：命中率修正
@default 0.0
@param Tag_4_Mod:EVA
@desc 地形タグ_4：回避率修正
@default 0.0
@param Tag_4_Mod:CRI
@desc 地形タグ_4：会心率修正
@default 0.0
@param Tag_4_Mod:CEV
@desc 地形タグ_4：会心回避率修正
@default 0.0
@param Tag_4_Mod:MEV
@desc 地形タグ_4：魔法回避率修正
@default 0.0
@param Tag_4_Mod:MRF
@desc 地形タグ_4：魔法反射率修正
@default 0.0
@param Tag_4_Mod:CNT
@desc 地形タグ_4：反撃率修正
@default 0.0
@param Tag_4_Mod:HRG
@desc 地形タグ_4：HP再生率修正
@default 0.0
@param Tag_4_Mod:MRG
@desc 地形タグ_4：MP再生率修正
@default 0.0
@param Tag_4_Mod:TRG
@desc 地形タグ_4：TP再生率修正
@default 0.0
@param Tag_4_Mod:TGR
@desc 地形タグ_4：狙われ率修正
@default 1.0
@param Tag_4_Mod:GRD
@desc 地形タグ_4：防御効果率修正
@default 1.0
@param Tag_4_Mod:REC
@desc 地形タグ_4：回復効果率修正
@default 1.0
@param Tag_4_Mod:PHA
@desc 地形タグ_4：薬の知識修正
@default 1.0
@param Tag_4_Mod:MCR
@desc 地形タグ_4：MP消費率修正
@default 1.0
@param Tag_4_Mod:TCR
@desc 地形タグ_4：TPチャージ率修正
@default 1.0
@param Tag_4_Mod:PDR
@desc 地形タグ_4：物理ダメージ率修正
@default 1.0
@param Tag_4_Mod:MDR
@desc 地形タグ_4：魔法ダメージ率修正
@default 1.0
@param Tag_4_Mod:FDR
@desc 地形タグ_4：床ダメージ率修正
@default 1.0
@param Tag_4_Mod:EXR
@desc 地形タグ_4：経験獲得率修正
@default 1.0

@param Tag_5_Name
@desc 地形タグ_5：名前（ゲーム内には反映されません）
@default ----
@param Tag_5_MovingCost
@desc 地形タグ_5：移動コスト（1未満には設定できません）
@default 1
@param Tag_5_Mod:ATK
@desc 地形タグ_5：攻撃力修正
@default 0
@param Tag_5_Mod:DEF
@desc 地形タグ_5：防御力修正
@default 0
@param Tag_5_Mod:MAT
@desc 地形タグ_5：魔法力修正
@default 0
@param Tag_5_Mod:MDF
@desc 地形タグ_5：魔法防御修正
@default 0
@param Tag_5_Mod:AGI
@desc 地形タグ_5：敏捷性修正
@default 0
@param Tag_5_Mod:LUK
@desc 地形タグ_5：運修正
@default 0
@param Tag_5_Mod:HIT
@desc 地形タグ_5：命中率修正
@default 0.0
@param Tag_5_Mod:EVA
@desc 地形タグ_5：回避率修正
@default 0.0
@param Tag_5_Mod:CRI
@desc 地形タグ_5：会心率修正
@default 0.0
@param Tag_5_Mod:CEV
@desc 地形タグ_5：会心回避率修正
@default 0.0
@param Tag_5_Mod:MEV
@desc 地形タグ_5：魔法回避率修正
@default 0.0
@param Tag_5_Mod:MRF
@desc 地形タグ_5：魔法反射率修正
@default 0.0
@param Tag_5_Mod:CNT
@desc 地形タグ_5：反撃率修正
@default 0.0
@param Tag_5_Mod:HRG
@desc 地形タグ_5：HP再生率修正
@default 0.0
@param Tag_5_Mod:MRG
@desc 地形タグ_5：MP再生率修正
@default 0.0
@param Tag_5_Mod:TRG
@desc 地形タグ_5：TP再生率修正
@default 0.0
@param Tag_5_Mod:TGR
@desc 地形タグ_5：狙われ率修正
@default 1.0
@param Tag_5_Mod:GRD
@desc 地形タグ_5：防御効果率修正
@default 1.0
@param Tag_5_Mod:REC
@desc 地形タグ_5：回復効果率修正
@default 1.0
@param Tag_5_Mod:PHA
@desc 地形タグ_5：薬の知識修正
@default 1.0
@param Tag_5_Mod:MCR
@desc 地形タグ_5：MP消費率修正
@default 1.0
@param Tag_5_Mod:TCR
@desc 地形タグ_5：TPチャージ率修正
@default 1.0
@param Tag_5_Mod:PDR
@desc 地形タグ_5：物理ダメージ率修正
@default 1.0
@param Tag_5_Mod:MDR
@desc 地形タグ_5：魔法ダメージ率修正
@default 1.0
@param Tag_5_Mod:FDR
@desc 地形タグ_5：床ダメージ率修正
@default 1.0
@param Tag_5_Mod:EXR
@desc 地形タグ_5：経験獲得率修正
@default 1.0

@param Tag_6_Name
@desc 地形タグ_6：名前（ゲーム内には反映されません）
@default ----
@param Tag_6_MovingCost
@desc 地形タグ_6：移動コスト（1未満には設定できません）
@default 1
@param Tag_6_Mod:ATK
@desc 地形タグ_6：攻撃力修正
@default 0
@param Tag_6_Mod:DEF
@desc 地形タグ_6：防御力修正
@default 0
@param Tag_6_Mod:MAT
@desc 地形タグ_6：魔法力修正
@default 0
@param Tag_6_Mod:MDF
@desc 地形タグ_6：魔法防御修正
@default 0
@param Tag_6_Mod:AGI
@desc 地形タグ_6：敏捷性修正
@default 0
@param Tag_6_Mod:LUK
@desc 地形タグ_6：運修正
@default 0
@param Tag_6_Mod:HIT
@desc 地形タグ_6：命中率修正
@default 0.0
@param Tag_6_Mod:EVA
@desc 地形タグ_6：回避率修正
@default 0.0
@param Tag_6_Mod:CRI
@desc 地形タグ_6：会心率修正
@default 0.0
@param Tag_6_Mod:CEV
@desc 地形タグ_6：会心回避率修正
@default 0.0
@param Tag_6_Mod:MEV
@desc 地形タグ_6：魔法回避率修正
@default 0.0
@param Tag_6_Mod:MRF
@desc 地形タグ_6：魔法反射率修正
@default 0.0
@param Tag_6_Mod:CNT
@desc 地形タグ_6：反撃率修正
@default 0.0
@param Tag_6_Mod:HRG
@desc 地形タグ_6：HP再生率修正
@default 0.0
@param Tag_6_Mod:MRG
@desc 地形タグ_6：MP再生率修正
@default 0.0
@param Tag_6_Mod:TRG
@desc 地形タグ_6：TP再生率修正
@default 0.0
@param Tag_6_Mod:TGR
@desc 地形タグ_6：狙われ率修正
@default 1.0
@param Tag_6_Mod:GRD
@desc 地形タグ_6：防御効果率修正
@default 1.0
@param Tag_6_Mod:REC
@desc 地形タグ_6：回復効果率修正
@default 1.0
@param Tag_6_Mod:PHA
@desc 地形タグ_6：薬の知識修正
@default 1.0
@param Tag_6_Mod:MCR
@desc 地形タグ_6：MP消費率修正
@default 1.0
@param Tag_6_Mod:TCR
@desc 地形タグ_6：TPチャージ率修正
@default 1.0
@param Tag_6_Mod:PDR
@desc 地形タグ_6：物理ダメージ率修正
@default 1.0
@param Tag_6_Mod:MDR
@desc 地形タグ_6：魔法ダメージ率修正
@default 1.0
@param Tag_6_Mod:FDR
@desc 地形タグ_6：床ダメージ率修正
@default 1.0
@param Tag_6_Mod:EXR
@desc 地形タグ_6：経験獲得率修正
@default 1.0

@param Tag_7_Name
@desc 地形タグ_7：名前（ゲーム内には反映されません）
@default ----
@param Tag_7_MovingCost
@desc 地形タグ_7：移動コスト（1未満には設定できません）
@default 1
@param Tag_7_Mod:ATK
@desc 地形タグ_7：攻撃力修正
@default 0
@param Tag_7_Mod:DEF
@desc 地形タグ_7：防御力修正
@default 0
@param Tag_7_Mod:MAT
@desc 地形タグ_7：魔法力修正
@default 0
@param Tag_7_Mod:MDF
@desc 地形タグ_7：魔法防御修正
@default 0
@param Tag_7_Mod:AGI
@desc 地形タグ_7：敏捷性修正
@default 0
@param Tag_7_Mod:LUK
@desc 地形タグ_7：運修正
@default 0
@param Tag_7_Mod:HIT
@desc 地形タグ_7：命中率修正
@default 0.0
@param Tag_7_Mod:EVA
@desc 地形タグ_7：回避率修正
@default 0.0
@param Tag_7_Mod:CRI
@desc 地形タグ_7：会心率修正
@default 0.0
@param Tag_7_Mod:CEV
@desc 地形タグ_7：会心回避率修正
@default 0.0
@param Tag_7_Mod:MEV
@desc 地形タグ_7：魔法回避率修正
@default 0.0
@param Tag_7_Mod:MRF
@desc 地形タグ_7：魔法反射率修正
@default 0.0
@param Tag_7_Mod:CNT
@desc 地形タグ_7：反撃率修正
@default 0.0
@param Tag_7_Mod:HRG
@desc 地形タグ_7：HP再生率修正
@default 0.0
@param Tag_7_Mod:MRG
@desc 地形タグ_7：MP再生率修正
@default 0.0
@param Tag_7_Mod:TRG
@desc 地形タグ_7：TP再生率修正
@default 0.0
@param Tag_7_Mod:TGR
@desc 地形タグ_7：狙われ率修正
@default 1.0
@param Tag_7_Mod:GRD
@desc 地形タグ_7：防御効果率修正
@default 1.0
@param Tag_7_Mod:REC
@desc 地形タグ_7：回復効果率修正
@default 1.0
@param Tag_7_Mod:PHA
@desc 地形タグ_7：薬の知識修正
@default 1.0
@param Tag_7_Mod:MCR
@desc 地形タグ_7：MP消費率修正
@default 1.0
@param Tag_7_Mod:TCR
@desc 地形タグ_7：TPチャージ率修正
@default 1.0
@param Tag_7_Mod:PDR
@desc 地形タグ_7：物理ダメージ率修正
@default 1.0
@param Tag_7_Mod:MDR
@desc 地形タグ_7：魔法ダメージ率修正
@default 1.0
@param Tag_7_Mod:FDR
@desc 地形タグ_7：床ダメージ率修正
@default 1.0
@param Tag_7_Mod:EXR
@desc 地形タグ_7：経験獲得率修正
@default 1.0

@help
Game_CharacterBase の makeMoveTable関数を書き換えます。
なるべく上の方に置いてください。(SRPG_core直下が望ましいです)

地形タグごとに地形効果を設定できる。
ATK～TRGは修正値を足す。TGR～EXRは修正値を掛ける。
メモ欄に
<srpgTE_TagxMod???:y>（xは地形タグ番号、???は能力値名、yは修正値）
と書くとその数値が優先される。
例：
<srpgTE_Tag1ModATK:10>
↑プラグインパラメータにかかわらず、
地形タグ１のタイル上では攻撃力に+10の修正を得る。
また、<srpgTE_TagxMC:y>（xは地形タグ番号、yはコスト）で移動コストの上書き。

今のところ、
「職業」「エネミー」
のメモ欄を参照する。
*/
(function(){
    var parameters = PluginManager.parameters('SRPG_TerrainEffect');
    var MovingCostList = [];
    var paramModList = [];
    var xparamModList = [];
    var sparamModList = [];
    for (var tagId = 0; tagId < 8; tagId++) {
        MovingCostList[tagId] = Number(parameters['Tag_' + tagId + '_MovingCost'] || 1);
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

    Game_BattlerBase.prototype.getTagId = function() {
        var eventId = 0;
        for (var i = 0; i < $gameSystem._EventToUnit.length; i++) {
            if ($gameSystem.EventToUnit(i)) {
                if ($gameSystem.EventToUnit(i)[1] === this) {
                    eventId = i;
                    break;
                }
            }
        }
        if ($gameMap.event(eventId)) {
            var event = $gameMap.event(eventId);
            return $gameMap.terrainTag(event.posX(), event.posY());
        } else {
            return 0;
        }
    };

    var _Game_BattlerBase_xparam = Game_BattlerBase.prototype.xparam;
    Game_BattlerBase.prototype.xparam = function(xparamId) {
        if ($gameSystem.isSRPGMode() == true) {
            var tagId = this.getTagId();
            var value = _Game_BattlerBase_xparam.call(this, xparamId);
            var terrainMod = xparamModList[tagId][xparamId];
            var unitdata;
            if (this.isActor()) {
                unitdata = this.currentClass();
            }
            if (this.isEnemy()) {
                unitdata = this.enemy();
            }
            if (eval('unitdata.meta.srpgTE_Tag' + tagId + 'Mod' + xparamWordList[xparamId])) {
                terrainMod = Number(eval('unitdata.meta.srpgTE_Tag' + tagId + 'Mod' + xparamWordList[xparamId]));
            }
            value += terrainMod;
            return value;
        } else {
            return _Game_BattlerBase_xparam.call(this, xparamId);
        }
    };

    var _Game_BattlerBase_sparam = Game_BattlerBase.prototype.sparam;
    Game_BattlerBase.prototype.sparam = function(sparamId) {
        if ($gameSystem.isSRPGMode() == true) {
            var tagId = this.getTagId();
            var value = _Game_BattlerBase_sparam.call(this, sparamId);
            var terrainMod = sparamModList[tagId][sparamId];
            var unitdata;
            if (this.isActor()) {
                unitdata = this.currentClass();
            }
            if (this.isEnemy()) {
                unitdata = this.enemy();
            }
            if (eval('unitdata.meta.srpgTE_Tag' + tagId + 'Mod' + sparamWordList[sparamId])) {
                terrainMod = Number(eval('unitdata.meta.srpgTE_Tag' + tagId + 'Mod' + sparamWordList[sparamId]));
            }
            value *= terrainMod;
            return value;
        } else {
            return _Game_BattlerBase_sparam.call(this, sparamId);
        }
    };
    var _Game_Actor_paramPlus = Game_Actor.prototype.paramPlus;
    Game_Actor.prototype.paramPlus = function(paramId) {
        if ($gameSystem.isSRPGMode() == true) {
            var tagId = this.getTagId();
            var value = _Game_Actor_paramPlus.call(this, paramId);
            var terrainMod = paramModList[tagId][paramId];
            var unitdata = this.currentClass();
            if (eval('unitdata.meta.srpgTE_Tag' + tagId + 'Mod' + paramWordList[paramId])) {
                terrainMod = Number(eval('unitdata.meta.srpgTE_Tag' + tagId + 'Mod' + paramWordList[paramId]));
            }
            value += terrainMod;
            return Math.floor(value);
        } else {
            return _Game_Actor_paramPlus.call(this, paramId);
        }
    };
    var _Game_Enemy_paramPlus = Game_Enemy.prototype.paramPlus;
    Game_Enemy.prototype.paramPlus = function(paramId) {
        if ($gameSystem.isSRPGMode() == true) {
            var tagId = this.getTagId();
            var value = _Game_Enemy_paramPlus.call(this, paramId);
            var terrainMod = paramModList[tagId][paramId];
            var unitdata = this.enemy();
            if (eval('unitdata.meta.srpgTE_Tag' + tagId + 'Mod' + paramWordList[paramId])) {
                terrainMod = Number(eval('unitdata.meta.srpgTE_Tag' + tagId + 'Mod' + paramWordList[paramId]));
            }
            value += terrainMod;
            return Math.floor(value);
        } else {
            return _Game_Enemy_paramPlus.call(this, paramId);
        }
    };

//====================================================================================================================
    var _SRPG_SceneMap_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        this.createSrpgTileInfoWindow();
        _SRPG_SceneMap_createAllWindows.call(this);
    };

    Scene_Map.prototype.createSrpgTileInfoWindow = function() {
        console.log('creat')
        this._mapSrpgTileInfoWindow = new Window_SrpgTileInfo(0, 0);
        this._mapSrpgTileInfoWindow.x = Graphics.boxWidth - this._mapSrpgTileInfoWindow.windowWidth();
        this._mapSrpgTileInfoWindow.y = 0;
        this.addWindow(this._mapSrpgTileInfoWindow);
        this._mapSrpgTileInfoWindow.openness = 0;
        if ($gameSystem.isSRPGMode()) this._mapSrpgTileInfoWindow.open();
        else this._mapSrpgTileInfoWindow.close();
    };

    window.Window_SrpgTileInfo = function() {
        this.initialize.apply(this, arguments);
    }

    Window_SrpgTileInfo.prototype = Object.create(Window_Base.prototype);
    Window_SrpgTileInfo.prototype.constructor = Window_SrpgTileInfo;

    Window_SrpgTileInfo.prototype.initialize = function(x, y) {
        this._widthEach = 108;
        this._effectCount = 0;
        var width = this.windowWidth();
        var height = this.windowHeight();
        Window_Base.prototype.initialize.call(this, x, y, width, height);
        this.refresh();
    };

    Window_SrpgTileInfo.prototype.windowWidth = function() {
        return 2 * this._widthEach + this.textPadding() + this.standardPadding() * 2;
    };

    Window_SrpgTileInfo.prototype.windowHeight = function() {
        return this.fittingHeight(1);
    };

    Window_SrpgTileInfo.prototype.refresh = function() {
        this._effectCount = 0;
        this._tagId = $gameMap.terrainTag($gamePlayer.posX(), $gamePlayer.posY());
        this.contents.clear();
        this.drawContents();
        if (this._effectCount == 0) this.close();
    };

    Window_SrpgTileInfo.prototype.drawContents = function() {
        this.drawParamValue(paramModList, paramWordList);
        this.drawParamValue(xparamModList, xparamWordList);
        this.drawParamValue(sparamModList, sparamWordList);
    };

    Window_SrpgTileInfo.prototype.drawParamValue = function(paramList, paramWordList) {
        var pd = this.textPadding();
        for (var i = 0; i < paramWordList.length; i++){
            var value = paramList[this._tagId][i];
            var hasUnit = $gameTemp.activeEvent() && $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())
            if (hasUnit){
                var unit = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1];
                if (unit.isActor()) var unitdata = unit.currentClass();
                if (unit.isEnemy()) var unitdata = unit.enemy();
                var paramPlus = unitdata.meta['srpgTE_Tag' + this._tagId + 'Mod' + paramList[i]] || 0;
                value += Number(paramPlus);
            }
            if (paramList === sparamModList) value -= 1;
            if (value !== 0){
                var sign = value > 0 ? '+' : '';
                if (paramList === paramModList){
                    var info = sign + value;
                } else{
                    var info = sign + Math.round(100 * value) + '%';
                } 
                this.changeTextColor(this.systemColor());
                this.drawText(paramWordList[i], this._effectCount * this._widthEach + pd, 0, this._widthEach / 2 - pd)
                this.resetTextColor();
                console.log(this._effectCount * this._widthEach + this._widthEach / 2, this.windowWidth())
                this.drawText(info, this._effectCount * this._widthEach + this._widthEach / 2, 0, this._widthEach / 2);
                this._effectCount += 1;
            }
        }
    };

    Game_System.prototype.setSrpgTileInfoWindowNeedRefresh = function() {
        this._SrpgTileInfoWindowRefreshFlag = true;
    };

    // ステータスウィンドウのリフレッシュフラグをクリアする
    Game_System.prototype.clearSrpgTileInfoWindowNeedRefresh = function() {
        this._SrpgTileInfoWindowRefreshFlag = false;
    };

    Game_System.prototype.srpgTileInfoWindowNeedRefresh = function() {
        return this._SrpgTileInfoWindowRefreshFlag;
    };

    var _SRPG_Game_Player_startMapEvent = Game_Player.prototype.startMapEvent;
    Game_Player.prototype.startMapEvent = function(x, y, triggers, normal) {
        if ($gameSystem.isSRPGMode()) $gameSystem.setSrpgTileInfoWindowNeedRefresh();
        _SRPG_Game_Player_startMapEvent.call(this, x, y, triggers, normal);
    }

    var _SRPG_SceneMap_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _SRPG_SceneMap_update.call(this);
        if ($gameSystem.isSRPGMode()) {
            if ($gameSystem.srpgTileInfoWindowNeedRefresh()){
                this._mapSrpgTileInfoWindow.refresh();
                $gameSystem.clearSrpgTileInfoWindowNeedRefresh();
            }
            var subPhase = $gameSystem.isSubBattlePhase();
            if ($gameSystem.isBattlePhase() !== 'actor_phase' || subPhase == 'status_window' || subPhase == 'battle_window'){
                this._mapSrpgTileInfoWindow.close();
            } else if (this._mapSrpgTileInfoWindow._effectCount > 0 && this._mapSrpgTileInfoWindow.isClosed()){
                this._mapSrpgTileInfoWindow.open();
            }
        }

        if (!$gameSystem.srpgTileInfoWindowNeedRefresh() && !$gameSystem.isSRPGMode()){
            this._mapSrpgTileInfoWindow.close();
            $gameSystem.setSrpgTileInfoWindowNeedRefresh();
        }
    }

})();