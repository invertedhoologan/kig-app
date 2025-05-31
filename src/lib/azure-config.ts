// Azure configuration and utilities
export const isAzureConfigured = process.env.NEXT_PUBLIC_AZURE_CONFIGURED === 'true';

export const azureConfig = {
  storage: {
    accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || '',
    accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || '',
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
    tableEndpoint: process.env.AZURE_TABLE_ENDPOINT || '',
  },
  auth: {
    tenantName: process.env.AZURE_AD_B2C_TENANT_NAME || '',
    clientId: process.env.AZURE_AD_B2C_CLIENT_ID || '',
    clientSecret: process.env.AZURE_AD_B2C_CLIENT_SECRET || '',
    policyName: process.env.AZURE_AD_B2C_POLICY_NAME || 'B2C_1_SignUpSignIn',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
  },
};

export const validateAzureConfig = (): boolean => {
  if (!isAzureConfigured) {
    console.warn('Azure is not configured. Using mock data.');
    return false;
  }

  // Check for required environment variables
  const connectionString = azureConfig.storage.connectionString;
  const accountName = azureConfig.storage.accountName;
  const jwtSecret = azureConfig.jwt.secret;

  if (!connectionString || connectionString.trim() === '' || connectionString === 'undefined') {
    console.warn('Azure connection string is missing or invalid. Using mock data.');
    return false;
  }

  if (!accountName || accountName.trim() === '' || accountName === 'undefined') {
    console.warn('Azure storage account name is missing. Using mock data.');
    return false;
  }

  if (!jwtSecret || jwtSecret.trim() === '' || jwtSecret === 'fallback-secret-key') {
    console.warn('JWT secret is missing or using fallback. Using mock data.');
    return false;
  }

  // Validate connection string format
  if (!connectionString.includes('AccountName=') || !connectionString.includes('AccountKey=')) {
    console.warn('Azure connection string format is invalid. Using mock data.');
    return false;
  }

  return true;
};
