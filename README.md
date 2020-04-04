### Mesh draco file decoder for the browser

* single file, can be bundled
* larger since wasm & worker scripts are bundled as base64
* only mesh decoding

### Usage

```javascript
import worker from 'draco-mesh-web-decoder';
worker.onmessage = msg => {
    if (msg.data.initialized) {
        fetch('./file.drc')
            .then(response => response.arrayBuffer())
            .then(buffer => {
                worker.postMessage(buffer)
            })
    }
};
```

### Build

```shell
$ source ../emsdk/emsdk_env.sh
$ npm install
$ npm run build
```
