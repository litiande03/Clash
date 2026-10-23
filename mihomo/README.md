# mihomo-ltd

按本人现有分流习惯（`Home.ini` / `externaluse.ini`）做的 **独立** Mihomo / Stash / Clash Meta 配置，结构参考 [Seven1echo/Yaml](https://github.com/Seven1echo/Yaml)（锚点、rule-providers、icon），**不改动**仓库根目录旧文件。

## 文件

| 文件 | 用途 |
|------|------|
| `externaluse.yaml` | 外用（对齐 externaluse：ip138、内网穿透、媒体、常用 App） |
| `Home.yaml` | 家庭用（对齐 Home：EPG、tvbanywherena、Steam/GitHub/Docker 等） |
| `overwrite.js` | Clash Verge 覆写：给订阅补 icon（分组名已是无 emoji） |
| `build.js` | 重新生成上面两个 yaml |

## 相对旧 ini 的改进

- YAML 锚点复用 url-test 参数
- 地区过滤加强：忽略大小写 + 常见机场码
- 增加 `China` 域名直连（不只靠 `GEOIP,CN`）
- 开启 sniffer，纯 IP / 错误 SNI 时分流更准
- 每组带 `icons/` 图标；`自动测速` 仅测速、15s 间隔、不进规则
- **不含** `proxy-providers`：机场在客户端自行添加

## 用法

### Stash

1. 在 Stash 里添加机场订阅  
2. 配置 → 导入 `externaluse.yaml` 或 `Home.yaml`（或仓库 raw 链接）  
3. 模式选 **rule**

### Clash Verge / Mihomo

1. 订阅照常添加  
2. 可用「配置」导入对应 yaml，或订阅 + 粘贴 `overwrite.js` 补图标  
3. DNS / 分组以 yaml 为准

### 重新生成

改完 `build.js` 后：

```bash
node mihomo-ltd/build.js
```

## 远程链接（推仓库后）

```
https://raw.githubusercontent.com/litiande03/Clash/refs/heads/master/mihomo-ltd/externaluse.yaml
https://raw.githubusercontent.com/litiande03/Clash/refs/heads/master/mihomo-ltd/Home.yaml
```
