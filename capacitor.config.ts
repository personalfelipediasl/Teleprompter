export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
  ios?: {
    contentInset?: string;
    preferredContentMode?: string;
    scheme?: string;
    limitsNavigationsToAppBoundDomains?: boolean;
  };
  server?: {
    androidScheme?: string;
  };
}

const config: CapacitorConfig = {
  appId: 'com.teleprompter.pro.ios',
  appName: 'Teleprompter iPhone',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
    scheme: 'Teleprompter',
    limitsNavigationsToAppBoundDomains: true,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
