'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),p=require('../src/density-palette.js');
test('ROOT gradient reproduces all three supplied RGB stops',()=>{assert.deepEqual(p.rgb(0),[230,230,230]);assert.deepEqual(p.rgb(.25),[38,38,38]);assert.deepEqual(p.rgb(1),[255,0,0]);});
test('both segments interpolate in RGB without square-root or gamma normalization',()=>{assert.deepEqual(p.rgb(.125),[134,134,134]);assert.deepEqual(p.rgb(.625),[147,19,19]);assert.deepEqual(p.rgb(-1),p.rgb(0));assert.deepEqual(p.rgb(2),p.rgb(1));});
