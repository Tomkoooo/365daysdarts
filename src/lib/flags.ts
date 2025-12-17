export const isDevMode = () => process.env.DEV_MODE === 'true';

export const shouldBypassPaywall = () => {
  return isDevMode();
};
