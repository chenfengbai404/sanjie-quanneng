(function () {
  const KEY = "sanjie-ext-by-chat";
  const ctx = () => SillyTavern.getContext();
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
  const sync = () => {
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
    panel.append('<div>当前聊天 ' + list.length + ' 条。新开聊天为空。</div>');
    list.forEach((e) => panel.append('<div class="card"><b>' + e.type + " · " + e.name + "</b><div>" + e.text + "</div></div>"));
    if (!list.length) panel.append("<div>这一局还没有记录。</div>");
    $("body").append(panel);
    $("#sanjie-close").on("click", () => $("#sanjie-panel").remove());
  };
  $(() => {
    if (!$("#sanjie-btn").length) $('<button id="sanjie-btn">界</button>').on("click", open).appendTo("body");
    if (window.eventSource && window.event_types) eventSource.on(event_types.CHAT_CHANGED, sync);
  });
})();
