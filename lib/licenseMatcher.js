const { get, first, isEqual: isDeepEqual } = require('lodash')
const { isLicenseFile } = require('./utils')

class LicenseMatcher {
  constructor(policies) {
    this._policies = policies || [new DefinitionLicenseMatchPolicy(), new HarvestLicenseMatchPolicy()]
  }

  /**
   * Given two coordinate with different revision, decide whether they have the same license and provide reason
   * @param { definition, harvest } source
   * @param { definition, harvest } target
   * @return { isMatching: Boolean, reason: String | undefined, policy: String | undefined }
   */
  process(source, target) {
    for (const policy of this._policies) {
      const match = policy.isMatching(source, target);
      if (match.isMatching) {
        return match
      }
    }
    return { isMatching: false }
  }
}

class DefinitionLicenseMatchPolicy {
  constructor() {
    this._policyName = 'definition'
    this._compareProps = ['hashes.sha1', 'hashes.sha256', 'token']
  }

  isMatching(source, target) {
    const sourceLicenseFiles = source.definition.files.filter(f => isLicenseFile(f.path, source.definition.coordinates))
    const targetLicenseFiles = target.definition.files.filter(f => isLicenseFile(f.path, target.definition.coordinates))
    for (const file of targetLicenseFiles) {
      for (const propPath of this._compareProps) {
        const value = get(file, propPath)
        const isMatching = sourceLicenseFiles.some(licenseFile => noEmptyEqual(get(licenseFile, propPath), value))
        if (isMatching) {
          const reason = `${source.definition.coordinates.revision} and ${target.definition.coordinates.revision} share the same ${propPath} in ${file.path}: ${value}`
          return {
            isMatching: true,
            policy: this._policyName,
            reason
          }
        }
      }
    }
    return { isMatching: false }
  }
}

class HarvestLicenseMatchPolicy {
  constructor() {
    this._policyName = 'harvest'
  }

  isMatching(source, target) {
    const sourceLatestClearlyDefinedToolHarvest = getLatestToolHarvest(source.harvest, 'clearlydefined')
    const targetLatestClearlyDefinedToolHarvest = getLatestToolHarvest(target.harvest, 'clearlydefined')
    const falsy = { isMatching: false }
    const propPaths = this._getComparePropPaths(source)
    if (propPaths.length === 0) {
      return falsy
    }
    let reasonBuilder = []
    for (const propPath of propPaths) {
      const sourceLicense = get(sourceLatestClearlyDefinedToolHarvest, propPath)
      const targetLicense = get(targetLatestClearlyDefinedToolHarvest, propPath)
      if (!isDeepEqual(sourceLicense, targetLicense)) {
        return falsy
      }
      reasonBuilder.push(`${propPath}: \`\`\`${JSON.stringify(sourceLicense)}\`\`\``)
    }
    return {
      isMatching: true,
      policy: this._policyName,
      reason: `${source.definition.coordinates.revision} and ${target.definition.coordinates.revision} share the same ${reasonBuilder.join(' and ')}.\n`
    }
  }

  _getComparePropPaths(source) {
    const type = source.definition.coordinates.type;
    switch (type) {
      case 'maven':
        return ['manifest.summary.licenses']
      case 'crate':
      case 'pod':
        return ['registryData.license']
      case 'nuget':
        return ['manifest.licenseExpression', 'manifest.licenseUrl']
      case 'npm':
      case 'composer':
        return ['registryData.manifest.license']
      case 'gem':
        return ['registryData.licenses']
      case 'pypi':
        return ['declaredLicense', 'registryData.info.license']
      case 'deb':
      case 'debsrc':
        return ['declaredLicenses', 'copyrightUrl']
      default:
        return []
    }
  }
}

/**
 * If either source and target is undefined or null, return false. Otherwise, do the ===
 * @param {*} source
 * @param {*} target
 * @return { Boolean }
 */
function noEmptyEqual(source, target) {
  if (!source || !target) {
    return false
  }
  return source === target
}

function getLatestToolHarvest(coordinateHarvest, tool) {
  if (!coordinateHarvest[tool]) {
    return
  }
  const sortedVersions = Object.keys(coordinateHarvest[tool]).sort((a, b) => semver.gt(a, b) ? -1 : 1)
  const latestVersion = first(sortedVersions)
  return get(coordinateHarvest, [tool, latestVersion])
}

module.exports = {
  LicenseMatcher,
  DefinitionLicenseMatchPolicy,
  HarvestLicenseMatchPolicy
}