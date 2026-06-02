# 清清松项目

## 改代码必验证

每次修改 `index.html` 后，**必须**运行验证脚本确认所有功能正常：

```bash
node test_verify.js local
```

验证通过（25/25）后才能告诉用户"修好了"。

如果验证失败：
1. 看失败项和控制台错误
2. 定位并修复
3. 重新运行验证
4. 全部通过后再推送

## 推送前验证

```bash
node test_verify.js local   # 先本地验证
git push origin master      # 通过后再推送
```

## 部署地址

- GitHub Pages: https://5zm6jpg2kk-sys.github.io/qingqingsong/
- 仓库: git@github.com:5zm6jpg2kk-sys/qingqingsong.git
