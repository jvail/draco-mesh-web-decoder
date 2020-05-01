### draco file decoder for the browser

* single file, can be bundled
* larger since wasm & worker scripts are bundled as base64

### Usage

```javascript
import getWorker from 'draco-web-decoder';
const worker = getWorker();
worker.onmessage = msg => {
    if (msg.data && 'initialized' in msg.data && msg.data.initialized) {
        fetch('file.drc')
            .then(response => response.arrayBuffer())
            .then(buffer => {
                worker.postMessage(buffer, [buffer])
            })
    } else if (msg.data) {
        console.log(msg.data);
    } else {
        console.log('error');
    }
};
```

### Build

```shell
$ source ../emsdk/emsdk_env.sh
$ npm install
$ npm run build
```
