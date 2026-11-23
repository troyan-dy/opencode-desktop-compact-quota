# opencode-desktop-compact-quota

Compact provider quota display in the OpenCode Desktop composer.

## Install in OpenCode Desktop

From the global OpenCode configuration directory (normally `~/.config/opencode`), run:

```sh
git clone https://github.com/troyan-dy/opencode-desktop-compact-quota.git local-themes/compact-quota
```

Add the following entries to the existing `plugins` array in your global `opencode.jsonc`:

```jsonc
{
  "plugins": [
    "@slkiser/opencode-quota",
    "./local-themes/compact-quota"
  ]
}
```

## Usage

Requires [OpenCode Quota](https://github.com/slkiser/opencode-quota). The compact UI reads its provider snapshots, shows the remaining percentage and reset time, and links to the full report. Labels and reset times are formatted in Russian.

This plugin uses the [experimental OpenCode Desktop GUI plugin API](https://opencode.ai/docs/build/plugins/gui).
