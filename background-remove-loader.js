let loaderPromise = null;

function loadRemoveBackground() {
  if (!loaderPromise) {
    loaderPromise = import(
      'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/dist/index.mjs'
    ).then((mod) => {
      return mod.default;
    }).catch((err) => {
      loaderPromise = null;
      throw err;
    });
  }
  return loaderPromise;
}

window.__loadRemoveBackground = loadRemoveBackground;
