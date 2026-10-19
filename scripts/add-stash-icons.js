/**
 * Clash Verge / Mihomo 脚本：给 proxy-groups 补上与 externaluse-stash.yaml 一致的 icon
 * 分组名兼容 externaluse.ini（带 emoji）与无 emoji 名称
 *
 * 用法（Clash Verge Rev）：
 *   订阅 → 脚本 → 粘贴本文件全部内容 → 启用
 *   必须包含 function main(config) { ... return config; }
 *
 * 文档：https://clashvergerev.com/en/guide/script
 */

const ICON_BASE =
  "https://raw.githubusercontent.com/litiande03/Clash/master/stash-ico";

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
  const raw = String(name || "").trim();
  if (EMOJI_ALIASES[raw]) return EMOJI_ALIASES[raw];
  const stripped = stripEmoji(raw);
  if (ICON_BY_NAME[stripped]) return stripped;
  if (/pixman|mytv/i.test(stripped)) return "pixman";
  return stripped;
}

function getIconUrl(groupName) {
  const key = normalizeGroupName(groupName);
  const file = ICON_BY_NAME[key];
  if (!file) return null;
  return ICON_BASE + "/" + file;
}

function main(config) {
  if (!config || !config["proxy-groups"]) return config;

  const groups = config["proxy-groups"];
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (!group || !group.name) continue;
    const icon = getIconUrl(group.name);
    if (icon) group.icon = icon;
  }

  return config;
}
