// Platform detection for web-specific features
export const Platform = {
  OS: 'web' as const,
  select: (obj: { web: any; default?: any }) => obj.web || obj.default,
  isWeb: true,
  isMobile: false,
};

export default Platform;



