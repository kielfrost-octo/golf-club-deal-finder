import { FEATURE_CLIENT_ID, RELEASE_VERSION } from './config.js?v=1.0.16';

const PROVIDER_URL = 'https://esm.sh/@octopusdeploy/openfeature@5.0.0';
const SDK_URL = 'https://esm.sh/@openfeature/web-sdk@1.10.0';
const TIMEOUT_MS = 3000;

/** Resolves a boolean Octopus feature flag; falls back to `defaultValue` when flags are unavailable. */
export async function getFlag(slug, defaultValue = false) {
  if (!FEATURE_CLIENT_ID) return defaultValue;

  try {
    const [{ OctopusFeatureProvider, ProductMetadata }, { OpenFeature }] = await Promise.all([
      import(PROVIDER_URL),
      import(SDK_URL),
    ]);

    const ready = OpenFeature.setProviderAndWait(
      new OctopusFeatureProvider({
        clientIdentifier: FEATURE_CLIENT_ID,
        productMetadata: new ProductMetadata('golf-club-deal-finder', RELEASE_VERSION || '0.0.0'),
      }),
    );
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timed out')), TIMEOUT_MS));
    await Promise.race([ready, timeout]);

    return OpenFeature.getClient().getBooleanValue(slug, defaultValue);
  } catch (error) {
    console.warn(`Feature flag "${slug}" unavailable, using default.`, error);
    return defaultValue;
  }
}
