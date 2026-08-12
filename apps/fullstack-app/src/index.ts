/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { World } from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { desktopWorldOptions } from './desktop-world-options.js';
import { PanelSystem } from './panel.js';
import { RobotSystem } from './robot.js';

const sceneContainer = document.getElementById('scene-container');
const loadingScreen = document.getElementById('loading-screen');
const loadingMessage = document.getElementById('loading-message');
const loadingError = document.getElementById('loading-error');

function showWorld() {
  sceneContainer?.setAttribute('aria-busy', 'false');
  loadingScreen?.classList.add('is-ready');
  window.setTimeout(() => loadingScreen?.remove(), 200);
}

function showStartupError() {
  loadingMessage?.setAttribute('hidden', '');
  loadingError?.removeAttribute('hidden');
}

async function supportsImmersiveVR() {
  const xr = navigator.xr;
  if (!xr) {
    return false;
  }

  try {
    return await xr.isSessionSupported('immersive-vr');
  } catch {
    return false;
  }
}

async function initializeWorld() {
  if (!(sceneContainer instanceof HTMLDivElement)) {
    throw new Error('The scene container is missing.');
  }

  const useXR = await supportsImmersiveVR();
  const worldOptions = useXR
    ? projectOptions
    : { ...projectOptions, world: desktopWorldOptions };
  const world = await World.create(sceneContainer, worldOptions);
  world.registerSystem(RobotSystem);
  world.registerSystem(PanelSystem);
  showWorld();
}

initializeWorld().catch((error: unknown) => {
  console.error('Unable to initialize the Meta XR experience.', error);
  showStartupError();
});
