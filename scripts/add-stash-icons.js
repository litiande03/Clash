#!/usr/bin/env node
/**
 * 按 externaluse-stash.yaml 的 icon 规则，给 Clash / Stash YAML 的 proxy-groups 补 icon。
 * 分组名可对齐 externaluse.ini（带 emoji）或 stash 版（无 emoji）。
 *
 * 用法：
 *   node scripts/add-stash-icons.js input.yaml [output.yaml]
 *   node scripts/add-stash-icons.js --print-map
 *
 * 不传 output 时写回 input；管道：
 *   cat config.yaml | node scripts/add-stash-icons.js - > out.yaml
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ICON_BASE =
  "https://raw.githubusercontent.com/litiande03/Clash/master/stash-ico";

/** 规范名（去 emoji）→ 图标文件名，与 externaluse-stash.yaml 一致 */
const ICON_BY_NAME = {
  国外流量: "gw.png",
  国内流量: "gn.png",
  故障转移: "Dinosaur.png",
  手动切换: "sdxz.png",
  自动选择: "zdxz.png",
  "自动选择(非港)": "zdxz.png",
  pixman: "myTV_SUPER.png",
  "myTV SUPER": "myTV_SUPER.png",
  奥视澳门: "tdm.png",
  "4gtv": "4GTV.png",
  内网穿透: "nwct.png",
  中国大陆节点: "cn.png",
  漏网之鱼: "lwzy.png",
  YouTube: "YouTube.png",
  Telegram: "Telegram.png",
  TikTok: "TikTok.png",
  OpenAI: "ChatGPT.png",
  Gemini: "AI.png",
  "Disney+": "Disney+.png",
  AppleIntelligence: "Appleintelligence.png",
  Google: "Google.png",
  香港节点: "hk.png",
  台湾节点: "tw.png",
  新加坡节点: "sg.png",
  马来西亚节点: "my.png",
  日本节点: "jp.png",
  美国节点: "us.png",
  韩国节点: "kr.png",
  澳门节点: "tdm.png",
};

/** externaluse.ini 里带 emoji 的完整名 → 规范名（可选，优先精确匹配） */
const EMOJI_ALIASES = {
  "🚀 国外流量": "国外流量",
  "🎯 国内流量": "国内流量",
  "👌🏻 手动切换": "手动切换",
  "♻️ 自动选择": "自动选择",
  "♻️ 自动选择(非港)": "自动选择(非港)",
  "❓ pixman": "pixman",
  "🎦 奥视澳门": "奥视澳门",
  "🧋 4gtv": "4gtv",
  "🚄 内网穿透": "内网穿透",
  "🇨🇳 中国大陆节点": "中国大陆节点",
  "🐟 漏网之鱼": "漏网之鱼",
  "📹 YouTube": "YouTube",
  "📲 Telegram": "Telegram",
  "🎵 TikTok": "TikTok",
  "🤖 OpenAI": "OpenAI",
  "✨ Gemini": "Gemini",
  "🎥 Disney+": "Disney+",
  "🍎🤖 AppleIntelligence": "AppleIntelligence",
  "🔍 Google": "Google",
  "🇭🇰 香港节点": "香港节点",
  "🇹🇼 台湾节点": "台湾节点",
  "🇸🇬 新加坡节点": "新加坡节点",
  "🇲🇾 马来西亚节点": "马来西亚节点",
  "🇯🇵 日本节点": "日本节点",
  "🇺🇲 美国节点": "美国节点",
  "🇰🇷 韩国节点": "韩国节点",
  "🇲🇴 澳门节点": "澳门节点",
};

function stripEmoji(name) {
  return String(name)
    .replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{20E3}]/gu,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeGroupName(name) {
  const raw = String(name).trim();
  if (EMOJI_ALIASES[raw]) return EMOJI_ALIASES[raw];
  const stripped = stripEmoji(raw);
  if (ICON_BY_NAME[stripped]) return stripped;
  // 兼容「myTV SUPER」等
  if (/pixman|mytv/i.test(stripped)) return "pixman";
  return stripped;
}

function getIconUrl(groupName) {
  const key = normalizeGroupName(groupName);
  const file = ICON_BY_NAME[key];
  if (!file) return null;
  return `${ICON_BASE}/${file}`;
}

