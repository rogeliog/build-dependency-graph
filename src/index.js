const os = require("os");
const { readConfig } = require("jest-config");
const Runtime = require("jest-runtime");
const DependencyResolver = require("jest-resolve-dependencies");
const glob = require("glob");
const fs = require("fs");

async function getDependencyResolver(configPath) {
  const { projectConfig: config } = readConfig({}, configPath);
  const cacheDirExists = await new Promise(res =>
    fs.exists(config.cacheDirectory, res)
  );

  if (!cacheDirExists) {
    await new Promise(res =>
      fs.mkdir(config.cacheDirectory, { recursive: true }, res)
    );
  }

  const hasteMap = await Runtime.createHasteMap(config, {
    console: { log() {}, error() {}, warn() {} }, // fakeConsole,
    maxWorkers: os.cpus().length - 1
  }).build();

  const { hasteFS, moduleMap } = hasteMap;
  const resolver = Runtime.createResolver(config, moduleMap);

  return new DependencyResolver(resolver, hasteFS);
}

async function buildDependencyGraph(filesGlob, configPath) {
  const targetFiles = glob.sync(filesGlob);
  const reverseDependencyResolver = await getDependencyResolver(configPath);

  return targetFiles.reduce((acc, file) => {
    const dependsOn = reverseDependencyResolver
      .resolve(file)
      .map(f => f.replace(`${process.cwd()}/`, ""));

    acc[file] = { dependsOn };
    return acc;
  }, {});
}

module.exports = buildDependencyGraph;
