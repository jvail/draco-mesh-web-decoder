import worker_str from './tmp/import-worker';
const workerScript = URL.createObjectURL(new Blob([atob(worker_str)], { type: 'text/javascript' }));

export default () => {
    return new Worker(workerScript);
};
