#!/usr/bin/env node
import { randomBytes } from 'node:crypto';

const PREFIX = 'sz_met_';
const PRODUCTION_URL = 'https://metrepairs.com';

const apiKey = `${PREFIX}${randomBytes(32).toString('hex')}`;

console.log('\nMET Repairs ↔ StackZen integration key\n');
console.log(apiKey);
console.log('\n1. StackZen (Vercel + .env.local)');
console.log(`   MET_REPAIRS_API_URL=${PRODUCTION_URL}`);
console.log(`   MET_REPAIRS_API_KEY=${apiKey}`);
console.log('\n2. MET Repairs OS — metrepairs.com (Vercel)');
console.log(`   STACKZEN_API_KEY=${apiKey}`);
console.log('\n3. Redeploy both applications.\n');
