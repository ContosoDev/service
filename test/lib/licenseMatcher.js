const {
  LicenseMatcher, DefinitionLicenseMatchPolicy, HarvestLicenseMatchPolicy
} = require('../../lib/licenseMatcher')
const EntityCoordinates = require('../../lib/entityCoordinates')
const { expect } = require('chai')

describe('licenseMatcher.js', () => {
  describe('LicenseMatcher', () => {
    const matcher = new LicenseMatcher([
      {
        isMatching: () => ({ isMatching: false, policy: '1' }),
      },
      {
        isMatching: () => ({ isMatching: true, policy: '2' }),
      },
      {
        isMatching: () => ({ isMatching: true, policy: '3' }),
      }
    ])
    describe('Should return the first match result', () => {
      const result = matcher.process({}, {})
      expect(result).has.property('isMatching', true)
      expect(result).has.property('policy', '2')
    })
  })

  describe('DefinitionLicenseMatchPolicy isMatching()', () => {
    const definitionLicenseMatchPolicy = new DefinitionLicenseMatchPolicy()
    describe('Should match when two license files share the same hashes.sha1', () => {
      const coordinates = { type: 'npm' }
      const sourceDefinition = {
        "files": [{
          "path": "package/LICENSE",
          "hashes": {
            "sha1": "dbf8c7e394791d3de9a9fff305d8ee7b59196f26",
          }
        }]
      }

      const targetDefinition = {
        "files": [{
          "path": "package/LICENSE",
          "hashes": {
            "sha1": "dbf8c7e394791d3de9a9fff305d8ee7b59196f26",
          }
        }]
      }

      const result = definitionLicenseMatchPolicy.isMatching(
        { definition: { ...sourceDefinition, coordinates } },
        { definition: { ...targetDefinition, coordinates } }
      )
      expect(result).has.property('isMatching', true)
    })

    describe('Should match when two license files share the same hashes.sha256', () => {
      const coordinates = { type: 'pypi', name: 'foo', revision: '1.0.0' }
      const sourceDefinition = {
        "files": [{
          "path": "foo-1.0.0/LICENSE",
          "hashes": {
            "sha256": "d9fccda7d1daaec4c1a84d46b48d808e56ee8979c1b62ccc1492b7c27ab7010d",
          }
        }]
      }

      const targetDefinition = {
        "files": [{
          "path": "foo-1.0.0/LICENSE",
          "hashes": {
            "sha256": "d9fccda7d1daaec4c1a84d46b48d808e56ee8979c1b62ccc1492b7c27ab7010d",
          }
        }]
      }

      const result = definitionLicenseMatchPolicy.isMatching(
        { definition: { ...sourceDefinition, coordinates } },
        { definition: { ...targetDefinition, coordinates } }
      )
      expect(result).has.property('isMatching', true)
    })

    context('Should match when two license files share the same token', () => {
      const coordinates = { type: 'maven' }
      const sourceDefinition = {
        "files": [{
          "path": "meta-inf/LICENSE",
          "token": "d9fccda7d1daaec4c1a84d46b48d808e56ee8979c1b62ccc1492b7c27ab7010d"
        }]
      }

      const targetDefinition = {
        "files": [{
          "path": "meta-inf/LICENSE",
          "token": "d9fccda7d1daaec4c1a84d46b48d808e56ee8979c1b62ccc1492b7c27ab7010d"
        }]
      }

      const result = definitionLicenseMatchPolicy.isMatching(
        { definition: { ...sourceDefinition, coordinates } },
        { definition: { ...targetDefinition, coordinates } }
      )
      expect(result).has.property('isMatching', true)
    })

    context('Should NOT match when no license files found', () => {
      const sourceDefinition = {
        "path": "NOT-A-License-File",
        "files": [{
          "token": "d9fccda7d1daaec4c1a84d46b48d808e56ee8979c1b62ccc1492b7c27ab7010d"
        }]
      }

      const targetDefinition = {
        "path": "NOT-A-License-File",
        "files": [{
          "token": "d9fccda7d1daaec4c1a84d46b48d808e56ee8979c1b62ccc1492b7c27ab7010d"
        }]
      }

      const result = definitionLicenseMatchPolicy.isMatching(
        { definition: sourceDefinition },
        { definition: targetDefinition }
      )
      expect(result).has.property('isMatching', false)
    })

    context(`Should NOT match when two license file don't share the same hashes.sha1`, () => {
      const sourceDefinition = {
        "files": [{
          "path": "license.md",
          "hashes": {
            "sha1": "dbf8c7e394791d3de9a9fff305d8ee7b59196f26",
          }
        }]
      }

      const targetDefinition = {
        "files": [{
          "path": "license.md",
          "hashes": {
            "sha1": "dbf8c7e394791d3de9a9fff305d8ee7b59196f26-Diff",
          }
        }]
      }

      const result = definitionLicenseMatchPolicy.isMatching(
        { definition: sourceDefinition },
        { definition: targetDefinition }
      )
      expect(result).has.property('isMatching', false)
    })
  })

  // Even though some matching props are the same for different package type.
  // However, the value of the props are various. Therefore, it's better to test based on type
  describe('HarvestLicenseMatchPolicy isMatching()', () => {
    const harvestLicenseMatchPolicy = new HarvestLicenseMatchPolicy();
    describe('Match maven package', () => {
      const sourceDefinition = {
        coordinates: EntityCoordinates.fromString('maven/mavencentral/io.opentelemetry/opentelemetry-sdk-common/1.0.0')
      }
      const sourceHarvest = {
        "clearlydefined": {
          "1.5.0": {
            "manifest": {
              "summary": {
                "licenses": [
                  {
                    "license": [
                      {
                        "name": [
                          "The Apache License, Version 2.0"
                        ],
                        "url": [
                          "http://www.apache.org/licenses/LICENSE-2.0.txt"
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          }
        }
      }

      it('Should match when harvest manifest.summary.licenses are deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('maven/mavencentral/io.opentelemetry/opentelemetry-sdk-common/0.17.1')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.4.0": {
              "manifest": {
                "summary": {
                  "licenses": [
                    {
                      "license": [
                        {
                          "name": [
                            "The Apache License, Version 2.0"
                          ],
                          "url": [
                            "http://www.apache.org/licenses/LICENSE-2.0.txt"
                          ]
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', true)
      })

      it('Should NOT match when harvest manifest.summary.licenses are NOT deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('maven/mavencentral/io.opentelemetry/opentelemetry-sdk-common/0.10.0')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.3.0": {
              "manifest": {
                "summary": {
                  "licenses": [
                    {
                      "license": [
                        {
                          "name": [
                            "MIT"
                          ],
                          "url": [
                            "https://opensource.org/licenses/MIT"
                          ]
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', false)
      })
    })

    describe('Match crate package', () => {
      const sourceDefinition = {
        coordinates: EntityCoordinates.fromString('crate/cratesio/-/libc/0.2.86')
      }
      const sourceHarvest = {
        "clearlydefined": {
          "1.2.0": {
            "registryData": {
              "license": "MIT OR Apache-2.0"
            }
          }
        }
      }

      it('Should match when harvest registryData.license are deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('crate/cratesio/-/libc/0.2.49')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.2.0": {
              "registryData": {
                "license": "MIT OR Apache-2.0"
              }
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', true)
      })

      it('Should NOT match when harvest registryData.license are NOT deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('crate/cratesio/-/libc/0.2.61')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.2.0": {
              "registryData": {
                "license": "MIT AND Apache-2.0"
              }
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', false)
      })
    })

    describe('Match nuget package', () => {
      const sourceDefinition = {
        coordinates: EntityCoordinates.fromString('nuget/nuget/-/Microsoft.Identity.Web.MicrosoftGraph/1.4.0')
      }
      const sourceHarvest = {
        "clearlydefined": {
          "1.4.2": {
            "manifest": {
              "licenseUrl": "https://licenses.nuget.org/MIT",
              "licenseExpression": "MIT"
            }
          }
        }
      }

      it('Should match when harvest manifest.licenseExpression and manifest.licenseUrl are deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('nuget/nuget/-/Microsoft.Identity.Web.MicrosoftGraph/1.4.0')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.2.0": {
              "manifest": {
                "licenseExpression": "MIT",
                "licenseUrl": "https://licenses.nuget.org/MIT"
              }
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', true)
      })

      it('Should NOT match when harvest manifest.licenseExpression are NOT deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('nuget/nuget/-/Microsoft.Identity.Web.MicrosoftGraph/1.4.0')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.4.2": {
              "manifest": {
                "licenseExpression": "Apache-2.0",
                "licenseUrl": "https://licenses.nuget.org/MIT"
              }
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', false)
      })

      it('Should NOT match when harvest manifest.licenseUrl are NOT deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('nuget/nuget/-/Microsoft.Identity.Web.MicrosoftGraph/1.4.0')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.4.2": {
              "manifest": {
                "licenseExpression": "MIT",
                "licenseUrl": "https://licenses.nuget.org/Apache-2.0"
              }
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', false)
      })
    })

    describe('Match npm package', () => {
      const sourceDefinition = {
        coordinates: EntityCoordinates.fromString('npm/npmjs/-/mongoose/5.2.5')
      }
      const sourceHarvest = {
        "clearlydefined": {
          "1.1.2": {
            "registryData": {
              "manifest": {
                "license": "MIT"
              }
            }
          }
        }
      }

      it('Should match when harvest registryData.license are deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('npm/npmjs/-/mongoose/4.2.7')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.3.4": {
              "registryData": {
                "manifest": {
                  "license": "MIT"
                }
              }
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', true)
      })

      it('Should NOT match when harvest registryData.license are NOT deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('npm/npmjs/-/mongoose/5.2.5')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.1.2": {
              "registryData": {
                "license": "Apache-2.0"
              }
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', false)
      })
    })

    describe('Match composer package', () => {
      const sourceDefinition = {
        coordinates: EntityCoordinates.fromString('composer/packagist/codeinwp/themeisle-sdk/3.2.9')
      }
      const sourceHarvest = {
        "clearlydefined": {
          "1.2.0": {
            "registryData": {
              "manifest": {
                "license": [
                  "GPL-2.0+"
                ]
              }
            }
          }
        }
      }

      it('Should match when harvest registryData.manifest.license are deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('composer/packagist/codeinwp/themeisle-sdk/3.1.9')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.1.2": {
              "registryData": {
                "manifest": {
                  "license": [
                    "GPL-2.0+"
                  ]
                }
              }
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', true)
      })

      it('Should NOT match when harvest registryData.manifest.license are NOT deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('composer/packagist/codeinwp/themeisle-sdk/3.0.5')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.2.0": {
              "registryData": {
                "manifest": {
                  "license": [
                    "GPL-2.0"
                  ]
                }
              }
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', false)
      })
    })

    describe('Match pod package', () => {
      const sourceDefinition = {
        coordinates: EntityCoordinates.fromString('pod/cocoapods/-/ADAL/2.7.7')
      }
      const sourceHarvest = {
        "clearlydefined": {
          "1.2.0": {
            "registryData": {
              "license": {
                "type": "MIT",
                "file": "LICENSE.txt"
              }
            }
          }
        }
      }

      it('Should match when harvest registryData.license are deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('pod/cocoapods/-/ADAL/2.7.14')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.2.0": {
              "registryData": {
                "license": {
                  "file": "LICENSE.txt",
                  "type": "MIT"
                }
              }
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', true)
      })

      it('Should NOT match when harvest registryData.license are NOT deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('pod/cocoapods/-/ADAL/4.0.4')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.2.0": {
              "registryData": {
                "license": {
                  "file": "LICENSE.txt",
                  "type": "Apache-2.0"
                }
              }
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', false)
      })
    })

    describe('Match gem package', () => {
      const sourceDefinition = {
        coordinates: EntityCoordinates.fromString('gem/rubygems/-/reline/0.2.3')
      }
      const sourceHarvest = {
        "clearlydefined": {
          "1.3.3": {
            "registryData": {
              "licenses": [
                "Ruby"
              ]
            }
          }
        }
      }

      it('Should match when harvest registryData.license are deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('gem/rubygems/-/reline/0.2.1')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.2.0": {
              "registryData": {
                "licenses": [
                  "Ruby"
                ]
              }
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', true)
      })

      it('Should NOT match when harvest registryData.license are NOT deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('gem/rubygems/-/reline/0.1.1')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.2.0": {
              "registryData": {
                "licenses": [
                  "Ruby License"
                ]
              }
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', false)
      })
    })

    describe('Match pypi package', () => {
      const sourceDefinition = {
        coordinates: EntityCoordinates.fromString('pypi/pypi/-/distributed/2021.1.0')
      }
      const sourceHarvest = {
        "clearlydefined": {
          "1.3.1": {
            "registryData": {
              "info": {
                "license": "BSD"
              }
            },
            "declaredLicense": "BSD-2-Clause"
          }
        }
      }

      it('Should match when harvest declaredLicense and registryData.info.license are deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('pypi/pypi/-/distributed/1.25.3')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.3.1": {
              "registryData": {
                "info": {
                  "license": "BSD"
                }
              },
              "declaredLicense": "BSD-2-Clause"
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', true)
      })

      it('Should NOT match when harvest declaredLicense are NOT deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('pypi/pypi/-/distributed/1.25.3')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.3.1": {
              "registryData": {
                "info": {
                  "license": "BSD"
                }
              },
              "declaredLicense": "BSD-3-Clause"
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', false)
      })

      it('Should NOT match when harvest registryData.info.license are NOT deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('nuget/nuget/-/Microsoft.Identity.Web.MicrosoftGraph/1.4.0')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.3.1": {
              "registryData": {
                "info": {
                  "license": "BSD License"
                }
              },
              "declaredLicense": "BSD-2-Clause"
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', false)
      })
    })

    describe('Match deb package', () => {
      const sourceDefinition = {
        coordinates: EntityCoordinates.fromString('deb/debian/-/kopano-contacts/8.7.0-4_s390x')
      }
      const sourceHarvest = {
        "clearlydefined": {
          "1.2.1": {
            "declaredLicenses": [
              "AGPL-3",
              "MIT",
              "BSD-3-clause",
              "(GPL-3 OR AGPL-3)",
              "PSF-2",
              "GPL-3"
            ],
            "copyrightUrl": "https://metadata.ftp-master.debian.org/changelogs/main/k/kopanocore/kopanocore_8.7.0-4_copyright"
          }
        }
      }

      it('Should match when harvest DeclaredLicenses and copyrightUrl are deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('deb/debian/-/kopano-contacts/8.7.0-4_i386')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.2.1": {
              "declaredLicenses": [
                "AGPL-3",
                "MIT",
                "BSD-3-clause",
                "(GPL-3 OR AGPL-3)",
                "PSF-2",
                "GPL-3"
              ],
              "copyrightUrl": "https://metadata.ftp-master.debian.org/changelogs/main/k/kopanocore/kopanocore_8.7.0-4_copyright"
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', true)
      })

      it('Should NOT match when harvest declaredLicense are NOT deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('deb/debian/-/kopano-contacts/8.7.0-3_amd64')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.2.1": {
              "declaredLicenses": [
                "MIT",
                "BSD-3-clause",
                "(GPL-3 OR AGPL-3)",
                "PSF-2",
                "GPL-3"
              ],
              "copyrightUrl": "https://metadata.ftp-master.debian.org/changelogs/main/k/kopanocore/kopanocore_8.7.0-3_copyright"
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', false)
      })

      it('Should NOT match when harvest copyrightUrl are NOT deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('deb/debian/-/kopano-contacts/8.7.0-3_s390x')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.2.1": {
              "declaredLicenses": [
                "AGPL-3",
                "MIT",
                "BSD-3-clause",
                "(GPL-3 OR AGPL-3)",
                "PSF-2",
                "GPL-3"
              ],
              "copyrightUrl": "https://metadata.ftp-master.debian.org/changelogs/main/k/kopanocore/kopanocore_8.7.0-3_copyright"
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', false)
      })
    })

    describe('Match debsrc package', () => {
      const sourceDefinition = {
        coordinates: EntityCoordinates.fromString('debsrc/debian/-/lava/2019.10-1')
      }
      const sourceHarvest = {
        "clearlydefined": {
          "1.3.1": {
            "copyrightUrl": "https://metadata.ftp-master.debian.org/changelogs/main/l/lava/lava_2019.10_copyright",
            "declaredLicenses": [
              "GPL-3.0+",
              "MIT",
              "GPL-2.0+",
              "AGPL-3.0",
              "BSD-3-clause"
            ]
          }
        }
      }

      it('Should match when harvest declaredLicenses and copyrightUrl are deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('debsrc/debian/-/lava/2019.10-2')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.3.1": {
              "copyrightUrl": "https://metadata.ftp-master.debian.org/changelogs/main/l/lava/lava_2019.10_copyright",
              "declaredLicenses": [
                "GPL-3.0+",
                "MIT",
                "GPL-2.0+",
                "AGPL-3.0",
                "BSD-3-clause"
              ]
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', true)
      })

      it('Should NOT match when harvest declaredLicenses are NOT deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('debsrc/debian/-/lava/2019.10-3')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.3.1": {
              "copyrightUrl": "https://metadata.ftp-master.debian.org/changelogs/main/l/lava/lava_2019.10_copyright",
              "declaredLicenses": [
                "MIT",
                "GPL-2.0+",
                "AGPL-3.0",
                "BSD-3-clause"
              ]
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', false)
      })

      it('Should NOT match when harvest copyrightUrl are NOT deep equal', () => {
        const targetDefinition = {
          coordinates: EntityCoordinates.fromString('deb/debian/-/kopano-contacts/8.7.0-3_s390x')
        }
        const targetHarvest = {
          "clearlydefined": {
            "1.2.1": {
              "declaredLicenses": [
                "AGPL-3",
                "MIT",
                "BSD-3-clause",
                "(GPL-3 OR AGPL-3)",
                "PSF-2",
                "GPL-3"
              ],
              "copyrightUrl": "https://metadata.ftp-master.debian.org/changelogs/main/k/kopanocore/kopanocore_8.7.0-3_copyright"
            }
          }
        }

        const result = harvestLicenseMatchPolicy.isMatching(
          { definition: sourceDefinition, harvest: sourceHarvest },
          { definition: targetDefinition, harvest: targetHarvest }
        )
        expect(result).to.have.property('isMatching', false)
      })
    })
  })
})