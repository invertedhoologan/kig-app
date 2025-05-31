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

  const required = [
    azureConfig.storage.accountName,
    azureConfig.storage.accountKey,
    azureConfig.auth.clientId,
    azureConfig.jwt.secret,
  ];

  return required.every(value => value && value !== '');
};
