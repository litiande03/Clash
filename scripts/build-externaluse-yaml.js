/**
 * 从 externaluse-shadowrocket.conf 生成 Stash 用的 externaluse-stash.yaml
 * 只含 DNS / 分组 / 分流 / icon；机场订阅在 Stash 里自行添加（不写 proxy-providers）
 *
 * 用法：node scripts/build-externaluse-yaml.js
 */
const fs = require("fs");
const path = require("path");
const { normalizeGroupName, getIconUrl } = require("./group-icons");

const root = path.join(__dirname, "..");
const confPath = path.join(root, "externaluse-shadowrocket.conf");
const outPath = path.join(root, "externaluse-stash.yaml");

function parseSections(text) {
  const sections = {};
  let current = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith(";")) continue;
    const sec = line.match(/^\[(.+)\]$/);
    if (sec) {
      current = sec[1];
      sections[current] = [];
      continue;
    }
    if (current) sections[current].push(raw.replace(/\s+$/, ""));
  }
  return sections;
}

function splitArgs(s) {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseProxyGroups(lines) {
  const groups = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith(";")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const name = line.slice(0, eq).trim();
    const args = splitArgs(line.slice(eq + 1));
    const type = args[0];
    const opts = {
      name,
      type,
      proxies: [],
      filter: null,
      url: null,
      interval: null,
      tolerance: null,
    };

    for (let i = 1; i < args.length; i++) {
      const a = args[i];
      if (a.startsWith("policy-regex-filter=")) {
        opts.filter = a.slice("policy-regex-filter=".length);
      } else if (a.startsWith("url=")) {
        opts.url = a.slice(4);
      } else if (a.startsWith("interval=")) {
        opts.interval = Number(a.slice(9));
      } else if (a.startsWith("tolerance=")) {
        opts.tolerance = Number(a.slice(10));
      } else if (a.startsWith("timeout=")) {
        // ignore
      } else {
        opts.proxies.push(a);
      }
    }
    groups.push(opts);
  }
  return groups;
}

function parseRules(lines) {
  return lines
    .map((raw) => raw.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith(";"));
}

function providerKeyFromUrl(url) {
  try {
    const u = new URL(url);
    const base = path.basename(u.pathname).replace(/\.list$/i, "");
    return (
      base
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "ruleset"
    );
  } catch {
    return "ruleset";
  }
}

function toClashRuleUrl(url) {
  return url.replace("/rule/Shadowrocket/", "/rule/Clash/");
}

function buildRuleProvidersAndRules(rawRules, rename) {
  const providers = {};
  const rules = [];
  const used = new Map();

  function ensureProvider(url) {
    url = toClashRuleUrl(url);
    if (used.has(url)) return used.get(url);
    let key = providerKeyFromUrl(url);
    let n = 2;
    while (providers[key] && providers[key].url !== url) {
      key = `${providerKeyFromUrl(url)}-${n++}`;
    }
    providers[key] = {
      type: "http",
      behavior: "classical",
      format: "text",
      url,
      interval: 86400,
    };
    used.set(url, key);
    return key;
  }

  for (const line of rawRules) {
    if (line.startsWith("RULE-SET,")) {
      const parts = line.split(",");
      const url = parts[1];
      let policy = rename(parts[2]);
      const extra = parts.slice(3);
      const key = ensureProvider(url);
      const tail = extra.length ? "," + extra.join(",") : "";
      rules.push(`RULE-SET,${key},${policy}${tail}`);
    } else if (line.startsWith("GEOIP,")) {
      const parts = line.split(",");
      parts[2] = rename(parts[2]);
      rules.push(parts.join(","));
    } else if (line.startsWith("FINAL,")) {
      rules.push(`MATCH,${rename(line.slice(6))}`);
    } else {
      rules.push(line);
    }
  }

  return { providers, rules };
}

