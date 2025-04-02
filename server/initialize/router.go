package initialize

import (
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"net/http"
	"server/global"
	"server/middleware"
	"server/router"
)

// InitRouter 初始化路由
func InitRouter() *gin.Engine {
	// 设置gin模式
	// gin.DebugMode（默认值）—— 开发模式，日志详细
	// gin.ReleaseMode—— 生产模式，日志简洁，提高性能
	// gin.TestMode—— 测试模式
	gin.SetMode(global.Config.System.Env)
	// 创建 Gin 引擎
	Router := gin.Default()
	// 使用日志记录中间件
	//	true 可能是一个选项，表示是否在 panic 发生时返回 JSON 格式错误信息
	Router.Use(middleware.GinLogger(), middleware.GinRecovery(true))
	// 使用gin会话路由
	// 创建一个基于 Cookie 的会话存储实例
	// global.Config.System.SessionsSecret 是从全局配置中获取的会话密钥，用于对会话数据进行加密
	var store = cookie.NewStore([]byte(global.Config.System.SessionsSecret))
	// 将会话管理中间件应用到 Gin 引擎上，"session" 是会话的名称，后续可以通过这个名称来访问会话数据
	Router.Use(sessions.Sessions("session", store))
	// 将指定目录下的文件提供给客户端
	// "uploads" 是URL路径前缀，http.Dir("uploads")是实际文件系统中存储文件的目录
	Router.StaticFS(global.Config.Upload.Path, http.Dir(global.Config.Upload.Path))
	// 创建路由组
	routerGroup := router.RouterGroupApp

	publicGroup := Router.Group(global.Config.System.RouterPrefix)
	privateGroup := Router.Group(global.Config.System.RouterPrefix)
	privateGroup.Use(middleware.JWTAuth())
	adminGroup := Router.Group(global.Config.System.RouterPrefix)
	adminGroup.Use(middleware.JWTAuth()).Use(middleware.AdminAuth())
	// 后面设置谁可以访问
	{
		routerGroup.InitBaseRouter(publicGroup)
	}
	{
		routerGroup.InitUserRouter(privateGroup, publicGroup, adminGroup)
		routerGroup.InitArticleRouter(privateGroup, publicGroup, adminGroup)
		routerGroup.InitCommentRouter(privateGroup, publicGroup, adminGroup)
		routerGroup.InitFeedbackRouter(privateGroup, publicGroup, adminGroup)
	}
	{
		routerGroup.InitImageRouter(adminGroup)
		routerGroup.InitAdvertisementRouter(adminGroup, publicGroup)
		routerGroup.InitFriendLinkRouter(adminGroup, publicGroup)
		routerGroup.InitWebsiteRouter(adminGroup, publicGroup)
		routerGroup.InitConfigRouter(adminGroup)
	}
	return Router
}
