// Manual JS port of modules-hub/modules/auth v0.1.0 adapters/credential-store-adapter.ts
// (canonical TS source). Near-verbatim.
function createCredentialStoreAdapter(options) {
  return {
    resolve(credential) {
      return options.verify(credential);
    }
  };
}

module.exports = { createCredentialStoreAdapter };