/**
 * 给 YAML 文本中的 proxy-groups 补上 icon（已有 icon 则覆盖为映射表）
 */
function applyIconsToYaml(yamlText) {
  const lines = yamlText.split(/\r?\n/);
  const out = [];
  let inProxyGroups = false;
  let currentName = null;
  let pendingIcon = null;
  let sawIconInGroup = false;
  let indentOfGroup = null;

  function flushPendingIcon(beforeLine) {
    if (pendingIcon == null) return;
    if (!sawIconInGroup) {
      const pad = " ".repeat((indentOfGroup ?? 2) + 2);
      out.push(`${pad}icon: ${pendingIcon}`);
    }
    pendingIcon = null;
    sawIconInGroup = false;
    currentName = null;
    indentOfGroup = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^proxy-groups\s*:/.test(trimmed)) {
      flushPendingIcon();
      inProxyGroups = true;
      out.push(line);
      continue;
    }

    // 离开 proxy-groups（同级顶层 key）
    if (
      inProxyGroups &&
      trimmed &&
      !trimmed.startsWith("#") &&
      !/^\s/.test(line) &&
      !/^-/.test(trimmed)
    ) {
      flushPendingIcon();
      inProxyGroups = false;
      out.push(line);
      continue;
    }

    if (!inProxyGroups) {
      out.push(line);
      continue;
    }

    // 新分组：- name: xxx
    const nameMatch = line.match(/^(\s*)-\s+name:\s*(.+?)\s*$/);
    if (nameMatch) {
      flushPendingIcon();
      indentOfGroup = nameMatch[1].length;
      currentName = nameMatch[2].replace(/^["']|["']$/g, "");
      pendingIcon = getIconUrl(currentName);
      sawIconInGroup = false;
      out.push(line);
      continue;
    }

    // 已有 icon 行：替换
    const iconMatch = line.match(/^(\s*)icon:\s*.+$/);
    if (iconMatch && currentName != null) {
      const url = pendingIcon || getIconUrl(currentName);
      if (url) {
        out.push(`${iconMatch[1]}icon: ${url}`);
        sawIconInGroup = true;
        pendingIcon = null;
        continue;
      }
    }

    // 下一个列表项开始（同级 - ）且不是 name（极少见）
    if (
      currentName != null &&
      indentOfGroup != null &&
      new RegExp(`^ {${indentOfGroup}}-\\s+`).test(line) &&
      !/^\s*-\s+name:/.test(line)
    ) {
      flushPendingIcon();
    }

    out.push(line);
  }

  flushPendingIcon();
  return out.join("\n");
}

function printMap() {
  const rows = Object.keys(ICON_BY_NAME).map((name) => {
    const emojiEntry = Object.entries(EMOJI_ALIASES).find(([, v]) => v === name);
    const emoji = emojiEntry ? emojiEntry[0] : "";
    return `${(emoji || name).padEnd(28)} → ${ICON_BASE}/${ICON_BY_NAME[name]}`;
  });
  console.log(rows.join("\n"));
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--print-map") || args.includes("-m")) {
    printMap();
    return;
  }
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    console.log(`用法:
  node scripts/add-stash-icons.js <input.yaml> [output.yaml]
  node scripts/add-stash-icons.js --print-map

示例:
  node scripts/add-stash-icons.js clash-sub.yaml clash-sub-icon.yaml
  getIconUrl("🚀 国外流量") // => .../gw.png`);
    process.exit(args.length === 0 ? 1 : 0);
  }

  const input = args[0];
  const output = args[1] || (input === "-" ? "-" : input);

  const text =
    input === "-"
      ? fs.readFileSync(0, "utf8")
      : fs.readFileSync(path.resolve(input), "utf8");

  const result = applyIconsToYaml(text);

  if (output === "-") {
    process.stdout.write(result);
    if (!result.endsWith("\n")) process.stdout.write("\n");
  } else {
    fs.writeFileSync(path.resolve(output), result, "utf8");
    console.error(`已写入 icon: ${output}`);
  }
}

module.exports = {
  ICON_BASE,
  ICON_BY_NAME,
  EMOJI_ALIASES,
  stripEmoji,
  normalizeGroupName,
  getIconUrl,
  applyIconsToYaml,
};

if (require.main === module) {
  main();
}
