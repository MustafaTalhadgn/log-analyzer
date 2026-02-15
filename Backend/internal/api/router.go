package api

import (
	"log-analyzer/internal/api/handlers"
	"log-analyzer/internal/api/websocket"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(alertHandler *handlers.AlertHandler, ruleHandler *handlers.RuleHandler, wsHub *websocket.Hub) *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api")
	{
		api.GET("/alerts", alertHandler.GetAlerts)
		api.GET("/stats", alertHandler.GetStats)
		api.GET("/stats/daily", alertHandler.GetDailyStats)

		api.GET("/rules", ruleHandler.GetRules)
		api.POST("/rules", ruleHandler.CreateRule)
		api.DELETE("/rules/:id", ruleHandler.DeleteRule)
	}

	r.GET("/ws", websocket.ServeWS(wsHub))

	return r
}
