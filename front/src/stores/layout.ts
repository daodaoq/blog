// 导入 zustand 库中的 create 函数，用于创建状态管理 store
import { create } from 'zustand';
// 导入 zustand/middleware 中的 persist 函数，用于实现状态的持久化存储
import { persist } from 'zustand/middleware';

// 定义 LayoutState 接口，用于描述状态的结构
interface LayoutState {
  // 侧边栏是否折叠的布尔值
  isCollapse: boolean;
  // 弹出框是否可见的布尔值
  popoverVisible: boolean;
  // 登录框是否可见的布尔值
  loginVisible: boolean;
  // 注册框是否可见的布尔值
  registerVisible: boolean;
  // 忘记密码框是否可见的布尔值
  forgotPasswordVisible: boolean;
  // 重置密码框是否可见的布尔值
  passwordResetVisible: boolean;
  // 是否需要刷新用户表格的布尔值
  shouldRefreshUserTable: boolean;
  // 是否需要刷新图片表格的布尔值
  shouldRefreshImageTable: boolean;
  // 文章创建框是否可见的布尔值
  articleCreateVisible: boolean;
  // 文章更新框是否可见的布尔值
  articleUpdateVisible: boolean;
  // 是否需要刷新文章表格的布尔值
  shouldRefreshArticleTable: boolean;
  // 友情链接创建框是否可见的布尔值
  friendLinkCreateVisible: boolean;
  // 友情链接更新框是否可见的布尔值
  friendLinkUpdateVisible: boolean;
  // 是否需要刷新友情链接表格的布尔值
  shouldRefreshFriendLinkTable: boolean;
  // 广告创建框是否可见的布尔值
  advertisementCreateVisible: boolean;
  // 广告更新框是否可见的布尔值
  advertisementUpdateVisible: boolean;
  // 是否需要刷新广告表格的布尔值
  shouldRefreshAdvertisementTable: boolean;
  // 反馈回复框是否可见的布尔值
  feedbackReplyVisible: boolean;
  // 是否需要刷新反馈表格的布尔值
  shouldRefreshFeedbackTable: boolean;
  // 是否需要刷新评论表格的布尔值
  shouldRefreshCommentTable: boolean;
  // 是否需要刷新评论列表的布尔值
  shouldRefreshCommentList: boolean;
  // 设置 isCollapse 状态的函数，接受一个布尔值作为参数
  setIsCollapse: (isCollapse: boolean) => void;
  // 设置部分状态的函数，接受一个部分 LayoutState 对象作为参数
  setState: (partialState: Partial<LayoutState>) => void;
}

// 使用 create 函数创建一个状态管理 store
const useLayoutStore = create<LayoutState>()(
  // 使用 persist 中间件实现状态的持久化存储
  persist(
    // 状态初始化函数，接受 set 函数作为参数，用于更新状态
    (set) => ({
      // 初始化侧边栏为未折叠状态
      isCollapse: false,
      // 初始化弹出框为不可见状态
      popoverVisible: false,
      // 初始化登录框为不可见状态
      loginVisible: false,
      // 初始化注册框为不可见状态
      registerVisible: false,
      // 初始化忘记密码框为不可见状态
      forgotPasswordVisible: false,
      // 初始化重置密码框为不可见状态
      passwordResetVisible: false,
      // 初始化不需要刷新用户表格
      shouldRefreshUserTable: false,
      // 初始化不需要刷新图片表格
      shouldRefreshImageTable: false,
      // 初始化文章创建框为不可见状态
      articleCreateVisible: false,
      // 初始化文章更新框为不可见状态
      articleUpdateVisible: false,
      // 初始化不需要刷新文章表格
      shouldRefreshArticleTable: false,
      // 初始化友情链接创建框为不可见状态
      friendLinkCreateVisible: false,
      // 初始化友情链接更新框为不可见状态
      friendLinkUpdateVisible: false,
      // 初始化不需要刷新友情链接表格
      shouldRefreshFriendLinkTable: false,
      // 初始化广告创建框为不可见状态
      advertisementCreateVisible: false,
      // 初始化广告更新框为不可见状态
      advertisementUpdateVisible: false,
      // 初始化不需要刷新广告表格
      shouldRefreshAdvertisementTable: false,
      // 初始化反馈回复框为不可见状态
      feedbackReplyVisible: false,
      // 初始化不需要刷新反馈表格
      shouldRefreshFeedbackTable: false,
      // 初始化不需要刷新评论表格
      shouldRefreshCommentTable: false,
      // 初始化不需要刷新评论列表
      shouldRefreshCommentList: false,

      // 设置 isCollapse 状态的函数实现
      setIsCollapse: (isCollapse) => set({ isCollapse }),

      // 设置部分状态的函数实现
      setState: (partialState) => set(partialState),
    }),
    {
      // 持久化存储的 key，用于在存储中标识该状态
      name: 'layout-storage',
      // 只持久化部分状态，这里只持久化 isCollapse 状态
      partialize: (state) => ({ isCollapse: state.isCollapse }),
    }
  )
);

// 导出状态管理 store
export default useLayoutStore;