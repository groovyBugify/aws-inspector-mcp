import { 
  Finding, 
  FindingStatus, 
  Severity, 
  ListFindingsCommand,
  FilterCriteria,
  DateFilter
} from '@aws-sdk/client-inspector2';
import { AWS } from '../aws-config';

const MCP_URL = process.env.NEXT_PUBLIC_MCP_URL || 'http://localhost:3001';

export interface InspectorFinding {
  findingArn: string;
  title: string;
  description: string;
  severity: Severity;
  status: FindingStatus;
  createdAt: string;
  updatedAt: string;
  resourceType?: string;
  resourceId?: string;
  packageVulnerability?: {
    vulnerablePackages: Array<{
      name: string;
      version: string;
      fixedInVersion?: string;
    }>;
  };
}

export interface InspectorDashboardStats {
  totalFindings: number;
  findingsBySeverity: Record<Severity, number>;
  findingsByStatus: Record<FindingStatus, number>;
  topVulnerablePackages: Array<{
    name: string;
    count: number;
  }>;
  trendData: Array<{
    date: string;
    count: number;
  }>;
}

export async function getFindings(maxResults: number = 100): Promise<InspectorFinding[]> {
  try {
    const inspector = await AWS.inspector();
    const command = new ListFindingsCommand({
      maxResults,
    });

    const response = await inspector.send(command);
    return (response.findings || []).map((finding: Finding) => ({
      findingArn: finding.findingArn || '',
      title: finding.title || '',
      description: finding.description || '',
      severity: finding.severity || Severity.INFORMATIONAL,
      status: finding.status || FindingStatus.ACTIVE,
      createdAt: finding.firstObservedAt?.toISOString() || '',
      updatedAt: finding.lastObservedAt?.toISOString() || '',
      resourceType: finding.resources?.[0]?.type,
      resourceId: finding.resources?.[0]?.id,
      packageVulnerability: finding.packageVulnerabilityDetails ? {
        vulnerablePackages: finding.packageVulnerabilityDetails.vulnerablePackages?.map(pkg => ({
          name: pkg.name || '',
          version: pkg.version || '',
          fixedInVersion: pkg.fixedInVersion,
        })) || [],
      } : undefined,
    }));
  } catch (error) {
    console.error('Error fetching Inspector findings:', error);
    throw error;
  }
}

