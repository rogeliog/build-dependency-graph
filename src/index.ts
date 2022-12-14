import type { Config } from '@jest/types';
import glob from 'glob';
import { readConfig } from 'jest-config';
import DependencyResolver from 'jest-resolve-dependencies';
import Runtime from 'jest-runtime';
import type { SnapshotResolver } from 'jest-snapshot';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

async function getDependencyResolver(configPath: string): Promise<DependencyResolver> {
  const { projectConfig: config } = readConfig({} as Config.Argv, configPath);
  const cacheDirExists = fs.existsSync(config.cacheDirectory);

  if (!cacheDirExists) {
    await fs.promises.mkdir(config.cacheDirectory, { recursive: true });
  }

  const hasteMap = await Runtime.createHasteMap(config, {
    console: { log() {}, error() {}, warn() {} } as any as Console,
    maxWorkers: os.cpus().length - 1,
    resetCache: false,
    watchman: false
  }).build();

  const { hasteFS, moduleMap } = hasteMap;
  const resolver = Runtime.createResolver(config, moduleMap);

  return new DependencyResolver(resolver, hasteFS, undefined as any as SnapshotResolver);
}

async function buildDependencyGraph(
  filesGlob: string,
  configPath: string
): Promise<Record<string, { dependsOn: string[] }>> {
  const targetFiles = glob.sync(filesGlob);
  const reverseDependencyResolver = await getDependencyResolver(configPath);

  return targetFiles.reduce((acc, file) => {
    acc[file] = {
      dependsOn: reverseDependencyResolver.resolve(file).map((f) => path.relative(process.cwd(), f))
    };

    return acc;
  }, {} as Record<string, { dependsOn: string[] }>);
}

export = buildDependencyGraph;
