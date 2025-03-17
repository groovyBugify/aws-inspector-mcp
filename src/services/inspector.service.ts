import { Inspector } from '@aws-sdk/client-inspector2';
import { logger } from '../utils/logger';

export class InspectorService {
  private client: Inspector;

  constructor() {
    this.client = new Inspector({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  async getFindings() {
    try {
      const response = await this.client.listFindings({});
      return response.findings || [];
    } catch (error) {
      logger.error('Error fetching Inspector findings:', error);
      throw error;
    }
  }

  async getFindingsByStatus(status: string) {
    try {
      const response = await this.client.listFindings({
        filterCriteria: {
          status: [{ comparison: 'EQUALS', value: status }]
        }
      });
      return response.findings || [];
    } catch (error) {
      logger.error(`Error fetching Inspector findings with status ${status}:`, error);
      throw error;
    }
  }

  async getFindingsByResource(resourceId: string) {
    try {
      const response = await this.client.listFindings({
        filterCriteria: {
          resourceId: [{ comparison: 'EQUALS', value: resourceId }]
        }
      });
      return response.findings || [];
    } catch (error) {
      logger.error(`Error fetching Inspector findings for resource ${resourceId}:`, error);
      throw error;
    }
  }

  async getFindingsByDateRange(startTime: Date, endTime: Date) {
    try {
      const response = await this.client.listFindings({
        filterCriteria: {
          firstObservedAt: [
            { 
              startInclusive: startTime.toISOString(),
              endInclusive: endTime.toISOString()
            }
          ]
        }
      });
      return response.findings || [];
    } catch (error) {
      logger.error('Error fetching Inspector findings by date range:', error);
      throw error;
    }
  }

  async getFindingsBySeverity(severity: string) {
    try {
      const response = await this.client.listFindings({
        filterCriteria: {
          severity: [{ comparison: 'EQUALS', value: severity }]
        }
      });
      return response.findings || [];
    } catch (error) {
      logger.error(`Error fetching Inspector findings with severity ${severity}:`, error);
      throw error;
    }
  }

  async getAggregatedFindings() {
    try {
      const findings = await this.getFindings();
      const aggregated = {
        total: findings.length,
        bySeverity: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        byResourceType: {} as Record<string, number>,
        recentFindings: findings.slice(0, 10)
      };

      findings.forEach(finding => {
        if (finding.severity) {
          aggregated.bySeverity[finding.severity] = (aggregated.bySeverity[finding.severity] || 0) + 1;
        }
        if (finding.status) {
          aggregated.byStatus[finding.status] = (aggregated.byStatus[finding.status] || 0) + 1;
        }
        if (finding.resourceType) {
          aggregated.byResourceType[finding.resourceType] = (aggregated.byResourceType[finding.resourceType] || 0) + 1;
        }
      });

      return aggregated;
    } catch (error) {
      logger.error('Error aggregating Inspector findings:', error);
      throw error;
    }
  }
}