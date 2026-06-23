const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("sleekStitchDesktop", {
  platform: process.platform,
  isDesktop: true
});
