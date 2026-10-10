(function () {
  const KEY = "sanjie-ext-by-chat";
  const PROMPT_KEY = "sanjie-quanneng";
  const ctx = () => SillyTavern.getContext();
  const rules = `【三界权能·扩展注入】
你必须遵守以下规则，不依赖世界书。
陈浮生拥有真实之眼、万界簿、词条复制、诸天垂钓、万界人物抽奖、易次元界。
当日第一次对话必须当条完成诸天垂钓，不得延迟。
召唤角色必须是女性出场。男性角色强制娘化并改名。与陈浮生禁止任何亲属关系，只允许恋人、情人、下属、搭档、侍从、契约者。
词条最多8条，满了按相似度融合。
每次使用真实之眼，必须同时输出真实之眼状态栏、万界簿记录结算、词条复制结算。
每次召唤必须输出召唤状态栏，并同时输出万界簿和词条复制。
状态账本是可覆盖当前值，沿用上一条，只改变化项。
【真实之眼·状态栏】
目标： 真实身份： 当前状态： 剧情护体： 当前节点：
基础属性：力量 敏捷 体质 智力 精神 魅力
隐藏能力： 弱点：
秘密档案：黑历史 真实动机 心理弱点 恐惧 欲望 忠诚度
因果线：近3-7日 未来72小时
隐藏资源：资产 密码 情感破绽 可利用关系
【万界簿·记录结算】
记录目标： 目标类型： 等级： 奖励内容：
【词条复制·结算】
原词条： 原等级： 新词条等级： 当前效果： 槽位：
【诸天垂钓·当日收获】
收获一 名称 类型 来源世界 处理方式 魔改与成人向效果
收获二 收获三
【单人召唤·状态栏】
姓名： 来源： 职业： 社会身份： 与我的关系： 当前状态： 最高词条：
【状态账本】
日期： 今日剩余抽奖：/3 今日垂钓： 垂钓空间物品数： 已召唤： 万界簿记录数： 已复制词条数：/8`;
  const chatKey = () => {
    const c = ctx();
    const ch = c.characters && c.characters[c.characterId];
    return ((ch && ch.name) || "卡") + "::" + (c.chatId || c.chat_id || "chat");
  };
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
  const save = (d) => localStorage.setItem(KEY, JSON.stringify(d));
  const field = (raw, k) => { const m = raw.match(new RegExp(k + "[:：]\\s*([^\\n]+)")); return m ? m[1].trim() : ""; };
  const collect = (raw) => {
    const out = [];
    const person = field(raw, "姓名");
    if (raw.includes("【单人召唤·状态栏】") && person) out.push({ type: "人物", name: person, text: "职业：" + field(raw, "职业") + "\n关系：" + field(raw, "与我的关系") });
    const target = field(raw, "记录目标");
    if (raw.includes("【万界簿·记录结算】") && target) out.push({ type: "万界簿", name: target, text: "奖励：" + field(raw, "奖励内容") });
    const trait = field(raw, "原词条");
    if (raw.includes("【词条复制·结算】") && trait) out.push({ type: "词条", name: trait, text: "新等级：" + field(raw, "新词条等级") });
    ["【收获一】", "【收获二】", "【收获三】"].forEach((tag) => {
      const i = raw.indexOf(tag); if (i < 0) return;
      const part = raw.slice(i, i + 350), name = field(part, "名称");
      if (name) out.push({ type: "垂钓", name, text: field(part, "魔改与成人向效果") });
    });
    return out;
  };
  const inject = () => {
    if (typeof setExtensionPrompt !== "function") return;
    const pos = window.extension_prompt_types ? extension_prompt_types.IN_CHAT : 1;
    const role = window.extension_prompt_roles ? extension_prompt_roles.SYSTEM : 0;
    setExtensionPrompt(PROMPT_KEY, rules, pos, 1, false, role);
  };
  const sync = () => {
    inject();
    const key = chatKey();
    const bag = load();
    const list = bag[key] || [];
    const raw = ((ctx().chat || []).slice(-2)).map((m) => m.mes || "").join("\n");
    collect(raw).forEach((item) => {
      const i = list.findIndex((e) => e.type === item.type && e.name === item.name);
      if (i >= 0) list[i] = item; else list.push(item);
    });
    bag[key] = list;
    save(bag);
    return list;
  };
  const open = () => {
    $("#sanjie-panel").remove();
    const list = sync();
    const panel = $('<div id="sanjie-panel"></div>');
    panel.append('<div style="display:flex;justify-content:space-between"><b>三界权能</b><button id="sanjie-close">关闭</button></div>');
    panel.append('<div>规则由扩展注入，不需要世界书。当前聊天 ' + list.length + ' 条。</div>');
    list.forEach((e) => panel.append('<div class="card"><b>' + e.type + " · " + e.name + "</b><div>" + e.text + "</div></div>"));
    if (!list.length) panel.append("<div>这一局还没有记录。</div>");
    $("body").append(panel);
    $("#sanjie-close").on("click", () => $("#sanjie-panel").remove());
  };
  $(() => {
    inject();
    if (!$("#sanjie-btn").length) $('<button id="sanjie-btn">界</button>').on("click", open).appendTo("body");
    if (window.eventSource && window.event_types) {
      eventSource.on(event_types.CHAT_CHANGED, sync);
      if (event_types.GENERATION_STARTED) eventSource.on(event_types.GENERATION_STARTED, inject);
    }
  });
})();
