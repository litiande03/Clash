# Clash 配置仓库

## 目录

```
Clash/
├── icons/                 # 分组图标（raw URL 固定，勿改路径）
├── rules/                 # 规则集（raw URL 固定，勿改路径）
├── base/                  # 底包（DNS 等）
│   └── clash-base-nodnsleak.yml
├── profiles/
│   ├── home/              # 家庭：Subconverter + OpenClash 覆写
│   ├── externaluse/       # 外用：ini / Shadowrocket / Stash / Verge 脚本配套
│   └── macao/             # 澳门相关 ini
├── scripts/               # 生成 / 覆写辅助脚本
└── local/                 # 仅本机（已 gitignore）
    └── openwrt/           # OpenClash UCI 备份
```

## 常用入口

| 场景 | 文件 |
|------|------|
| 家庭 Subconverter | `profiles/home/Home.ini` |
| 家庭 OpenClash 覆写 | `profiles/home/Home_OpenClash_Overwrite.conf` |
| 外用 Subconverter | `profiles/externaluse/externaluse.ini` |
| 外用 Shadowrocket | `profiles/externaluse/externaluse-shadowrocket.conf` |
| 外用 Stash | `profiles/externaluse/externaluse-stash.yaml` |
| Verge JS 覆写 | `scripts/externaluse-overwrite.js` |

## Raw URL 注意

`icons/`、`rules/` 路径保持不变。配置文件已迁到 `profiles/`、`base/`，推送后请更新订阅/覆写地址，例如：

- `.../master/profiles/home/Home_OpenClash_Overwrite.conf`
- `.../master/base/clash-base-nodnsleak.yml`
- `.../master/profiles/externaluse/externaluse-stash.yaml`

## 脚本

```bash
node scripts/build-externaluse-yaml.js   # 由 shadowrocket.conf 生成 stash yaml
```
