import { buildDependencyGraph } from '../src/lib';
import * as path from 'node:path';

function resource(filename: string): string {
  return path.relative(process.cwd(), path.join(__dirname, '__resources__', filename));
}

test('Integration test', async () => {
  const graph = await buildDependencyGraph(resource('*.js'), resource('jest.config.cjs'));

  expect(graph).toStrictEqual({
    [resource('a.js')]: {
      dependsOn: [resource('b.js'), resource('c.js')]
    },
    [resource('b.js')]: {
      dependsOn: []
    },
    [resource('c.js')]: {
      dependsOn: [resource('d.js')]
    },
    [resource('d.js')]: {
      dependsOn: []
    }
  });
});
