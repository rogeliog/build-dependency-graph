const os = require("os");
const { readConfig } = require("jest-config");
const Runtime = require("jest-runtime");
const DependencyResolver = require("jest-resolve-dependencies");
const glob = require("glob");

async function getDependencyResolver(configPath) {
  const { projectConfig: config } = readConfig({}, configPath);

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
    const dependants = reverseDependencyResolver
      .resolve(file)
      .map(f => f.replace(`${__dirname}/`, ""));

    acc[file] = dependants;
    return acc;
  }, {});
}

module.exports = buildDependencyGraph;
