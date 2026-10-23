/**
 * Clash Verge 覆写脚本（配合 mihomo-ltd/*.yaml）
 * 若直接导入 yaml，一般已有 icon；本脚本用于「只更新订阅、配置缺 icon」时补齐。
 *
 * 用法：订阅 → 脚本 → 粘贴本文件 → 启用
 */

const ICON_BASE =
  "https://raw.githubusercontent.com/litiande03/Clash/master/icons";

const ICON_BY_NAME = {
  国外流量: "gw.png",
  国内流量: "gn.png",
  手动切换: "sdxz.png",
  自动选择: "zdxz.png",
  "自动选择(非港)": "zdxz.png",
  自动测速: "Speedtest.png",
  pixman: "myTV_SUPER.png",
  奥视澳门: "tdm.png",
  "4gtv": "4GTV.png",
  内网穿透: "nwct.png",
  中国大陆节点: "cn.png",
  漏网之鱼: "lwzy.png",
  "hm-epg": "hk.png",
  "tw-epg": "tw.png",
  tvbanywherena: "TVB.png",
  YouTube: "YouTube.png",
  Telegram: "Telegram.png",
  TikTok: "TikTok.png",
  OpenAI: "ChatGPT.png",
  Gemini: "AI.png",
  "Disney+": "Disney+.png",
  AppleIntelligence: "Appleintelligence.png",
  Google: "Google.png",
  Steam: "Dinosaur.png",
  GitHub: "sdxz.png",
  Docker: "gw.png",
  香港节点: "hk.png",
  澳门节点: "mo.png",
  台湾节点: "tw.png",
  新加坡节点: "sg.png",
  马来西亚节点: "my.png",
  日本节点: "jp.png",
  美国节点: "us.png",
  韩国节点: "kr.png",
};

function main(config) {
  if (!config || !config["proxy-groups"]) return config;
  const groups = config["proxy-groups"];
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    if (!g || !g.name) continue;
    const file = ICON_BY_NAME[g.name];
    if (file) g.icon = ICON_BASE + "/" + file;
  }
  return config;
}
