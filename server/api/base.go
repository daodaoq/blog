package api

import (
	"github.com/gin-gonic/gin"
	"github.com/mojocn/base64Captcha"
	"go.uber.org/zap"
	"server/global"
	"server/model/request"
	"server/model/response"
)

// BaseApi 结构体是一个空结构体，用于组织 API 方法，这样可以更方便地管理和扩展 API 逻辑
type BaseApi struct {
}

// 定义验证码存储
// 使用 base64Captcha 库提供的默认内存存储方式来存储验证码信息
var store = base64Captcha.DefaultMemStore

// Captcha 生成数字验证码
// c 是 *gin.Context 类型的参数，它封装了请求和响应的所有信息，方便处理 HTTP 请求和返回响应
func (baseApi *BaseApi) Captcha(c *gin.Context) {
	// 创建数字验证码的驱动
	// 从全局配置中获取验证码的高度、宽度、长度、最大倾斜度和干扰点数量等参数
	driver := base64Captcha.NewDriverDigit(
		global.Config.Captcha.Height,
		global.Config.Captcha.Width,
		global.Config.Captcha.Length,
		global.Config.Captcha.MaxSkew,
		global.Config.Captcha.DotCount,
	)

	// 创建验证码对象
	// 将验证码驱动和存储对象传入，用于生成和存储验证码
	captcha := base64Captcha.NewCaptcha(driver, store)

	// 生成验证码
	// id 是验证码的唯一标识符，b64s 是 Base64 编码的验证码图片数据
	id, b64s, _, err := captcha.Generate()

	// 检查生成验证码过程中是否出现错误
	if err != nil {
		// 使用全局日志记录器记录错误信息
		global.Log.Error("Failed to generate captcha:", zap.Error(err))
		// 若出现错误，向客户端返回失败响应并附带错误信息
		response.FailWithMessage("Failed to generate captcha", c)
		return
	}
	// 若生成成功，向客户端返回包含验证码 ID 和图片数据的成功响应
	response.OkWithData(response.Captcha{
		CaptchaID: id,
		PicPath:   b64s,
	}, c)
}

// SendEmailVerificationCode 发送邮箱验证码
func (baseApi *BaseApi) SendEmailVerificationCode(c *gin.Context) {
	// 定义一个变量 req 用于存储从请求中解析出来的数据
	var req request.SendEmailVerificationCode
	// 使用 Gin 框架的 ShouldBindJSON 方法将请求体中的 JSON 数据解析到 req 变量中
	err := c.ShouldBindJSON(&req)
	// 检查解析过程中是否出现错误
	if err != nil {
		// 若出现错误，向客户端返回失败响应并附带错误信息
		response.FailWithMessage(err.Error(), c)
		return
	}
	// 验证用户输入的验证码是否正确
	if store.Verify(req.CaptchaID, req.Captcha, true) {
		// 若验证码验证通过，调用 baseService 的 SendEmailVerificationCode 方法发送邮箱验证码
		err = baseService.SendEmailVerificationCode(c, req.Email)
		// 检查发送邮箱验证码过程中是否出现错误
		if err != nil {
			// 若出现错误，使用全局日志记录器记录错误信息
			global.Log.Error("Failed to send email:", zap.Error(err))
			// 向客户端返回失败响应并附带错误信息
			response.FailWithMessage("Failed to send email", c)
			return
		}
		// 若发送成功，向客户端返回成功响应并附带成功信息
		response.OkWithMessage("Successfully sent email", c)
		return
	}
	// 若验证码验证不通过，向客户端返回失败响应并附带错误信息
	response.FailWithMessage("Incorrect verification code", c)
}

// QQLoginURL 返回 QQ 登录链接
func (baseApi *BaseApi) QQLoginURL(c *gin.Context) {
	// 从全局配置中获取 QQ 登录链接
	url := global.Config.QQ.QQLoginURL()
	// 向客户端返回包含 QQ 登录链接的成功响应
	response.OkWithData(url, c)
}
