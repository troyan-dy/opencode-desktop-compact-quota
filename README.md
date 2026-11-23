# opencode-desktop-compact-quota

## Установка через агента

Скопируйте в чат агента:

```text
Установи https://github.com/troyan-dy/opencode-desktop-compact-quota для OpenCode Desktop по инструкции в README. Глобально подключи @slkiser/opencode-quota и сам плагин именно в этом порядке. Сохрани текущие настройки и не добавляй дубликаты.
```

Из терминала ту же задачу можно передать агенту OpenCode:

```sh
opencode run "Установи https://github.com/troyan-dy/opencode-desktop-compact-quota для OpenCode Desktop по инструкции в README. Глобально подключи @slkiser/opencode-quota и сам плагин именно в этом порядке. Сохрани текущие настройки и не добавляй дубликаты."
```

---

Compact provider quota display in the OpenCode Desktop composer.

From your global OpenCode configuration directory (normally `~/.config/opencode`):

```sh
git clone https://github.com/troyan-dy/opencode-desktop-compact-quota.git local-themes/compact-quota
```

Add `"./local-themes/compact-quota"` to the `plugins` array in the global `opencode.jsonc`.

Requires [`@slkiser/opencode-quota`](https://github.com/slkiser/opencode-quota) in the same `plugins` list.
