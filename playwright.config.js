import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests',testMatch:'ui.spec.js',workers:1,use:{baseURL:'http://127.0.0.1:3001',channel:'msedge'},webServer:{command:'node server/index.js sqlite',url:'http://127.0.0.1:3001/api/health',reuseExistingServer:false,env:{SQLITE_PATH:'./data/ui-test.db'}},reporter:'list'});
