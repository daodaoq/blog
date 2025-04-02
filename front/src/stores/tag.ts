// 从 zustand 库导入 create 函数，用于创建状态管理 store
import { create } from 'zustand';

// 定义 Tag 接口，描述单个标签的结构
interface Tag {
  // 标签的标题
  title: string;
  // 标签的名称
  name: string;
}

// 定义 TagStore 接口，描述标签存储的状态和操作方法
interface TagStore {
  // 存储标签的数组
  tags: Tag[];
  // 添加新标签的方法，接受一个 Tag 类型的参数
  addTag: (newTag: Tag) => void;
  // 移除指定名称标签的方法，接受一个字符串类型的参数
  removeTag: (tagName: string) => void;
  // 重置标签的方法，无参数
  resetTags: () => void;
}

// 使用 create 函数创建一个标签存储的状态管理 store
const useTagStore = create<TagStore>((set) => {
  // 尝试从 localStorage 中获取已保存的标签数据
  const savedTags = localStorage.getItem('tags');
  // 如果 localStorage 中有保存的标签数据，则解析为对象；否则使用默认的初始标签
  const initialTags = savedTags ? JSON.parse(savedTags) : [
    {
      // 默认标签的标题
      title: "主页",
      // 默认标签的名称
      name: "home"
    }
  ];

  return {
    // 初始化标签状态
    tags: initialTags,

    // 添加标签的方法实现
    addTag: (newTag: Tag) => {
      set((state) => {
        // 复制当前标签数组，并添加新标签
        const updatedTags = [...state.tags, newTag];
        // 将更新后的标签数组存储到 localStorage 中
        localStorage.setItem('tags', JSON.stringify(updatedTags));
        // 返回更新后的标签状态
        return { tags: updatedTags };
      });
    },

    // 移除标签的方法实现
    removeTag: (tagName: string) => {
      set((state) => {
        // 过滤掉名称匹配的标签
        const updatedTags = state.tags.filter(tag => tag.name !== tagName);
        // 将更新后的标签数组存储到 localStorage 中
        localStorage.setItem('tags', JSON.stringify(updatedTags));
        // 返回更新后的标签状态
        return { tags: updatedTags };
      });
    },

    // 重置标签的方法实现
    resetTags: () => {
      // 将标签状态重置为空数组
      set({ tags: [] });
      // 从 localStorage 中移除保存的标签数据
      localStorage.removeItem('tags');
    },
  };
});

// 导出标签存储的状态管理 store
export default useTagStore;