#!/usr/bin/env node
'use strict'
require('@iarna/cli')(main)
  .usage('lock-verify [projectPath]')
  .help()

const fs = require('fs')
const readFile = promisify(fs.readFile)
const path = require('path')
const npa = require('npm-package-arg')
const semver = require('semver')

async function main (opts, check) {
  if (!check) check = '.'
  const pjson = await readJson(`${check}/package.json`)
  let plock
  try {
    plock = await readJson(`${check}/npm-shrinkwrap.json`)
  } catch (ex) {
    plock = await readJson(`${check}/package-lock.json`)
  }
  let errors = false
  for (let type of [['dependencies'], ['devDependencies'], ['optionalDependencies', true]]) {
    const deps = pjson[type[0]]
    if (!deps) continue
    const isOptional = type[1]
    Object.keys(deps).forEach(name => {
      const spec = npa.resolve(name, deps[name])
      const lock = plock.dependencies[name]
      if (!lock) {
        console.error('Missing:', name + '@' + deps[name])
        if (!isOptional) errors = true
        return
      }
      if (spec.registry) {
        // Can't match tags to package-lock w/o network
        if (spec.type === 'tag') return
        if (!semver.satisfies(lock.version, spec.fetchSpec)) {
          console.error("Invalid: lock file's", name + '@' + lock.version, 'does not satisfy', name + '@' + spec.fetchSpec)
          errors = true
          return
        }
      } else if (spec.type === 'git') {
        // can't verify git w/o network
        return
      } else if (spec.type === 'remote') {
        if (lock.version !== spec.fetchSpec) {
          console.error("Invalid: lock file's", name + '@' + lock.version, 'does not satisfy', name + '@' + spec.fetchSpec)
          errors = true
          return
        }
      } else if (spec.type === 'file' || spec.type === 'directory') {
        const lockSpec = npa.resolve(name, lock.version)
        if (spec.fetchSpec !== lockSpec.fetchSpec) {
          console.error("Invalid: lock file's", name + '@' + lock.version, 'does not satisfy', name + '@' + deps[name])
          errors = true
          return
        }
      } else {
        console.log(spec)
      }
    })
  }
  if (errors) return Promise.reject('Errors found')
}

async function readJson (file) {
  return JSON.parse(await readFile(file))
}

function promisify (fn) {
  return function asPromised () {
    return new Promise((resolve, reject) => {
      const args = new Array(arguments.length + 1)
      const cbIndex = arguments.length
      for (var ii = 0; ii < arguments.length; ++ii) {
        args[ii] = arguments[ii]
      }
      args[cbIndex] = (err, value) => err ? reject(err) : resolve(value)
      fn.apply(this, args)
    })
  }
}
