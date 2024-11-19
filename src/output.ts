import { copyFile, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

import { logger } from './logger'

import type { Collections, Output } from './types'

const isProduction = process.env.NODE_ENV === 'production'

const emitted = new Map<string, string>()

/**
 * emit file if content changed, reduce disk IO and improve fast refresh in app
 * @param path file path
 * @param content file data
 * @param log log message
 */
export const emit = async (path: string, content: string, log?: string): Promise<void> => {
  if (emitted.get(path) === content) {
    logger.log(`skipped write '${path}' with same content`)
    return
  }
  await writeFile(path, content)
  logger.log(log ?? `wrote '${path}' with ${content.length} bytes`)
  emitted.set(path, content)
}

/**
 * output entry file
 * @param dest output destination directory
 * @param configPath resolved config file path
 * @param collections collection options
 */
export const outputEntry = async (dest: string, format: Output['format'], configPath: string, collections: Collections): Promise<void> => {
  const begin = performance.now()

  const configModPath = relative(dest, configPath).replace(/\\/g, '/')

  const entry: string[] = []
  const dts: string[] = [`import type __vc from '${configModPath}'\n`]
  dts.push('type Collections = typeof __vc.collections\n')

  Object.entries(collections).map(([name, collection]) => {
    if (format === 'cjs') {
      entry.push(`exports.${name} = require('./${name}.json')`)
    } else {
      entry.push(`export { default as ${name} } from './${name}.json'`)
    }
    dts.push(`export type ${collection.name} = Collections['${name}']['schema']['_output']`)
    dts.push(`export declare const ${name}: ${collection.name + (collection.single ? '' : '[]')}\n`)
  })

  const banner = '// This file is generated by Velite\n\n'

  const entryFile = join(dest, 'index.js')
  await emit(entryFile, banner + entry.join('\n'), `created entry file in '${entryFile}'`)

  const dtsFile = join(dest, 'index.d.ts')
  await emit(dtsFile, banner + dts.join('\n'), `created entry dts file in '${dtsFile}'`)

  logger.log(`output entry file in '${dest}'`, begin)
}

/**
 * output all built result
 * @param dest output destination directory
 * @param result all built result
 */
export const outputData = async (dest: string, result: Record<string, any>): Promise<void> => {
  const begin = performance.now()
  const logs: string[] = []
  await Promise.all(
    Object.entries(result).map(async ([name, data]) => {
      if (data == null) return
      const target = join(dest, name + '.json')
      // TODO: output each record separately to a single file to improve fast refresh performance in app
      const content = isProduction ? JSON.stringify(data) : JSON.stringify(data, null, 2)
      await emit(target, content, `wrote '${target}' with ${data.length ?? 1} ${name}`)
      logs.push(`${data.length ?? 1} ${name}`)
    })
  )
  logger.log(`output ${logs.join(', ')}`, begin)
}

/**
 * output all collected assets
 * @param dest output destination directory
 * @param assets all collected assets
 */
export const outputAssets = async (dest: string, assets: Map<string, string>): Promise<void> => {
  const begin = performance.now()
  let count = 0
  await Promise.all(
    Array.from(assets.entries()).map(async ([name, from]) => {
      if (emitted.get(name) === from) {
        logger.log(`skipped copy '${name}' with same content`)
        return
      }
      await copyFile(from, join(dest, name))
      // logger.log(`copied '${name}' from '${from}'`)
      emitted.set(name, from)
      count++
    })
  )
  logger.log(`output ${count} assets`, begin)
}