export async function getDashboardStats(): Promise<InspectorDashboardStats> {
  try {
    const findings = await getFindings(1000); // Get last 1000 findings for stats
    
    const stats: InspectorDashboardStats = {
      totalFindings: findings.length,
      findingsBySeverity: {
        [Severity.CRITICAL]: 0,
        [Severity.HIGH]: 0,
        [Severity.MEDIUM]: 0,
        [Severity.LOW]: 0,
        [Severity.INFORMATIONAL]: 0,
        [Severity.UNTRIAGED]: 0
      },
      findingsByStatus: {
        [FindingStatus.ACTIVE]: 0,
        [FindingStatus.SUPPRESSED]: 0,
        [FindingStatus.CLOSED]: 0
      },
      topVulnerablePackages: [],
      trendData: [],
    };

    // Calculate severity and status counts
    findings.forEach(finding => {
      if (finding.severity) {
        stats.findingsBySeverity[finding.severity]++;
      }
      if (finding.status) {
        stats.findingsByStatus[finding.status]++;
      }
    });

    // Calculate top vulnerable packages
    const packageCounts = new Map<string, number>();
    findings.forEach(finding => {
      finding.packageVulnerability?.vulnerablePackages.forEach(pkg => {
        const count = packageCounts.get(pkg.name) || 0;
        packageCounts.set(pkg.name, count + 1);
      });
    });

    stats.topVulnerablePackages = Array.from(packageCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate trend data (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const dailyCounts = new Map<string, number>();
    findings
      .filter(finding => new Date(finding.createdAt) >= thirtyDaysAgo)
      .forEach(finding => {
        const date = finding.createdAt.split('T')[0];
        const count = dailyCounts.get(date) || 0;
        dailyCounts.set(date, count + 1);
      });

    stats.trendData = Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return stats;
  } catch (error) {
    console.error('Error fetching Inspector dashboard stats:', error);
    throw error;
  }
}

export async function getFindingsByStatus(status: FindingStatus): Promise<InspectorFinding[]> {
  try {
    const inspector = await AWS.inspector();
    const filterCriteria: FilterCriteria = {
      findingStatus: [{ comparison: 'EQUALS', value: status }]
    };

    const command = new ListFindingsCommand({ filterCriteria });
    const response = await inspector.send(command);
    
    return (response.findings || []).map((finding: Finding) => ({
      findingArn: finding.findingArn || '',
      title: finding.title || '',
      description: finding.description || '',
      severity: finding.severity || Severity.INFORMATIONAL,
      status: finding.status || FindingStatus.ACTIVE,
      createdAt: finding.firstObservedAt?.toISOString() || '',
      updatedAt: finding.lastObservedAt?.toISOString() || '',
      resourceType: finding.resources?.[0]?.type,
      resourceId: finding.resources?.[0]?.id,
      packageVulnerability: finding.packageVulnerabilityDetails ? {
        vulnerablePackages: finding.packageVulnerabilityDetails.vulnerablePackages?.map(pkg => ({
          name: pkg.name || '',
          version: pkg.version || '',
          fixedInVersion: pkg.fixedInVersion,
        })) || [],
      } : undefined,
    }));
  } catch (error) {
    console.error('Error fetching Inspector findings by status:', error);
    throw error;
  }
}

export async function getFindingsByResource(resourceId: string): Promise<InspectorFinding[]> {
  try {
    const inspector = await AWS.inspector();
    const filterCriteria: FilterCriteria = {
      resourceId: [{ comparison: 'EQUALS', value: resourceId }]
    };

    const command = new ListFindingsCommand({ filterCriteria });
    const response = await inspector.send(command);
    
    return (response.findings || []).map((finding: Finding) => ({
      findingArn: finding.findingArn || '',
      title: finding.title || '',
      description: finding.description || '',
      severity: finding.severity || Severity.INFORMATIONAL,
      status: finding.status || FindingStatus.ACTIVE,
      createdAt: finding.firstObservedAt?.toISOString() || '',
      updatedAt: finding.lastObservedAt?.toISOString() || '',
      resourceType: finding.resources?.[0]?.type,
      resourceId: finding.resources?.[0]?.id,
      packageVulnerability: finding.packageVulnerabilityDetails ? {
        vulnerablePackages: finding.packageVulnerabilityDetails.vulnerablePackages?.map(pkg => ({
          name: pkg.name || '',
          version: pkg.version || '',
          fixedInVersion: pkg.fixedInVersion,
        })) || [],
      } : undefined,
    }));
  } catch (error) {
    console.error('Error fetching Inspector findings by resource:', error);
    throw error;
  }
}

export async function getFindingsByDateRange(startTime: Date, endTime: Date): Promise<InspectorFinding[]> {
  try {
    const inspector = await AWS.inspector();
    const filterCriteria: FilterCriteria = {
      firstObservedAt: [{
        startTime,
        endTime
      }]
    };

    const command = new ListFindingsCommand({ filterCriteria });
    const response = await inspector.send(command);
    
    return (response.findings || []).map((finding: Finding) => ({
      findingArn: finding.findingArn || '',
      title: finding.title || '',
      description: finding.description || '',
      severity: finding.severity || Severity.INFORMATIONAL,
      status: finding.status || FindingStatus.ACTIVE,
      createdAt: finding.firstObservedAt?.toISOString() || '',
      updatedAt: finding.lastObservedAt?.toISOString() || '',
      resourceType: finding.resources?.[0]?.type,
      resourceId: finding.resources?.[0]?.id,
      packageVulnerability: finding.packageVulnerabilityDetails ? {
        vulnerablePackages: finding.packageVulnerabilityDetails.vulnerablePackages?.map(pkg => ({
          name: pkg.name || '',
          version: pkg.version || '',
          fixedInVersion: pkg.fixedInVersion,
        })) || [],
      } : undefined,
    }));
  } catch (error) {
    console.error('Error fetching Inspector findings by date range:', error);
    throw error;
  }
}

export async function getFindingsBySeverity(severity: Severity): Promise<InspectorFinding[]> {
  try {
    const inspector = await AWS.inspector();
    const filterCriteria: FilterCriteria = {
      severity: [{ comparison: 'EQUALS', value: severity }]
    };

    const command = new ListFindingsCommand({ filterCriteria });
    const response = await inspector.send(command);
    
    return (response.findings || []).map((finding: Finding) => ({
      findingArn: finding.findingArn || '',
      title: finding.title || '',
      description: finding.description || '',
      severity: finding.severity || Severity.INFORMATIONAL,
      status: finding.status || FindingStatus.ACTIVE,
      createdAt: finding.firstObservedAt?.toISOString() || '',
      updatedAt: finding.lastObservedAt?.toISOString() || '',
      resourceType: finding.resources?.[0]?.type,
      resourceId: finding.resources?.[0]?.id,
      packageVulnerability: finding.packageVulnerabilityDetails ? {
        vulnerablePackages: finding.packageVulnerabilityDetails.vulnerablePackages?.map(pkg => ({
          name: pkg.name || '',
          version: pkg.version || '',
          fixedInVersion: pkg.fixedInVersion,
        })) || [],
      } : undefined,
    }));
  } catch (error) {
    console.error('Error fetching Inspector findings by severity:', error);
    throw error;
  }
}