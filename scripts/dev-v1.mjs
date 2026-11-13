process.env.DB_ADRESSE = `127.0.0.1:${process.env.DEV_TEST_DB_PORT || 3308}`;
await import(new URL('../node_modules/vite/bin/vite.js', import.meta.url).href);
