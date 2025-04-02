package upload

import (
	"context"
	"errors"
	"fmt"
	"github.com/qiniu/go-sdk/v7/auth/qbox"
	"github.com/qiniu/go-sdk/v7/storage"
	"mime/multipart"
	"path/filepath"
	"server/global"
	"server/utils"
	"strings"
	"time"
)

type Qiniu struct {
}

func (*Qiniu) UploadImage(file *multipart.FileHeader) (string, string, error) {
	// 计算文件大小
	size := float64(file.Size) / float64(1024*1024)
	if size >= float64(global.Config.Upload.Size) {
		return "", "", fmt.Errorf("image size exceeds limit: %.2f MB (max: %d MB)", size, global.Config.Upload.Size)
	}

	// 获取文件扩展名
	ext := filepath.Ext(file.Filename)
	name := strings.TrimSuffix(file.Filename, ext)
	if _, exists := WhiteImageList[ext]; !exists {
		return "", "", errors.New("invalid image format")
	}

	// 七牛云上传策略
	putPolicy := storage.PutPolicy{Scope: global.Config.Qiniu.Bucket}
	mac := qbox.NewMac(global.Config.Qiniu.AccessKey, global.Config.Qiniu.SecretKey)
	upToken := putPolicy.UploadToken(mac)
	cfg := qiniuConfig()
	formUploader := storage.NewFormUploader(cfg)
	putRet := storage.PutRet{}
	putExtra := storage.PutExtra{Params: map[string]string{}}

	// 生成唯一文件名
	fileKey := utils.MD5V([]byte(name)) + "-" + time.Now().Format("20060102150405") + ext

	// 读取文件
	data, err := file.Open()
	if err != nil {
		return "", "", err
	}
	defer data.Close()

	// 上传文件
	err = formUploader.Put(context.Background(), &putRet, upToken, fileKey, data, file.Size, &putExtra)
	if err != nil {
		return "", "", err
	}

	// 确保返回完整 URL（包含 http:// 或 https://）
	fullURL := fmt.Sprintf("%s%s", global.Config.Qiniu.ImgPath, putRet.Key)
	return fullURL, putRet.Key, nil
}

func (*Qiniu) DeleteImage(key string) error {
	mac := qbox.NewMac(global.Config.Qiniu.AccessKey, global.Config.Qiniu.SecretKey)
	cfg := qiniuConfig()
	bucketManager := storage.NewBucketManager(mac, cfg)
	return bucketManager.Delete(global.Config.Qiniu.Bucket, key)
}

func qiniuConfig() *storage.Config {
	cfg := storage.Config{
		UseHTTPS:      global.Config.Qiniu.UseHTTPS,
		UseCdnDomains: global.Config.Qiniu.UseCdnDomains,
	}
	switch global.Config.Qiniu.Zone {
	case "z0", "ZoneHuadong":
		cfg.Zone = &storage.ZoneHuadong
	case "z1", "ZoneHuabei":
		cfg.Zone = &storage.ZoneHuabei
	case "z2", "ZoneHuanan":
		cfg.Zone = &storage.ZoneHuanan
	case "na0", "ZoneBeimei":
		cfg.Zone = &storage.ZoneBeimei
	case "as0", "ZoneXinjiapo":
		cfg.Zone = &storage.ZoneXinjiapo
	case "ZoneHuadongZheJiang2":
		cfg.Zone = &storage.ZoneHuadongZheJiang2
	}
	return &cfg
}
