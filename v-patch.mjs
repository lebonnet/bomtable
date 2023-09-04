import process from 'node:process'
import { ok } from 'node:assert'
import { execSync } from 'node:child_process'


const currentVersion = process.env.npm_package_version
ok(currentVersion, 'Empty current version')
const [major, minor, patch] = currentVersion.split('.')
const now = new Date()
const year = String(now.getUTCFullYear()).substring(2)
const month = String(now.getUTCMonth() + 1)
const resetPatch = major !== year || minor !== month
const newVersion = [year, month, resetPatch ? 1 : String(Number(patch) + 1)].join('.')
console.info(`Version: ${currentVersion} -> ${newVersion}`)

execSync(`npm version ${newVersion}`, { stdio: [0, 1, 2] })
