const { MenuItem, Plugin, Style } = require("@opencode/plugin/gui");

const row = '[data-slot="composer-controls"] > div';
const buttonClass = "local-quota-trigger";
const panelClass = "local-quota-panel";
const rpc = {
  id: "slkiser.opencode-quota",
  methods: { snapshot: { input: { type: "object" }, output: { type: "object" } } },
};
const resetFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
});

function element(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}

function windowName(item) {
  if (item.window === "week" && /^(week(ly)?|7d)$/i.test(item.label)) return "Неделя";
  if (item.window === "five_hour" && /^(5\s*h(ours?)?|five[- ]hour)$/i.test(item.label)) return "5 часов";
  return item.label;
}

function renderLimits(body, snapshot) {
  body.replaceChildren();
  for (const provider of snapshot.providers ?? []) {
    const accounts = new Map();
    for (const item of provider.rows ?? []) {
      if (!["quota", "budget"].includes(item.type) || !Number.isFinite(item.percentRemaining)) continue;
      const account = item.account || "";
      if (!accounts.has(account)) accounts.set(account, []);
      accounts.get(account).push(item);
    }
    for (const [account, items] of accounts) {
      const group = element("section");
      const name = !account ? provider.label : account.startsWith(provider.label) ? account : `${provider.label} · ${account}`;
      group.append(element("div", "lq-account", name));
      for (const item of items) {
        const pct = Math.min(100, Math.max(0, item.percentRemaining));
        const block = element("div", "lq-period");
        const line = element("div", "lq-line");
        const value = `${Math.round(pct)}%`;
        line.append(element("span", "", windowName(item)), element("strong", "", value));
        const track = element("div", "lq-track");
        track.setAttribute("aria-hidden", "true");
        const fill = element("div");
        fill.style.width = `${pct}%`;
        if (pct <= 15) fill.dataset.low = "";
        track.append(fill);
        block.append(line, track);
        const reset = Date.parse(item.resetsAt);
        const hints = [];
        if (provider.error || reset <= Date.now()) hints.push("Последние известные данные");
        if (Number.isFinite(reset)) hints.push(`Сброс ${resetFormat.format(reset)}`);
        if (hints.length) block.append(element("small", "", hints.join(" · ")));
        group.append(block);
      }
      body.append(group);
    }
  }
  if (!body.childElementCount) body.textContent = "Провайдер пока не сообщил остаток. Подробности — в полном отчёте.";
}

