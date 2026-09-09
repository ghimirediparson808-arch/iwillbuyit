import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',timeout:60000,expect:{timeout:12000},fullyParallel:false,workers:1,reporter:[['list'],['html',{open:'never'}]],use:{baseURL:'http://localhost:3000',headless:true,viewport:{width:1672,height:941},trace:'retain-on-failure',screenshot:'only-on-failure',launchOptions:{args:['--no-sandbox']}}});
