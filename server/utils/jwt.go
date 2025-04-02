package utils

import (
    "errors"
    "github.com/golang-jwt/jwt/v4"
    "server/global"
    "server/model/request"
    "time"
)

type JWT struct {
    AccessTokenSecret  []byte // Access Token 的密钥
    RefreshTokenSecret []byte // Refresh Token 的密钥
}

// 按照规范修改错误变量名
var (
    ErrTokenExpired      = errors.New("token is expired")           // Token 已过期
    ErrTokenNotValidYet  = errors.New("token not active yet")       // Token 还不可用
    ErrTokenMalformed    = errors.New("that's not even a token")    // Token 格式错误
    ErrTokenInvalid      = errors.New("couldn't handle this token") // Token 无效
)

// NewJWT 创建一个新的 JWT 实例，初始化 AccessToken 和 RefreshToken 密钥
func NewJWT() *JWT {
    return &JWT{
        AccessTokenSecret:  []byte(global.Config.Jwt.AccessTokenSecret),  // 从全局配置加载 AccessToken 密钥
        RefreshTokenSecret: []byte(global.Config.Jwt.RefreshTokenSecret), // 从全局配置加载 RefreshToken 密钥
    }
}

// CreateAccessClaims 创建 Access Token 的 Claims，包含基本信息和过期时间等
func (j *JWT) CreateAccessClaims(baseClaims request.BaseClaims) request.JwtCustomClaims {
    ep, _ := ParseDuration(global.Config.Jwt.AccessTokenExpiryTime) // 获取过期时间
    claims := request.JwtCustomClaims{
        BaseClaims: baseClaims, // 基本 Claims
        RegisteredClaims: jwt.RegisteredClaims{
            Audience:  jwt.ClaimStrings{"TAP"},                // 受众
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(ep)), // 过期时间
            Issuer:    global.Config.Jwt.Issuer,               // 签名的发行者
        },
    }
    return claims
}

// CreateAccessToken 创建 Access Token，通过 Claims 生成 JWT Token
func (j *JWT) CreateAccessToken(claims request.JwtCustomClaims) (string, error) {
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims) // 创建新的 JWT Token
    return token.SignedString(j.AccessTokenSecret)             // 使用 AccessToken 密钥签名并返回 Token 字符串
}

// CreateRefreshClaims 创建 Refresh Token 的 Claims，包含用户信息和过期时间等
func (j *JWT) CreateRefreshClaims(baseClaims request.BaseClaims) request.JwtCustomRefreshClaims {
    ep, _ := ParseDuration(global.Config.Jwt.RefreshTokenExpiryTime) // 获取过期时间
    claims := request.JwtCustomRefreshClaims{
        UserID: baseClaims.UserID, // 用户 ID
        RegisteredClaims: jwt.RegisteredClaims{
            Audience:  jwt.ClaimStrings{"TAP"},                // 受众
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(ep)), // 过期时间
            Issuer:    global.Config.Jwt.Issuer,               // 签名的发行者
        },
    }
    return claims
}

// CreateRefreshToken 创建 Refresh Token，通过 Claims 生成 JWT Token
func (j *JWT) CreateRefreshToken(claims request.JwtCustomRefreshClaims) (string, error) {
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims) // 创建新的 JWT Token
    return token.SignedString(j.RefreshTokenSecret)            // 使用 RefreshToken 密钥签名并返回 Token 字符串
}

// ParseAccessToken 解析 Access Token，验证 Token 并返回 Claims 信息
func (j *JWT) ParseAccessToken(tokenString string) (*request.JwtCustomClaims, error) {
    claims, err := j.parseToken(tokenString, &request.JwtCustomClaims{}, j.AccessTokenSecret) // 解析 Token
    if err != nil {
        return nil, err
    }
    if customClaims, ok := claims.(*request.JwtCustomClaims); ok { // 确保解析出的 Claims 类型正确
        return customClaims, nil
    }
    return nil, ErrTokenInvalid // 使用修改后的错误变量名
}

// ParseRefreshToken 解析 Refresh Token，验证 Token 并返回 Claims 信息
func (j *JWT) ParseRefreshToken(tokenString string) (*request.JwtCustomRefreshClaims, error) {
    claims, err := j.parseToken(tokenString, &request.JwtCustomRefreshClaims{}, j.RefreshTokenSecret) // 解析 Token
    if err != nil {
        return nil, err
    }
    if refreshClaims, ok := claims.(*request.JwtCustomRefreshClaims); ok { // 确保解析出的 Claims 类型正确
        return refreshClaims, nil
    }
    return nil, ErrTokenInvalid // 使用修改后的错误变量名
}

// parseToken 通用的 Token 解析方法，验证 Token 是否有效并返回 Claims
func (j *JWT) parseToken(tokenString string, claims jwt.Claims, secretKey interface{}) (interface{}, error) {
    token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
        return secretKey, nil // 返回密钥以验证 Token
    })
    if err != nil {
        if ve, ok := err.(*jwt.ValidationError); ok { // 处理 Token 验证错误
            switch {
            case ve.Errors&jwt.ValidationErrorMalformed != 0:
                return nil, ErrTokenMalformed // 使用修改后的错误变量名
            case ve.Errors&jwt.ValidationErrorExpired != 0:
                return nil, ErrTokenExpired // 使用修改后的错误变量名
            case ve.Errors&jwt.ValidationErrorNotValidYet != 0:
                return nil, ErrTokenNotValidYet // 使用修改后的错误变量名
            default:
                return nil, ErrTokenInvalid // 使用修改后的错误变量名
            }
        }
        return nil, ErrTokenInvalid // 使用修改后的错误变量名
    }

    if token.Valid { // 如果 Token 验证通过，返回 Claims
        return token.Claims, nil
    }
    return nil, ErrTokenInvalid // 使用修改后的错误变量名
}