# AWS Inspector MCP Server Deployment Guide

## Prerequisites
- An EC2 instance running (Amazon Linux 2023 or Ubuntu recommended)
- Node.js 18+ installed
- PM2 or similar process manager for running Node.js applications
- Git installed
- IAM Role attached to the EC2 instance

## Required IAM Policies

### AWS Inspector Access Policy
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "inspector2:ListFindings",
                "inspector2:GetFindings",
                "inspector2:ListCoverage",
                "inspector2:GetDashboardMetrics",
                "inspector2:BatchGetAccountStatus",
                "inspector2:ListTagsForResource"
            ],
            "Resource": "*"
        }
    ]
}
```

### STS Assume Role Policy (if using role assumption)
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "sts:AssumeRole",
                "sts:GetCallerIdentity"
            ],
            "Resource": "arn:aws:iam::*:role/*"
        }
    ]
}
```

## Deployment Steps

1. **Connect to your EC2 instance**
```bash
ssh -i your-key.pem ec2-user@your-instance-ip
```

2. **Install Node.js and other dependencies**
```bash
# For Amazon Linux 2023
sudo dnf update -y
sudo dnf install -y nodejs git

# For Ubuntu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git
```

3. **Install PM2 globally**
```bash
sudo npm install -g pm2
```

4. **Clone the repository**
```bash
git clone https://github.com/groovyBugify/aws-inspector-mcp.git
cd aws-inspector-mcp
```

5. **Install dependencies**
```bash
npm install
```

6. **Create environment file**
```bash
cp .env.example .env
```

7. **Configure environment variables**
Edit the .env file with your configuration:
```bash
nano .env
```

Required configurations:
```env
PORT=3001
AWS_REGION=your-region
CORS_ORIGIN=your-frontend-domain
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

8. **Build the application**
```bash
npm run build
```

9. **Start the application with PM2**
```bash
pm2 start npm --name "aws-inspector-mcp" -- start
```

10. **Save PM2 configuration for auto-restart**
```bash
pm2 save
pm2 startup
```

## Security Configuration

1. **Configure Firewall Rules**
Allow inbound traffic only on port 3001 (or your configured port) from your frontend application's IP/subnet.

2. **Set up NGINX as a reverse proxy (Optional but recommended)**
```bash
sudo apt install nginx
```

Create NGINX configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring and Logging

1. **View application logs**
```bash
pm2 logs aws-inspector-mcp
```

2. **Monitor application status**
```bash
pm2 monit
```

3. **View application metrics**
```bash
pm2 show aws-inspector-mcp
```

## Health Check

The application exposes a health check endpoint at `/health` that can be used for monitoring.

## Troubleshooting

1. **Check application logs**
```bash
pm2 logs aws-inspector-mcp --lines 100
```

2. **Verify IAM Role**
```bash
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

3. **Test AWS Inspector Access**
```bash
aws inspector2 list-findings --region your-region
```

## Maintenance

1. **Update application**
```bash
cd aws-inspector-mcp
git pull
npm install
npm run build
pm2 restart aws-inspector-mcp
```

2. **Backup configuration**
```bash
cp .env .env.backup
```

## Additional IAM Policy Recommendations

### Least Privilege Policy
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "inspector2:ListFindings",
                "inspector2:GetFindings",
                "inspector2:ListCoverage",
                "inspector2:GetDashboardMetrics"
            ],
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "aws:RequestedRegion": ["us-east-1"]  // Replace with your region
                }
            }
        }
    ]
}
```

### Resource-Based Policy (if using cross-account access)
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::ACCOUNT-ID:role/ROLE-NAME"
            },
            "Action": [
                "inspector2:ListFindings",
                "inspector2:GetFindings"
            ],
            "Resource": "*"
        }
    ]
}
```