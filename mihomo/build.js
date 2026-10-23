/**
 * 生成适合本人使用的 Mihomo / Stash / Clash Verge 配置
 * 结构参考 Seven1echo/Yaml（锚点 + rule-providers），分流逻辑对齐现有 ini/conf
 *
 * 用法：node mihomo-ltd/build.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname);
const ICON = "https://raw.githubusercontent.com/litiande03/Clash/master/icons";
const RULE = "https://raw.githubusercontent.com/litiande03/Clash/refs/heads/master/rules";
const BM7 = "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash";

// 排除 x2+ 倍率
const NO_X2 = "(?!.*x(?:[2-9]|[1-9][0-9]))";

// 地区正则（比原 ini 更严：忽略大小写 + 机场码）
const F = {
  hk: `(?i)^${NO_X2}(?=.*(港|香港|hong\\s?kong|(?<![a-z])hk(?![a-z])|hkg|🇭🇰)).*$`,
  mo: `(?i)^${NO_X2}(?=.*(澳门|澳門|macao|macau|🇲🇴)).*$`,
  tw: `(?i)^${NO_X2}(?=.*(台|台湾|台灣|新北|彰化|taiwan|taipei|(?<![a-z])tw(?![a-z])|tpe|khh|🇹🇼)).*$`,
  sg: `(?i)^${NO_X2}(?=.*(新加坡|狮城|singapore|(?<![a-z])sg(?![a-z])|sin|xsp|🇸🇬)).*$`,
  my: `(?i)^${NO_X2}(?=.*(马来西亚|馬來西亞|malaysia|(?<![a-z])my(?![a-z])|kul|🇲🇾)).*$`,
  jp: `(?i)^${NO_X2}(?=.*(日本|川日|东京|大阪|泉日|埼玉|沪日|深日|japan|tokyo|(?<![a-z])jp(?![a-z])|nrt|hnd|kix|🇯🇵)).*$`,
  us: `(?i)^${NO_X2}(?=.*(美国|美利坚|united\\s?states|america|(?<![a-z])us(?![a-z])|usa|lax|sfo|sjc|jfk|波特兰|达拉斯|俄勒冈|凤凰城|费利蒙|硅谷|拉斯维加斯|洛杉矶|圣何塞|圣克拉拉|西雅图|芝加哥|Las Vegas|🇺🇸)).*$`,
  kr: `(?i)^${NO_X2}(?=.*(韩国|韓國|korea|seoul|(?<![a-z])kr(?![a-z])|icn|kor|韩|韓|🇰🇷)).*$`,
  cn: "(?i)(广东河源电信|广东广州电信|内网)",
  // 自动选择：主要地区（含港，不含澳门单独依赖）
  auto: `(?i)^${NO_X2}(?=.*(港|香港|hong\\s?kong|(?<![a-z])hk(?![a-z])|hkg|台|台湾|台灣|taiwan|(?<![a-z])tw(?![a-z])|新加坡|狮城|singapore|(?<![a-z])sg(?![a-z])|马来|malaysia|日本|tokyo|(?<![a-z])jp(?![a-z])|美国|america|(?<![a-z])us(?![a-z])|usa|韩国|korea|(?<![a-z])kr(?![a-z])|韩|韓)).*$`,
  autoNoHk: `(?i)^${NO_X2}(?=.*(台|台湾|台灣|taiwan|(?<![a-z])tw(?![a-z])|新加坡|狮城|singapore|(?<![a-z])sg(?![a-z])|马来|malaysia|日本|tokyo|(?<![a-z])jp(?![a-z])|美国|america|(?<![a-z])us(?![a-z])|usa|韩国|korea|(?<![a-z])kr(?![a-z])|韩|韓)).*$`,
  // 测速：主要地区 + 澳门
  speed: `(?i)^${NO_X2}(?=.*(港|香港|hong\\s?kong|(?<![a-z])hk(?![a-z])|澳门|澳門|macao|macau|台|台湾|台灣|taiwan|新加坡|狮城|singapore|马来|malaysia|日本|tokyo|美国|america|usa|韩国|korea|韩|韓)).*$`,
  tvbUs: `(?i)^${NO_X2}(?!.*AI专用)(?=.*(美国|美利坚|united\\s?states|america|(?<![a-z])us(?![a-z])|usa|lax|sfo|波特兰|达拉斯|拉斯维加斯|洛杉矶|西雅图|芝加哥|Las Vegas)).*$`,
};

function icon(file) {
  return `${ICON}/${file}`;
}

function rp(key, url, behavior = "classical", format = "text") {
  return { key, url, behavior, format };
}

const providersCommon = [
  rp("pixman", `${RULE}/pixman.list`),
  rp("pixman_ntp", `${RULE}/pixman-ntp.list`),
  rp("tmd", `${RULE}/tmd.list`),
  rp("gtv4", `${RULE}/4gtv.list`),
  rp("wechat", `${BM7}/WeChat/WeChat.list`),
  rp("youtube", `${BM7}/YouTube/YouTube.list`),
  rp("telegram", `${BM7}/Telegram/Telegram.list`),
  rp("openai", `${BM7}/OpenAI/OpenAI.list`),
  rp("gemini", `${BM7}/Gemini/Gemini.list`),
  rp("disney", `${BM7}/Disney/Disney.list`),
  rp(
    "apple_intelligence",
    "https://raw.githubusercontent.com/ddgksf2013/Filter/master/AppleIntelligence.list"
  ),
  rp("tiktok", `${BM7}/TikTok/TikTok.list`),
  rp("google", `${BM7}/Google/Google.list`),
  rp("gfw", `${RULE}/ProxyGFWlist1.list`),
  // 补强国内直连：域名 + 公司 IP（相对只靠 GEOIP 更稳）
  rp("china_domain", `${BM7}/China/China.list`),
  rp("china_company_ip", `${RULE}/ChinaCompanyIp.list`),
];

const providersExternal = [
  rp("ip138", `${RULE}/ip138.list`),
  rp("intranet", `${RULE}/IntranetIP.list`),
  ...providersCommon,
];

const providersHome = [
  rp("hm_epg", `${RULE}/hm-epg.list`),
  rp("tw_epg", `${RULE}/tw-epg.list`),
  ...providersCommon.filter((p) => p.key !== "china_company_ip"),
  rp("tvbanywherena", `${RULE}/tvbanywherena.list`),
  rp("steam", `${BM7}/Steam/Steam.list`),
  rp("github", `${BM7}/GitHub/GitHub.list`),
  rp("docker", `${BM7}/Docker/Docker.list`),
];

function renderProviders(list) {
  return list
    .map(
      (p) => `  ${p.key}:
    type: http
    behavior: ${p.behavior}
    format: ${p.format}
    url: ${p.url}
    interval: 86400`
    )
    .join("\n");
}

// select 地区组不过滤 x2（手动可全选）；url-test 组保留 NO_X2
function selectFilter(raw) {
  // 从 url-test 风格变成 select：去掉 NO_X2，保留 (?i)^(?=...).*$
  return raw.replace(NO_X2, "");
}

function regionGroupsFixed() {
  const rows = [
    ["香港节点", "select", selectFilter(F.hk), "hk.png"],
    ["澳门节点", "url-test", F.mo, "mo.png"],
    ["台湾节点", "select", selectFilter(F.tw), "tw.png"],
    ["新加坡节点", "select", selectFilter(F.sg), "sg.png"],
    ["马来西亚节点", "select", selectFilter(F.my), "my.png"],
    ["日本节点", "select", selectFilter(F.jp), "jp.png"],
    ["美国节点", "select", selectFilter(F.us), "us.png"],
    ["韩国节点", "select", selectFilter(F.kr), "kr.png"],
  ];
  return rows
    .map(([name, type, filter, ico]) => {
      if (type === "url-test") {
        return `  - name: ${name}
    <<: *ut
    filter: "${filter}"
    icon: ${icon(ico)}`;
      }
      return `  - name: ${name}
    type: select
    include-all: true
    filter: "${filter}"
    icon: ${icon(ico)}`;
    })
    .join("\n\n");
}

function appSelect(name, proxies, ico) {
  return `  - name: ${name}
    type: select
    proxies:
${proxies.map((p) => `      - ${p}`).join("\n")}
    icon: ${icon(ico)}`;
}

const REGIONS = [
  "香港节点",
  "澳门节点",
  "台湾节点",
  "新加坡节点",
  "马来西亚节点",
  "日本节点",
  "美国节点",
  "韩国节点",
];
const REGIONS_NO_MO = REGIONS.filter((x) => x !== "澳门节点");
const REGIONS_NO_HK = REGIONS.filter((x) => x !== "香港节点" && x !== "澳门节点");

function header(title, profile) {
  return `# ${title}
# 独立目录：mihomo-ltd/（不改动仓库根目录旧 ini/conf）
# 结构参考 Seven1echo/Yaml：锚点 + rule-providers + icon
# 分流对齐本人现有 ${profile}；订阅请在客户端自行添加（本文件不含 proxy-providers）
# 重新生成：node mihomo-ltd/build.js
# DNS：redir-host（不用 fake-ip），兼顾防泄露与节点可用性

mode: rule
log-level: info
ipv6: true
unified-delay: true
tcp-concurrent: true
profile:
  store-selected: true

# ══ 锚点（未知字段会被内核忽略，仅供 YAML 合并） ══
Anchor_UT: &ut
  type: url-test
  include-all: true
  url: https://i.ytimg.com/generate_204
  interval: 60
  tolerance: 150
  lazy: true

dns:
  enable: true
  ipv6: true
  enhanced-mode: redir-host
  use-hosts: true
  default-nameserver:
    - 223.5.5.5
    - 223.6.6.6
  proxy-server-nameserver:
    - 223.5.5.5
    - 8.8.8.8
  nameserver:
    - 223.5.5.5
    - 223.6.6.6
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
  fallback:
    - 1.1.1.1
    - 8.8.8.8
    - https://1.1.1.1/dns-query
    - https://8.8.8.8/dns-query
  fallback-filter:
    geoip: true
    geoip-code: CN
    ipcidr:
      - 240.0.0.0/4
      - 0.0.0.0/32
      - 127.0.0.1/32

sniffer:
  enable: true
  parse-pure-ip: true
  override-destination: false
  sniff:
    HTTP:
      ports: [80, 8080-8880]
    TLS:
      ports: [443, 8443]
`;
}

function buildExternal() {
  const groups = `
proxy-groups:
  - name: 国外流量
    type: select
    proxies:
      - 自动选择
      - 手动切换
      - DIRECT
${REGIONS_NO_MO.map((r) => `      - ${r}`).join("\n")}
    icon: ${icon("gw.png")}

  - name: 国内流量
    type: select
    proxies:
      - DIRECT
      - 国外流量
      - 自动选择
    icon: ${icon("gn.png")}

  - name: 手动切换
    type: select
    include-all: true
    icon: ${icon("sdxz.png")}

  - name: 自动选择
    <<: *ut
    filter: "${F.auto}"
    icon: ${icon("zdxz.png")}

  - name: 自动选择(非港)
    <<: *ut
    filter: "${F.autoNoHk}"
    icon: ${icon("zdxz.png")}

  # 仅测速，不参与任何 RULE
  - name: 自动测速
    <<: *ut
    interval: 15
    tolerance: 50
    filter: "${F.speed}"
    icon: ${icon("Speedtest.png")}

  - name: pixman
    type: select
    include-all: true
    filter: "${selectFilter(F.hk)}"
    icon: ${icon("myTV_SUPER.png")}

  - name: 奥视澳门
    <<: *ut
    filter: "${F.mo}"
    icon: ${icon("tdm.png")}

  - name: 4gtv
    type: select
    include-all: true
    filter: "${selectFilter(F.tw)}"
    icon: ${icon("4GTV.png")}

  - name: 内网穿透
    type: select
    proxies:
      - 中国大陆节点
      - 手动切换
      - DIRECT
    icon: ${icon("nwct.png")}

  - name: 中国大陆节点
    type: select
    include-all: true
    filter: "${F.cn}"
    icon: ${icon("cn.png")}

  - name: 漏网之鱼
    type: select
    proxies:
      - 国外流量
      - 自动选择
      - DIRECT
      - 手动切换
    icon: ${icon("lwzy.png")}

${appSelect("YouTube", ["自动选择", ...REGIONS, "手动切换"], "YouTube.png")}

${appSelect("Telegram", ["自动选择", ...REGIONS_NO_MO, "手动切换"], "Telegram.png")}

${appSelect("TikTok", ["自动选择(非港)", ...REGIONS_NO_HK, "手动切换"], "TikTok.png")}

${appSelect("OpenAI", ["自动选择(非港)", ...REGIONS_NO_HK, "手动切换"], "ChatGPT.png")}

${appSelect("Gemini", ["自动选择", ...REGIONS_NO_MO, "手动切换"], "AI.png")}

${appSelect("Disney+", ["自动选择", ...REGIONS_NO_MO, "手动切换"], "Disney+.png")}

${appSelect("AppleIntelligence", ["自动选择(非港)", ...REGIONS_NO_HK, "手动切换"], "Appleintelligence.png")}

${appSelect("Google", ["自动选择", ...REGIONS_NO_MO, "手动切换"], "Google.png")}

${regionGroupsFixed()}
`.trimEnd();

  const rules = `
rules:
  - RULE-SET,ip138,国外流量
  - RULE-SET,pixman,pixman
  - RULE-SET,pixman_ntp,pixman
  - RULE-SET,tmd,奥视澳门
  - RULE-SET,gtv4,4gtv
  - RULE-SET,intranet,内网穿透
  - RULE-SET,wechat,国内流量
  - RULE-SET,youtube,YouTube
  - RULE-SET,telegram,Telegram
  - RULE-SET,openai,OpenAI
  - RULE-SET,gemini,Gemini
  - RULE-SET,disney,Disney+
  - RULE-SET,apple_intelligence,AppleIntelligence
  - RULE-SET,tiktok,TikTok
  - RULE-SET,google,Google
  - RULE-SET,gfw,国外流量
  - RULE-SET,china_domain,国内流量
  - RULE-SET,china_company_ip,国内流量,no-resolve
  - GEOIP,CN,国内流量,no-resolve
  - MATCH,漏网之鱼
`.trimEnd();

  return (
    header("外用 Mihomo / Stash 配置（对齐 externaluse）", "externaluse.ini") +
    "\n" +
    groups +
    "\n\nrule-providers:\n" +
    renderProviders(providersExternal) +
    "\n\n" +
    rules +
    "\n"
  );
}

function buildHome() {
  const groups = `
proxy-groups:
  - name: 国外流量
    type: select
    proxies:
      - 自动选择
      - 手动切换
      - DIRECT
${REGIONS_NO_MO.map((r) => `      - ${r}`).join("\n")}
    icon: ${icon("gw.png")}

  - name: 国内流量
    type: select
    proxies:
      - DIRECT
      - 国外流量
      - 自动选择
    icon: ${icon("gn.png")}

  - name: 手动切换
    type: select
    include-all: true
    icon: ${icon("sdxz.png")}

  - name: 自动选择
    <<: *ut
    filter: "${F.auto}"
    icon: ${icon("zdxz.png")}

  - name: 自动选择(非港)
    <<: *ut
    filter: "${F.autoNoHk}"
    icon: ${icon("zdxz.png")}

  - name: 自动测速
    <<: *ut
    interval: 15
    tolerance: 50
    filter: "${F.speed}"
    icon: ${icon("Speedtest.png")}

  - name: pixman
    type: select
    include-all: true
    filter: "${selectFilter(F.hk)}"
    icon: ${icon("myTV_SUPER.png")}

  - name: 奥视澳门
    <<: *ut
    filter: "${F.mo}"
    icon: ${icon("tdm.png")}

  - name: 4gtv
    type: select
    include-all: true
    filter: "${selectFilter(F.tw)}"
    icon: ${icon("4GTV.png")}

  - name: hm-epg
    <<: *ut
    tolerance: 80
    filter: "${F.hk}"
    icon: ${icon("hk.png")}

  - name: tw-epg
    <<: *ut
    filter: "${F.tw}"
    icon: ${icon("tw.png")}

  - name: tvbanywherena
    <<: *ut
    filter: "${F.tvbUs}"
    icon: ${icon("TVB.png")}

  - name: 漏网之鱼
    type: select
    proxies:
      - 国外流量
      - 自动选择
      - DIRECT
      - 手动切换
    icon: ${icon("lwzy.png")}

${appSelect("YouTube", ["自动选择", ...REGIONS, "手动切换"], "YouTube.png")}

${appSelect("Telegram", ["自动选择", ...REGIONS_NO_MO, "手动切换"], "Telegram.png")}

${appSelect("TikTok", ["自动选择(非港)", ...REGIONS_NO_HK, "手动切换"], "TikTok.png")}

${appSelect("OpenAI", ["自动选择(非港)", ...REGIONS_NO_HK, "手动切换"], "ChatGPT.png")}

${appSelect("Gemini", ["自动选择", ...REGIONS_NO_MO, "手动切换"], "AI.png")}

${appSelect("Disney+", ["自动选择", ...REGIONS_NO_MO, "手动切换"], "Disney+.png")}

${appSelect("AppleIntelligence", ["自动选择(非港)", ...REGIONS_NO_HK, "手动切换"], "Appleintelligence.png")}

${appSelect("Docker", ["自动选择", ...REGIONS_NO_MO, "手动切换"], "gw.png")}

${appSelect(
  "Steam",
  ["DIRECT", "自动选择", ...REGIONS_NO_MO, "手动切换"],
  "Dinosaur.png"
)}

${appSelect("GitHub", ["自动选择", ...REGIONS_NO_MO, "手动切换"], "sdxz.png")}

${appSelect("Google", ["自动选择", ...REGIONS_NO_MO, "手动切换"], "Google.png")}

${regionGroupsFixed()}
`.trimEnd();

  const rules = `
rules:
  - RULE-SET,hm_epg,hm-epg
  - RULE-SET,tw_epg,tw-epg
  - RULE-SET,pixman,pixman
  - RULE-SET,pixman_ntp,pixman
  - RULE-SET,tmd,奥视澳门
  - RULE-SET,gtv4,4gtv
  - RULE-SET,tvbanywherena,tvbanywherena
  - RULE-SET,wechat,国内流量
  - RULE-SET,youtube,YouTube
  - RULE-SET,telegram,Telegram
  - RULE-SET,openai,OpenAI
  - RULE-SET,gemini,Gemini
  - RULE-SET,disney,Disney+
  - RULE-SET,apple_intelligence,AppleIntelligence
  - RULE-SET,tiktok,TikTok
  - RULE-SET,steam,Steam
  - RULE-SET,github,GitHub
  - RULE-SET,google,Google
  - RULE-SET,docker,Docker
  - RULE-SET,gfw,国外流量
  - RULE-SET,china_domain,国内流量
  - GEOIP,CN,国内流量,no-resolve
  - MATCH,漏网之鱼
`.trimEnd();

  return (
    header("家庭用 Mihomo / Stash 配置（对齐 Home.ini）", "Home.ini") +
    "\n" +
    groups +
    "\n\nrule-providers:\n" +
    renderProviders(providersHome) +
    "\n\n" +
    rules +
    "\n"
  );
}

const external = buildExternal();
const home = buildHome();
fs.writeFileSync(path.join(ROOT, "externaluse.yaml"), external, "utf8");
fs.writeFileSync(path.join(ROOT, "Home.yaml"), home, "utf8");
console.log("wrote mihomo-ltd/externaluse.yaml");
console.log("wrote mihomo-ltd/Home.yaml");
