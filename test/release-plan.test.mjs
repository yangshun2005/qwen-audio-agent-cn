import assert from 'node:assert/strict'
import test from 'node:test'
import { createReleasePlan } from '../scripts/release-plan.mjs'

test('skips ordinary main updates when the package version is unchanged', () => {
  assert.deepEqual(createReleasePlan({
    currentVersion: '0.10.0',
    previousVersion: '0.10.0',
    changelog: '# Changelog\n\n## 0.10.0\n',
  }), {
    release: false,
    version: '0.10.0',
    tag: 'v0.10.0',
    previousVersion: '0.10.0',
    manual: false,
  })
})

test('plans a release when a release PR changes the package version', () => {
  assert.deepEqual(createReleasePlan({
    currentVersion: '0.11.0',
    previousVersion: '0.10.0',
    changelog: '# Changelog\n\n## 0.11.0\n',
  }), {
    release: true,
    version: '0.11.0',
    tag: 'v0.11.0',
    previousVersion: '0.10.0',
    manual: false,
  })
})

test('supports an explicit recovery run for the current version', () => {
  const plan = createReleasePlan({
    currentVersion: '0.10.0',
    requestedVersion: '0.10.0',
    changelog: '# Changelog\n\n## 0.10.0\n',
  })
  assert.equal(plan.release, true)
  assert.equal(plan.manual, true)
  assert.equal(plan.tag, 'v0.10.0')
})

test('rejects mismatched recovery versions and missing changelog entries', () => {
  assert.throws(() => createReleasePlan({
    currentVersion: '0.10.0',
    requestedVersion: '0.9.1',
    changelog: '# Changelog\n\n## 0.10.0\n',
  }), /不一致/)
  assert.throws(() => createReleasePlan({
    currentVersion: '0.11.0',
    previousVersion: '0.10.0',
    changelog: '# Changelog\n\n## 0.10.0\n',
  }), /CHANGELOG/)
})
