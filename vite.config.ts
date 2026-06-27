import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const sectorPerfFilesModule = 'virtual:sector-perf-files';
const resolvedSectorPerfFilesModule = `\0${sectorPerfFilesModule}`;
const sectorPerfFilePattern = /^sector_perf_\d{4}-\d{2}-\d{2}\.csv$/;

const discoverSectorPerfFiles = (root: string) => {
  const dataDir = resolve(root, 'public/data');

  return readdirSync(dataDir)
    .filter((file) => sectorPerfFilePattern.test(file))
    .sort();
};

const isDiscoveredSectorPerfFile = (dataDir: string, file: string) => {
  const relativeFile = relative(dataDir, file);
  return !relativeFile.startsWith('..') && !relativeFile.includes(':') && sectorPerfFilePattern.test(relativeFile);
};

let projectRoot = '';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'sector-perf-file-discovery',
      configResolved(config) {
        projectRoot = config.root;
      },
      configureServer(server) {
        const dataDir = resolve(projectRoot, 'public/data');

        const reloadFilesModule = (file: string) => {
          if (!isDiscoveredSectorPerfFile(dataDir, file)) return;

          const mod = server.moduleGraph.getModuleById(resolvedSectorPerfFilesModule);
          if (mod) server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: 'full-reload' });
        };

        server.watcher.add(dataDir);
        server.watcher.on('add', reloadFilesModule);
        server.watcher.on('unlink', reloadFilesModule);
      },
      resolveId(id) {
        if (id === sectorPerfFilesModule) return resolvedSectorPerfFilesModule;
      },
      load(id) {
        if (id !== resolvedSectorPerfFilesModule) return;

        return `export default ${JSON.stringify(discoverSectorPerfFiles(projectRoot))};`;
      },
    },
  ],
  build: {
    sourcemap: true,
  },
});
