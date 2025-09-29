# shiguang_warehouse

本仓库用于 shiguangschedule 适配脚本的管理和测试。所有适配脚本将集中存放于此，方便软件拉取和测试。

## 仓库结构说明

- `schools.json`：适配学校索引列表，包含所有已适配学校的关键信息。
- `schools/`：存放各学校的适配代码，每个学校一个独立的 JS 文件。
- `LICENSE`：开源协议文件。

## schools.json 字段说明

每个学校索引应包含以下字段：

| 字段名         | 类型    | 说明                                   |
| -------------- | ------- | -------------------------------------- |
| `id`           | String  | 学校唯一标识（建议用拼音或英文缩写）    |
| `name`         | String  | 学校中文全称                           |
| `initial`      | String  | 学校名称的首字母，用于排序和查找        |
| `importUrl`    | String  | 教务系统登录的 URL                         |
| `assetJsPath`  | String  | 适配脚本路径（如 `schools/school.js`）  |
| `maintainer`   | String  | 维护者信息（如姓名或 GitHub 用户名）    |

示例：
```json
[
  {
    "id": "school_Cs",
    "name": "测试大学(这是一个空网站，用于组件测试)",
    "initial": "C",
    "importUrl": "",
    "assetJsPath": "schools/school.js",
    "maintainer": "星河欲转"
  }
]
```

**注意：**  
- 请严格按照上述字段填写，不要添加或减少字段。
- `importUrl` 一定要是登录页面
- `assetJsPath` 填写对应学校的适配脚本路径。
- `maintainer` 填写维护者信息，便于后续沟通和维护。

## 开发流程

1. **Fork 仓库**  
   - 所有开发者需先 fork 本仓库（本仓库带有 `lighthouse` 标签，软件会自动校验仓库标签以保证数据来源正确）。

2. **添加适配代码**  
   - 在 `schools/` 文件夹下新建对应学校的适配 JS 文件。
   - 在 `schools.json` 中添加学校索引信息，确保各字段填写完整。

3. **软件测试**  
   - 开发者需在软件的“我的-更多-更新仓库”中选择**自定义仓库或私有仓库**，来拉取并更新自己的仓库代码进行实际测试，完成 Beta 阶段适配验证。

4. **提交 PR**  
   - 测试通过后，提交 Pull Request，等待审核合并。

## 注意事项

- 请确保 `schools.json` 信息准确，入口文件路径与实际文件一致。
- 每次提交适配代码或索引信息后，建议自测通过再提交 PR。
- 仓库需保留 `lighthouse` 标签，否则软件无法识别为适配仓库。

---

如有问题或建议，欢迎提交 Issue 或 PR。