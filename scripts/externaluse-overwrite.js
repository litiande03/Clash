/**
 * externaluse 覆写脚本（对标 profiles/externaluse/externaluse.ini）
 * - 重建 proxy-groups / rule-providers / rules
 * - 分组去 emoji，补 icons/
 * - 保留订阅里的 proxies / proxy-providers
 *
 * 用法：
 * - Clash Verge Rev：订阅 → 脚本 → 粘贴本文件 → 启用
 * - Clashmi / FlClash 等：作为 JS 覆写使用
 *
 * 与 add-group-icons.js 区别：
 * - 本脚本 = 完整分流覆写
 * - add-group-icons.js = 只给现有分组补图标/去 emoji
 */

function main(config) {
  if (!config || typeof config !== "object") return config;

  const ICON =
    "https://raw.githubusercontent.com/litiande03/Clash/master/icons/";
  const RULE =
    "https://raw.githubusercontent.com/litiande03/Clash/refs/heads/master/rules/";
  const BM7 =
    "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/";
  const ACL =
    "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/";

  const TEST_URL = "https://i.ytimg.com/generate_204";

  // 排除 x2+；主要地区（自动选择）
  const FILTER_AUTO =
    "^(?!.*x(?:[2-9]|[1-9][0-9]))(?=.*(?:港|香港|HongKong|HK|Hong Kong|台|台湾|台灣|新北|彰化|TW|Taiwan|新加坡|狮城|SG|Singapore|马来西亚|Malaysia|日本|川日|东京|大阪|泉日|埼玉|沪日|深日|JP|Japan|美国|美利坚|USA|U.S.A|United States|America|波特兰|达拉斯|俄勒冈|凤凰城|费利蒙|硅谷|拉斯维加斯|洛杉矶|圣何塞|圣克拉拉|西雅图|芝加哥|Las Vegas|KR|Korea|韩国|KOR|首尔|韩|韓)).*$";
  // 非港
  const FILTER_AUTO_NO_HK =
    "^(?!.*x(?:[2-9]|[1-9][0-9]))(?=.*(?:台|台湾|台灣|新北|彰化|TW|Taiwan|新加坡|狮城|SG|Singapore|马来西亚|Malaysia|日本|川日|东京|大阪|泉日|埼玉|沪日|深日|JP|Japan|美国|美利坚|USA|U.S.A|United States|America|波特兰|达拉斯|俄勒冈|凤凰城|费利蒙|硅谷|拉斯维加斯|洛杉矶|圣何塞|圣克拉拉|西雅图|芝加哥|Las Vegas|KR|Korea|韩国|KOR|首尔|韩|韓)).*$";
  // 测速（含澳门）
  const FILTER_SPEED =
    "^(?!.*x(?:[2-9]|[1-9][0-9]))(?=.*(?:港|香港|HongKong|HK|Hong Kong|台|台湾|台灣|新北|彰化|TW|Taiwan|新加坡|狮城|SG|Singapore|马来西亚|Malaysia|日本|川日|东京|大阪|泉日|埼玉|沪日|深日|JP|Japan|美国|美利坚|USA|U.S.A|United States|America|波特兰|达拉斯|俄勒冈|凤凰城|费利蒙|硅谷|拉斯维加斯|洛杉矶|圣何塞|圣克拉拉|西雅图|芝加哥|Las Vegas|KR|Korea|韩国|KOR|首尔|韩|韓|澳门|澳門|Macao|Macau)).*$";
  const FILTER_HK = "港|香港|HongKong|HK|Hong Kong";
  const FILTER_MO =
    "^(?!.*x(?:[2-9]|[1-9][0-9]))(?=.*(?:澳门|澳門|Macao|Macau|macao|macau)).*$";
  const FILTER_TW = "台|台湾|台灣|新北|彰化|TW|Taiwan";
  const FILTER_SG = "新加坡|狮城|SG|Singapore";
  const FILTER_MY = "马来西亚|Malaysia";
  const FILTER_JP = "日本|川日|东京|大阪|泉日|埼玉|沪日|深日|JP|Japan";
  const FILTER_US =
    "美国|美利坚|USA|U.S.A|United States|America|波特兰|达拉斯|俄勒冈|凤凰城|费利蒙|硅谷|拉斯维加斯|洛杉矶|圣何塞|圣克拉拉|西雅图|芝加哥|Las Vegas";
  const FILTER_KR = "KR|Korea|韩国|KOR|首尔|韩|韓";
  const FILTER_CN = "广东河源电信|广东广州电信|内网";

  function icon(file) {
    return ICON + file;
  }
  function select(name, proxies, file) {
    return { name: name, type: "select", proxies: proxies, icon: icon(file) };
  }
  function selectFilter(name, filter, file) {
    return {
      name: name,
      type: "select",
      "include-all": true,
      filter: filter,
      icon: icon(file),
    };
  }
  function urlTest(name, filter, file, interval, tolerance) {
    return {
      name: name,
      type: "url-test",
      "include-all": true,
      url: TEST_URL,
      interval: interval || 60,
      tolerance: tolerance || 150,
      filter: filter,
      icon: icon(file),
    };
  }
  function rp(url) {
    return {
      type: "http",
      behavior: "classical",
      format: "text",
      url: url,
      interval: 86400,
    };
  }

  // 基础项（轻量，不强制改端口，避免冲掉客户端设置）
  config.mode = "rule";
  config.ipv6 = true;
  if (!config.profile) config.profile = {};
  config.profile["store-selected"] = true;

  // DNS：对齐 clash-base-nodnsleak（redir-host）
  // 若路由器 OpenClash 自行管 DNS，可注释掉整段 dns
  config.dns = {
    enable: true,
    ipv6: true,
    "enhanced-mode": "redir-host",
    "use-hosts": true,
    "default-nameserver": ["223.5.5.5", "223.6.6.6"],
    "proxy-server-nameserver": ["223.5.5.5", "8.8.8.8"],
    nameserver: [
      "223.5.5.5",
      "223.6.6.6",
      "https://dns.alidns.com/dns-query",
      "https://doh.pub/dns-query",
    ],
    fallback: [
      "1.1.1.1",
      "8.8.8.8",
      "https://1.1.1.1/dns-query",
      "https://8.8.8.8/dns-query",
    ],
    "fallback-filter": {
      geoip: true,
      "geoip-code": "CN",
      ipcidr: ["240.0.0.0/4", "0.0.0.0/32", "127.0.0.1/32"],
    },
  };

  const region = [
    "香港节点",
    "台湾节点",
    "新加坡节点",
    "马来西亚节点",
    "日本节点",
    "美国节点",
    "韩国节点",
  ];
  const regionWithMo = [
    "香港节点",
    "澳门节点",
    "台湾节点",
    "新加坡节点",
    "马来西亚节点",
    "日本节点",
    "美国节点",
    "韩国节点",
  ];
  const regionNoHk = [
    "台湾节点",
    "新加坡节点",
    "马来西亚节点",
    "日本节点",
    "美国节点",
    "韩国节点",
  ];

  config["proxy-groups"] = [
    select(
      "国外流量",
      ["自动选择", "手动切换", "DIRECT"].concat(region),
      "gw.png"
    ),
    select("国内流量", ["DIRECT", "国外流量", "自动选择"], "gn.png"),
    selectFilter("手动切换", ".*", "sdxz.png"),
    urlTest("自动选择", FILTER_AUTO, "zdxz.png", 60, 150),
    urlTest("自动选择(非港)", FILTER_AUTO_NO_HK, "zdxz.png", 60, 150),
    // 仅测速，不参与分流
    urlTest("自动测速", FILTER_SPEED, "Speedtest.png", 15, 50),
    selectFilter("pixman", FILTER_HK, "myTV_SUPER.png"),
    urlTest("奥视澳门", FILTER_MO, "tdm.png", 60, 150),
    selectFilter("4gtv", FILTER_TW, "4GTV.png"),
    select("内网穿透", ["中国大陆节点", "手动切换", "DIRECT"], "nwct.png"),
    selectFilter("中国大陆节点", FILTER_CN, "cn.png"),
    select(
      "漏网之鱼",
      ["国外流量", "自动选择", "DIRECT", "手动切换"],
      "lwzy.png"
    ),
    select(
      "YouTube",
      ["自动选择"].concat(regionWithMo).concat(["手动切换"]),
      "YouTube.png"
    ),
    select(
      "Telegram",
      ["自动选择"].concat(region).concat(["手动切换"]),
      "Telegram.png"
    ),
    select(
      "TikTok",
      ["自动选择(非港)"].concat(regionNoHk).concat(["手动切换"]),
      "TikTok.png"
    ),
    select(
      "OpenAI",
      ["自动选择(非港)"].concat(regionNoHk).concat(["手动切换"]),
      "ChatGPT.png"
    ),
    select(
      "Gemini",
      ["自动选择"].concat(region).concat(["手动切换"]),
      "AI.png"
    ),
    select(
      "Disney+",
      ["自动选择"].concat(region).concat(["手动切换"]),
      "Disney+.png"
    ),
    select(
      "AppleIntelligence",
      ["自动选择(非港)"].concat(regionNoHk).concat(["手动切换"]),
      "Appleintelligence.png"
    ),
    select(
      "Google",
      ["自动选择"].concat(region).concat(["手动切换"]),
      "Google.png"
    ),
    selectFilter("香港节点", FILTER_HK, "hk.png"),
    urlTest("澳门节点", FILTER_MO, "mo.png", 60, 150),
    selectFilter("台湾节点", FILTER_TW, "tw.png"),
    selectFilter("新加坡节点", FILTER_SG, "sg.png"),
    selectFilter("马来西亚节点", FILTER_MY, "my.png"),
    selectFilter("日本节点", FILTER_JP, "jp.png"),
    selectFilter("美国节点", FILTER_US, "us.png"),
    selectFilter("韩国节点", FILTER_KR, "kr.png"),
  ];

  config["rule-providers"] = {
    ip138: rp(RULE + "ip138.list"),
    pixman: rp(RULE + "pixman.list"),
    "pixman-ntp": rp(RULE + "pixman-ntp.list"),
    tmd: rp(RULE + "tmd.list"),
    "4gtv": rp(RULE + "4gtv.list"),
    intranet: rp(RULE + "IntranetIP.list"),
    wechat: rp(BM7 + "WeChat/WeChat.list"),
    youtube: rp(BM7 + "YouTube/YouTube.list"),
    telegram: rp(BM7 + "Telegram/Telegram.list"),
    openai: rp(BM7 + "OpenAI/OpenAI.list"),
    gemini: rp(BM7 + "Gemini/Gemini.list"),
    disney: rp(BM7 + "Disney/Disney.list"),
    "apple-intelligence": rp(
      "https://raw.githubusercontent.com/ddgksf2013/Filter/refs/heads/master/AppleIntelligence.list"
    ),
    tiktok: rp(BM7 + "TikTok/TikTok.list"),
    google: rp(BM7 + "Google/Google.list"),
    gfw: rp(RULE + "ProxyGFWlist1.list"),
    global: rp(BM7 + "Global/Global.list"),
    "china-domain": rp(ACL + "ChinaDomain.list"),
    "china-company-ip": rp(RULE + "ChinaCompanyIp.list"),
    "china-ip": rp(RULE + "ChinaIp.list"),
  };

  // 顺序对齐 externaluse.ini
  config.rules = [
    "RULE-SET,ip138,国外流量",
    "RULE-SET,pixman,pixman",
    "RULE-SET,pixman-ntp,pixman",
    "RULE-SET,tmd,奥视澳门",
    "RULE-SET,4gtv,4gtv",
    "RULE-SET,intranet,内网穿透",
    "RULE-SET,wechat,国内流量",
    "RULE-SET,youtube,YouTube",
    "RULE-SET,telegram,Telegram",
    "RULE-SET,openai,OpenAI",
    "RULE-SET,gemini,Gemini",
    "RULE-SET,disney,Disney+",
    "RULE-SET,apple-intelligence,AppleIntelligence",
    "RULE-SET,tiktok,TikTok",
    "RULE-SET,google,Google",
    "RULE-SET,gfw,国外流量",
    "RULE-SET,global,国外流量",
    "RULE-SET,china-domain,国内流量",
    "RULE-SET,china-company-ip,国内流量,no-resolve",
    "RULE-SET,china-ip,国内流量,no-resolve",
    "GEOIP,CN,国内流量,no-resolve",
    "MATCH,漏网之鱼",
  ];

  return config;
}
