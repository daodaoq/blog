// 从 zustand 库中导入 create 函数，用于创建状态管理 store
import { create } from 'zustand';
// 从 '../api/website' 模块导入获取网站信息的函数
import { websiteInfo } from '../api/website';
// 从 '../api/config' 模块导入 Website 类型
import type { Website } from '../api/config';

// 定义 WebsiteStore 接口，描述网站状态存储的结构和方法
interface WebsiteStore {
  // 网站信息对象，类型为 Website
  websiteInfo: Website;
  // 表示网站信息是否已经初始化的布尔值
  websiteInfoInitialized: boolean;
  // 初始化网站信息的异步方法，返回一个 Promise<void>
  initializeWebsite: () => Promise<void>;
}

// 使用 create 函数创建一个名为 useWebsiteStore 的状态管理 store
const useWebsiteStore = create<WebsiteStore>((set) => ({
  // 初始化网站信息对象，所有属性都设置为空值
  websiteInfo: {
    logo: '',
    full_logo: '',
    title: '',
    slogan: '',
    slogan_en: '',
    description: '',
    version: '',
    created_at: '',
    icp_filing: '',
    public_security_filing: '',
    bilibili_url: '',
    gitee_url: '',
    github_url: '',
    name: '',
    job: '',
    address: '',
    email: '',
    qq_image: '',
    wechat_image: '',
  },
  // 初始化网站信息是否已初始化的标志为 false
  websiteInfoInitialized: false,

  // 定义初始化网站信息的异步方法
  initializeWebsite: async () => {
    // 调用 websiteInfo 函数获取网站信息
    const res = await websiteInfo();
    // 检查响应的状态码是否为 0，表示请求成功
    if (res.code === 0) {
      // 使用 set 函数更新状态，将获取到的网站信息赋值给 websiteInfo
      // 并将 websiteInfoInitialized 标志设置为 true
      set({
        websiteInfo: res.data,
        websiteInfoInitialized: true,
      });
    }
  },
}));

// 定义一个初始化函数，用于确保 store 在使用时自动调用初始化方法
export const initializeStore = () => {
  // 获取 useWebsiteStore 的当前状态
  const store = useWebsiteStore.getState();
  // 检查网站信息是否还未初始化
  if (!store.websiteInfoInitialized) {
    // 若未初始化，则调用 initializeWebsite 方法进行初始化
    store.initializeWebsite();
  }
};

// 导出 useWebsiteStore 状态管理 store
export default useWebsiteStore;