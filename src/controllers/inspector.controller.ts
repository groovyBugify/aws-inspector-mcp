import { Request, Response } from 'express';
import { InspectorService } from '../services/inspector.service';
import { logger } from '../utils/logger';

export class InspectorController {
  private service: InspectorService;

  constructor() {
    this.service = new InspectorService();
  }

  getFindings = async (req: Request, res: Response) => {
    try {
      const findings = await this.service.getFindings();
      res.json({ findings });
    } catch (error) {
      logger.error('Error in getFindings controller:', error);
      res.status(500).json({ error: 'Failed to fetch findings' });
    }
  };

  getFindingsByStatus = async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      const findings = await this.service.getFindingsByStatus(status);
      res.json({ findings });
    } catch (error) {
      logger.error('Error in getFindingsByStatus controller:', error);
      res.status(500).json({ error: 'Failed to fetch findings by status' });
    }
  };

  getFindingsByResource = async (req: Request, res: Response) => {
    try {
      const { resourceId } = req.params;
      const findings = await this.service.getFindingsByResource(resourceId);
      res.json({ findings });
    } catch (error) {
      logger.error('Error in getFindingsByResource controller:', error);
      res.status(500).json({ error: 'Failed to fetch findings by resource' });
    }
  };

  getFindingsByDateRange = async (req: Request, res: Response) => {
    try {
      const { startTime, endTime } = req.query;
      if (!startTime || !endTime) {
        return res.status(400).json({ error: 'Start time and end time are required' });
      }
      const findings = await this.service.getFindingsByDateRange(
        new Date(startTime as string),
        new Date(endTime as string)
      );
      res.json({ findings });
    } catch (error) {
      logger.error('Error in getFindingsByDateRange controller:', error);
      res.status(500).json({ error: 'Failed to fetch findings by date range' });
    }
  };

  getFindingsBySeverity = async (req: Request, res: Response) => {
    try {
      const { severity } = req.params;
      const findings = await this.service.getFindingsBySeverity(severity);
      res.json({ findings });
    } catch (error) {
      logger.error('Error in getFindingsBySeverity controller:', error);
      res.status(500).json({ error: 'Failed to fetch findings by severity' });
    }
  };

  getAggregatedFindings = async (req: Request, res: Response) => {
    try {
      const aggregated = await this.service.getAggregatedFindings();
      res.json(aggregated);
    } catch (error) {
      logger.error('Error in getAggregatedFindings controller:', error);
      res.status(500).json({ error: 'Failed to fetch aggregated findings' });
    }
  };
}