exports.default = Plugin.define({
  setup(ctx) {
    // Keep the report in the launcher's action list without pinning a panel tab.
    const openReport = () => {
      if (!ctx.commands.run("@slkiser/opencode-quota.server.quota")) ctx.toast.show({ title: "OpenCode Quota недоступен" });
    };
    ctx.add(MenuItem, () => ctx.sessions.current()?.server.builtin ? {
      menu: "session.panel", id: "quota-report", title: "Quota", icon: "status",
      order: -1, run: openReport,
    } : undefined);
    ctx.add(Style, `
      .${buttonClass} {
        order: 1;
        flex: none;
        margin-inline-start: 2px;
        padding: 0 5px;
        height: 22px;
        border: 0;
        border-radius: 4px;
        background: transparent;
        color: var(--v2-text-text-muted);
        font: inherit;
        font-size: 11px;
        cursor: pointer;
      }
      .${buttonClass}:is(:hover, :focus-visible) {
        color: var(--v2-text-text-base);
        background: var(--v2-background-bg-layer-02);
      }
      .${panelClass} {
        position: fixed; inset: auto; margin: 0; padding: 0; box-sizing: border-box;
        width: min(272px, calc(100vw - 16px)); max-height: min(380px, 80vh); overflow: auto;
        border: 1px solid var(--v2-border-base, color-mix(in srgb, currentColor 15%, transparent));
        border-radius: 10px; background: var(--v2-background-bg-layer-01, Canvas);
        color: var(--v2-text-text-base, CanvasText); font: inherit;
        box-shadow: 0 6px 24px rgb(0 0 0 / 20%);
      }
      .${panelClass} header { padding: 13px 15px 0; font-size: 13px; font-weight: 600; }
      .${panelClass} .lq-body { padding: 8px 15px 13px; font-size: 12px; }
      .${panelClass} section + section { margin-top: 14px; }
      .${panelClass} .lq-account, .${panelClass} small { color: var(--v2-text-text-muted); font-size: 11px; }
      .${panelClass} .lq-period { margin-top: 8px; }
      .${panelClass} .lq-line { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
      .${panelClass} strong { font-size: 16px; font-weight: 600; font-variant-numeric: tabular-nums; }
      .${panelClass} .lq-track { margin: 5px 0; height: 4px; border-radius: 4px; overflow: hidden; background: color-mix(in srgb, currentColor 13%, transparent); }
      .${panelClass} .lq-track > div { height: 100%; background: var(--v2-text-text-accent, #559eb1); }
      .${panelClass} .lq-track > div[data-low] { background: var(--v2-state-fg-warning, #cf9751); }
      .${panelClass} footer { border-top: 1px solid color-mix(in srgb, currentColor 10%, transparent); padding: 6px 11px; }
      .${panelClass} footer button { color: var(--v2-text-text-muted); font: inherit; font-size: 11px; padding: 3px 4px; cursor: pointer; }
      .${panelClass} footer button:is(:hover,:focus-visible) { color: var(--v2-text-text-base); }
    `);

    const panel = element("div", panelClass);
    panel.id = "local-quota-summary";
    panel.popover = "auto";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Остаток подписки");
    const body = element("div", "lq-body");
    body.setAttribute("aria-live", "polite");
    const footer = element("footer");
    const report = element("button", "", "Полный отчёт →");
    report.type = "button";
    report.onclick = () => {
      panel.hidePopover();
      openReport();
    };
    footer.append(report);
    panel.append(element("header", "", "Остаток подписки"), body, footer);
    document.body.append(panel);

    let anchor, generation = 0;
    function place() {
      if (!panel.matches(":popover-open")) return;
      if (!anchor?.isConnected || !anchor.getClientRects().length) return panel.hidePopover();
      const a = anchor.getBoundingClientRect();
      const { width, height } = panel.getBoundingClientRect();
      panel.style.left = `${Math.max(8, Math.min(innerWidth - width - 8, a.left + a.width / 2 - width / 2))}px`;
      panel.style.top = `${Math.max(8, a.top >= height + 14 ? a.top - height - 6 : Math.min(innerHeight - height - 8, a.bottom + 6))}px`;
    }
    async function load() {
      const version = ++generation;
      const session = ctx.sessions.current();
      if (session && !session.server.builtin) {
        body.textContent = "Для удалённого сервера нет данных о подписке.";
        return;
      }
      body.textContent = "Загружаю остаток…";
      try {
        const result = await ctx.client.rpc(rpc).snapshot(session ? { sessionID: session.id } : {}, {
          ...(session?.directory ? { location: { directory: session.directory } } : {}),
          signal: AbortSignal.timeout(8000),
        });
        if (version === generation) renderLimits(body, result.snapshot);
      } catch {
        if (version === generation) body.textContent = "Не удалось получить лимиты. Откройте полный отчёт для проверки.";
      }
    }
    panel.addEventListener("beforetoggle", e => {
      if (e.newState === "open") {
        anchor = e.source ?? document.activeElement;
        void load();
      } else generation++;
    });
    panel.addEventListener("toggle", place);
    const size = new ResizeObserver(place);
    size.observe(panel);
    window.addEventListener("resize", place);
    document.addEventListener("scroll", place, true);

    function attach(controls) {
      if (controls.querySelector(`.${buttonClass}`)) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = buttonClass;
      button.textContent = "Квота";
      button.title = "Остаток лимитов подписок";
      button.popoverTargetElement = panel;
      button.setAttribute("aria-haspopup", "dialog");
      controls.append(button);
    }

    function scan(root) {
      if (root.matches(row)) attach(root);
      root.querySelectorAll(row).forEach(attach);
    }
    scan(document.documentElement);
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType === 1 && node.isConnected && (node.childElementCount || node.matches(row))) scan(node);
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      generation++;
      size.disconnect();
      window.removeEventListener("resize", place);
      document.removeEventListener("scroll", place, true);
      panel.remove();
      document.querySelectorAll(`.${buttonClass}`).forEach(button => button.remove());
    };
  },
});
