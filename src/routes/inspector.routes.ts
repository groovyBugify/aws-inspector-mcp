import { Router } from 'express';
import { InspectorController } from '../controllers/inspector.controller';

const router = Router();
const controller = new InspectorController();

// Get all findings
router.get('/findings', controller.getFindings);

// Get findings by status
router.get('/findings/status/:status', controller.getFindingsByStatus);

// Get findings by resource
router.get('/findings/resource/:resourceId', controller.getFindingsByResource);

// Get findings by date range
router.get('/findings/date-range', controller.getFindingsByDateRange);

// Get findings by severity
router.get('/findings/severity/:severity', controller.getFindingsBySeverity);

// Get aggregated findings statistics
router.get('/findings/aggregated', controller.getAggregatedFindings);

export const inspectorRoutes = router;