package router

import (
	"github.com/gin-gonic/gin"
	"server/api"
)

// 将方法统一附加在结构体上，便于方法管理
type BaseRouter struct {
}

func (b *BaseRouter) InitBaseRouter(Router *gin.RouterGroup) {
	// 利用 Router.Group("base") 方法创建了一个新的子路由组 baseRouter
	// 这个子路由组的所有路由都会以 /base 作为前缀
	baseRouter := Router.Group("base")
	baseApi := api.ApiGroupApp.BaseApi
	{
		baseRouter.POST("captcha", baseApi.Captcha)
		baseRouter.POST("sendEmailVerificationCode", baseApi.SendEmailVerificationCode)
		baseRouter.GET("qqLoginURL", baseApi.QQLoginURL)
	}
}
