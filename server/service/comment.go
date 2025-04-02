package service

import (
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/gofrs/uuid"
	"gorm.io/gorm"
	"server/global"
	"server/model/appTypes"
	"server/model/database"
	"server/model/other"
	"server/model/request"
	"server/utils"
	"sync"
)

type CommentService struct{}

// CommentInfoByArticleID 获取文章评论列表（带子评论）
func (cs *CommentService) CommentInfoByArticleID(req request.CommentInfoByArticleID) ([]database.Comment, error) {
	var comments []database.Comment

	// 使用事务确保数据一致性
	err := global.DB.Transaction(func(tx *gorm.DB) error {
		// 查找指定文章的一级评论
		if err := tx.Where("article_id = ? AND p_id IS NULL", req.ArticleID).
			Preload("User", func(db *gorm.DB) *gorm.DB {
				return db.Select("uuid, username, avatar, address, signature")
			}).
			Find(&comments).Error; err != nil {
			return err
		}

		// 使用goroutine并行加载子评论
		var wg sync.WaitGroup
		errChan := make(chan error, len(comments))

		for i := range comments {
			wg.Add(1)
			go func(comment *database.Comment) {
				defer wg.Done()
				if err := cs.loadChildren(comment); err != nil {
					errChan <- err
				}
			}(&comments[i])
		}

		wg.Wait()
		close(errChan)

		for err := range errChan {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return comments, nil
}

// CommentNew 获取最新评论
func (cs *CommentService) CommentNew() ([]database.Comment, error) {
	var comments []database.Comment
	err := global.DB.Order("created_at desc").Limit(5).
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("uuid, username, avatar, address, signature")
		}).
		Find(&comments).Error
	if err != nil {
		return nil, err
	}
	return comments, nil
}

// CommentCreate 创建新评论
func (cs *CommentService) CommentCreate(req request.CommentCreate) error {
	comment := database.Comment{
		ArticleID: req.ArticleID,
		UserUUID:  req.UserUUID,
		Content:   req.Content,
	}

	// 只有当PID有效时才设置，否则保持NULL
	if req.PID != nil && *req.PID > 0 {
		// 验证父评论是否存在
		if exists, err := cs.commentExists(*req.PID); err != nil {
			return err
		} else if !exists {
			return errors.New("父评论不存在")
		}
		comment.PID = req.PID
	}

	return global.DB.Create(&comment).Error
}

// CommentDelete 删除评论
func (cs *CommentService) CommentDelete(c *gin.Context, req request.CommentDelete) error {
	if len(req.IDs) == 0 {
		return nil
	}

	return global.DB.Transaction(func(tx *gorm.DB) error {
		for _, id := range req.IDs {
			var comment database.Comment
			if err := tx.Take(&comment, id).Error; err != nil {
				return err
			}

			userUUID := utils.GetUUID(c)
			userRoleID := utils.GetRoleID(c)
			if userUUID != comment.UserUUID && userRoleID != appTypes.Admin {
				return errors.New("没有权限删除此评论")
			}

			if err := cs.deleteCommentAndChildren(tx, id); err != nil {
				return err
			}
		}
		return nil
	})
}

// CommentInfo 获取用户评论信息
func (cs *CommentService) CommentInfo(uuid uuid.UUID) ([]database.Comment, error) {
	var rawComments []database.Comment
	err := global.DB.Order("created_at desc").
		Where("user_uuid = ?", uuid).
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("uuid, username, avatar, address, signature")
		}).
		Find(&rawComments).Error
	if err != nil {
		return nil, err
	}

	for i := range rawComments {
		if err := cs.loadChildren(&rawComments[i]); err != nil {
			return nil, err
		}
	}

	// 评论去重
	var comments []database.Comment
	idMap := cs.findChildCommentsIDByRootCommentUserUUID(rawComments)
	for i := range rawComments {
		if _, exists := idMap[rawComments[i].ID]; !exists {
			comments = append(comments, rawComments[i])
		}
	}
	return comments, nil
}

// CommentList 评论列表分页查询
func (cs *CommentService) CommentList(info request.CommentList) (interface{}, int64, error) {
	db := global.DB.Model(&database.Comment{})

	if info.ArticleID != nil {
		db = db.Where("article_id = ?", *info.ArticleID)
	}

	if info.UserUUID != nil {
		db = db.Where("user_uuid = ?", *info.UserUUID)
	}

	if info.Content != nil {
		db = db.Where("content LIKE ?", "%"+*info.Content+"%")
	}

	option := other.MySQLOption{
		PageInfo: info.PageInfo,
		Where:    db,
	}

	return utils.MySQLPagination(&database.Comment{}, option)
}

// loadChildren 递归加载子评论（私有方法）
func (cs *CommentService) loadChildren(comment *database.Comment) error {
	if comment == nil {
		return nil
	}

	var children []database.Comment
	err := global.DB.Where("p_id = ?", comment.ID).
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("uuid, username, avatar, address, signature")
		}).
		Find(&children).Error

	if err != nil {
		return err
	}

	for i := range children {
		if err := cs.loadChildren(&children[i]); err != nil {
			return err
		}
	}

	comment.Children = children
	return nil
}

// deleteCommentAndChildren 递归删除评论及其子评论（私有方法）
func (cs *CommentService) deleteCommentAndChildren(tx *gorm.DB, id uint) error {
	// 先删除所有子评论
	var childIDs []uint
	if err := tx.Model(&database.Comment{}).Where("p_id = ?", id).Pluck("id", &childIDs).Error; err != nil {
		return err
	}

	for _, childID := range childIDs {
		if err := cs.deleteCommentAndChildren(tx, childID); err != nil {
			return err
		}
	}

	// 最后删除当前评论
	return tx.Delete(&database.Comment{}, id).Error
}

// findChildCommentsIDByRootCommentUserUUID 查找子评论ID（私有方法）
func (cs *CommentService) findChildCommentsIDByRootCommentUserUUID(comments []database.Comment) map[uint]struct{} {
	idMap := make(map[uint]struct{})
	for _, comment := range comments {
		cs.traverseChildren(&comment, idMap)
	}
	return idMap
}

// traverseChildren 遍历子评论（私有方法）
func (cs *CommentService) traverseChildren(comment *database.Comment, idMap map[uint]struct{}) {
	for _, child := range comment.Children {
		idMap[child.ID] = struct{}{}
		cs.traverseChildren(&child, idMap)
	}
}

// commentExists 检查评论是否存在（私有方法）
func (cs *CommentService) commentExists(id uint) (bool, error) {
	var count int64
	err := global.DB.Model(&database.Comment{}).Where("id = ?", id).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
