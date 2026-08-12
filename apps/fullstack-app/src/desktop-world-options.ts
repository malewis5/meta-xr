export const desktopWorldOptions = {
  xr: false,
  input: {
    canvasPointerEvents: true,
  },
  render: {
    near: 0.001,
    far: 200,
    camera: {
      position: [0, 1.5, 0],
      lookAt: [4, 1.1, 4.2],
    },
  },
  features: {
    locomotion: {
      useWorker: true,
      initialPlayerPosition: [-4, 0, -6],
      browserControls: true,
    },
    grabbing: true,
    physics: false,
    sceneUnderstanding: false,
    environmentRaycast: false,
    spatialUI: {
      kit: "horizon",
    },
  },
} as const;
