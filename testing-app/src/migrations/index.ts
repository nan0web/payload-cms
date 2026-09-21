import * as migration_20260918_140935_init from './20260918_140935_init';

export const migrations = [
  {
    up: migration_20260918_140935_init.up,
    down: migration_20260918_140935_init.down,
    name: '20260918_140935_init'
  },
];