function renderYaml(groups, providers, rules) {
  const groupBlocks = groups.map((g) => {
    const name = g.name;
    let body = `  - name: ${name}\n    type: ${g.type}`;

    if (g.filter != null) {
      body += `\n    include-all: true`;
      if (g.url) body += `\n    url: ${g.url}`;
      if (g.interval != null) body += `\n    interval: ${g.interval}`;
      if (g.tolerance != null) body += `\n    tolerance: ${g.tolerance}`;
      body += `\n    filter: "${g.filter}"`;
    } else if (g.proxies.length) {
      body += `\n    proxies:`;
      for (const p of g.proxies) body += `\n      - ${p}`;
    } else {
      body += `\n    include-all: true`;
    }

    const icon = getIconUrl(name);
    if (icon) body += `\n    icon: ${icon}`;
    return body;
  });

  const providerBlocks = Object.entries(providers)
    .map(
      ([key, p]) => `  ${key}:
    type: ${p.type}
    behavior: ${p.behavior}
    format: ${p.format}
    url: ${p.url}
    interval: ${p.interval}`
    )
    .join("\n");

  const ruleBlocks = rules.map((r) => `  - ${r}`).join("\n");

  return `# 外用 Stash 配置（由 externaluse-shadowrocket.conf 生成）
# 只含 DNS / 分组 / 分流 / icon；机场订阅请在 Stash 里自行添加
# 策略组用 include-all，会自动汇总 Stash 已添加订阅里的节点
#
# 内网穿透注意：
# - Stash：空策略组会被当成 DIRECT。请确认「中国大陆节点」里有家里节点
# - 节点名需匹配 filter：广东河源电信 / 广东广州电信 / 内网
# - 若组为空，请在「内网穿透」里改选「手动切换」并点家里节点
# - 用 IP 访问内网时不要开「绕过局域网/私有地址」（若设置里有）
#
# 用法：
# 1. Stash 首页/订阅里添加机场（只负责节点）
# 2. 配置 > 从文件/URL 导入本 yaml，模式选 rule
# 重新生成：node scripts/build-externaluse-yaml.js
# 远程更新（推到仓库后）：
# https://raw.githubusercontent.com/litiande03/Clash/refs/heads/master/externaluse-stash.yaml

mode: rule
log-level: info
ipv6: true

dns:
  enable: true
  ipv6: true
  # 尽量用真实 IP，避免内网域名落在 fake-ip 后匹配不到 IntranetIP
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
    - https://dns.alidns.com/dns-query
  # 若客户端仍走 fake-ip：私有域名强制真实解析
  fake-ip-filter:
    - geosite:private
    - "+.lan"
    - "+.local"
    - "+.home.arpa"
  nameserver-policy:
    geosite:private: system
    "+.lan": system
    "+.local": system
  fallback:
    - 1.1.1.1
    - https://1.1.1.1/dns-query
  fallback-filter:
    geoip: true
    geoip-code: CN
    ipcidr:
      - 240.0.0.0/4
      - 0.0.0.0/32
      - 127.0.0.1/32

proxy-groups:
${groupBlocks.join("\n\n")}

rule-providers:
${providerBlocks}

rules:
${ruleBlocks}
`;
}

function main() {
  const conf = fs.readFileSync(confPath, "utf8");
  const sections = parseSections(conf);
  const rawGroups = parseProxyGroups(sections["Proxy Group"] || []);
  const rawRules = parseRules(sections.Rule || []);

  const renameMap = {};
  const groups = rawGroups.map((g) => {
    const newName = normalizeGroupName(g.name);
    if (newName !== g.name) renameMap[g.name] = newName;
    let proxies = g.proxies.map((p) =>
      p === "DIRECT" || p === "REJECT" ? p : normalizeGroupName(p)
    );
    // 内网穿透：手动切换放最前，避免「中国大陆节点」为空被当成 DIRECT 后默认直连失败
    if (newName === "内网穿透" && proxies.length) {
      const prefer = ["手动切换", "中国大陆节点", "DIRECT"];
      const rest = proxies.filter((p) => !prefer.includes(p));
      proxies = [...prefer.filter((p) => proxies.includes(p)), ...rest];
    }
    return { ...g, name: newName, proxies };
  });

  const rename = (policy) => {
    if (!policy) return policy;
    if (renameMap[policy]) return renameMap[policy];
    return normalizeGroupName(policy);
  };

  const { providers, rules } = buildRuleProvidersAndRules(rawRules, rename);
  fs.writeFileSync(outPath, renderYaml(groups, providers, rules), "utf8");

  const missing = groups.filter((g) => !getIconUrl(g.name)).map((g) => g.name);
  console.log("wrote", outPath);
  console.log("groups:", groups.length);
  if (missing.length) console.warn("missing icons:", missing.join(", "));
  else console.log("icons: all matched");
}

main();
