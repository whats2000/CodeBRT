# 图像上传

CodeBRT 允许用户将图像上传到聊天室。
此功能在调试视觉信息时非常有用。

:::note
关于图像上传的一个重要注意事项是，这些图像存储在扩展存储空间中。
为了降低 token 的成本，图像仅在最新的使用消息中使用。

如果您对此功能有任何建议或疑虑，请给我反馈。
:::

有多种方法可以将图像上传到聊天室：

- 上传按钮
- 复制和粘贴
- 拖放

## 上传按钮

上传图像最常见的方法是使用上传按钮。

1. 单击上传按钮。

   ![Upload-Button](/img/image-upload/upload-button.png)

2. 选择您要上传的图像。

   ![Upload-Image](/img/image-upload/select-images.png)

   :::tip
   您可以一次选择多张图像。
   :::

3. 在聊天室中预览图像。

   ![Preview-Image](/img/image-upload/preview-image.png)

## 复制和粘贴

另一种上传图像的方法是将图像复制并粘贴到消息框中。

1. 复制图像。
2. 将图像粘贴到消息框中。

   ![Copy-Paste-Image](/img/image-upload/copy-paste-image.png)

## 拖放

您也可以将图像拖放到聊天室中来上传图像。

1. 从文件资源管理器拖动图像。
   
   ![Drag-Image](/img/image-upload/drag-image.png)

2. 按住 Shift 键并将图像放到聊天室中。

   :::note
   VSCode 编辑器要求使用 Shift 键才能将图像放到聊天室视图中。
   :::