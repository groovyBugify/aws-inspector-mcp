import { Inspector2Client } from '@aws-sdk/client-inspector2';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

async function getCredentials() {
  // If IAM Role ARN is provided, assume the role
  if (process.env.AWS_ROLE_ARN) {
    const stsClient = new STSClient({ region: process.env.AWS_REGION });
    try {
      const command = new AssumeRoleCommand({
        RoleArn: process.env.AWS_ROLE_ARN,
        RoleSessionName: 'InspectorMCPSession',
        DurationSeconds: 3600, // 1 hour
      });
      
      const response = await stsClient.send(command);
      
      if (!response.Credentials) {
        throw new Error('Failed to assume IAM role: No credentials returned');
      }

      return {
        accessKeyId: response.Credentials.AccessKeyId,
        secretAccessKey: response.Credentials.SecretAccessKey,
        sessionToken: response.Credentials.SessionToken,
      };
    } catch (error) {
      console.error('Failed to assume IAM role:', error);
      throw error;
    }
  }

  // Otherwise, use IAM Access Keys if provided
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    };
  }

  // If neither is provided, let the SDK use the default credential provider chain
  return fromNodeProviderChain()();
}

// Initialize AWS clients with credentials
async function initializeAWSClients() {
  const credentials = await getCredentials();
  
  const config = {
    region: process.env.AWS_REGION || 'us-east-1',
    ...(credentials && { credentials }),
  };

  return {
    inspector: new Inspector2Client(config),
  };
}

// AWS namespace with lazy initialization
export const AWS = {
  _clients: null as null | { inspector: Inspector2Client },
  
  // Helper method to get the inspector client
  async inspector() {
    if (!this._clients) {
      this._clients = await initializeAWSClients();
    }
    return this._clients.inspector;
  },

  // Method to refresh credentials (useful for long-running processes)
  async refreshCredentials() {
    this._clients = await initializeAWSClients();
    return this._clients;
  }
};