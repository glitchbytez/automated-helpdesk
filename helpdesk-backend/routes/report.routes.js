import { Router } from "express"
import * as reportController from "../controllers/report.controller.js"
import { authenticateJWT, restrictTo } from "../middleware/auth.middleware.js"

const reportRouter = Router()

// Protect all routes
reportRouter.use(authenticateJWT)
reportRouter.use(restrictTo("admin", "agent"))

// Get ticket stats (dashboard metrics)
reportRouter.get("/ticket-stats", reportController.getTicketStats)

// Get ticket metrics (status and priority distribution)
reportRouter.get("/ticket-metrics", reportController.getTicketMetrics)

// Get ticket volume report
reportRouter.get("/ticket-volume", reportController.getTicketVolumeReport)

// Get response time report
reportRouter.get("/response-time", reportController.getResponseTimeReport)

// Get response time metrics for dashboard
reportRouter.get("/response-time-metrics", reportController.getResponseTimeMetrics)

// Get agent performance report
reportRouter.get("/agent-performance", reportController.getAgentPerformanceReport)

// Get customer satisfaction report
reportRouter.get("/satisfaction", reportController.getSatisfactionReport)

// Get monthly ticket report by year and month
reportRouter.get("/monthly-tickets/:year/:month", reportController.getMonthlyTicketReport)



export default reportRouter
