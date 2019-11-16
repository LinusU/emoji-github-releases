#!/usr/bin/env node

const applicationConfig = require('application-config')('emoji-github-releases')
const execa = require('execa')
const Octokit = require('@octokit/rest')
const printDiff = require('print-diff')
const readline = require('readline')

const delim1 = 'E2B4D2F3-B7AF-4377-BF0F-D81F4E0723F3'
const delim2 = '25B7DA41-228B-4679-B2A2-86E328D3C3DE'

function formatRelease ({ breaking, features, fixes, internal }) {
  if (breaking.length === 0 && features.length === 1 && fixes.length === 0 && internal.length === 0 && features[0][0] === '🎉 Add initial implementation') {
    return '## 🎉 Initial release\n'
  }

  let result = ''

  if (breaking.length > 0) {
    result += '## 💥 Breaking Changes\n\n'

    for (const commit of breaking) {
      result += `- ${commit[0].replace('💥 ', '')}\n`

      if (/Migration Guide:/i.test(commit[2])) {
        result += `\n  ${commit[2].replace(/.*Migration Guide:/img, 'Migration Guide:').replace(/^(?!\s*$)/gm, '  ').trim()}\n\n`
      }
    }

    result += '\n'
  }

  if (features.length > 0) {
    result += '## 🎉 Enhancements\n\n'

    for (const commit of features) {
      result += `- ${commit[0].replace('🎉 ', '')}\n`
    }

    result += '\n'
  }

  if (fixes.length > 0) {
    result += '## 🐛 Fixes\n\n'

    for (const commit of fixes) {
      result += `- ${commit[0].replace('🐛 ', '')}\n`
    }

    result += '\n'
  }

  if (internal.length > 0) {
    result += '## 🌹 Internal Changes\n\n'

    for (const commit of internal) {
      result += `- ${commit[0].replace('🌹 ', '')}\n`
    }

    result += '\n'
  }

  return result.trim() + '\n'
}

async function readLocalReleases () {
  const { stdout } = await execa('git', ['log', '--no-merges', `--format=format:%s${delim1}%cI${delim1}%b${delim2}`])
  const commits = stdout.split(delim2).filter(line => line.includes(delim1)).map(line => line.trim().split(delim1))

  let currentVersion
  const versionChanges = new Map()

  for (const commit of commits) {
    if (commit[0].startsWith('🚢 ')) {
      currentVersion = commit[0].replace('🚢 ', '')
      versionChanges.set(currentVersion, { version: currentVersion, date: commit[1].slice(0, 10), breaking: [], features: [], fixes: [], internal: [] })
    }

    if (!currentVersion) {
      continue
    }

    if (commit[0].startsWith('💥 ')) {
      versionChanges.get(currentVersion).breaking.unshift(commit)
    }

    if (commit[0].startsWith('🎉 ')) {
      versionChanges.get(currentVersion).features.unshift(commit)
    }

    if (commit[0].startsWith('🐛 ')) {
      versionChanges.get(currentVersion).fixes.unshift(commit)
    }

    if (commit[0].startsWith('🌹 ')) {
      versionChanges.get(currentVersion).internal.unshift(commit)
    }
  }

  const result = []

  for (const version of versionChanges.keys()) {
    const { date } = versionChanges.get(version)
    result.push({ tag: `v${version}`, name: `🚢 ${version} / ${date}`, body: formatRelease(versionChanges.get(version)) })
  }

  return result
}

async function getRemoteReleases (gh, { owner, repo }) {
  const response = await gh.repos.listReleases({ owner, repo })

  return response.data.map(item => ({ id: item.id, tag: item.tag_name, name: item.name, body: item.body.replace(/\r\n/g, '\n') }))
}

async function getRepo () {
  const { stdout } = await execa('git', ['remote', 'get-url', 'origin'])
  const match = /[/:]([\w-]+)\/(.*?)(?:\.git)?$/.exec(stdout)
  if (!match) throw new Error('Failed to determine upstream Github repo')
  return { owner: match[1], repo: match[2] }
}

async function questionYesNo (rl, question) {
  while (true) {
    const answer = await new Promise((resolve) => rl.question(question, resolve))

    if (answer === 'y' || answer === 'yes') return true
    if (answer === 'n' || answer === 'no') return false

    rl.write('Unkown answer, please type "yes" or "no"\n')
  }
}

async function main () {
  const rl = readline.createInterface(process.stdin, process.stderr)

  try {
    /** @type {{ githubToken?: string }} */
    const cfg = await applicationConfig.read()

    if (cfg.githubToken) {
      rl.write(`Using GitHub token from config at ${applicationConfig.filePath}\n`)
    } else {
      rl.write('To access GitHub this program needs a "Personal access token", please create one at the below URL and paste it below\n')
      rl.write('\nhttps://github.com/settings/tokens\n\n')
      cfg.githubToken = await new Promise((resolve) => rl.question('> ', resolve))
      await applicationConfig.write(cfg)
    }

    const gh = new Octokit({ auth: () => 'token ' + cfg.githubToken })

    const { owner, repo } = await getRepo()
    const actual = await getRemoteReleases(gh, { owner, repo })
    const expected = await readLocalReleases()

    for (const item of expected) {
      const current = actual.find(a => a.tag === item.tag)

      if (!current) {
        rl.write(`============================== ${item.tag} ==============================\n`)
        rl.write(item.name)
        rl.write('\n\n')
        rl.write(item.body)
        rl.write(`============================== ${item.tag} ==============================\n`)
        const shouldCreate = await questionYesNo(rl, 'Create this release [y,n]? ')

        if (shouldCreate) {
          await gh.repos.createRelease({ owner, repo, tag_name: item.tag, name: item.name, body: item.body })
        }

        continue
      }

      if (current.name === item.name && current.body === item.body) {
        continue
      }

      rl.write(`============================== ${item.tag} ==============================`)
      if (current.name !== item.name) printDiff.inline(current.name, item.name, rl)
      if (current.body !== item.body) printDiff.unified(current.body, item.body, rl)
      rl.write(`============================== ${item.tag} ==============================\n`)
      const shouldUpdate = await questionYesNo(rl, 'Update this release [y,n]? ')

      if (shouldUpdate) {
        await gh.repos.updateRelease({ owner, repo, release_id: current.id, name: item.name, body: item.body })
      }
    }

    rl.write('All done\n')
  } finally {
    rl.close()
  }
}

main().catch((err) => {
  process.exitCode = 1
  console.error(err.stack)
})
